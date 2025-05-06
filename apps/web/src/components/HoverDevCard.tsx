import type { PublicUser } from '@workspace/core/types';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';
import Link from 'next/link';
import { LuUser } from 'react-icons/lu';

export default function HoverProfileDetailsCard({ user }: { user: PublicUser }) {
  return (
    <div>
      <div className="flex justify-between">
        <Avatar asChild>
          <Link className="hover:opacity-80" href={user.url}>
            <AvatarImage src={user.avatarUrl ?? ''} />
            <AvatarFallback>
              <LuUser className="h-5 w-5" />
            </AvatarFallback>
          </Link>
        </Avatar>
      </div>
      <div className="mt-2">
        {!user.name && !user.username && (
          <div>
            <Link className="text-foreground font-semibold hover:underline" href={user.url}>
              @{user.id}
            </Link>
          </div>
        )}
        {user.name && (
          <div>
            <Link className="text-foreground font-semibold hover:underline" href={user.url}>
              {user.name}
            </Link>
          </div>
        )}
        {user.username && (
          <div>
            <Link className="text-muted-foreground hover:text-foreground leading-4 font-medium hover:underline" href={user.url}>
              @{user.username}
            </Link>
          </div>
        )}
      </div>
      {user.wonderfulDevUrl && user.wonderfulDevUsername ? (
        <div className="mt-2">
          <Link
            className="text-foreground text-sm font-medium hover:underline"
            href={user.wonderfulDevUrl}
            rel="nofollow noopener"
            target="_blank"
          >
            wonderful.dev/{user.wonderfulDevUsername}
          </Link>
        </div>
      ) : null}
      {user.githubUrl && user.githubUsername ? (
        <div className="mt-2">
          <Link
            className="text-foreground text-sm font-medium hover:underline"
            href={user.githubUrl}
            rel="nofollow noopener"
            target="_blank"
          >
            github.com/{user.githubUsername}
          </Link>
        </div>
      ) : null}
      {user.twitterUrl && user.twitterUsername ? (
        <div className="mt-2">
          <Link
            className="text-foreground text-sm font-medium hover:underline"
            href={user.twitterUrl}
            rel="nofollow noopener"
            target="_blank"
          >
            x.com/{user.twitterUsername}
          </Link>
        </div>
      ) : null}
      {user.bio ? <div className="text-muted-foreground mt-3 text-sm">{user.bio}</div> : null}
    </div>
  );
}
