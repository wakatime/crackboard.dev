import { getTitleForProvider } from '@acme/core/integrations/integration-list';
import type { PublicProgramLanguageBadge } from '@acme/core/types';
import { getBadgeText } from '@acme/core/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@acme/ui/components/ui/avatar';
import { Badge } from '@acme/ui/components/ui/badge';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@acme/ui/components/ui/hover-card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@acme/ui/components/ui/tooltip';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { LuUser } from 'react-icons/lu';

import FollowButton from './FollowButton';
import HoverProfileDetailsCard from './HoverProfileDetailsCard';

export default function UserListItem({
  name,
  languageBadges,
  username,
  id,
  isFollowing,
  avatarUrl,
  onToggleFollowing,
  isLoading,
  badgeText,
  subtitle,
  action,
}: {
  action?: ReactNode;
  avatarUrl: string;
  badgeText?: string;
  id: string;
  isFollowing?: boolean;
  isLoading?: boolean;
  languageBadges?: PublicProgramLanguageBadge[];
  name?: string | null;
  onToggleFollowing?: () => void;
  subtitle?: ReactNode;
  username?: string | null;
}) {
  return (
    <div className="group relative">
      <Link className="group-focus-within:bg-secondary/50 group-hover:bg-secondary/50 absolute inset-0" href={`/${username ?? id}`} />
      <div className="pointer-events-none relative flex flex-1 items-center gap-2 p-4 [&_a]:pointer-events-auto [&_button]:pointer-events-auto">
        <Avatar>
          <AvatarImage src={avatarUrl} />
          <AvatarFallback>
            <LuUser size={20} />
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-1 flex-col gap-1 overflow-hidden">
          <div className="flex items-center gap-2">
            <HoverCard>
              <HoverCardTrigger asChild>
                <p className="line-clamp-1 text-sm font-semibold leading-5 hover:underline">
                  <Link className="font-semibold hover:underline" href={`/${username ?? id}`}>
                    {name ?? username ?? id}
                  </Link>
                </p>
              </HoverCardTrigger>
              <HoverCardContent className="pointer-events-auto">
                <HoverProfileDetailsCard userId={id} />
              </HoverCardContent>
            </HoverCard>
            <div className="flex items-center gap-1">
              {name && username ? (
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <p className="text-muted-foreground line-clamp-1 text-sm leading-5">
                      <Link className="font-semibold hover:underline" href={`/${username}`}>
                        @{username}
                      </Link>
                    </p>
                  </HoverCardTrigger>
                  <HoverCardContent className="pointer-events-auto">
                    <HoverProfileDetailsCard userId={id} />
                  </HoverCardContent>
                </HoverCard>
              ) : null}
              {badgeText ? (
                <p className="bg-muted text-muted-foreground whitespace-pre rounded-sm px-1.5 py-0.5 text-xs font-medium">{badgeText}</p>
              ) : null}
            </div>
          </div>
          {languageBadges ? (
            <div className="flex flex-wrap gap-2">
              {languageBadges.map((badge) => (
                <Tooltip key={badge.provider}>
                  <TooltipTrigger>
                    <Badge variant="outline">{getTitleForProvider(badge.provider)}</Badge>
                  </TooltipTrigger>
                  <TooltipContent>{getBadgeText(badge)}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          ) : subtitle ? (
            <div className="text-muted-foreground mt-1 whitespace-pre text-sm">{subtitle}</div>
          ) : null}
        </div>
        <div className="pointer-events-auto">
          {action ??
            (!!onToggleFollowing && (
              <FollowButton isFollowing={isFollowing} isLoading={isLoading} onClick={onToggleFollowing} userName={username ?? id} />
            ))}
        </div>
      </div>
    </div>
  );
}
