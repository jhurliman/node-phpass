'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const native = require('bcrypt');
const { PasswordHash, version } = require('..');
const portable = require('./portable-vectors.json');
const legacy = require('./legacy-vectors.json');

test('version agrees with package metadata', () => assert.equal(version, require('../package.json').version));

test('reads stored bcrypt costs independently of the generation setting', () => {
  const hasher = new PasswordHash(4);
  for (const cost of [4, 5, 6]) {
    const hash = native.hashSync('test', cost);
    assert.equal(hasher.checkPassword('test', hash), true);
    assert.equal(hasher.checkPassword('wrong', hash), false);
  }
});

test('interoperates with native bcrypt for UTF-8, empty strings and embedded NULs', () => {
  const hasher = new PasswordHash(4);
  for (const password of ['', 'ascii', 'pässwörd', '🔑密码', 'before\0after', 'é'.repeat(36)]) {
    assert.equal(native.compareSync(password, hasher.hashPassword(password)), true);
    assert.equal(hasher.checkPassword(password, native.hashSync(password, 4)), true);
  }
});

test('supports 2a, 2b and 2y hashes, but rejects unsupported formats', () => {
  const hasher = new PasswordHash(4);
  const hash = native.hashSync('password', 4);
  for (const prefix of ['$2a$', '$2b$', '$2y$']) {
    assert.equal(hasher.checkPassword('password', prefix + hash.slice(4)), true);
  }
  for (const hash of ['', '*0', '*1', '$2x$04$' + 'a'.repeat(53), null, undefined, 3]) {
    assert.equal(hasher.checkPassword('password', hash), false);
  }
});

test('uses cryptographic salt generation without Math.random', () => {
  const hasher = new PasswordHash(4);
  const original = Math.random;
  Math.random = () => { throw Error('insecure randomness'); };
  try {
    const a = hasher.hashPassword('password');
    const b = hasher.hashPassword('password');
    assert.notEqual(a.slice(0, 29), b.slice(0, 29));
    assert.equal(hasher.checkPassword('password', a), true);
  } finally { Math.random = original; }
});

test('rejects new passwords over 72 UTF-8 bytes and preserves historical bcrypt verification', () => {
  const hasher = new PasswordHash(4);
  assert.throws(() => hasher.hashPassword('a'.repeat(73)), RangeError);
  assert.throws(() => hasher.hashPassword('é'.repeat(37)), RangeError);
  const long = 'a'.repeat(80);
  assert.equal(hasher.checkPassword(long, native.hashSync(long, 4)), true);
});

test('validates configuration and rejects excessive stored costs before hashing', () => {
  for (const rounds of [0, 3, -1, NaN, Infinity, 4.5, 32]) assert.throws(() => new PasswordHash(rounds), RangeError);
  assert.throws(() => new PasswordHash(8, true), /generation is unsupported/);
  assert.throws(() => new PasswordHash(8, false, { maxBcryptCost: 7 }), RangeError);
  const limited = new PasswordHash(4, false, { maxBcryptCost: 4, maxPortableCost: 7 });
  assert.equal(limited.checkPassword('password', '$2b$31$' + '.'.repeat(53)), false);
  assert.equal(limited.checkPassword('password', '$P$S12345678' + '.'.repeat(22)), false);
  assert.equal(limited.checkPassword('password', '$P$412345678' + '.'.repeat(22)), false);
  assert.equal(limited.checkPassword('a'.repeat(4097), portable[0].hash), false);
  assert.throws(() => limited.hashPassword(null), TypeError);
  assert.throws(() => limited.checkPassword(null, 'hash'), TypeError);
});

test('verifies portable hashes from Openwall’s independent C implementation (#2)', () => {
  const hasher = new PasswordHash(4);
  for (const { password, hash } of portable) {
    assert.equal(hasher.checkPassword(password, hash), true, hash);
    assert.equal(hasher.checkPassword(password + 'wrong', hash), false);
    assert.equal(hasher.checkPassword(password, '$H$' + hash.slice(3)), true);
  }
});

test('rejects malformed portable hashes', () => {
  const hasher = new PasswordHash(4);
  const hash = portable[0].hash;
  for (const broken of [hash.slice(1), hash + 'a', hash.slice(0, -1), '$S$' + hash.slice(3), hash.replace('1', '!')]) {
    assert.equal(hasher.checkPassword('', broken), false);
  }
});

test('legacy UTF-16-low-byte verification is an explicit migration operation', () => {
  const hasher = new PasswordHash(6);
  for (const { password, hash } of legacy) {
    assert.equal(hasher.checkPasswordLegacy(password, hash), true);
    assert.equal(hasher.checkPasswordLegacy(password + 'wrong', hash), false);
    if (password !== 'ascii-password') assert.equal(hasher.checkPassword(password, hash), false);
  }
  assert.equal(hasher.checkPasswordLegacy('password', '$2a$31$' + '.'.repeat(53)), false);
  assert.equal(hasher.checkPasswordLegacy('password', '$2b$04$' + '.'.repeat(53)), false);
});

test('async bcrypt methods interoperate and reject invalid input', async () => {
  const hasher = new PasswordHash(4);
  const hash = await hasher.hashPasswordAsync('🔑password');
  assert.equal(native.compareSync('🔑password', hash), true);
  assert.equal(await hasher.checkPasswordAsync('🔑password', hash), true);
  assert.equal(await hasher.checkPasswordAsync('wrong', hash), false);
  assert.equal(await hasher.checkPasswordAsync('password', 'malformed'), false);
  await assert.rejects(hasher.hashPasswordAsync('a'.repeat(73)), RangeError);
  await assert.rejects(hasher.checkPasswordAsync(null, hash), TypeError);
});

test('async portable verification runs in a worker without blocking timers', async () => {
  const hasher = new PasswordHash(4);
  const fixture = portable.find(row => row.password === 'pässwörd');
  let timerRan = false;
  const timer = setTimeout(() => { timerRan = true; }, 0);
  assert.equal(await hasher.checkPasswordAsync(fixture.password, fixture.hash), true);
  assert.equal(timerRan, true);
  clearTimeout(timer);
  assert.equal(await hasher.checkPasswordAsync('wrong', fixture.hash), false);
});
