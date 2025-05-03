/* eslint-disable @typescript-eslint/no-unused-vars */
import 'dotenv/config';

import { WakaQChildWorker } from 'wakaq';

import { wakaq } from '..';
import * as syncSummariesForAllUsers from '../summaries/syncSummariesForAllUsers';
import * as syncUserSummaries from '../summaries/syncUserSummaries';

await new WakaQChildWorker(wakaq).start();
wakaq.disconnect();
process.exit(0);
