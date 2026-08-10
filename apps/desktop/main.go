package main

import (
	"embed"
	"log"

	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	workspaceService := NewWorkspaceService()

	app := application.New(application.Options{
		Name:        "ActiveLane",
		Description: "ActiveLane Workbench",
		Services: []application.Service{
			application.NewService(workspaceService),
		},
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
	})

	window := app.Window.NewWithOptions(application.WebviewWindowOptions{
		Name:             "workbench",
		Title:            "ActiveLane Workbench",
		Width:            1440,
		Height:           900,
		MinWidth:         900,
		MinHeight:        600,
		Frameless:        true,
		BackgroundColour: application.NewRGB(10, 10, 12),
		URL:              "/",
		Mac: application.MacWindow{
			InvisibleTitleBarHeight: 48,
			TitleBar:                application.MacTitleBarHiddenInset,
		},
	})
	window.RegisterHook(events.Common.WindowClosing, func(event *application.WindowEvent) {
		workspaceService.Close()
	})

	if err := app.Run(); err != nil {
		log.Fatal(err)
	}
}
