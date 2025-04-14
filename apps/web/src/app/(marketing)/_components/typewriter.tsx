'use client';

import { useState } from 'react';
import { useInterval } from 'usehooks-ts';

export default function Typewriter({ words, width }: { width: string; words: string[] }) {
  const [word, setWord] = useState(0);
  const [index, setIndex] = useState(words[0]?.length ?? 0);
  const [direction, setDirection] = useState(-1);

  const isAnimating = word < words.length;
  const isLastIndex = index >= (words[word]?.length ?? 0);
  const delay = isLastIndex ? 900 : 130;

  useInterval(
    () => {
      const i = index + direction;
      if (i < 0) {
        setWord(word + 1);
        setDirection(1);
        setIndex(0);
        return;
      }
      const len = words[word]?.length ?? 0;
      if (i > len) {
        setIndex(len - 1);
        setDirection(-1);
        if (word >= words.length - 1) {
          setWord(word + 1);
        }
        return;
      }
      setIndex(i);
    },
    isAnimating ? delay : null,
  );
  const text = word >= words.length ? words.at(-1) : words[word]?.slice(0, index);

  return <span style={{ display: 'inline-block', textAlign: 'left', whiteSpace: 'nowrap', width }}>{text}</span>;
}
