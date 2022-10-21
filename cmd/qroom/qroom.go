package main

import (
	"errors"
	"flag"
	"fmt"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/miclle/qroom/common/logger"
	"github.com/miclle/qroom/config"
	"github.com/miclle/qroom/database"
)

func main() {
	log := logger.New("Initialize")

	var confPath string
	flag.StringVar(&confPath, "f", "", "-f=/path/to/config")
	flag.Parse()

	// Load configuration
	cfg := config.LoadConfig(log, confPath)

	// 初始化 MySQL
	db, err := database.New(cfg.Database)
	if err != nil {
		log.Fatalf("failed to open database, err: %+v", err)
	}

	// migrates.AutoMigrate(log)

	gin.SetMode(cfg.Env)
	router := gin.Default()
	router.Use(func(c *gin.Context) {
		c.Set("db", db)
	})

	// !Embed website assets
	if cfg.Env == "debug" {
		website := os.Getenv("PROXY_WEBSITE")
		ReverseProxyWebsiteApp(router, website) // Only in development mode
	} else {
		EmbedPublicAssets(router)
	}

	// API ping
	router.GET("/ping", func(c *gin.Context) {
		c.String(200, "pong")
	})

	// ------------------------------------------------------------------------
	s := &http.Server{
		Handler: router,
		Addr:    fmt.Sprintf(":%d", cfg.Port),
	}

	if err = s.ListenAndServe(); err != nil && errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("failed to listen and serve, err: %v", err)
	}
}
