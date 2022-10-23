package actions

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
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

	whiteboard, err := createWhiteBoard(cfg)
	if err != nil {
		c.AbortWithError(500, err)
		return
	}

	db.Transaction(func(tx *gorm.DB) error {
		room = &models.Room{
			AdminID:      currentUser.ID,
			State:        models.RoomStateActive,
			WhiteboardID: whiteboard.UUID,
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
// https://docs.agora.io/cn/whiteboard/generate_whiteboard_token#%E7%94%9F%E6%88%90-room-token%EF%BC%88post%EF%BC%89
func GetRoomWhiteBoard(c *gin.Context) {
	var (
		cfg         = c.MustGet("config").(*config.Config)
		db          = c.MustGet("db").(*database.Database)
		room        = c.MustGet("room").(*models.Room)
		currentUser = c.MustGet("currentUser").(*models.User)
	)

	if room.WhiteboardID == "" {
		whiteboard, err := createWhiteBoard(cfg)
		if err != nil {
			c.AbortWithError(500, err)
			return
		}

		room.WhiteboardID = whiteboard.UUID

		if err := db.Model(room).Update("whiteboard_id", whiteboard.UUID).Error; err != nil {
			c.AbortWithError(500, err)
			return
		}
	}

	url := fmt.Sprintf("https://api.netless.link/v5/tokens/rooms/%s", room.WhiteboardID)

	args := map[string]interface{}{
		"lifespan": 0,
		"role":     "admin",
	}

	data, _ := json.Marshal(args)

	req, err := http.NewRequest("POST", url, bytes.NewReader(data))
	if err != nil {
		c.AbortWithError(500, err)
		return
	}
	req.Header.Add("Content-Type", "application/json")
	req.Header.Add("token", cfg.Whiteboard.Token)
	req.Header.Add("region", "cn-hz")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		c.AbortWithError(500, err)
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

	var token string
	err = json.NewDecoder(resp.Body).Decode(&token)
	if err != nil {
		c.AbortWithError(500, err)
		return
	}

	c.JSON(200, gin.H{
		"app_id":     cfg.Whiteboard.AppID,
		"user_id":    currentUser.UUID,
		"room_uuid":  room.WhiteboardID,
		"room_token": token,
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

// WhiteBoardRoom whiteboard token
type WhiteBoardRoom struct {
	UUID      string    `json:"uuid"`
	TeamUUID  string    `json:"teamUUID"`
	AppUUID   string    `json:"appUUID"`
	IsRecord  bool      `json:"isRecord"`
	IsBan     bool      `json:"isBan"`
	CreatedAt time.Time `json:"createdAt"`
	Limit     int       `json:"limit"`
}

// createWhiteBoard get room white board info
// https://docs.agora.io/cn/whiteboard/whiteboard_room_management?platform=RESTful
func createWhiteBoard(cfg *config.Config) (*WhiteBoardRoom, error) {

	req, err := http.NewRequest("POST", "https://api.netless.link/v5/rooms", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Add("Content-Type", "application/json")
	req.Header.Add("token", cfg.Whiteboard.Token)
	req.Header.Add("region", "cn-hz")

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

	var token = &WhiteBoardRoom{}
	err = json.NewDecoder(resp.Body).Decode(token)
	if err != nil {
		return nil, err
	}

	return token, nil
}
