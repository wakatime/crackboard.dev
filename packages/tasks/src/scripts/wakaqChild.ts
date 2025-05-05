/* eslint-disable @typescript-eslint/no-unused-vars */
import 'dotenv/config';

import { WakaQChildWorker } from 'wakaq';

import { wakaq } from '..';
import * as registerWithDirectory from '../register/registerWithDirectory';
import * as syncSummariesForAllUsers from '../summaries/syncSummariesForAllUsers';
import * as syncUserSummaries from '../summaries/syncUserSummaries';
import * as syncUserProfile from '../users/syncUserProfile';
import * as syncUserProfilesForAllUsers from '../users/syncUserProfilesForAllUsers';

await new WakaQChildWorker(wakaq).start();
wakaq.disconnect();
process.exit(0);
