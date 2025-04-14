declare module 'rgbaster' {
  export default function analyze(
    src: string,

    options?: { ignore?: string[]; scale?: number },
  ): Promise<{ color: string; count: number }[]>;
}
