import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// KV Store Interface
export interface IKVStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  increment(key: string, ttlSeconds?: number): Promise<number>;
}

// In-Memory store with optional persistence or external KV support
class MemoryAndFsKVStore implements IKVStore {
  private memory = new Map<string, { value: any; expiresAt?: number }>();
  private readonly dataDir: string;
  private readonly kvFile: string;
  private isPersisting = false;

  constructor() {
    this.dataDir = process.env.DATA_DIR || path.resolve(__dirname, '../../data');
    this.kvFile = path.join(this.dataDir, 'kv_store.json');
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.kvFile)) {
        const raw = fs.readFileSync(this.kvFile, 'utf8');
        const parsed = JSON.parse(raw);
        const now = Date.now();
        for (const [k, v] of Object.entries(parsed)) {
          const entry = v as { value: any; expiresAt?: number };
          if (!entry.expiresAt || entry.expiresAt > now) {
            this.memory.set(k, entry);
          }
        }
      }
    } catch {
      // Safe fallback in readonly/serverless
    }
  }

  private scheduleSave() {
    if (this.isPersisting || process.env.VERCEL) return;
    this.isPersisting = true;
    setTimeout(() => {
      try {
        if (!fs.existsSync(this.dataDir)) {
          fs.mkdirSync(this.dataDir, { recursive: true });
        }
        const obj: Record<string, any> = {};
        const now = Date.now();
        for (const [k, v] of this.memory.entries()) {
          if (!v.expiresAt || v.expiresAt > now) {
            obj[k] = v;
          }
        }
        fs.writeFileSync(this.kvFile, JSON.stringify(obj), 'utf8');
      } catch {
        // In serverless / read-only filesystem, silently handle
      } finally {
        this.isPersisting = false;
      }
    }, 100);
  }

  async get<T>(key: string): Promise<T | null> {
    // 1. If Redis / Upstash is configured, query external KV
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      try {
        const res = await fetch(`${process.env.KV_REST_API_URL}/get/${encodeURIComponent(key)}`, {
          headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
        });
        if (res.ok) {
          const data = await res.json() as { result: string | null };
          if (data && data.result !== null) {
            return JSON.parse(data.result) as T;
          }
          return null;
        }
      } catch (err) {
        console.warn('[KV External Get Error, falling back]:', err);
      }
    }

    const entry = this.memory.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.memory.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.memory.set(key, { value, expiresAt });
    this.scheduleSave();

    // If external KV is configured
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      try {
        const command = ttlSeconds
          ? `${process.env.KV_REST_API_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(JSON.stringify(value))}?ex=${ttlSeconds}`
          : `${process.env.KV_REST_API_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(JSON.stringify(value))}`;
        await fetch(command, {
          headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
        });
      } catch (err) {
        console.warn('[KV External Set Error]:', err);
      }
    }
  }

  async delete(key: string): Promise<void> {
    this.memory.delete(key);
    this.scheduleSave();

    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      try {
        await fetch(`${process.env.KV_REST_API_URL}/del/${encodeURIComponent(key)}`, {
          headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
        });
      } catch (err) {
        console.warn('[KV External Del Error]:', err);
      }
    }
  }

  async increment(key: string, ttlSeconds = 60): Promise<number> {
    const current = (await this.get<number>(key)) || 0;
    const next = current + 1;
    await this.set(key, next, ttlSeconds);
    return next;
  }
}

export const kvStore = new MemoryAndFsKVStore();
