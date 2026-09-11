# Changelog

## 1.0.0 — 2026-09-10

- Add verification of `$P$` and `$H$` portable hashes (#2), including a worker-backed asynchronous API.
- Replace normal bcrypt operations with bcrypt.js: cryptographic salts, standard UTF-8, stored-cost verification, and `$2b$` generation.
- Add Promise hashing/verification, input validation, verification cost ceilings, and TypeScript declarations.
- Default generation cost changes from 8 to 10; require Node.js 22+.
- Reject new bcrypt passwords over 72 UTF-8 bytes instead of silently truncating them. Verification preserves existing bcrypt truncation behavior up to a 4,096-byte input limit.
- Retain the old low-byte encoding only in explicit `checkPasswordLegacy()` for migration; no automatic fallback.
- Add native-bcrypt interoperability tests, independent Openwall fixtures, legacy fixtures, and GitHub Actions.
- Add explicit npm contents and preserve license/attribution in the archive; rewrite README with migration guidance.

## 0.1.1

- Fix constructing PasswordHash without parameters.

## 0.1.0

- Initial release.
