/**
 * Blacklist mints whose Jupiter + pump.fun enrichment returned nothing.
 * First fail → skip external enrich for 24h; second fail after that → permanent.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const BLACKLIST_PATH = path.join(ROOT_DIR, 'data', 'enrich-fail-blacklist.json');
const TEMP_TTL_MS = 24 * 60 * 60 * 1000;

export type EnrichFailEntry =
  | { status: 'temp'; failedAt: number; until: number }
  | { status: 'permanent'; failedAt: number };

type EnrichFailStore = Record<string, EnrichFailEntry>;

function readStore(): EnrichFailStore {
  if (!fs.existsSync(BLACKLIST_PATH)) return {};
  try {
    const raw = fs.readFileSync(BLACKLIST_PATH, 'utf8');
    const parsed = JSON.parse(raw) as EnrichFailStore;
    return parsed != null && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(data: EnrichFailStore): void {
  const dir = path.dirname(BLACKLIST_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(BLACKLIST_PATH, JSON.stringify(data), 'utf8');
}

/** True when external Jupiter/pump.fun enrich should be skipped for this mint. */
export function isEnrichBlacklisted(mint: string): boolean {
  const m = mint.trim();
  if (!m) return false;
  const entry = readStore()[m];
  if (!entry) return false;
  if (entry.status === 'permanent') return true;
  return Date.now() < entry.until;
}

/**
 * Record that Jupiter/pump.fun enrich produced nothing usable.
 * Call only when every attempted external source among those two failed.
 */
export function recordExternalEnrichFailure(mint: string): void {
  const m = mint.trim();
  if (!m) return;

  const store = readStore();
  const existing = store[m];
  const now = Date.now();

  if (existing?.status === 'permanent') return;

  if (existing?.status === 'temp') {
    if (now < existing.until) {
      // Still in the 24h window — ignore duplicate failures from the same cooldown.
      return;
    }
    // Cooldown elapsed and external enrich failed again → permanent.
    store[m] = { status: 'permanent', failedAt: now };
    writeStore(store);
    console.info(`[enrich-blacklist] permanent ${m.slice(0, 8)}… (second fail after 24h)`);
    return;
  }

  store[m] = { status: 'temp', failedAt: now, until: now + TEMP_TTL_MS };
  writeStore(store);
  console.info(`[enrich-blacklist] temp 24h ${m.slice(0, 8)}…`);
}
