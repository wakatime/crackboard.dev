import { useEffect, useState } from 'react';

export const usePreviousPath = () => {
  const [previousPath, setPreviousPath] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const { previousPath } = window.history.state as { previousPath?: string };
      setPreviousPath(previousPath === window.location.href ? null : (previousPath ?? null));
    }
  }, []);

  return previousPath;
};
