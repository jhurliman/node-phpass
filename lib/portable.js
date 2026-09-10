'use strict';

// Adapted from Solar Designer's public-domain phpass algorithm:
// https://github.com/openwall/phpass/blob/main/src/PasswordHash.php
const { createHash } = require('node:crypto');
const alphabet = './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

exports.portableCost = function(storedHash, maximum) {
  if (!/^\$[PH]\$[./0-9A-Za-z]{31}$/.test(storedHash)) return null;
  const cost = alphabet.indexOf(storedHash[3]);
  return cost >= 7 && cost <= maximum ? cost : null;
};

exports.portableHash = function(password, storedHash, cost) {
  const bytes = Buffer.from(password, 'utf8');
  let digest = createHash('md5').update(storedHash.slice(4, 12), 'ascii').update(bytes).digest();
  for (let count = 2 ** cost; count > 0; count--) {
    digest = createHash('md5').update(digest).update(bytes).digest();
  }
  let encoded = '';
  for (let offset = 0; offset < digest.length; offset += 3) {
    const remaining = Math.min(3, digest.length - offset);
    let bits = 0;
    for (let i = 0; i < remaining; i++) bits |= digest[offset + i] << (8 * i);
    for (let i = 0; i < Math.ceil(remaining * 8 / 6); i++) {
      encoded += alphabet[(bits >>> (6 * i)) & 63];
    }
  }
  return storedHash.slice(0, 12) + encoded;
};
