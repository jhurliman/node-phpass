'use strict';

// Copyright (c) 2011 Cull TV, Inc. MIT Licensed.
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const { portableHash, portableCost } = require('./portable');

exports.version = require('../package.json').version;
exports.PasswordHash = PasswordHash;

function integer(value, min, max, name) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(`${name} must be an integer from ${min} through ${max}`);
  }
  return value;
}

function PasswordHash(iterationCountLog2 = 10, portableHashes = false, options = {}) {
  if (portableHashes !== false) {
    throw new TypeError('Portable hash generation is unsupported; existing $P$/$H$ hashes can be verified');
  }
  this.maxBcryptCost = integer(options.maxBcryptCost ?? 16, 4, 31, 'maxBcryptCost');
  this.maxPortableCost = integer(options.maxPortableCost ?? 20, 7, 30, 'maxPortableCost');
  this.iterationCountLog2 = integer(iterationCountLog2, 4, this.maxBcryptCost, 'iterationCountLog2');
}

function passwordBytes(password) {
  if (typeof password !== 'string') throw new TypeError('password must be a string');
  return Buffer.byteLength(password, 'utf8');
}

function validateNewPassword(password) {
  if (passwordBytes(password) > 72) throw new RangeError('bcrypt passwords must not exceed 72 UTF-8 bytes');
}

function bcryptCost(storedHash, maximum) {
  if (typeof storedHash !== 'string' || !/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(storedHash)) return null;
  const cost = Number(storedHash.slice(4, 6));
  return cost >= 4 && cost <= maximum ? cost : null;
}

function equalHashes(actual, expected) {
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

PasswordHash.prototype.hashPassword = function(password) {
  validateNewPassword(password);
  return bcrypt.hashSync(password, this.iterationCountLog2);
};

PasswordHash.prototype.hashPasswordAsync = async function(password) {
  validateNewPassword(password);
  return bcrypt.hash(password, this.iterationCountLog2);
};

PasswordHash.prototype.checkPassword = function(password, storedHash) {
  const bytes = passwordBytes(password);
  if (bytes > 4096 || typeof storedHash !== 'string') return false;
  if (bcryptCost(storedHash, this.maxBcryptCost) !== null) {
    return bcrypt.compareSync(password, storedHash);
  }
  const cost = portableCost(storedHash, this.maxPortableCost);
  return cost !== null && equalHashes(portableHash(password, storedHash, cost), storedHash);
};

PasswordHash.prototype.checkPasswordAsync = async function(password, storedHash) {
  const bytes = passwordBytes(password);
  if (bytes > 4096 || typeof storedHash !== 'string') return false;
  if (bcryptCost(storedHash, this.maxBcryptCost) !== null) {
    return bcrypt.compare(password, storedHash);
  }
  const cost = portableCost(storedHash, this.maxPortableCost);
  if (cost === null) return false;
  // The MD5 loop is kept off the event loop for legacy database migrations.
  const { Worker } = require('node:worker_threads');
  return new Promise((resolve, reject) => {
    const worker = new Worker(require.resolve('./portable-worker'), {
      workerData: { password, storedHash, cost },
    });
    worker.once('message', actual => resolve(equalHashes(actual, storedHash)));
    worker.once('error', reject);
    worker.once('exit', code => {
      if (code !== 0) reject(new Error(`Portable hash worker exited with code ${code}`));
    });
  });
};

// Explicit migration path only: 0.1.x encoded UTF-16 code units as low bytes.
// Never try this automatically for hashes from other password implementations.
PasswordHash.prototype.checkPasswordLegacy = function(password, storedHash) {
  passwordBytes(password);
  const cost = bcryptCost(storedHash, this.maxBcryptCost);
  if (cost === null || !storedHash.startsWith('$2a$') || password.length > 4096) return false;
  const { BCrypt } = require('./bcrypt');
  const actual = new BCrypt(cost).hash(password, storedHash.slice(0, 29));
  return equalHashes(actual, storedHash);
};
