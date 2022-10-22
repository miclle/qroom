package actions

import (
	"errors"
	"net/http"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/miclle/qroom/database"
	"github.com/miclle/qroom/models"
)

// CreateUserArgs create user args
type CreateUserArgs struct {
	Name string `json:"name" binding:"required"`
}

// CreateUser 创建用户
func CreateUser(c *gin.Context) {
	var (
		db   = c.MustGet("db").(*database.Database)
		args = CreateUserArgs{}
	)

	if err := c.BindJSON(&args); err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "invalid args", "code": "INVALID_ARGS"})
		return
	}

	user := &models.User{
		Name: args.Name,
	}

	if err := db.Create(user).Error; err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": "create user failed", "code": "INTERNAL_SERVER_ERROR"})
		return
	}

	session := sessions.Default(c)

	session.Set("user", user.UUID)
	session.Save()

	c.JSON(http.StatusCreated, gin.H{
		"signed_in": true,
		"id":        user.ID,
		"name":      user.Name,
	})
}

// UserOverview user overview
func UserOverview(c *gin.Context) {

	var (
		db      = c.MustGet("db").(*database.Database)
		session = sessions.Default(c)
		uuid    = session.Get("user")
		user    = &models.User{}
	)

	if uuid == nil {
		c.JSON(200, gin.H{"signed_in": false})
		return
	}

	if _, ok := uuid.(string); !ok {
		c.JSON(200, gin.H{"signed_in": false})
		return
	}

	if result := db.First(&user, "uuid = ?", uuid.(string)); result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			c.AbortWithStatus(http.StatusUnauthorized)
		} else {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": result.Error.Error(), "code": "INTERNAL_SERVER_ERROR"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"signed_in": true,
		"id":        user.ID,
		"name":      user.Name,
	})
}
