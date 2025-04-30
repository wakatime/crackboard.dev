import 'dotenv/config';

import { WakaQScheduler } from 'wakaq';

import { wakaq } from '..';

const scheduler = new WakaQScheduler(wakaq);
await scheduler.start();
wakaq.disconnect();
process.exit(0);
