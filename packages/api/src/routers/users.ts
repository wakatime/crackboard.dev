import { getUserByUsername, isAdminUserId } from '@acme/core/backend/auth';
import { createCSRFToken } from '@acme/core/backend/csrf';
import {
  canUserCreateOrVoteOnPosts,
  companyToPublicCompany,
  getFriendsOfFriends,
  getNameForUser,
  getTopUserSuggestions,
  hasCompanyStarredDev,
  hasDevStarredCompany,
  userToPublicUser,
} from '@acme/core/backend/helpers';
import {
  AUDIT_LOG_FOLLOWED_USER,
  AUDIT_LOG_UNFOLLOWED_USER,
  AUDIT_LOG_USER_BLOCKED_USER,
  AUDIT_LOG_USER_PROFILE_BIO_CHANGED,
  AUDIT_LOG_USER_PROFILE_DEFAULT_CHANGED,
  AUDIT_LOG_USER_UNBLOCKED_USER,
  AUDIT_LOG_USERNAME_CHANGED,
} from '@acme/core/constants';
import { parseBioFromGPT } from '@acme/core/integrations/backend';
import {
  avatarForConnection,
  badgeInfoForConnection,
  badgeInfoForIntegration,
  nameForConnection,
  subConnectionsForConnection,
  urlForConnection,
  websiteUrlForConnection,
} from '@acme/core/integrations/extensions/getters';
import { integrations } from '@acme/core/integrations/integration-list';
import type { IntegrationConnection, PublicUser } from '@acme/core/types';
import { pagify } from '@acme/core/utils';
import { formatUsernameFromIntegration, validateId } from '@acme/core/validators';
import { and, count, desc, eq, ilike, isNull, ne, or, sql } from '@acme/db';
import { db, lt } from '@acme/db/drizzle';
import type { PublicCompany } from '@acme/db/schema';
import {
  AuditLog,
  ChatThread,
  ChatThreadReadByUser,
  Company,
  CompanyStarredDev,
  DevStarredCompany,
  Integration,
  OpenaiResult,
  PostForFollower,
  ProfileDefault,
  User,
  UserBlockedUser,
  UserFollow,
  UserNotification,
} from '@acme/db/schema';
import { afterFollowingUser } from '@acme/tasks/userActions/afterFollowingUser';
import { TRPCError } from '@trpc/server';
import { ipAddress } from '@vercel/functions';
import { union } from 'drizzle-orm/pg-core';
import type { ChatCompletion } from 'openai/resources/index.mjs';
import { z } from 'zod';

import { createTRPCRouter, privateProcedure, publicProcedure } from '../trpc';

export const usersRouter = createTRPCRouter({
  followUser: privateProcedure.input(z.string()).mutation(async ({ ctx: { req, currentUser }, input: userId }) => {
    const followUser = await db.query.User.findFirst({
      where: eq(User.id, userId),
    });
    if (!followUser) {
      return;
    }

    if (currentUser.id === followUser.id) {
      return false;
    }

    const insertId = createCSRFToken();
    const result = await db
      .insert(UserFollow)
      .values({
        followedById: currentUser.id,
        followingId: followUser.id,
        insertId,
      })
      .onConflictDoNothing()
      .returning({ insertId: UserFollow.insertId });
    if (result[0]?.insertId === insertId) {
      await db.insert(AuditLog).values({
        event: AUDIT_LOG_FOLLOWED_USER,
        ip: ipAddress(req),
        metadata: { followingId: followUser.id },
        userAgent: req.headers.get('user-agent'),
        userId: currentUser.id,
      });
      await afterFollowingUser.enqueue({
        followerUserId: currentUser.id,
        followingUserId: followUser.id,
      });
    }
  }),
  getCurrentUserPostOptions: publicProcedure.query(async ({ ctx: { currentUser } }) => {
    if (!currentUser) {
      return { canPost: false };
    }

    return {
      canPost: await canUserCreateOrVoteOnPosts(currentUser),
    };
  }),
  getStarred: publicProcedure
    .input(z.object({ cursor: z.number().int().min(0).max(999).default(0), userId: z.string() }))
    .query(async ({ ctx: { currentUser }, input: { userId, cursor } }) => {
      const limit = 10;
      const user = await db.query.User.findFirst({
        where: eq(User.id, userId),
      });
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found!' });
      }

      const items = await db.query.DevStarredCompany.findMany({
        limit,
        offset: cursor * limit,
        orderBy: [desc(DevStarredCompany.createdAt)],
        where: eq(DevStarredCompany.userId, user.id),
        with: { company: true },
      });

      return {
        items: await Promise.all(
          items.map(async (item) => {
            const isStarred = !!currentUser && (await hasDevStarredCompany(currentUser.id, item.companyId));
            const publicCompany = await companyToPublicCompany(item.company);
            const hasStarredMe = !!currentUser && (await hasCompanyStarredDev(item.companyId, currentUser.id));
            return {
              ...publicCompany,
              hasStarredMe,
              isStarred,
            };
          }),
        ),
        nextCursor: items.length == limit ? cursor + 1 : undefined,
      };
    }),
  getStars: publicProcedure
    .input(z.object({ cursor: z.number().int().min(0).max(999).default(0), userId: z.string(), query: z.string().optional() }))
    .query(async ({ ctx: { currentUser }, input: { userId, cursor, query } }) => {
      const limit = 10;
      const user = await db.query.User.findFirst({
        where: eq(User.id, userId),
      });
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found!' });
      }

      const items = await db
        .select()
        .from(CompanyStarredDev)
        .innerJoin(Company, eq(Company.id, CompanyStarredDev.companyId))
        .where(
          and(
            eq(CompanyStarredDev.userId, user.id),
            ...(query
              ? [
                  or(
                    ilike(Company.name, `%${query}%`),
                    ilike(Company.shortDescription, `%${query}%`),
                    ilike(Company.slug, `%${query}%`),
                    ilike(Company.websiteUrl, `%${query}%`),
                  ),
                ]
              : []),
          ),
        )
        .limit(limit)
        .offset(limit * cursor)
        .orderBy(desc(CompanyStarredDev.createdAt));

      return {
        items: await Promise.all(
          items.map(async (item) => {
            const isStarred = !!currentUser && (await hasDevStarredCompany(currentUser.id, item.Company.id));
            const publicCompany = await companyToPublicCompany(item.Company);
            const hasStarredMe =
              !!currentUser && (currentUser.id === userId || (await hasCompanyStarredDev(item.Company.id, currentUser.id)));
            return {
              ...publicCompany,
              hasStarredMe,
              isStarred,
            };
          }),
        ),
        nextCursor: items.length == limit ? cursor + 1 : undefined,
      };
    }),
  getStarsAndFollowers: publicProcedure
    .input(z.object({ cursor: z.number().int().min(0).max(999).default(0), userId: z.string(), query: z.string().optional() }))
    .query(async ({ ctx: { currentUser }, input: { userId, cursor, query } }) => {
      const limit = 10;
      const user = await db.query.User.findFirst({
        where: eq(User.id, userId),
      });
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found!' });
      }

      const companies = db
        .select({
          id: Company.id,
          type: sql<'user' | 'company'>`'company'`.as('type'),
          name: Company.name,
          slug: Company.slug,
          fullName: sql<string | null>`NULL`.as(User.fullName.name),
          username: sql<string | null>`NULL`.as(User.username.name),
          createdAt: CompanyStarredDev.createdAt,
        })
        .from(CompanyStarredDev)
        .innerJoin(Company, eq(Company.id, CompanyStarredDev.companyId))
        .where(
          and(
            eq(CompanyStarredDev.userId, user.id),
            ...(query
              ? [
                  or(
                    ilike(Company.name, `%${query}%`),
                    ilike(Company.shortDescription, `%${query}%`),
                    ilike(Company.slug, `%${query}%`),
                    ilike(Company.websiteUrl, `%${query}%`),
                  ),
                ]
              : []),
          ),
        )
        .orderBy(desc(CompanyStarredDev.createdAt));

      const devs = db
        .select({
          id: User.id,
          type: sql<'user' | 'company'>`'user'`.as('type'),
          name: sql<string>`''`.as(Company.name.name),
          slug: sql<string>`''`.as(Company.slug.name),
          fullName: User.fullName,
          username: User.username,
          createdAt: UserFollow.createdAt,
        })
        .from(UserFollow)
        .innerJoin(User, eq(User.id, UserFollow.followedById))
        .where(
          and(
            eq(UserFollow.followingId, user.id),
            ...(query ? [or(ilike(User.username, `%${query}%`), ilike(User.fullName, `%${query}%`))] : []),
          ),
        )
        .orderBy(desc(UserFollow.createdAt));

      const rows = await union(companies, devs)
        .limit(limit)
        .offset(cursor * limit);

      const items = (
        await Promise.all(
          rows.map(async (item) => {
            if (item.type === 'company') {
              const company = await db.query.Company.findFirst({ where: eq(Company.id, item.id) });
              if (!company) {
                return;
              }
              const isStarred = !!currentUser && (await hasDevStarredCompany(currentUser.id, company.id));
              const publicCompany = await companyToPublicCompany(company);
              const hasStarredMe = !!currentUser && (currentUser.id === userId || (await hasCompanyStarredDev(company.id, currentUser.id)));
              return {
                type: 'company' as const,
                data: {
                  ...publicCompany,
                  hasStarredMe,
                  isStarred,
                },
              };
            } else {
              const user = await db.query.User.findFirst({ where: eq(User.id, item.id) });
              if (!user) {
                return;
              }
              return {
                type: 'user' as const,
                data: await userToPublicUser(user, currentUser?.id),
              };
            }
          }),
        )
      ).filter(Boolean) as (
        | { type: 'company'; data: { hasStarredMe: boolean; isStarred: boolean } & PublicCompany }
        | { type: 'user'; data: PublicUser }
      )[];

      return {
        items,
        nextCursor: items.length === limit ? cursor + 1 : undefined,
      };
    }),
  getFollowers: publicProcedure
    .input(z.object({ cursor: z.number().int().min(0).max(999).default(0), userId: z.string() }))
    .query(async ({ ctx: { currentUser }, input: { userId, cursor } }) => {
      const limit = 10;
      const user = await db.query.User.findFirst({
        where: eq(User.id, userId),
      });

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found!' });
      }

      const items = await db.query.UserFollow.findMany({
        limit,
        offset: cursor * limit,
        orderBy: [desc(UserFollow.createdAt)],
        where: eq(UserFollow.followingId, user.id),
        with: { followedBy: { with: { profileDefaults: true } } },
      });

      return {
        items: await Promise.all(items.map(({ followedBy }) => userToPublicUser(followedBy, currentUser?.id))),
        nextCursor: items.length == limit ? cursor + 1 : undefined,
      };
    }),
  getFollowing: publicProcedure
    .input(
      z.object({
        cursor: z.number().int().min(0).max(999).default(0),
        userId: z.string(),
      }),
    )
    .query(async ({ ctx: { currentUser }, input: { userId, cursor } }) => {
      const limit = 10;
      const user = await db.query.User.findFirst({
        where: eq(User.id, userId),
      });
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found!' });
      }

      const items = await db.query.UserFollow.findMany({
        limit,
        offset: cursor * limit,
        orderBy: [desc(UserFollow.createdAt)],
        where: eq(UserFollow.followedById, user.id),
        with: { following: { with: { profileDefaults: true } } },
      });

      return {
        items: await Promise.all(items.map(({ following }) => userToPublicUser(following, currentUser?.id))),
        nextCursor: items.length === limit ? cursor + 1 : undefined,
      };
    }),
  getPublicProfileIntegrationsForUser: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx: { currentUser, req }, input }) => {
      const user = await getUserByUsername(input.userId, req, {
        profileDefaults: { with: { integration: true } },
      });
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found!' });
      }
      const connections = await db.query.Integration.findMany({
        where: eq(Integration.userId, input.userId),
      });

      if (!currentUser || currentUser.id !== user.id) {
        return Promise.all(
          integrations
            .map((integration) => {
              const provider = integration.id;
              const { badgeText, score } = badgeInfoForIntegration(
                integration,
                connections.filter((c) => {
                  return c.provider == provider;
                }),
              );

              return {
                provider,
                badgeText: badgeText,
                connections: connections
                  .filter((c) => {
                    return c.provider == provider;
                  })
                  .map((c) => {
                    const info = badgeInfoForConnection(c);
                    return {
                      avatar: avatarForConnection(c as unknown as IntegrationConnection),
                      badgeText: info.badgeText,
                      id: c.id,
                      name: nameForConnection(c as unknown as IntegrationConnection),
                      provider: c.provider,
                      providerAccountUsername: c.providerAccountUsername,
                      score: info.score,
                      subConnections: subConnectionsForConnection(c),
                      url: urlForConnection(c),
                      websiteUrl: websiteUrlForConnection(c as unknown as IntegrationConnection),
                    };
                  }),
                icon: integration.icon ?? '',
                name: integration.name,
                score: score,
              };
            })
            .filter((integration) => {
              return integration.connections.length > 0;
            })
            .sort((a, b) => {
              return b.score - a.score;
            }),
        );
      }

      const defaults = await db.query.ProfileDefault.findMany({
        where: eq(ProfileDefault.userId, user.id),
      });
      return Promise.all(
        integrations
          .map((integration) => {
            const provider = integration.id;
            const { badgeText, score } = badgeInfoForIntegration(
              integration,
              connections.filter((c) => {
                return c.provider == provider;
              }),
            );

            return {
              provider,
              badgeText: badgeText,
              connections: connections
                .filter((c) => {
                  return c.provider == provider;
                })
                .map((c) => {
                  const info = badgeInfoForConnection(c);
                  return {
                    avatar: avatarForConnection(c as unknown as IntegrationConnection),
                    badgeText: info.badgeText,
                    id: c.id,
                    name: nameForConnection(c as unknown as IntegrationConnection),
                    provider: c.provider,
                    providerAccountId: c.providerAccountId,
                    providerAccountUsername: c.providerAccountUsername,
                    providerInfo: c.providerInfo,
                    score: info.score,
                    subConnections: subConnectionsForConnection(c),
                    url: urlForConnection(c),
                    websiteUrl: websiteUrlForConnection(c as unknown as IntegrationConnection),
                  };
                }),
              icon: integration.icon ?? '',
              name: integration.name,
              profileDefaults: defaults.filter((d) => {
                return !!connections.find((c) => {
                  return c.provider == provider && d.integrationId == c.id;
                });
              }),
              score: score,
            };
          })
          .filter((integration) => {
            return integration.connections.length > 0;
          })
          .sort((a, b) => {
            return b.score - a.score;
          }),
      );
    }),
  getSuggestedUsers: publicProcedure
    .input(z.object({ limit: z.number().min(3).max(30), userId: z.string().optional() }))
    .query(async ({ ctx: { currentUser }, input }) => {
      const users: PublicUser[] = [];

      // suggested followers when viewing a public profile
      if (input.userId && (!currentUser || currentUser.id !== input.userId)) {
        const user = await db.query.User.findFirst({ where: eq(User.id, input.userId) });
        if (!user) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found.' });
        }

        users.push(...(await getFriendsOfFriends(users, user, input.limit - 1, currentUser)));
      }

      if (currentUser) {
        users.push(...(await getFriendsOfFriends(users, currentUser, input.limit - users.length, currentUser)));
      }

      if (users.length < input.limit) {
        users.push(...(await getTopUserSuggestions(users, input.limit - users.length, currentUser)));
      }

      return users;
    }),
  getUserBioChoices: privateProcedure
    .input(z.object({ page: z.number(), userId: z.string() }))
    .query(async ({ ctx: { currentUser }, input }) => {
      const { userId, page } = input;
      if (userId != currentUser.id) {
        return { bios: [], ...pagify(0, 1, 4) };
      }

      const total = (await db.select({ value: count() }).from(OpenaiResult).where(eq(OpenaiResult.userId, currentUser.id)))[0]?.value ?? 0;
      const resp = pagify(total, page, 4);
      return {
        bios: (
          await db.query.OpenaiResult.findMany({
            limit: resp.limit,
            offset: resp.offset,
            orderBy: [desc(OpenaiResult.createdAt)],
            where: eq(OpenaiResult.userId, currentUser.id),
          })
        )
          .map((b) => {
            return {
              createdAt: b.createdAt,
              id: b.id,
              isSelected: b.isSelectedBio,
              text: parseBioFromGPT(b.response as ChatCompletion),
            };
          })
          .filter((b) => !!b.text),
        ...resp,
      };
    }),
  isFollowingUser: publicProcedure.input(z.string().optional()).query(async ({ ctx: { req, currentUser }, input: userId }) => {
    if (!userId) {
      return false;
    }
    if (!userId.startsWith('u_')) {
      const user = await getUserByUsername(userId, req);
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found.' });
      }
      userId = user.id;
    }

    if (!currentUser) {
      return false;
    }

    if (currentUser.id == userId) {
      return false;
    }

    const following = await db.query.UserFollow.findFirst({
      where: and(eq(UserFollow.followedById, currentUser.id), eq(UserFollow.followingId, userId)),
    });
    return !!following;
  }),
  publicProfileInfo: publicProcedure.input(z.string().min(1)).query(async ({ ctx: { req, currentUser }, input }) => {
    const user = await getUserByUsername(input, req, {
      programLanguageBadges: true,
      profileDefaults: { with: { integration: true } },
    });
    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile not found.' });
    }

    const pubUser = await userToPublicUser(user, currentUser?.id);
    const bio = await db.query.OpenaiResult.findFirst({
      orderBy: [sql`${OpenaiResult.isSelectedBio} desc nulls last`, desc(OpenaiResult.createdAt)],
      where: eq(OpenaiResult.userId, user.id),
    });
    if (bio) {
      pubUser.bio = parseBioFromGPT(bio.response as ChatCompletion);
    }
    return pubUser;
  }),
  searchUsers: publicProcedure
    .input(
      z.object({
        cursor: z.number().int().min(0).max(999).default(0),
        q: z.string(),
      }),
    )
    .query(async ({ input: { cursor, q } }) => {
      const limit = 10;
      const users = await db.query.User.findMany({
        columns: { id: true, username: true },
        limit,
        offset: cursor * limit,
        orderBy: [desc(ilike(User.username, `%${q}%`)), desc(ilike(User.fullName, `%${q}%`)), desc(User.createdAt)],
        where: or(ilike(User.username, `%${q}%`), ilike(User.fullName, `%${q}%`)),
      });

      return {
        items: users,
        nextCursor: users.length === limit ? cursor + 1 : undefined,
      };
    }),
  setBio: privateProcedure.input(z.object({ bioId: z.string() })).mutation(async ({ ctx: { req, currentUser }, input }) => {
    const { bioId } = input;
    const result = await db.query.OpenaiResult.findFirst({
      where: and(eq(OpenaiResult.userId, currentUser.id), eq(OpenaiResult.id, bioId)),
    });
    if (!result) {
      return;
    }
    if (result.isSelectedBio) {
      await db.update(OpenaiResult).set({ isSelectedBio: null }).where(ne(OpenaiResult.id, result.id));
      return;
    }

    const bio = parseBioFromGPT(result.response as ChatCompletion);
    if (!bio) {
      return;
    }

    await db.update(OpenaiResult).set({ isSelectedBio: null }).where(ne(OpenaiResult.id, result.id));
    await db.update(OpenaiResult).set({ isSelectedBio: true }).where(eq(OpenaiResult.id, result.id));
    await db.insert(AuditLog).values({
      event: AUDIT_LOG_USER_PROFILE_BIO_CHANGED,
      ip: ipAddress(req),
      metadata: { bioId },
      userAgent: req.headers.get('user-agent'),
      userId: currentUser.id,
    });
  }),
  setProfileDefault: privateProcedure
    .input(z.object({ defaultType: z.enum(ProfileDefault.defaultType.enumValues), integrationId: z.string() }))
    .mutation(async ({ ctx: { req, currentUser }, input: { defaultType, integrationId } }) => {
      const idForm = validateId(integrationId);
      if (idForm.error) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: idForm.error });
      }

      const integration = await db.query.Integration.findFirst({
        where: and(eq(Integration.userId, currentUser.id), eq(Integration.id, idForm.data as string)),
      });
      if (!integration) {
        return;
      }

      if (defaultType === 'username') {
        const newUsername = formatUsernameFromIntegration(integration.providerAccountUsername, isAdminUserId(currentUser.id));
        const oldUsername = currentUser.username;
        if (oldUsername == newUsername) {
          return;
        }

        try {
          await db.update(User).set({ username: newUsername }).where(eq(User.id, currentUser.id));
          await db.insert(AuditLog).values({
            event: AUDIT_LOG_USERNAME_CHANGED,
            ip: ipAddress(req),
            metadata: { old: oldUsername, username: newUsername },
            userAgent: req.headers.get('user-agent'),
            userId: currentUser.id,
          });
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Username not available.',
          });
        }
        await db
          .insert(ProfileDefault)
          .values({
            defaultType: defaultType,
            integrationId: integration.id,
            userId: currentUser.id,
          })
          .onConflictDoUpdate({
            set: {
              integrationId: integration.id,
            },
            target: [ProfileDefault.userId, ProfileDefault.defaultType],
          });
        return newUsername;
      }

      await db.transaction(async (tx) => {
        await tx
          .insert(ProfileDefault)
          .values({
            defaultType: defaultType,
            integrationId: integration.id,
            userId: currentUser.id,
          })
          .onConflictDoUpdate({
            set: {
              integrationId: integration.id,
            },
            target: [ProfileDefault.userId, ProfileDefault.defaultType],
          });
        await tx.insert(AuditLog).values({
          event: AUDIT_LOG_USER_PROFILE_DEFAULT_CHANGED,
          ip: ipAddress(req),
          metadata: {
            dataType: defaultType,
            provider: integration.provider,
          },
          userAgent: req.headers.get('user-agent'),
          userId: currentUser.id,
        });
      });

      if (defaultType === 'name') {
        const fullName = await getNameForUser(currentUser);
        await db.update(User).set({ fullName }).where(eq(User.id, currentUser.id));
      }
    }),
  unFollowUser: privateProcedure.input(z.string()).mutation(async ({ ctx: { req, currentUser }, input: userId }) => {
    const followUser = await db.query.User.findFirst({
      where: eq(User.id, userId),
    });
    if (!followUser) {
      return;
    }

    if (currentUser.id === followUser.id) {
      return false;
    }

    const result = await db
      .delete(UserFollow)
      .where(and(eq(UserFollow.followedById, currentUser.id), eq(UserFollow.followingId, followUser.id)))
      .returning({ createdAt: UserFollow.createdAt });
    if (result[0]?.createdAt) {
      await db.insert(AuditLog).values({
        event: AUDIT_LOG_UNFOLLOWED_USER,
        ip: ipAddress(req),
        metadata: { followingId: followUser.id },
        userAgent: req.headers.get('user-agent'),
        userId: currentUser.id,
      });
    }

    // remove timeline items from current user for this un-followed user
    await db.delete(PostForFollower).where(and(eq(PostForFollower.followerId, currentUser.id), eq(PostForFollower.userId, followUser.id)));
  }),
  getUserOnboardingStep: privateProcedure.query(async ({ ctx: { currentUser } }) => {
    const connections = await db.select({ id: Integration.id }).from(Integration).where(eq(Integration.userId, currentUser.id)).limit(1);
    if (connections.length === 0) {
      return 'connections';
    }
    return null;
  }),
  getIndicatorCounts: privateProcedure.query(async ({ ctx: { currentUser } }) => {
    const unreadThreadsCountPromise = db
      .select({ count: count(ChatThread.id) })
      .from(ChatThread)
      .leftJoin(ChatThreadReadByUser, eq(ChatThread.id, ChatThreadReadByUser.threadId))
      .where(
        and(
          or(eq(ChatThread.userId, currentUser.id), eq(ChatThread.otherUserId, currentUser.id)),
          or(
            isNull(ChatThreadReadByUser.readAt),
            and(eq(ChatThreadReadByUser.userId, currentUser.id), lt(ChatThreadReadByUser.readAt, ChatThread.mostRecentMessageAt)),
          ),
        ),
      )
      .then((res) => res[0]?.count ?? 0);

    const unreadNotificationCountPromise = await db
      .select({ count: count() })
      .from(UserNotification)
      .where(and(eq(UserNotification.userId, currentUser.id), isNull(UserNotification.readAt)))
      .then((res) => res[0]?.count ?? 0);

    const [unreadThreadsCount, unreadNotificationCount] = await Promise.all([unreadThreadsCountPromise, unreadNotificationCountPromise]);

    return { unreadThreadsCount, unreadNotificationCount };
  }),
  blockUser: privateProcedure.input(z.object({ userId: z.string() })).mutation(async ({ ctx: { currentUser, req }, input }) => {
    const user = await db.query.User.findFirst({
      columns: {
        id: true,
      },
      where: and(ne(User.id, currentUser.id), eq(User.id, input.userId)),
    });
    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }

    await db.transaction(async (tx) => {
      const [blocked] = await db
        .insert(UserBlockedUser)
        .values({
          userId: currentUser.id,
          blockedUserId: user.id,
        })
        .onConflictDoNothing()
        .returning();
      if (!blocked) {
        return;
      }
      await tx.delete(UserFollow).where(and(eq(UserFollow.followedById, currentUser.id), eq(UserFollow.followingId, user.id)));
      await tx.insert(AuditLog).values({
        event: AUDIT_LOG_USER_BLOCKED_USER,
        ip: ipAddress(req),
        metadata: {
          blockedUserId: user.id,
        },
        userAgent: req.headers.get('user-agent'),
        userId: currentUser.id,
      });
    });
  }),
  unBlockUser: privateProcedure.input(z.object({ userId: z.string() })).mutation(async ({ ctx: { req, currentUser }, input }) => {
    const user = await db.query.User.findFirst({
      columns: {
        id: true,
      },
      where: and(ne(User.id, currentUser.id), eq(User.id, input.userId)),
    });
    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }

    await db.transaction(async (tx) => {
      const [unblocked] = await db
        .delete(UserBlockedUser)
        .where(and(eq(UserBlockedUser.userId, currentUser.id), eq(UserBlockedUser.blockedUserId, user.id)))
        .returning();
      if (!unblocked) {
        return;
      }
      await tx.insert(AuditLog).values({
        event: AUDIT_LOG_USER_UNBLOCKED_USER,
        ip: ipAddress(req),
        metadata: {
          blockedUserId: user.id,
        },
        userAgent: req.headers.get('user-agent'),
        userId: currentUser.id,
      });
    });
  }),
  getBlockedUsers: privateProcedure
    .input(
      z.object({
        limit: z.number().optional(),
        cursor: z.number().optional(),
      }),
    )
    .query(async ({ ctx: { currentUser }, input }) => {
      const cursor = input.cursor ?? 0;
      const limit = input.limit ?? 10;

      const accounts = await db
        .select()
        .from(UserBlockedUser)
        .innerJoin(User, eq(UserBlockedUser.blockedUserId, User.id))
        .where(eq(UserBlockedUser.userId, currentUser.id))
        .offset(limit * cursor)
        .limit(limit)
        .orderBy(desc(UserBlockedUser.createdAt));

      return {
        items: await Promise.all(accounts.map((user) => userToPublicUser(user.User, currentUser.id, true))),
        nextCursor: accounts.length >= limit ? cursor + 1 : null,
      };
    }),
});
