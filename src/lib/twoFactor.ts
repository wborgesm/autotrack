import crypto from "crypto";

function base32ToBuffer(secret: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  const padLength = 8 - (secret.length % 8);
  const padded = secret + "=".repeat(padLength === 8 ? 0 : padLength);
  for (let i = 0; i < padded.length; i++) {
    const val = alphabet.indexOf(padded.charAt(i).toUpperCase());
    if (val === -1) continue; // ignora pads
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.substr(i * 8, 8), 2);
  }
  return Buffer.from(bytes);
}

function hotp(secret: Buffer, counter: number): string {
  const buf = Buffer.alloc(8);
  buf.writeBigInt64BE(BigInt(counter), 0);
  const hmac = crypto.createHmac("sha1", secret).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 1000000;
  return code.toString().padStart(6, "0");
}

export function gerarSegredo(): string {
  const bytes = crypto.randomBytes(20);
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let result = "";
  for (let i = 0; i < bytes.length; i++) {
    result += alphabet[bytes[i] % 32];
  }
  return result;
}

export function gerarQRCodeUrl(email: string, secret: string): string {
  const issuer = "AutoTrack";
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);
  const encodedSecret = encodeURIComponent(secret);
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${encodedSecret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

export function verificarToken(secret: string, token: string): boolean {
  try {
    const key = base32ToBuffer(secret);
    // Testa o tick atual e dois ticks anteriores (janela de 90 segundos)
    const ticks = Math.floor(Date.now() / 30000);
    for (let i = -2; i <= 0; i++) {
      if (hotp(key, ticks + i) === token) return true;
    }
    return false;
  } catch {
    return false;
  }
}
