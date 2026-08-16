package alx

import (
	"archive/zip"
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

const MaxPackageBytes int64 = 256 << 20

var deterministicTime = time.Date(1980, 1, 1, 0, 0, 0, 0, time.UTC)

type Inspection struct {
	Manifest Manifest `json:"manifest"`
	Digest   string   `json:"packageDigest"`
	Size     int64    `json:"sizeBytes"`
	Files    []string `json:"files"`
}

func PackDir(root, output string) (Inspection, error) {
	root, err := filepath.Abs(root)
	if err != nil {
		return Inspection{}, err
	}
	manifestBytes, err := os.ReadFile(filepath.Join(root, ManifestFile))
	if err != nil {
		return Inspection{}, fmt.Errorf("read %s: %w", ManifestFile, err)
	}
	m, err := ParseManifest(manifestBytes)
	if err != nil {
		return Inspection{}, err
	}
	var names []string
	err = filepath.WalkDir(root, func(p string, d fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if p == root {
			return nil
		}
		rel, err := filepath.Rel(root, p)
		if err != nil {
			return err
		}
		rel = filepath.ToSlash(rel)
		if d.Type()&os.ModeSymlink != 0 {
			return fmt.Errorf("symlink not allowed: %s", rel)
		}
		if d.IsDir() {
			return nil
		}
		if rel == filepath.ToSlash(output) || p == output {
			return nil
		}
		if err := validateArchivePath(rel); err != nil {
			return err
		}
		names = append(names, rel)
		return nil
	})
	if err != nil {
		return Inspection{}, err
	}
	sort.Strings(names)
	f, err := os.Create(output)
	if err != nil {
		return Inspection{}, err
	}
	h := sha256.New()
	zw := zip.NewWriter(io.MultiWriter(f, h))
	for _, name := range names {
		info, err := os.Stat(filepath.Join(root, filepath.FromSlash(name)))
		if err != nil {
			f.Close()
			return Inspection{}, err
		}
		hdr, err := zip.FileInfoHeader(info)
		if err != nil {
			f.Close()
			return Inspection{}, err
		}
		hdr.Name, hdr.Method = name, zip.Deflate
		hdr.Modified = deterministicTime
		hdr.SetMode(0644)
		hdr.Extra, hdr.Comment = nil, ""
		w, err := zw.CreateHeader(hdr)
		if err != nil {
			f.Close()
			return Inspection{}, err
		}
		src, err := os.Open(filepath.Join(root, filepath.FromSlash(name)))
		if err != nil {
			f.Close()
			return Inspection{}, err
		}
		_, copyErr := io.Copy(w, src)
		closeErr := src.Close()
		if copyErr != nil {
			f.Close()
			return Inspection{}, copyErr
		}
		if closeErr != nil {
			f.Close()
			return Inspection{}, closeErr
		}
	}
	if err := zw.Close(); err != nil {
		f.Close()
		return Inspection{}, err
	}
	if err := f.Sync(); err != nil {
		f.Close()
		return Inspection{}, err
	}
	if err := f.Close(); err != nil {
		return Inspection{}, err
	}
	stat, err := os.Stat(output)
	if err != nil {
		return Inspection{}, err
	}
	return Inspection{Manifest: m, Digest: "sha256:" + hex.EncodeToString(h.Sum(nil)), Size: stat.Size(), Files: names}, nil
}

func InspectFile(filename string) (Inspection, error) {
	f, err := os.Open(filename)
	if err != nil {
		return Inspection{}, err
	}
	defer f.Close()
	st, err := f.Stat()
	if err != nil {
		return Inspection{}, err
	}
	return InspectReader(f, st.Size())
}

func InspectReader(r io.ReaderAt, size int64) (Inspection, error) {
	if size <= 0 || size > MaxPackageBytes {
		return Inspection{}, fmt.Errorf("package size %d is outside allowed range", size)
	}
	zr, err := zip.NewReader(r, size)
	if err != nil {
		return Inspection{}, fmt.Errorf("open package: %w", err)
	}
	seen := map[string]bool{}
	var names []string
	var manifestBytes []byte
	hash := sha256.New()
	section := io.NewSectionReader(r, 0, size)
	if _, err := io.Copy(hash, section); err != nil {
		return Inspection{}, err
	}
	for _, zf := range zr.File {
		if err := validateArchivePath(strings.TrimSuffix(zf.Name, "/")); err != nil {
			return Inspection{}, err
		}
		if seen[zf.Name] {
			return Inspection{}, fmt.Errorf("duplicate archive path %q", zf.Name)
		}
		seen[zf.Name] = true
		if zf.Mode()&os.ModeSymlink != 0 {
			return Inspection{}, fmt.Errorf("symlink not allowed: %s", zf.Name)
		}
		if zf.FileInfo().IsDir() {
			continue
		}
		names = append(names, zf.Name)
		if zf.Name == ManifestFile {
			if zf.UncompressedSize64 > MaxManifestBytes {
				return Inspection{}, fmt.Errorf("manifest too large")
			}
			rc, err := zf.Open()
			if err != nil {
				return Inspection{}, err
			}
			manifestBytes, err = io.ReadAll(io.LimitReader(rc, MaxManifestBytes+1))
			rc.Close()
			if err != nil {
				return Inspection{}, err
			}
		}
	}
	if manifestBytes == nil {
		return Inspection{}, fmt.Errorf("package is missing %s", ManifestFile)
	}
	m, err := ParseManifest(manifestBytes)
	if err != nil {
		return Inspection{}, err
	}
	if !seen[m.Entry] {
		return Inspection{}, fmt.Errorf("manifest entry %q is missing from package", m.Entry)
	}
	sort.Strings(names)
	return Inspection{Manifest: m, Digest: "sha256:" + hex.EncodeToString(hash.Sum(nil)), Size: size, Files: names}, nil
}

func ExtractFile(filename, destination string) (Inspection, error) {
	inspection, err := InspectFile(filename)
	if err != nil {
		return Inspection{}, err
	}
	zr, err := zip.OpenReader(filename)
	if err != nil {
		return Inspection{}, err
	}
	defer zr.Close()
	for _, zf := range zr.File {
		if zf.FileInfo().IsDir() {
			continue
		}
		target := filepath.Join(destination, filepath.FromSlash(zf.Name))
		if !strings.HasPrefix(target, filepath.Clean(destination)+string(os.PathSeparator)) {
			return Inspection{}, fmt.Errorf("unsafe extraction path")
		}
		if err := os.MkdirAll(filepath.Dir(target), 0755); err != nil {
			return Inspection{}, err
		}
		rc, err := zf.Open()
		if err != nil {
			return Inspection{}, err
		}
		out, err := os.OpenFile(target, os.O_CREATE|os.O_EXCL|os.O_WRONLY, 0644)
		if err != nil {
			rc.Close()
			return Inspection{}, err
		}
		_, copyErr := io.Copy(out, rc)
		closeErr := out.Close()
		rc.Close()
		if copyErr != nil {
			return Inspection{}, copyErr
		}
		if closeErr != nil {
			return Inspection{}, closeErr
		}
	}
	return inspection, nil
}

func MarshalInspection(i Inspection) ([]byte, error) { return json.MarshalIndent(i, "", "  ") }

func InspectBytes(data []byte) (Inspection, error) {
	return InspectReader(bytes.NewReader(data), int64(len(data)))
}
