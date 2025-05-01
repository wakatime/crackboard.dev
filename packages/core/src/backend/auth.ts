import { eq } from '@workspace/db';
import { db } from '@workspace/db/drizzle';
import { User } from '@workspace/db/schema';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

import { LOGIN_COOKIE } from '../constants';
import { env } from '../env';
import { decodeAuthJWT } from './jwt';

export const getJwtFromRequest = (req: NextRequest) => {
  let token = req.cookies.get(LOGIN_COOKIE)?.value;
  if (!token) {
    const Authorization = req.headers.get('Authorization');
    if (Authorization) {
      token = Authorization.replace('Bearer ', '');
    }
  }
  return token ?? null;
};

export const getJwt = async (req?: NextRequest) => {
  let token = req?.cookies.get(LOGIN_COOKIE)?.value;
  if (!token) {
    const cookieStore = await cookies();
    token = cookieStore.get(LOGIN_COOKIE)?.value;
    if (!token) {
      const authorization = req?.headers.get('Authorization');
      if (authorization) {
        token = authorization.replace('Bearer ', '');
      }
    }
  }
  return token ?? null;
};

export const sessionIdFromRequest = async (req?: NextRequest) => {
  const secret = env.JWT_SECRET;
  if (!secret) {
    return;
  }
  const jwt = await getJwt(req);
  if (!jwt) {
    return;
  }

  const id = await decodeAuthJWT(jwt, secret);
  return id;
};

export function isAdmin(user?: { id: string } | null): boolean {
  if (!user) {
    return false;
  }

  return isAdminUserId(user.id);
}

export function isAdminUserId(userId: string): boolean {
  return (env.ADMIN_IDS?.split(',').map((s) => s.trim()) ?? []).includes(userId);
}

export const authenticatedUserFromRequest = async (req?: NextRequest, sessionId?: string) => {
  if (!sessionId) {
    const id = await sessionIdFromRequest(req);
    if (!id) {
      return null;
    }
    sessionId = id;
  }

  const user = await db.query.User.findFirst({
    where: eq(User.sessionId, sessionId),
  });
  if (!user) {
    if (req) {
      const cookieStore = await cookies();
      cookieStore.delete(LOGIN_COOKIE);
    }
    return null;
  }

  return user;
};
