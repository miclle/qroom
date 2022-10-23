package models

import "github.com/qiniu/go-sdk/v7/storage"

// FileItem file info
type FileItem struct {
	storage.ListItem
	URL string `json:"url"`
}
