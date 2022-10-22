package actions

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

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
