// scripts/generate-keys.ts — run with: npx tsx scripts/generate-keys.ts
import { randomBytes, generateKeyPairSync } from 'node:crypto';

const aesKey = randomBytes(32).toString('base64');

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
});

console.log('VOTE_ENCRYPTION_KEY=' + aesKey);
console.log('VOTE_SIGNING_PRIVATE_KEY=' + Buffer.from(privateKey).toString('base64'));
console.log('VOTE_SIGNING_PUBLIC_KEY=' + Buffer.from(publicKey).toString('base64'));