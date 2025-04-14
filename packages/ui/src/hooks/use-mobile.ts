import { useEffect, useState } from 'react';

export function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    // const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };
    window.addEventListener('resize', onChange);
    setIsMobile(window.innerWidth < breakpoint);
    return () => window.removeEventListener('resize', onChange);
  }, [breakpoint]);

  return !!isMobile;
}
