# phpass

[![CI](https://github.com/jhurliman/node-phpass/actions/workflows/ci.yml/badge.svg)](https://github.com/jhurliman/node-phpass/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/phpass.svg)](https://www.npmjs.com/package/phpass)

Bring a legacy PHP password database into Node.js. **phpass** verifies portable
`$P$` / `$H$` hashes and standard bcrypt hashes, and generates new bcrypt hashes
through [bcrypt.js](https://github.com/dcodeIO/bcrypt.js). It includes synchronous
and Promise APIs, TypeScript declarations, and a separate migration path for
passwords created by the original `node-phpass` implementation.

Its purpose is interoperability with existing databases. Portable hashes are
verified for migration; new hashes use bcrypt. This package does not implement
PHP's extended DES fallback, Drupal `$S$` hashes, or application-specific wrappers.

## Install

```sh
npm install phpass
```

Version 1 requires Node.js 22 or newer. Its runtime uses JavaScript and Node's
built-in crypto API; consumers do not need a native compiler.

## Hash and verify

Save as `example.mjs` and run `node example.mjs`:

```js
import { PasswordHash } from 'phpass';

const passwords = new PasswordHash(10);
const storedHash = await passwords.hashPasswordAsync('correct horse battery staple');

console.log(await passwords.checkPasswordAsync('correct horse battery staple', storedHash));
// true
console.log(await passwords.checkPasswordAsync('wrong password', storedHash));
// false
```

For CommonJS use `const { PasswordHash } = require('phpass')`. The original
synchronous API remains available as `hashPassword()` and `checkPassword()`.

## Supported formats

| Stored hash | Verification | New hash generation |
| --- | --- | --- |
| bcrypt `$2a$`, `$2b$`, `$2y$` | `checkPassword()` / `checkPasswordAsync()` | bcrypt `$2b$` |
| phpass portable `$P$` | Same methods | Unsupported |
| phpBB portable `$H$` | Same methods | Unsupported |
| Non-ASCII hashes created by node-phpass 0.1.x | Explicit `checkPasswordLegacy()` | Unsupported |

Portable verification implements the public-domain
[Openwall phpass algorithm](https://github.com/openwall/phpass/blob/main/src/PasswordHash.php).
The tests include outputs from Openwall's independent C implementation, covering
empty, ASCII, UTF-8, and long passwords at multiple iteration counts.

## Migrate a portable hash

Verify the supplied password against the stored hash. After successful
verification, create a new hash from that same password and persist it through
your application's normal account update:

```js
import { PasswordHash } from 'phpass';

const passwords = new PasswordHash(10);
// A public test fixture for the password "test", not a real account credential.
const oldHash = '$P$5123456782Jd0mCwOvdg2EsRtmpU9H1';

if (await passwords.checkPasswordAsync('test', oldHash)) {
  const replacement = await passwords.hashPasswordAsync('test');
  console.log(replacement); // Store this in place of oldHash.
}
```

Passwords over 72 UTF-8 bytes can be verified against portable hashes, but cannot
be passed to `hashPassword()`: choose an explicit account migration/reset policy
for those records rather than silently truncating their passwords.

## API and limits

```js
const passwords = new PasswordHash(10, false, {
  maxBcryptCost: 16,
  maxPortableCost: 20,
});
```

The first argument is the bcrypt generation cost (default `10`). Verification
reads the cost from the **stored hash**, independently of that setting. The
second argument must remain `false`: portable hash generation is unsupported.
The optional third argument bounds verification work before hashing begins.

| Method | Returns |
| --- | --- |
| `hashPassword(password)` | A bcrypt hash; blocks until complete |
| `hashPasswordAsync(password)` | `Promise<string>`; bcrypt work yields between chunks |
| `checkPassword(password, storedHash)` | Whether a supported hash matches; blocks until complete |
| `checkPasswordAsync(password, storedHash)` | `Promise<boolean>`; portable work uses a worker thread |
| `checkPasswordLegacy(password, storedHash)` | Whether an explicitly identified node-phpass 0.1.x hash matches |

Passwords are strings encoded as UTF-8. New bcrypt passwords may contain at most
72 bytes. Verification accepts up to 4,096 UTF-8 bytes; bcrypt retains its
historical 72-byte truncation behavior when checking an existing hash. Legacy
verification instead limits the old representation to 4,096 UTF-16 code units.

Malformed, unsupported, and over-policy hashes return `false`. Non-string
passwords and invalid configuration throw (async methods reject). Hashing errors,
such as an unavailable MD5 implementation in a restricted crypto runtime, also
propagate. Generation cost must be an integer from 4 through `maxBcryptCost`;
verification ceilings allow 4–31 for bcrypt and 7–30 for portable hashes. Each
cost increment doubles the work, so choose ceilings for your stored database
and workload before increasing them.

Async methods do not impose a concurrency limit. Bound concurrent verification
in your application, particularly portable verification, which starts one
worker per call. Sync methods run on the calling thread. None of these methods
handles account storage, login throttling, or session management.

## Upgrading from 0.1.x

Version 1 deliberately changes several behaviors:

- New salts use cryptographic randomness; the bundled `Math.random()` salt path
  is replaced. The default generation cost increases from 8 to 10.
- Verification uses each stored hash's cost. You no longer need a separate
  `PasswordHash` instance matching every record's original cost.
- New passwords use standard UTF-8 bcrypt encoding and reject inputs beyond
  72 bytes. Generated hashes use `$2b$`.
- Malformed/unsupported hashes return `false`, configuration is validated, and
  verification costs are bounded. TypeScript declarations are included.

**Identify records created by node-phpass 0.1.x before migrating non-ASCII
passwords.** That release reduced UTF-16 code units to individual low bytes,
which is not UTF-8 and can map different passwords to the same byte sequence.
For those records only, use `checkPasswordLegacy()`, then replace the hash after
a successful check. It is synchronous and retains the old encoding behavior
solely for migration. The normal verification methods never fall back to it
automatically. The `$2a$` prefix alone does not identify a node-phpass record.

See [CHANGELOG.md](CHANGELOG.md) for release details.

## Development

```sh
npm ci
npm test
npm run test:types
npm run test:coverage
npm pack --dry-run
```

CI runs on Node.js 22, 24, and 26. Tests cross-check standard hashes with native
bcrypt, portable hashes with Openwall-generated fixtures, and legacy hashes with
fixtures generated by node-phpass 0.1.1. Native bcrypt is a development-only
oracle and is not installed by package consumers.

## License and credits

[MIT](LICENSE), with original code copyright © 2011 Cull TV, Inc.
The legacy bcrypt implementation was originally credited to
[jsBCrypt](https://code.google.com/archive/p/javascript-bcrypt/) under the New BSD
license. Portable verification follows Solar Designer's public-domain algorithm;
standard bcrypt is provided by bcrypt.js. See [THIRD_PARTY.md](THIRD_PARTY.md).
