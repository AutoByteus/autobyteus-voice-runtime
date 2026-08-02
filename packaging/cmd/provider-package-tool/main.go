package main

import (
	"encoding/json"
	"flag"
	"fmt"
	providerarchive "github.com/AutoByteus/autobyteus-voice-runtime/packaging/archive"
	"os"
	"path/filepath"
)

func main() {
	if len(os.Args) < 2 {
		fail("usage")
	}
	switch os.Args[1] {
	case "build":
		build(os.Args[2:])
	case "extract":
		extract(os.Args[2:])
	default:
		fail("unknown command")
	}
}
func build(args []string) {
	flags := flag.NewFlagSet("build", flag.ExitOnError)
	root := flags.String("root", "", "")
	output := flags.String("output", "", "")
	report := flags.String("report", "", "")
	flags.Parse(args)
	if *root == "" || *output == "" || *report == "" {
		fail("missing build arguments")
	}
	result, err := providerarchive.BuildCanonicalZIP(filepath.Clean(*root), filepath.Clean(*output))
	if err != nil {
		fail(err.Error())
	}
	write(*report, map[string]any{"schemaVersion": 1, "sha256": result.SHA256, "compressedSizeBytes": result.CompressedSizeBytes, "extractedSizeBytes": result.ExtractedSizeBytes, "entryCount": result.EntryCount})
}
func extract(args []string) {
	flags := flag.NewFlagSet("extract", flag.ExitOnError)
	archivePath := flags.String("archive", "", "")
	expectationPath := flags.String("expectation", "", "")
	destination := flags.String("destination", "", "")
	report := flags.String("report", "", "")
	flags.Parse(args)
	var expected providerarchive.ExtractExpectation
	data, err := os.ReadFile(*expectationPath)
	if err != nil {
		fail("invalid input")
	}
	expected, err = providerarchive.DecodeExtractExpectation(data)
	if err != nil {
		fail("invalid input")
	}
	result, err := providerarchive.ExtractVerified(*archivePath, *destination, expected)
	if err != nil {
		fail(err.Error())
	}
	write(*report, result)
}
func write(path string, value any) {
	data, err := json.MarshalIndent(value, "", "  ")
	if err != nil {
		fail(err.Error())
	}
	data = append(data, '\n')
	if err := os.WriteFile(path, data, 0600); err != nil {
		fail(err.Error())
	}
}
func fail(message string) { fmt.Fprintln(os.Stderr, message); os.Exit(1) }
