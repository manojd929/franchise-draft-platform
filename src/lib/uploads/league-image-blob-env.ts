/** Server-only: used by tournament pages to show upload UI when Blob is configured. */
export function isLeagueImageUploadConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}
