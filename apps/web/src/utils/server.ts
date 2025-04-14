import 'server-only';

import { listToPublicList } from '@acme/core/backend/helpers/list';
import { getPublicPostById } from '@acme/core/backend/helpers/post';
import { getAvatarForUser, getNameForUser, userToPublicUser } from '@acme/core/backend/helpers/user';
import { cache } from 'react';

export const userToPublicUserCached = cache(userToPublicUser);
export const getNameForUserCached = cache(getNameForUser);
export const getAvatarForUserCached = cache(getAvatarForUser);
export const getPublicPostByIdCached = cache(getPublicPostById);
export const listToPublicListCached = cache(listToPublicList);
