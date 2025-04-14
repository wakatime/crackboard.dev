import { Buffer } from 'buffer';

export const b64decode = (str: string): string => Buffer.from(str, 'base64').toString('binary');
export const b64encode = (str: string): string => Buffer.from(str, 'binary').toString('base64');
