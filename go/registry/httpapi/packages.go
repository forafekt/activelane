package httpapi

import (
	"fmt"
	"io"
	"net/http"
	"strconv"
)

func (handlers handlers) downloadPackage(response http.ResponseWriter, request *http.Request) {
	file, version, err := handlers.config.Store.OpenPackage(versionParams(request))
	if err != nil {
		respond(response, nil, err)
		return
	}
	defer file.Close()

	response.Header().Set("Content-Type", packageMediaType)
	response.Header().Set("Content-Length", strconv.FormatInt(version.Artifact.SizeBytes, 10))
	response.Header().Set("ETag", fmt.Sprintf("\"%s\"", version.Artifact.Digest))
	response.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
	response.WriteHeader(http.StatusOK)
	_, _ = io.Copy(response, file)
}
