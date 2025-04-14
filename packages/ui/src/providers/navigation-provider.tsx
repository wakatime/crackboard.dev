'use client';

import { SS_LOCATION_HISTORY } from '@acme/core/constants';
import { useEffect, useRef } from 'react';

const getLocationHistory = () => {
  const hs = sessionStorage.getItem(SS_LOCATION_HISTORY);
  return JSON.parse(hs ?? '[]') as string[];
};

const setLocationHistory = (data: string[]) => {
  sessionStorage.setItem(SS_LOCATION_HISTORY, JSON.stringify(data));
};

export default function UpdateHistory() {
  const updateHistoryCalledRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    if (updateHistoryCalledRef.current) {
      return;
    }
    updateHistoryCalledRef.current = true;

    const localtionHistory = getLocationHistory();

    if (localtionHistory.length === 0) {
      localtionHistory.push(location.href);
      setLocationHistory(localtionHistory);
    }

    const originalPushState = history.pushState.bind(history);
    history.pushState = (data, unused, url) => {
      if (url) {
        const href = url instanceof URL ? url.href : url;
        if (localtionHistory.at(-1) !== href) {
          localtionHistory.push(href);
        }
      }
      setLocationHistory(localtionHistory);
      const previousPath = localtionHistory.at(-2);
      originalPushState({ ...data, ...(previousPath ? { fromApp: true, previousPath } : {}) }, unused, url);
    };

    const originalReplaceState = history.replaceState.bind(history);
    history.replaceState = (data, unused, url) => {
      if (url) {
        const href = url instanceof URL ? url.href : url;
        localtionHistory.pop();
        if (localtionHistory.at(-1) !== href) {
          localtionHistory.push(href);
        }
      }
      setLocationHistory(localtionHistory);
      const previousPath = localtionHistory.at(-2);
      originalReplaceState({ ...data, ...(previousPath ? { fromApp: true, previousPath } : {}) }, unused, url);
    };
  }, []);

  return null;
}
