package models

import (
	"github.com/oklog/ulid/v2"
	"gorm.io/gorm"
)

// User 用户
type User struct {
	ID        int64  `json:"id"         gorm:"primary_key"`
	UUID      string `json:"uuid"       gorm:"size:128;uniqueIndex"`
	Name      string `json:"name"       gorm:"size:128"`
	CreatedAt int64  `json:"created_at"`
	UpdatedAt int64  `json:"updated_at"`
}

// BeforeCreate gorm before create callback
func (user *User) BeforeCreate(tx *gorm.DB) (err error) {
	user.UUID = ulid.Make().String()
	return
}
