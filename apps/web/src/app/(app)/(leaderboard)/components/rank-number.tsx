'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@workspace/ui/components/alert-dialog';
import { Button } from '@workspace/ui/components/button';
import Link from 'next/link';
import { FaExternalLinkAlt } from 'react-icons/fa';

export default function RankNumber({ rank }: { rank: number }) {
  if (rank > 1) {
    return <p className="text-base font-semibold">#{rank}</p>;
  }
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <p className="cursor-pointer text-base leading-5 font-bold text-yellow-500">
          👑 #1
          <br />
          cracked
        </p>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>What is cracked?</AlertDialogTitle>
          <AlertDialogDescription>
            <p>It takes something special to #1 on the daily coding leaderboard.</p>
            <p>Sometimes it’s energy drinks, other times it’s the motivation of building something impactful.</p>
            <p className="my-2">
              Whatever your reasons, join the discussion on{' '}
              <Link className="underline" href="https://wonderful.dev/timeline">
                wonderful.dev
              </Link>
              .
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction asChild>
            <Button asChild>
              <Link href="https://wonderful.dev/timeline" target="_blank">
                Join the discussion
                <FaExternalLinkAlt />
              </Link>
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
