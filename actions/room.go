package actions

import (
	"errors"
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
		db          = c.MustGet("db").(*database.Database)
		currentUser = c.MustGet("currentUser").(*models.User)
		room        *models.Room
	)

	if err := c.BindJSON(&args); err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "invalid args", "code": "INVALID_ARGS"})
		return
	}

	db.Transaction(func(tx *gorm.DB) error {
		room = &models.Room{
			AdminID: currentUser.ID,
			State:   models.RoomStateActive,
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
