'use client';

import Link from 'next/link';
import { FaGithub } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="bg-background mt-20">
      <div className="container mx-auto flex h-28 max-w-7xl items-center gap-4 px-4 md:px-8">
        <div className="flex-1"></div>

        <div className="flex items-center gap-2">
          <Link href="https://github.com/wakatime/crackboard.dev">
            <FaGithub />
          </Link>
        </div>
      </div>
    </footer>
  );
}
