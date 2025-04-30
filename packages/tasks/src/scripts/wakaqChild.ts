import 'dotenv/config';

import { WakaQChildWorker } from 'wakaq';

import { wakaq } from '..';

await new WakaQChildWorker(wakaq).start();
wakaq.disconnect();
process.exit(0);
