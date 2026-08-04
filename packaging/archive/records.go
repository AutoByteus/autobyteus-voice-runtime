package archive

import (
	"encoding/binary"
	"errors"
	"io"
	"os"
	"sort"
)

const regularFileType uint32 = 0100000

type zipRecord struct {
	Name                          string
	Flags, Method, Time, Date     uint16
	CRC, Compressed, Uncompressed uint32
	External                      uint32
	LocalOffset                   uint32
	DataStart, DataEnd            int64
}

func inspectZIP(file *os.File, size int64) ([]zipRecord, error) {
	if size < 22 || size > MaxPackageBytes {
		return nil, errors.New("invalid zip size")
	}
	eocd := make([]byte, 22)
	if _, err := file.ReadAt(eocd, size-22); err != nil {
		return nil, err
	}
	if binary.LittleEndian.Uint32(eocd) != 0x06054b50 || binary.LittleEndian.Uint16(eocd[4:]) != 0 || binary.LittleEndian.Uint16(eocd[6:]) != 0 || binary.LittleEndian.Uint16(eocd[20:]) != 0 {
		return nil, errors.New("invalid EOCD")
	}
	count := int(binary.LittleEndian.Uint16(eocd[8:]))
	if count == 0 || count != int(binary.LittleEndian.Uint16(eocd[10:])) {
		return nil, errors.New("invalid entry count")
	}
	centralSize := int64(binary.LittleEndian.Uint32(eocd[12:]))
	centralOffset := int64(binary.LittleEndian.Uint32(eocd[16:]))
	if centralOffset+centralSize != size-22 {
		return nil, errors.New("invalid central directory bounds")
	}
	records := make([]zipRecord, 0, count)
	offset := centralOffset
	for index := 0; index < count; index++ {
		fixed := make([]byte, 46)
		if _, err := file.ReadAt(fixed, offset); err != nil || binary.LittleEndian.Uint32(fixed) != 0x02014b50 {
			return nil, errors.New("invalid central entry")
		}
		nameLen, extraLen, commentLen := int64(binary.LittleEndian.Uint16(fixed[28:])), int64(binary.LittleEndian.Uint16(fixed[30:])), int64(binary.LittleEndian.Uint16(fixed[32:]))
		if extraLen != 0 || commentLen != 0 || binary.LittleEndian.Uint16(fixed[4:]) != uint16(3<<8|20) || binary.LittleEndian.Uint16(fixed[6:]) != 20 || binary.LittleEndian.Uint16(fixed[34:]) != 0 || binary.LittleEndian.Uint16(fixed[36:]) != 0 {
			return nil, errors.New("unsupported central metadata")
		}
		name := make([]byte, nameLen)
		if _, err := file.ReadAt(name, offset+46); err != nil {
			return nil, err
		}
		record := zipRecord{Name: string(name), Flags: binary.LittleEndian.Uint16(fixed[8:]), Method: binary.LittleEndian.Uint16(fixed[10:]), Time: binary.LittleEndian.Uint16(fixed[12:]), Date: binary.LittleEndian.Uint16(fixed[14:]), CRC: binary.LittleEndian.Uint32(fixed[16:]), Compressed: binary.LittleEndian.Uint32(fixed[20:]), Uncompressed: binary.LittleEndian.Uint32(fixed[24:]), External: binary.LittleEndian.Uint32(fixed[38:]), LocalOffset: binary.LittleEndian.Uint32(fixed[42:])}
		if record.Flags != 0x800 || record.Method != 8 || record.Time != 0 || record.Date != 0x21 || record.Compressed == 0 && record.Uncompressed != 0 {
			return nil, errors.New("noncanonical central record")
		}
		if len(record.Name) < 9 || record.Name[:8] != "package/" {
			return nil, errors.New("unexpected archive root")
		}
		records = append(records, record)
		offset += 46 + nameLen
	}
	if offset != centralOffset+centralSize {
		return nil, errors.New("central directory size mismatch")
	}
	names := make([]string, len(records))
	for i := range records {
		names[i] = records[i].Name[8:]
	}
	if ValidatePathSet(names) != nil || !sort.StringsAreSorted(names) {
		return nil, errors.New("noncanonical path order")
	}
	for index := range records {
		if err := inspectLocal(file, &records[index], centralOffset); err != nil {
			return nil, err
		}
	}
	sort.Slice(records, func(i, j int) bool { return records[i].DataStart < records[j].DataStart })
	expectedOffset := int64(0)
	for i := range records {
		if int64(records[i].LocalOffset) != expectedOffset {
			return nil, errors.New("noncanonical local entry layout")
		}
		expectedOffset = records[i].DataEnd
	}
	if expectedOffset != centralOffset {
		return nil, errors.New("noncanonical central directory position")
	}
	return records, nil
}

func inspectLocal(file *os.File, record *zipRecord, centralOffset int64) error {
	fixed := make([]byte, 30)
	if _, err := file.ReadAt(fixed, int64(record.LocalOffset)); err != nil {
		return err
	}
	if binary.LittleEndian.Uint32(fixed) != 0x04034b50 || binary.LittleEndian.Uint16(fixed[4:]) != 20 || binary.LittleEndian.Uint16(fixed[6:]) != record.Flags || binary.LittleEndian.Uint16(fixed[8:]) != record.Method || binary.LittleEndian.Uint16(fixed[10:]) != record.Time || binary.LittleEndian.Uint16(fixed[12:]) != record.Date || binary.LittleEndian.Uint32(fixed[14:]) != record.CRC || binary.LittleEndian.Uint32(fixed[18:]) != record.Compressed || binary.LittleEndian.Uint32(fixed[22:]) != record.Uncompressed {
		return errors.New("local/central mismatch")
	}
	nameLen, extraLen := int64(binary.LittleEndian.Uint16(fixed[26:])), int64(binary.LittleEndian.Uint16(fixed[28:]))
	if extraLen != 0 {
		return errors.New("local extra field")
	}
	name := make([]byte, nameLen)
	if _, err := file.ReadAt(name, int64(record.LocalOffset)+30); err != nil {
		return err
	}
	if string(name) != record.Name {
		return errors.New("local name mismatch")
	}
	record.DataStart = int64(record.LocalOffset) + 30 + nameLen
	record.DataEnd = record.DataStart + int64(record.Compressed)
	if record.DataEnd > centralOffset {
		return errors.New("local data overrun")
	}
	return nil
}

func copyBounded(destination io.Writer, source io.Reader, expected int64) error {
	written, err := io.CopyN(destination, source, expected)
	if err != nil || written != expected {
		return errors.New("uncompressed size mismatch")
	}
	extra := make([]byte, 1)
	if count, _ := source.Read(extra); count != 0 {
		return errors.New("uncompressed overrun")
	}
	return nil
}

func verifyArchiveModes(records []zipRecord, manifest PackageFileManifest) error {
	modes := map[string]FileMode{"provider/package-files-v1.json": ReadOnly}
	for _, record := range manifest.Files {
		modes[record.Path] = record.Mode
	}
	if len(modes) != len(records) {
		return errors.New("archive mode closure mismatch")
	}
	for _, record := range records {
		relative := record.Name[len("package/"):]
		logical, ok := modes[relative]
		if !ok {
			return errors.New("archive mode path absent from manifest")
		}
		expected := regularFileType | 0444
		if logical == Executable {
			expected = regularFileType | 0555
		}
		if record.External>>16 != expected {
			return errors.New("archive logical mode mismatch")
		}
	}
	return nil
}
