package main

import (
	"errors"
	"flag"
	"fmt"
	"net/http"
	"os"

	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"

	"github.com/miclle/qroom/actions"
	"github.com/miclle/qroom/common/logger"
	"github.com/miclle/qroom/config"
	"github.com/miclle/qroom/database"
	"github.com/miclle/qroom/models"
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

	if err = models.Migrate(db.DB); err != nil {
		log.Fatalf("auto migrate models failed, err: %+v", err)
	}

	gin.SetMode(cfg.Env)
	router := gin.Default()

	store := cookie.NewStore([]byte(cfg.Secret))
	store.Options(sessions.Options{
		Path:     "/",
		HttpOnly: true,
	})
	router.Use(sessions.Sessions("QROOM", store))

	router.Use(func(c *gin.Context) {
		c.Set("config", cfg)
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

	router.POST("/api/user", actions.CreateUser)
	router.GET("/api/user/overview", actions.UserOverview)

	api := router.Group("api", actions.Auth)
	{
		api.POST("/rooms", actions.CreateRoom)
		api.GET("/rooms/:uuid", actions.GetRoom, actions.GetRoomInfo)
	}

	// ------------------------------------------------------------------------
	s := &http.Server{
		Handler: router,
		Addr:    fmt.Sprintf(":%d", cfg.Port),
	}

	if err = s.ListenAndServe(); err != nil && errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("failed to listen and serve, err: %v", err)
	}
}
