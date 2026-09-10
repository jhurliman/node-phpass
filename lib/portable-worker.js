'use strict';
const { parentPort, workerData } = require('node:worker_threads');
const { portableHash } = require('./portable');
parentPort.postMessage(portableHash(workerData.password, workerData.storedHash, workerData.cost));
