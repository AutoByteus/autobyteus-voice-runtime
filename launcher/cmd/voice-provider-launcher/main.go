package main

import (
	launcher "github.com/AutoByteus/autobyteus-voice-runtime/launcher/internal"
	"os"
)

func main() { os.Exit(launcher.Run(os.Args)) }
