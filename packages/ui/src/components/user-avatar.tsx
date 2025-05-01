import type { PublicUser } from '@workspace/core/types';
import { LuUser } from 'react-icons/lu';

import { cn } from '../lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export default function UserAvatar({ user, className }: { user?: Pick<PublicUser, 'avatarUrl'> | null; className?: string }) {
  return (
    <Avatar className={cn('border', className)}>
      {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} /> : null}
      <AvatarFallback>
        <LuUser className="size-1/2" />
      </AvatarFallback>
    </Avatar>
  );
}
