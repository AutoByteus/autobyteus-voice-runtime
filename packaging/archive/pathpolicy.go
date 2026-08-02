package archive

import (
	"errors"
	"path"
	"regexp"
	"strings"
)

var asciiPath = regexp.MustCompile(`^[A-Za-z0-9._/-]+$`)
var windowsReserved = regexp.MustCompile(`(?i)^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\..*)?$`)

func ValidateRelativePath(value string) error {
	if value == "" || len([]byte(value)) > 240 || !asciiPath.MatchString(value) || strings.Contains(value, "\\") || strings.HasPrefix(value, "/") || path.Clean(value) != value {
		return errors.New("invalid archive path")
	}
	for _, segment := range strings.Split(value, "/") {
		if segment == "" || segment == "." || segment == ".." || strings.HasSuffix(segment, ".") || strings.HasSuffix(segment, " ") || windowsReserved.MatchString(segment) {
			return errors.New("invalid archive path segment")
		}
	}
	return nil
}

func ValidatePathSet(values []string) error {
	exact := map[string]bool{}
	folded := map[string]bool{}
	for _, value := range values {
		if err := ValidateRelativePath(value); err != nil {
			return err
		}
		lower := strings.ToLower(value)
		if exact[value] || folded[lower] {
			return errors.New("duplicate or case-colliding path")
		}
		exact[value], folded[lower] = true, true
	}
	return nil
}
