import { scrypt, timingSafeEqual } from 'crypto';

export function scryptAsync(password: string, salt: string, keylen: number): Promise<string> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, (err, hash) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(hash.toString('hex'));
    });
  });
}

export async function scryptVerifyAsync(hash: string, password: string, salt: string): Promise<boolean> {
  const keylen = hash.length;
  const rehashed = await scryptAsync(password, salt, keylen);
  return timingSafeEqual(Buffer.from(hash), Buffer.from(rehashed));
}
