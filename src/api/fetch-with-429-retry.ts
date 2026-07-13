/**
 * Direct outbound fetch with a single 429 retry.
 * On first 429: wait 3s and retry once. A second 429 is returned as-is
 * so callers can skip to the next source (e.g. Jupiter → pump.fun).
 */

const RATE_LIMIT_RETRY_MS = 3_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** fetch() with one retry after 3s when the response is HTTP 429. */
export async function fetchWith429Retry(
  url: string | URL,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(url, init);
  if (res.status !== 429) return res;
  await sleep(RATE_LIMIT_RETRY_MS);
  return fetch(url, init);
}
