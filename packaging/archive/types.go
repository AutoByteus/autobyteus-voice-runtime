package archive

type FileMode string

const (
	Executable      FileMode = "executable"
	ReadOnly        FileMode = "read-only"
	MaxPackageBytes int64    = 1342177280
)

type ManifestFile struct {
	Path      string   `json:"path"`
	SHA256    string   `json:"sha256"`
	SizeBytes int64    `json:"sizeBytes"`
	Mode      FileMode `json:"mode"`
}
type HostFileManifest struct {
	SchemaVersion int            `json:"schemaVersion"`
	HostPackageID string         `json:"hostPackageId"`
	Files         []ManifestFile `json:"files"`
}
type AssetRef struct {
	Path   string `json:"path"`
	SHA256 string `json:"sha256"`
}
type Target struct {
	Platform     string `json:"platform"`
	Architecture string `json:"architecture"`
}
type ArchiveIdentity struct {
	Format              string `json:"format"`
	FormatVersion       int    `json:"formatVersion"`
	Compression         string `json:"compression"`
	Canonicalization    string `json:"canonicalization"`
	RootDirectory       string `json:"rootDirectory"`
	FileName            string `json:"fileName"`
	URL                 string `json:"url"`
	SHA256              string `json:"sha256"`
	CompressedSizeBytes int64  `json:"compressedSizeBytes"`
	ExtractedSizeBytes  int64  `json:"extractedSizeBytes"`
	EntryCount          int    `json:"entryCount"`
}
type ExtractExpectation struct {
	SchemaVersion  int             `json:"schemaVersion"`
	HostPackageID  string          `json:"hostPackageId"`
	Target         Target          `json:"target"`
	Archive        ArchiveIdentity `json:"archive"`
	HostDescriptor AssetRef        `json:"hostDescriptor"`
	FileManifest   AssetRef        `json:"fileManifest"`
}
type VerificationReport struct {
	SchemaVersion      int    `json:"schemaVersion"`
	HostPackageID      string `json:"hostPackageId"`
	HostRoot           string `json:"hostRoot"`
	ArchiveSHA256      string `json:"archiveSha256"`
	DescriptorSHA256   string `json:"descriptorSha256"`
	FileManifestSHA256 string `json:"fileManifestSha256"`
	ExtractedSizeBytes int64  `json:"extractedSizeBytes"`
	EntryCount         int    `json:"entryCount"`
	ModesVerified      bool   `json:"modesVerified"`
}
