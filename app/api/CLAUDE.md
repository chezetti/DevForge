# app/api/ — server routes (media)

The only server-side part of the app. Every other tool is fully client-side. This handles media downloads (YouTube/Instagram), which need CORS bypass and server-side access to third-party providers.

## Routes

### `media/resolve` (POST)
Resolves a source link into a direct download URL. The body is validated with Zod (`ResolveRequestSchema`): `{ url, type: 'youtube-video' | 'instagram-video' | 'youtube-mp3' }`.

Resolver chain (in order; first success wins):
1. **YouTube**: `trySaveNowYoutube` (savenow.to, polls progress up to ~45s) → `tryYoutubeDirect` (`@distube/ytdl-core`, picks the best format).
2. **Cobalt providers**: `tryCobalt` — iterates endpoints, the first being `process.env.MEDIA_API_URL` (if set), then public fallbacks.
3. **Instagram**: `tryInstagramEmbed` — parses `video_url` from the embed page.

Results are cached in memory: a `Map` with a 5-min TTL, 50-entry cap (LRU eviction). The cache is per-instance and does not survive restart/scaling.

### `media/download` (GET)
Proxies and streams the resolved file with correct `Content-Type`/`Content-Disposition`. Params: `url`, `title`, `type`.

## Security (do NOT weaken)

- **SSRF protection** in `download`: `isPrivateIP` blocks localhost, `127/8`, `10/8`, `172.16–31`, `192.168`, `169.254`, `0.x`. Only `http:`/`https:` are allowed.
- Filenames are sanitized (`sanitizeFileName`); the extension is derived from `Content-Type`.
- Any edits to these routes must keep the private-address and protocol checks.

## Conventions

- `NextRequest`/`NextResponse`, meaningful error codes: 400 (validation), 403 (private address), 422 (Instagram fallback), 502 (provider unavailable), 500 (other).
- External fetches use `cache: 'no-store'` and a realistic `User-Agent`.
- Providers are third-party and flaky; when adding a new one, slot it into the fallback chain rather than replacing the existing ones.
