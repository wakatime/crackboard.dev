/* eslint-disable @typescript-eslint/no-unused-vars */
import 'dotenv/config';

import { WakaQChildWorker } from 'wakaq';

import { wakaq } from '..';
import * as getSummaryForAllUsers from '../summaries/getSummaryForAllUsers';
import * as getUserSummary from '../summaries/getUserSummary';

await new WakaQChildWorker(wakaq).start();
wakaq.disconnect();
process.exit(0);
