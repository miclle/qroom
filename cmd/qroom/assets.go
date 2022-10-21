package main

import (
	"embed"
	"fmt"
	"html/template"
	"io/fs"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

//go:embed public/*
var embedFS embed.FS

func init() {
	_ = fs.WalkDir(embedFS, ".", func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		fmt.Printf("path=%q, isDir=%v\n", path, d.IsDir())
		return nil
	})
}

// EmbedPublicAssets embed fs from `public` dir
func EmbedPublicAssets(router *gin.Engine) {
	tmpl := template.Must(template.New("").ParseFS(embedFS, "public/*.html"))

	router.SetHTMLTemplate(tmpl)

	fp, _ := fs.Sub(embedFS, "public")
	router.StaticFS("/public", http.FS(fp))

	// handle home page
	router.GET("/", func(c *gin.Context) {
		c.HTML(200, "index.html", map[string]interface{}{})
	})

	router.NoRoute(func(c *gin.Context) {

		if c.Request.Method != http.MethodGet {
			c.AbortWithStatus(http.StatusNotFound)
			return
		}

		if strings.HasPrefix(c.Request.URL.Path, "/api") {
			c.AbortWithStatus(http.StatusNotFound)
			return
		}
	})
}
