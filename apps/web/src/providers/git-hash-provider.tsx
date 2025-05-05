import { GitHash } from '@workspace/core/backend/git-hash';
import type { PropsWithChildren } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';

const GitHashContext = createContext<string>('unknown');

export default function GitHashProvider({ children }: PropsWithChildren) {
  const [githash, setGitHash] = useState<string>(() => 'unknown');

  useEffect(() => {
    const run = async () => {
      const hash = await GitHash();
      setGitHash(hash);
    };
    void run();
  }, [setGitHash]);

  return <GitHashContext.Provider value={githash}>{children}</GitHashContext.Provider>;
}

export const useGitHash = () => {
  const context = useContext(GitHashContext);
  if (!context) {
    throw new Error('useGitHash must use inside GitHashProvider');
  }
  return context;
};
