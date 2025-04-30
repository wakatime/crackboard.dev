import { getUserByUsername } from '@acme/core/backend/auth';
import { notFound, redirect,RedirectType } from 'next/navigation';

interface Props {
  params: Promise<{
    username: string;
  }>;
}

export default async function UserIdPage({ params }: Props) {
  const { username } = await params;
  const user = await getUserByUsername(username);
  if (!user) {
    notFound();
  }

  if (user.username && username.trim() !== user.username) {
    redirect(`/${user.username}/id`, RedirectType.replace);
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <h3>{user.username}’s User ID is</h3>
      <pre className="mt-3">
        <code>{user.id}</code>
      </pre>
    </div>
  );
}
