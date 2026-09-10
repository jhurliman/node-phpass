export const version: string;
export interface VerificationOptions {
  maxBcryptCost?: number;
  maxPortableCost?: number;
}
export class PasswordHash {
  constructor(iterationCountLog2?: number, portableHashes?: false, options?: VerificationOptions);
  readonly iterationCountLog2: number;
  readonly maxBcryptCost: number;
  readonly maxPortableCost: number;
  hashPassword(password: string): string;
  hashPasswordAsync(password: string): Promise<string>;
  checkPassword(password: string, storedHash: string): boolean;
  checkPasswordAsync(password: string, storedHash: string): Promise<boolean>;
  checkPasswordLegacy(password: string, storedHash: string): boolean;
}
