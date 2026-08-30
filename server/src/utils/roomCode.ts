// ============================================================
// THROWN Room Code Generator
// Generates codes in SDT-XXXX format
// ============================================================

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const CODE_LENGTH = 4;
const PREFIX = "SDT-";

export function generateRoomCode(): string {
  let code = PREFIX;
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return code;
}

export function isValidRoomCode(code: string): boolean {
  return /^SDT-[A-Z0-9]{4}$/.test(code);
}
