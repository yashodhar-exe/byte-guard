# API integrations

## Implemented adapters

| Provider | Capability | Server configuration | Status when missing | Limits and handling |
| --- | --- | --- | --- | --- |
| Apple App Store Search API | Searches the software catalog and normalizes app name, store ID, seller, listing URL, icon URL, rating, and bundle ID when returned. | None | Live attempt | Five terms and 25 results per term. Requests time out after eight seconds. Provider failures are recorded independently. |
| Bluesky public API | Searches public profiles and the authors of public matching posts. | None | Live attempt | Five terms and 25 profile/post results each. It only uses documented public endpoints and never accesses private content. |
| urlscan.io Search API | Searches historical public urlscan observations for brand-like domains and records the scan result, domain, title, and source URL. | `URLSCAN_API_KEY` as an Edge Function secret | Unavailable | Five terms and 20 observations each. This adapter never visits, crawls, or submits candidate websites. |

Apple documents the search endpoint, `term`, country, `media=software`, result limit, and approximate request rate limit in its [iTunes Search API documentation](https://performance-partners.apple.com/search-api).

Bluesky documents public, unauthenticated GET requests through its [AppView HTTP API](https://bsky.network/docs/category/http-reference/). urlscan.io documents its [keyed Search API](https://docs.urlscan.io/apis/urlscan-openapi/search) for historical scan records. The application does not reverse-engineer website internals, use undocumented endpoints, scrape authenticated content, or bypass provider controls.

## Adding a provider

1. Confirm the endpoint, scope, quota, and permitted data use against its current official documentation.
2. Store its secret in Supabase Edge Function secrets, not in `.env` files committed to Git and never in `VITE_` variables.
3. Implement the adapter’s capability response, bounded pagination, timeout, backoff, sanitized error mapping, and normalized fields.
4. Add an independent `scan_sources` row so an outage produces a partial scan rather than hiding results from other sources.
5. Add fixture coverage for candidate deduplication, exact official-asset exclusion, and available/unavailable signals.
