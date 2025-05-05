export async function GitHash() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return (await import('../generated/git-hash')).GIT_HASH as string;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    /* empty */
  }
  return 'unknown';
}
