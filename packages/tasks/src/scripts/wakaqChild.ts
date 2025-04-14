import 'dotenv/config';

import { WakaQChildWorker } from 'wakaq';

import { wakaq } from '..';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as syncBadgesForAllUsers from '../badge/syncBadgesForAllUsers';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as afterChatMessageCreated from '../chat/afterChatMessageCreated';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as fetchCompanyDomainManifest from '../hire/fetchCompanyDomainManifest';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as sendLoginLink from '../hire/sendLoginLink';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as sendOnboardingNotificationToAdmins from '../hire/sendOnboardingNotificationToAdmins';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as populatePostCounters from '../infra/populatePostCounters';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as populateSuggestFollowUsersTable from '../infra/populateSuggestFollowUsersTable';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as prefetchTwitterProfile from '../infra/prefetchTwitterProfile';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as refreshTrendingPosts from '../infra/refreshTrendingPosts';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as syncIntegrationMilestonesForAllUsers from '../milestones/syncIntegrationMilestonesForAllUsers';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as scrapeRepoIssues from '../repoIssues/scrapeRepoIssues';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as scrapeRepoIssuesForUser from '../repoIssues/scrapeRepoIssuesForUser';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as lazyCreateRepo from '../scrape/lazyCreateRepo';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as scrapeIntegration from '../scrape/scrapeIntegration';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as scrapeIntegrationForAllUsers from '../scrape/scrapeIntegrationForAllUsers';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as syncUserInfo from '../scrape/syncUserInfo';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as syncUserInfoForAllUsers from '../scrape/syncUserInfoForAllUsers';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as syncIntegrationTimelineForAllUsers from '../timeline/syncIntegrationTimelineForAllUsers';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as addUserFollowersFromGitHub from '../userActions/addUserFollowersFromGitHub';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as afterFollowingUser from '../userActions/afterFollowingUser';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as afterPostCreated from '../userActions/afterPostCreated';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as afterReactionCreated from '../userActions/afterReactionCreated';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as afterStarCompany from '../userActions/afterStarCompany';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as afterStarDev from '../userActions/afterStarDev';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as afterStarJob from '../userActions/afterStarJob';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as afterUnStarCompany from '../userActions/afterUnStarCompany';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as afterUnStarDev from '../userActions/afterUnStarDev';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as afterUnStarJob from '../userActions/afterUnStarJob';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as afterVoted from '../userActions/afterVoted';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as assignHackerNewsDiscussionToPost from '../userActions/assignHackerNewsDiscussionToPost';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as assignLanguageToPost from '../userActions/assignLanguageToPost';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as assignProviderToPost from '../userActions/assignProviderToPost';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as deletePostImage from '../userActions/deletePostImage';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as fetchSocialPreviewImage from '../userActions/fetchSocialPreviewImage';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as generateProfileBio from '../userActions/generateProfileBio';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as notifyPostMentions from '../userActions/notifyPostMentions';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as notifyPostWatchers from '../userActions/notifyPostWatchers';

await new WakaQChildWorker(wakaq).start();
wakaq.disconnect();
process.exit(0);
