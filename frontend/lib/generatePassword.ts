const LOWER = "abcdefghijkmnpqrstuvwxyz"; // no l/o, easy to misread
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I/O
const DIGITS = "23456789"; // no 0/1
const SYMBOLS = "!@#$%^&*()-_=+[]{}";

const ALL = LOWER + UPPER + DIGITS + SYMBOLS;

/** Generates a random password using the browser's cryptographically secure RNG. */
export function generatePassword(length = 20): string {
  const randomFrom = (chars: string) => {
    const bytes = new Uint32Array(1);
    crypto.getRandomValues(bytes);
    return chars[bytes[0] % chars.length];
  };

  // Guarantee at least one of each character class, then fill the rest randomly.
  const required = [randomFrom(LOWER), randomFrom(UPPER), randomFrom(DIGITS), randomFrom(SYMBOLS)];
  const rest = Array.from({ length: Math.max(length - required.length, 0) }, () => randomFrom(ALL));

  const chars = [...required, ...rest];

  // Fisher-Yates shuffle so the guaranteed characters aren't always at the front.
  for (let i = chars.length - 1; i > 0; i--) {
    const bytes = new Uint32Array(1);
    crypto.getRandomValues(bytes);
    const j = bytes[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}
