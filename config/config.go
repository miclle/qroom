package config

import (
	"os"

	"github.com/spf13/viper"

	"github.com/miclle/qroom/common/logger"
	"github.com/miclle/qroom/database"
)

// Configuration for the ops-manager
var Configuration *Config

// Config 配置项
type Config struct {
	Env          string           `mapstructure:"env"` // debug,release,test
	Secret       string           `mapstructure:"secret"`
	Port         int              `mapstructure:"port"`
	Database     *database.Config `mapstructure:"database"`
	QiniuService *QiniuService    `mapstructure:"qiniu"`
}

// QiniuService qiniu service config
type QiniuService struct {
	AccessKey    string `mapstructure:"access_key"`
	SecretKey    string `mapstructure:"secret_key"`
	Bucket       string `mapstructure:"bucket"`
	BucketDomain string `mapstructure:"bucket_domain"`
	RTCAppID     string `mapstructure:"rtc_app_id"`
}

// LoadConfig load config file
func LoadConfig(log logger.Logger, path string) *Config {

	if len(path) == 0 {
		log.Fatal("config file not specified")
	}

	viper.SetConfigType("yaml")

	file, err := os.Open(path)
	if err != nil {
		log.Panicf("fatal error open config file: %s", err)
	}

	defer file.Close()

	if err = viper.ReadConfig(file); err != nil {
		log.Panicf("fatal error read config file: %s", err)
	}

	var config = &Config{}
	if err = viper.Unmarshal(config); err != nil {
		log.Panicf("parse config file failed: %s", err)
	}

	Configuration = config

	return config
}

// Unmarshal the config into a struct
func Unmarshal(rawVal interface{}) error {
	return viper.Unmarshal(rawVal)
}

// UnmarshalKey takes a single key and unmarshals it into a Struct.
func UnmarshalKey(key string, rawVal interface{}) error {
	return viper.UnmarshalKey(key, rawVal)
}
