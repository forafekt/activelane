package main

import (
	"embed"
	"log"
	"os"
	"os/signal"
	"runtime"
	"syscall"

	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	workspaceService := NewWorkspaceService()
	extensionService := NewExtensionService()
	defer extensionService.Close()
	networkService := NewNetworkService()

	// Determine frameless needs by OS
	isMac := runtime.GOOS == "darwin"

	app := application.New(application.Options{
		Name:        "ActiveLane",
		Description: "ActiveLane Workbench",
		Services: []application.Service{
			application.NewService(workspaceService),
			application.NewService(extensionService),
			application.NewService(networkService),
		},
		Assets: application.AssetOptions{
			Handler:    application.AssetFileServerFS(assets),
			Middleware: extensionAssetMiddleware(extensionService),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
	})
	if err := extensionService.startDevelopmentServer(func() {
		app.Event.Emit("activelane:development-extensions-changed")
	}); err != nil {
		log.Printf("ActiveLane extension development is unavailable: %v", err)
	}
	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, os.Interrupt, syscall.SIGTERM)
	defer signal.Stop(shutdown)
	go func() {
		<-shutdown
		extensionService.Close()
	}()

	window := app.Window.NewWithOptions(application.WebviewWindowOptions{
		Name:      "workbench",
		Title:     "ActiveLane Workbench",
		Width:     1440,
		Height:    900,
		MinWidth:  900,
		MinHeight: 600,
		Frameless: !isMac, // Native-default frameless windows retain the AppKit frame
		URL:       "/",
		Mac: application.MacWindow{
			TitleBar: application.MacTitleBar{
				AppearsTransparent: true, // Merges the titlebar into the window body
				HideTitle:          true, // Removes the text title
				FullSizeContent:    true, // Content flows behind the traffic lights
			},
		},
	})
	window.RegisterHook(events.Common.WindowClosing, func(event *application.WindowEvent) {
		workspaceService.Close()
		extensionService.Close()
	})

	if err := app.Run(); err != nil {
		log.Fatal(err)
	}
}
