package modelstore

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/AutoByteus/autobyteus-voice-runtime/integrity"
)

type Partial struct {
	store          *Store
	dataRelative   string
	recordRelative string
}

func (s *Store) Partial(manifestSHA, relative string) (*Partial, error) {
	data, record, err := s.partialRelatives(manifestSHA, relative)
	if err != nil {
		return nil, err
	}
	directory, err := s.openOwnedDirectory(filepath.Dir(data), true)
	if err != nil {
		return nil, err
	}
	_ = directory.Close()
	return &Partial{store: s, dataRelative: data, recordRelative: record}, nil
}

func (s *Store) partialRelatives(manifestSHA, relative string) (string, string, error) {
	if !digestPattern.MatchString(manifestSHA) || !integrity.ValidRelativePath(relative) {
		return "", "", ErrStoreCorrupt
	}
	encoded := fmt.Sprintf("%x", []byte(relative))
	directory := filepath.Join("partials", manifestSHA)
	return filepath.Join(directory, encoded+".part"), filepath.Join(directory, "partial-download-v1.json"), nil
}

func (p *Partial) OpenData(flags int, mode os.FileMode) (*os.File, error) {
	if p == nil || p.store == nil {
		return nil, ErrStoreCorrupt
	}
	return p.store.openOwnedRegular(p.dataRelative, flags, mode, true)
}

func (p *Partial) DataInfo() (os.FileInfo, error) {
	file, err := p.OpenData(os.O_RDONLY, 0)
	if err != nil {
		return nil, err
	}
	defer file.Close()
	return file.Stat()
}

func (p *Partial) ReadRecord(limit int64) ([]byte, error) {
	if p == nil || p.store == nil {
		return nil, ErrStoreCorrupt
	}
	return p.store.readOwned(p.recordRelative, limit)
}

func (p *Partial) WriteRecord(data []byte) error {
	if p == nil || p.store == nil {
		return ErrStoreCorrupt
	}
	temporary := p.recordRelative + ".tmp"
	if err := p.store.removeOwned(temporary, false); err != nil && !os.IsNotExist(err) {
		return err
	}
	if err := p.store.writeOwnedExclusive(temporary, data, 0600); err != nil {
		return err
	}
	return p.store.renameOwned(temporary, p.recordRelative)
}

func (p *Partial) Remove() error {
	if p == nil || p.store == nil {
		return ErrStoreCorrupt
	}
	for _, relative := range []string{p.dataRelative, p.recordRelative} {
		if err := p.store.removeOwned(relative, false); err != nil && !os.IsNotExist(err) {
			return err
		}
	}
	return nil
}

func (p *Partial) RemoveData() error {
	if p == nil || p.store == nil {
		return ErrStoreCorrupt
	}
	if err := p.store.removeOwned(p.dataRelative, false); err != nil && !os.IsNotExist(err) {
		return err
	}
	return nil
}

func (p *Partial) removeRecord() error {
	if p == nil || p.store == nil {
		return ErrStoreCorrupt
	}
	if err := p.store.removeOwned(p.recordRelative, false); err != nil && !os.IsNotExist(err) {
		return err
	}
	return nil
}
