package models

import "gorm.io/gorm"

// Migrate models
func Migrate(db *gorm.DB) error {

	err := db.AutoMigrate(
		&User{},
		&Room{},
		&Attendee{},
	)

	return err
}
