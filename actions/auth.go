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

// Auth middleware
func Auth(c *gin.Context) {

	var (
		db      = c.MustGet("db").(*database.Database)
		session = sessions.Default(c)
		uuid    = session.Get("user")
		user    = &models.User{}
	)

	if uuid == nil {
		c.AbortWithStatusJSON(401, gin.H{"signed_in": false})
		return
	}

	if _, ok := uuid.(string); !ok {
		c.AbortWithStatusJSON(401, gin.H{"signed_in": false})
		return
	}

	if result := db.First(&user, "`uuid` = ?", uuid.(string)); result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			c.AbortWithStatus(http.StatusUnauthorized)
		} else {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": result.Error.Error(), "code": "INTERNAL_SERVER_ERROR"})
		}
		return
	}

	c.Set("currentUser", user)
	c.Next()
}
