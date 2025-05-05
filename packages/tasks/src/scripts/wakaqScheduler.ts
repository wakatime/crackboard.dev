/* eslint-disable @typescript-eslint/no-unused-vars */
import 'dotenv/config';

import { WakaQScheduler } from 'wakaq';

import { wakaq } from '..';
import * as registerWithDirectory from '../register/registerWithDirectory';
import * as syncSummariesForAllUsers from '../summaries/syncSummariesForAllUsers';
import * as syncUserSummaries from '../summaries/syncUserSummaries';

const scheduler = new WakaQScheduler(wakaq);
await scheduler.start();
wakaq.disconnect();
process.exit(0);
