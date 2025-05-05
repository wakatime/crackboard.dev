/* eslint-disable @typescript-eslint/no-unused-vars */
import 'dotenv/config';

import * as syncSummariesForAllUsers from '@workspace/tasks/summaries/syncSummariesForAllUsers';
import { WakaQChildWorker } from 'wakaq';

import { wakaq } from '..';
import * as registerWithDirectory from '../register/registerWithDirectory';
import * as syncUserSummaries from '../summaries/syncUserSummaries';

await new WakaQChildWorker(wakaq).start();
wakaq.disconnect();
process.exit(0);
