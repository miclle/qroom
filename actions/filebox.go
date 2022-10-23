package actions

import (
	"context"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/qiniu/go-sdk/v7/auth/qbox"
	"github.com/qiniu/go-sdk/v7/storage"

	"github.com/miclle/qroom/config"
	"github.com/miclle/qroom/models"
)

// ListFiles list files
func ListFiles(c *gin.Context) {

	var (
		cfg  = c.MustGet("config").(*config.Config)
		room = c.MustGet("room").(*models.Room)
	)

	mac := qbox.NewMac(cfg.QiniuService.AccessKey, cfg.QiniuService.SecretKey)

	sc := storage.Config{
		UseHTTPS: true,
	}
	bucketManager := storage.NewBucketManager(mac, &sc)

	var (
		bucket    = cfg.QiniuService.Bucket
		prefix    = room.UUID
		delimiter = ""
		marker    = ""
		limit     = 1000
	)

	entries, _, _, _, err := bucketManager.ListFiles(bucket, prefix, delimiter, marker, limit)

	if err != nil {
		c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	files := []*models.FileItem{}
	for _, entry := range entries {
		files = append(files, &models.FileItem{
			ListItem: entry,
			URL:      storage.MakePublicURL(cfg.QiniuService.BucketDomain, entry.Key),
		})
	}

	c.JSON(200, files)
}

// UpdateFiles list files
func UpdateFiles(c *gin.Context) {

	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	file, err := fileHeader.Open()
	if err != nil {
		c.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	defer file.Close()

	var (
		cfg  = c.MustGet("config").(*config.Config)
		room = c.MustGet("room").(*models.Room)
	)

	mac := qbox.NewMac(cfg.QiniuService.AccessKey, cfg.QiniuService.SecretKey)

	putPolicy := storage.PutPolicy{
		Scope: cfg.QiniuService.Bucket,
	}

	upToken := putPolicy.UploadToken(mac)

	sc := storage.Config{}
	sc.Zone = &storage.ZoneHuadong
	sc.UseHTTPS = true
	sc.UseCdnDomains = false

	var (
		key          = fmt.Sprintf("%s/%s", room.UUID, fileHeader.Filename)
		formUploader = storage.NewFormUploader(&sc)
		ret          = storage.PutRet{}
	)

	err = formUploader.Put(context.Background(), &ret, upToken, key, file, fileHeader.Size, nil)
	if err != nil {
		c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	c.JSON(200, ret)
}
