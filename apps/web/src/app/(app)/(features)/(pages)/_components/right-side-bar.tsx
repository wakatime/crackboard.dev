'use client';

import { APP_NAME } from '@acme/core/constants';
import { Button } from '@acme/ui/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@acme/ui/components/ui/card';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { HiOutlineExternalLink } from 'react-icons/hi';
import { LuLoaderCircle } from 'react-icons/lu';
import { PiArrowRight, PiBuildingsLight } from 'react-icons/pi';

import SearchWidget from '~/components/sidebar-widgets/search-widget';
import SuggestedCompaniesWidget from '~/components/sidebar-widgets/suggested-companies-widget';
import SuggestedUsersWidget from '~/components/sidebar-widgets/suggested-users-widget';
import { useAuth } from '~/providers/AuthProvider';

interface MatchPath {
  exact?: boolean;
  href: string;
}
const HIDE_SEARCHBAR_PATHS: MatchPath[] = [{ href: '/search' }];
const HIDE_USER_SUGGESTION_PATHS: MatchPath[] = [{ href: '/connect-people' }];

const getMatch = (paths: MatchPath[], pathname: string) => {
  const index = paths.findIndex((path) => (path.exact ? path.href === pathname : pathname.startsWith(path.href)));
  return index !== -1;
};

export default function RightSideBar() {
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const pathname = usePathname();
  const showSearchBar = useMemo(() => !getMatch(HIDE_SEARCHBAR_PATHS, pathname), [pathname]);
  const showSuggestedUsers = useMemo(() => !getMatch(HIDE_USER_SUGGESTION_PATHS, pathname), [pathname]);

  return (
    <>
      {isAuthLoading ? (
        <Card className="flex h-32 items-center justify-center">
          <LuLoaderCircle className="h-6 w-6 animate-spin" />
        </Card>
      ) : currentUser ? (
        showSearchBar ? (
          <SearchWidget />
        ) : null
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>New to {APP_NAME}?</CardTitle>
            <CardDescription>Sign up now to get your dev profile</CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col items-stretch gap-2">
            <Button asChild>
              <Link href="/login" prefetch={false}>
                Log In
              </Link>
            </Button>
            <p className="text-muted-foreground text-sm">
              By signing up, you agree to the{' '}
              <Link className="hover:text-foreground font-semibold hover:underline" href="/terms">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link className="hover:text-foreground font-semibold hover:underline" href="/privacy">
                Privacy Policy
              </Link>
              .
            </p>
          </CardFooter>
        </Card>
      )}
      {showSuggestedUsers ? <SuggestedUsersWidget /> : null}
      {showSuggestedUsers ? <SuggestedCompaniesWidget /> : null}
      <div className="text-sm">
        <p className="text-muted-foreground">
          <span>
            Powered by{' '}
            <Link
              className="text-muted-foreground hover:text-foreground font-medium hover:underline"
              href="https://wakatime.com"
              rel="nofollow noopener"
              target="_blank"
            >
              WakaTime <HiOutlineExternalLink className="inline h-4 w-4" />
            </Link>
          </span>
          <Link className="text-muted-foreground hover:text-foreground ml-2 font-medium hover:underline" href="/terms">
            Terms
          </Link>
          <Link className="text-muted-foreground hover:text-foreground ml-2 font-medium hover:underline" href="/privacy">
            Privacy
          </Link>
        </p>
      </div>
      <div className="text-sm">
        <p className="text-muted-foreground">
          <span>
            <Button asChild>
              <Link href="https://hire.wonderful.dev">
                <PiBuildingsLight />
                For Companies
                <PiArrowRight />
              </Link>
            </Button>
          </span>
        </p>
      </div>
    </>
  );
}
