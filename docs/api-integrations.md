# API integrations

## Implemented adapters

| Provider | Capability | Server configuration | Status when missing | Limits and handling |
| --- | --- | --- | --- | --- |
| Apple App Store Search API | Searches the software catalog and normalizes app name, store ID, seller, listing URL, icon URL, rating, and bundle ID when returned. | None | Live attempt | Five terms and 25 results per term. Requests time out after eight seconds. Provider failures are recorded independently. |
| YouTube Data API v3 | Searches public channel resources using `search.list` with `part=snippet` and `type=channel`. | `YOUTUBE_API_KEY` as an Edge Function secret | Unavailable | Five terms and 25 results per term. The API key never reaches the browser. |

Apple documents the search endpoint, `term`, country, `media=software`, result limit, and approximate request rate limit in its [iTunes Search API documentation](https://performance-partners.apple.com/search-api). YouTube documents `search.list`, `part=snippet`, resource type filtering, bounded pages, and quota behavior in its [Data API reference](https://developers.google.com/youtube/v3/docs/search/list).

## Declared but intentionally unavailable adapters

| Provider | Needed configuration | Documented limitation reflected in ByteXL |
| --- | --- | --- |
| Google Play catalog | A configured third-party provider such as 42matters and its server-side key | No unsupported scraping is performed. The adapter is unavailable until a licensed provider is configured. |
| Instagram and Facebook | `META_APP_ID`, `META_APP_SECRET`, approved access, and required account/scopes | Only documented Graph API capabilities for approved use cases may be enabled. |
| X | `X_API_KEY`, `X_API_SECRET`, and a suitable access tier | Search is enabled only when the selected tier documents it. |
| TikTok | `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, approved product access | No private-content or anti-bot bypassing is attempted. |
| Reddit | `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET` | Must use registered-app access in accordance with API terms. |
| URL reputation | A specific provider key such as `URLSCAN_API_KEY`, `GOOGLE_WEB_RISK_API_KEY`, or `VIRUSTOTAL_API_KEY` | Reputation is supplementary evidence only, never a standalone verdict. |

## Adding a provider

1. Confirm the endpoint, scope, quota, and permitted data use against its current official documentation.
2. Store its secret in Supabase Edge Function secrets, not in `.env` files committed to Git and never in `VITE_` variables.
3. Implement the adapter’s capability response, bounded pagination, timeout, backoff, sanitized error mapping, and normalized fields.
4. Add an independent `scan_sources` row so an outage produces a partial scan rather than hiding results from other sources.
5. Add fixture coverage for candidate deduplication, exact official-asset exclusion, and available/unavailable signals.
