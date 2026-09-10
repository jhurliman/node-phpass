# Fixture provenance

`portable-vectors.json` was generated from Openwall phpass commit `b05308f306322ccea832b9fc7ca41f1125b4cdb8`, compiling `c/crypt_private.c` with `-DTEST` and OpenSSL libcrypto. Pass the password and the first 12 characters of each hash as the two program arguments to reproduce it. The C oracle handles NUL-terminated inputs; these fixtures do not claim embedded-NUL coverage for portable hashes.

`legacy-vectors.json` was generated with the unmodified node-phpass implementation at commit `4ea1ca515e39926640c9ac09bb5f63696b4ef3f8`, using generation cost 4. Salt values are randomly generated test data. The corpus includes ASCII, Latin characters, emoji, and Chinese characters.

Standard bcrypt tests independently generate/verify hashes using the native bcrypt package. It is a development dependency only.
