import 'dotenv/config';

import { WakaQScheduler } from 'wakaq';

import { wakaq } from '..';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as syncBadgesForAllUsers from '../badge/syncBadgesForAllUsers';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as populateSuggestFollowUsersTable from '../infra/populateSuggestFollowUsersTable';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as refreshTrendingPosts from '../infra/refreshTrendingPosts';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as syncIntegrationMilestonesForAllUsers from '../milestones/syncIntegrationMilestonesForAllUsers';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as syncIntegration from '../scrape/scrapeIntegration';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as scrapeIntegrationForAllUsers from '../scrape/scrapeIntegrationForAllUsers';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as syncUserInfo from '../scrape/syncUserInfo';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as syncUserInfoForAllUsers from '../scrape/syncUserInfoForAllUsers';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as syncIntegrationTimelineForAllUsers from '../timeline/syncIntegrationTimelineForAllUsers';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as afterFollowingUser from '../userActions/afterFollowingUser';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as generateProfileBio from '../userActions/generateProfileBio';

const scheduler = new WakaQScheduler(wakaq);
await scheduler.start();
wakaq.disconnect();
process.exit(0);
