all: gofmt govet golangci-lint golint test install

check: gofmt govet golangci-lint golint test

gofmt:
	gofmt -s -l . | tee .gofmt.log
	test `cat .gofmt.log | wc -l` -eq 0
	rm .gofmt.log

govet:
	go vet ./...

golangci-lint:
	golangci-lint run ./...

golint:
	golint ./... | tee .golint.log
	test `cat .golint.log | wc -l` -eq 0
	rm .golint.log

test:
	go clean -i -testcache .
	go test -v -race -coverprofile=coverage.txt -covermode=atomic ./...

coverage: test
	go tool cover -html=coverage.txt -o coverage.html
	open coverage.html

clean:
	go clean -i -cache -testcache -modcache .

# Run the website
site:
	cd website; yarn start

# Run back-end service and proxy website requests
# go install github.com/cespare/reflex@latest
serve:
	PROXY_WEBSITE=http://localhost:3000 reflex\
		-d none -s\
		-R 'tmp/' \
		-R '\.github' \
		-R 'website/' \
		-R 'cmd/qroom/public/' \
		-R '^coverage' \
		-R 'Makefile' \
		-R 'qroom.db' \
		-R '.log$$' \
		-R '_test.go$$'\
		-- go run -trimpath cmd/qroom/*.go -f cmd/qroom/config.local.yaml | tee -a development.log

# make build goos=linux goarch=amd64
build:
	cd cmd/qroom/public; find . ! -name '.website-app-not-built.html' ! -name '.' ! -name '..' -exec rm -rf {} +
	cd website; yarn install && yarn build
	mv website/build/* cmd/qroom/public/
	cd cmd/qroom; GOOS=${goos} GOARCH=${goarch} go build -tags=jsoniter -trimpath -ldflags '-s -w' ./...
	cd cmd/qroom/public; find . ! -name '.website-app-not-built.html' ! -name '.' ! -name '..' -exec rm -rf {} +
