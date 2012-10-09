
/*!
 * passwordhash
 * Copyright(c) 2011 Cull TV, Inc. <jhurliman@cull.tv>
 * MIT Licensed
 */

exports.version = '0.1.0';

var BCrypt = require('./bcrypt').BCrypt;
var utils = require('./utils');

exports.PasswordHash = function(iterationCountLog2, portableHashes) {
  //this.portableHashes = portableHashes;
  //this.randomState = this.microtime() + process.pid;
  if (portableHashes)
    throw 'Portable hashes are not implemented';
  
  this.bcrypt = new BCrypt(iterationCountLog2);
};

exports.PasswordHash.prototype.hashPassword = function(password) {
  var salt = this.bcrypt.genSalt();
  return this.bcrypt.hash(password, salt);
};

exports.PasswordHash.prototype.checkPassword = function(password, storedHash) {
  var salt = storedHash.substring(0, 29);
  var hash = this.bcrypt.hash(password, salt);
  return hash == storedHash;
};
