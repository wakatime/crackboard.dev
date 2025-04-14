import { S3Client } from '@aws-sdk/client-s3';

import { env } from './env';

const SPACES_KEY = env.SPACES_KEY;
const SPACES_SECRET = env.SPACES_SECRET;

if (!SPACES_KEY) {
  throw new Error('SPACES_KEY is required');
}

if (!SPACES_SECRET) {
  throw new Error('SPACES_SECRET is required');
}

const globalForAWS = globalThis as unknown as {
  s3: S3Client | undefined;
};

export const s3 =
  globalForAWS.s3 ??
  new S3Client({
    credentials: {
      accessKeyId: SPACES_KEY,
      secretAccessKey: SPACES_SECRET,
    },
    endpoint: 'https://sfo3.digitaloceanspaces.com',
    forcePathStyle: false,
    region: 'us-east-1',
  });

if (env.NODE_ENV !== 'production') {
  globalForAWS.s3 = s3;
}
