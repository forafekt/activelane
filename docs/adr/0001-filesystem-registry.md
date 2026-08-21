# ADR 0001: Filesystem metadata and content-addressed blobs

Status: accepted for the initial vertical slice.

The registry stores immutable blobs by SHA-256 and small version metadata documents on a local
filesystem. Atomic rename/link operations provide a complete self-hosted workflow without Docker,
a database, or cloud credentials. The public HTTP protocol does not expose this layout.

An object store or OCI Distribution backend remains possible behind the store boundary when scale
or deployment evidence requires it. OCI was not selected now because it would add operational and
authentication complexity without improving deterministic resolution or package validation.

A future air-gapped `.albundle` should contain a signed index, selected release and dependency
metadata, blobs, digests, SBOMs, attestations, and signatures. Import must verify the signed index
before atomically exposing releases. No signature or bundle capability is advertised today.
