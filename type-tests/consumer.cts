import { PasswordHash, version } from '../index.js';
const passwords = new PasswordHash(10, false, { maxBcryptCost: 14 });
const sync: boolean = passwords.checkPassword('password', passwords.hashPassword('password'));
const asyncHash: Promise<string> = passwords.hashPasswordAsync('password');
const asyncValid: Promise<boolean> = passwords.checkPasswordAsync('password', 'hash');
const legacy: boolean = passwords.checkPasswordLegacy('password', 'hash');
const label: string = version;
