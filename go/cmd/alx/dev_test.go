package main

import (
	"reflect"
	"testing"

	"github.com/activelane/activelane/go/devextensions"
)

func TestDevelopmentCommandUsesConfiguredPort(t *testing.T) {
	command, err := developmentCommand(devextensions.ProjectConfig{Command: []string{"custom", "--port={port}"}}, "pnpm", 43127)
	if err != nil {
		t.Fatal(err)
	}
	if expected := []string{"custom", "--port=43127"}; !reflect.DeepEqual(command, expected) {
		t.Fatalf("got %#v, want %#v", command, expected)
	}
}

func TestDevelopmentCommandIsFrameworkNeutral(t *testing.T) {
	command, err := developmentCommand(devextensions.ProjectConfig{Command: []string{"serve-react", "{port}"}}, "unsupported", 4000)
	if err != nil {
		t.Fatal(err)
	}
	if expected := []string{"serve-react", "4000"}; !reflect.DeepEqual(command, expected) {
		t.Fatalf("got %#v, want %#v", command, expected)
	}
}
