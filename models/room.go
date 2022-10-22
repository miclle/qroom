package models

import (
	"github.com/oklog/ulid/v2"
	"gorm.io/gorm"
)

// RoomState room state
type RoomState string

const (
	// RoomStateActive active
	RoomStateActive RoomState = "active"
	// RoomStateArchived archived
	RoomStateArchived RoomState = "archived"
)

// Room 房间
type Room struct {
	ID        int64      `json:"id"         gorm:"primary_key"`
	UUID      string     `json:"uuid"       gorm:"unique_index;size:24"` // 房间对外的 UUID，同时将作为 RTC Room Name
	Name      string     `json:"name"       gorm:"size:128"`             // 自定义房间名称
	State     RoomState  `json:"state"`                                  // 房间状态: active, archived
	AdminID   int64      `json:"admin_id"   gorm:"index"`                // 管理员
	CreatedAt int64      `json:"created_at"`
	UpdatedAt int64      `json:"updated_at"`
	Attendees []Attendee `json:"attendees"`
	Self      Attendee   `json:"self"`
}

// BeforeCreate gorm before create callback
func (room *Room) BeforeCreate(tx *gorm.DB) (err error) {
	room.UUID = ulid.Make().String()
	return
}

// Role 角色
type Role string

const (
	// RoleUser 普通用户
	RoleUser Role = "user"

	// RoleAdmin 房间管理员
	RoleAdmin Role = "admin"
)

// Attendee 会议出席者
type Attendee struct {
	ID        int64  `json:"id,omitempty"      gorm:"primary_key"`
	UserID    int64  `json:"user_id,omitempty" gorm:"unique_index:room_user"`
	RoomID    int64  `json:"room_id,omitempty" gorm:"unique_index:room_user"`
	Role      Role   `json:"role"`
	Name      string `json:"name"`
	CreatedAt int64  `json:"created_at"`
	UpdatedAt int64  `json:"updated_at"`
}
