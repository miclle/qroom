package actions

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/qiniu/go-sdk/v7/auth"
	"github.com/qiniu/go-sdk/v7/rtc"
	"gorm.io/gorm"

	"github.com/miclle/qroom/config"
	"github.com/miclle/qroom/database"
	"github.com/miclle/qroom/models"
)

// QuickStartArgs create room args
type QuickStartArgs struct {
	Name string `json:"name"`
}

// CreateRoom quick start actions
func CreateRoom(c *gin.Context) {

	var (
		args        = QuickStartArgs{}
		cfg         = c.MustGet("config").(*config.Config)
		db          = c.MustGet("db").(*database.Database)
		currentUser = c.MustGet("currentUser").(*models.User)
		room        *models.Room
	)

	if err := c.BindJSON(&args); err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "invalid args", "code": "INVALID_ARGS"})
		return
	}

	whiteboardToken, err := createWhiteBoard(cfg)
	if err != nil {
		c.AbortWithError(500, err)
		return
	}

	db.Transaction(func(tx *gorm.DB) error {
		room = &models.Room{
			AdminID:             currentUser.ID,
			State:               models.RoomStateActive,
			WhiteBoardMeetingID: whiteboardToken.MeetingID,
		}
		if err := tx.Create(room).Error; err != nil {
			return err
		}

		attendee := &models.Attendee{
			UserID: currentUser.ID,
			RoomID: room.ID,
			Role:   models.RoleAdmin,
			UUID:   currentUser.UUID,
			Name:   currentUser.Name,
		}

		if err := tx.Create(attendee).Error; err != nil {
			return err
		}

		return nil
	})

	c.JSON(200, room)
}

// GetRoomInfo get room info
func GetRoomInfo(c *gin.Context) {
	var room = c.MustGet("room").(*models.Room)
	c.JSON(http.StatusOK, room)
}

// GetRoomRTC get room info
func GetRoomRTC(c *gin.Context) {
	var (
		cfg         = c.MustGet("config").(*config.Config)
		room        = c.MustGet("room").(*models.Room)
		currentUser = c.MustGet("currentUser").(*models.User)
	)

	mgr := rtc.NewManager(&auth.Credentials{
		AccessKey: cfg.QiniuService.AccessKey,
		SecretKey: []byte(cfg.QiniuService.SecretKey),
	})

	access := rtc.RoomAccess{
		AppID:      cfg.QiniuService.RTCAppID,
		RoomName:   room.UUID,
		UserID:     currentUser.UUID,
		ExpireAt:   time.Now().Unix() + 600,
		Permission: string(room.Self.Role),
	}

	token, err := mgr.GetRoomToken(access)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": "get room token failed", "code": "INTERNAL_SERVER_ERROR"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"userID": currentUser.UUID,
		"token":  token,
	})
}

// ----------------------------------------------------------------------------

// GetRoomWhiteBoard get room white board info
func GetRoomWhiteBoard(c *gin.Context) {
	var (
		cfg         = c.MustGet("config").(*config.Config)
		room        = c.MustGet("room").(*models.Room)
		currentUser = c.MustGet("currentUser").(*models.User)
	)

	query := url.Values{}
	query.Set("userId", currentUser.UUID)
	query.Set("meetingId", room.WhiteBoardMeetingID)

	// /v4/apps/{appId}/board/user/token?userId=11111aa&meetingId=2c03d88f46f3468faab89f2fe0164a97&userIds=111,bbb
	url := fmt.Sprintf("https://rtc.qiniuapi.com/v4/apps/%s/board/user/token?%s", cfg.QiniuService.RTCAppID, query.Encode())

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": "get whiteboard token failed", "code": "INTERNAL_SERVER_ERROR"})
		return
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": "get whiteboard token failed", "code": "INTERNAL_SERVER_ERROR"})
		return
	}

	defer func() {
		if resp.Body != nil {
			io.Copy(io.Discard, resp.Body) // nolint: errcheck
			resp.Body.Close()
		}
	}()

	if resp.StatusCode >= 400 {
		fmt.Printf("%+v\n", resp.Header)
		c.AbortWithError(resp.StatusCode, errors.New(http.StatusText(resp.StatusCode)))
		return
	}

	var token = &WhiteBoardToken{}
	err = json.NewDecoder(resp.Body).Decode(token)
	if err != nil {
		c.AbortWithError(resp.StatusCode, err)
	}

	c.JSON(http.StatusOK, gin.H{
		"user_id":    currentUser.UUID,
		"app_id":     token.AppID,
		"meeting_id": room.WhiteBoardMeetingID,
		"token":      token.UserTokens[currentUser.UUID],
	})
}

// middleware
// ----------------------------------------------------------------------------

// GetRoom get room detail
func GetRoom(c *gin.Context) {

	var (
		uuid        = c.Param("uuid")
		db          = c.MustGet("db").(*database.Database)
		currentUser = c.MustGet("currentUser").(*models.User)
		room        *models.Room
	)

	if result := db.First(&room, "uuid = ?", uuid); result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"message": "the room doesn't exist", "code": "ROOM_NOT_FOUND"})
			return
		}
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": "get room info failed", "code": "INTERNAL_SERVER_ERROR"})
		return
	}

	attendee := models.Attendee{
		UserID: currentUser.ID,
		RoomID: room.ID,
		Role:   models.RoleUser,
		UUID:   currentUser.UUID,
		Name:   currentUser.Name,
	}

	if err := db.FirstOrCreate(&attendee, "user_id = ? AND room_id = ?", currentUser.ID, room.ID).Error; err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": "get room info failed", "code": "INTERNAL_SERVER_ERROR"})
		return
	}

	if err := db.Where("room_id = ?", room.ID).Find(&room.Attendees).Error; err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": "get room info failed", "code": "INTERNAL_SERVER_ERROR"})
		return
	}

	for _, attendee := range room.Attendees {
		if attendee.UserID == currentUser.ID {
			room.Self = attendee
		}
	}

	c.Set("room", room)
	c.Next()
}

// ----------------------------------------------------------------------------

// WhiteBoardToken whiteboard token
type WhiteBoardToken struct {
	AppID      string            `json:"appId"`
	MeetingID  string            `json:"meetingId"`
	BucketID   string            `json:"bucketId"`
	UserTokens map[string]string `json:"userTokens"`
}

// createWhiteBoard get room white board info
func createWhiteBoard(cfg *config.Config) (*WhiteBoardToken, error) {

	mac := &auth.Credentials{
		AccessKey: cfg.QiniuService.AccessKey,
		SecretKey: []byte(cfg.QiniuService.SecretKey),
	}

	args := map[string]interface{}{
		"type":        0,
		"aspectRatio": 1.33,
		"zoomScale":   1,
		"userIds":     []string{},
	}

	reqData, _ := json.Marshal(args)

	url := fmt.Sprintf("https://rtc.qiniuapi.com/v4/apps/%s/board/meeting", cfg.QiniuService.RTCAppID)
	req, err := http.NewRequest("POST", url, bytes.NewReader(reqData))
	if err != nil {
		return nil, err
	}
	req.Header.Add("Content-Type", "application/json")

	accessToken, err := mac.SignRequestV2(req)
	if err != nil {
		return nil, err
	}
	req.Header.Add("Authorization", "Qiniu "+accessToken)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}

	defer func() {
		if resp.Body != nil {
			io.Copy(io.Discard, resp.Body) // nolint: errcheck
			resp.Body.Close()
		}
	}()

	if resp.StatusCode >= 400 {
		fmt.Printf("%+v\n", resp.Header)
		return nil, errors.New(http.StatusText(resp.StatusCode))
	}

	var token = &WhiteBoardToken{}
	err = json.NewDecoder(resp.Body).Decode(token)
	if err != nil {
		return nil, err
	}

	return token, nil
}
