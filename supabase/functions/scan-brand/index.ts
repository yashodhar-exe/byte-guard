import { createClient } from 'npm:@supabase/supabase-js@2.57.4'

type SourceType = 'social' | 'app' | 'web'
type ProviderStatus = 'completed' | 'unavailable' | 'rate_limited' | 'failed'

interface ProviderResult {
  provider: string
  sourceType: SourceType
  status: ProviderStatus
  candidates: NormalizedCandidate[]
  errorMessage: string | null
  capability: Record<string, unknown>
}

interface NormalizedCandidate {
  sourceType: SourceType
  platform: string
  externalId: string
  name: string
  username: string | null
  description: string
  sourceUrl: string | null
  imageUrl: string | null
  publisher: string
  publisherWebsite: string | null
  rating: number | null
  downloadEstimate: number | null
  rawMetadata: Record<string, unknown>
}

interface OfficialAsset {
  platform: string
  external_id: string
  package_or_bundle_id: string
  store_listing_id: string
  url: string | null
  publisher: string
  trust_status: 'verified' | 'pending' | 'inactive'
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders })
}

function normalizeName(value: string) {
  return value.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ')
}

function damerauLevenshtein(first: string, second: string) {
  const source = normalizeName(first)
  const target = normalizeName(second)
  if (!source.length) return target.length
  if (!target.length) return source.length
  const matrix = Array.from({ length: source.length + 1 }, (_, row) => [row])
  for (let column = 1; column <= target.length; column += 1) matrix[0][column] = column
  for (let row = 1; row <= source.length; row += 1) {
    for (let column = 1; column <= target.length; column += 1) {
      const cost = source[row - 1] === target[column - 1] ? 0 : 1
      matrix[row][column] = Math.min(matrix[row - 1][column] + 1, matrix[row][column - 1] + 1, matrix[row - 1][column - 1] + cost, row > 1 && column > 1 && source[row - 1] === target[column - 2] && source[row - 2] === target[column - 1] ? matrix[row - 2][column - 2] + cost : Number.POSITIVE_INFINITY)
    }
  }
  return matrix[source.length][target.length]
}

function similarity(first: string, second: string) {
  const source = normalizeName(first)
  const target = normalizeName(second)
  if (!source || !target) return 0
  if (source === target || source.replaceAll(' ', '') === target.replaceAll(' ', '')) return 100
  const lexical = Math.max(0, 1 - damerauLevenshtein(source, target) / Math.max(source.length, target.length)) * 100
  return Math.round(Math.max(lexical, source.includes(target) || target.includes(source) ? 88 : 0))
}

function riskSeverity(score: number) {
  if (score >= 80) return 'critical'
  if (score >= 60) return 'high'
  if (score >= 30) return 'medium'
  return 'low'
}

function calculateRisk(signals: Array<{ name: string; value: number | null; explanation: string }>) {
  const weights: Record<string, number> = { name: 25, logo: 25, description: 20, publisher: 15, links: 15 }
  const available = signals.filter((signal) => signal.value !== null)
  const totalWeight = available.reduce((total, signal) => total + weights[signal.name], 0)
  const score = totalWeight === 0 ? 0 : Math.round(available.reduce((total, signal) => total + (signal.value ?? 0) * weights[signal.name], 0) / totalWeight)
  return { score, severity: riskSeverity(score), unavailable: signals.filter((signal) => signal.value === null).map((signal) => signal.name) }
}

function safeError(error: unknown) {
  if (error instanceof Error && /rate|quota|429/i.test(error.message)) return { status: 'rate_limited' as const, message: 'Provider rate limit or quota prevented retrieval.' }
  return { status: 'failed' as const, message: 'Provider retrieval failed. No provider response details were stored.' }
}

async function fetchJson(url: string, init: RequestInit = {}) {
  let latestError: unknown
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const headers = new Headers(init.headers)
      headers.set('accept', 'application/json')
      const response = await fetch(url, { ...init, signal: AbortSignal.timeout(8_000), headers })
      if (response.ok) return await response.json() as Record<string, unknown>
      if (response.status < 500 && response.status !== 429) throw new Error(`Provider response ${response.status}`)
      latestError = new Error(`Provider response ${response.status}`)
    } catch (error) {
      latestError = error
    }
    if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt))
  }
  throw latestError instanceof Error ? latestError : new Error('Provider request failed.')
}

async function searchApple(terms: string[]): Promise<ProviderResult> {
  const candidates: NormalizedCandidate[] = []
  const seen = new Set<string>()
  try {
    for (const term of terms.slice(0, 5)) {
      const url = new URL('https://itunes.apple.com/search')
      url.searchParams.set('term', term)
      url.searchParams.set('country', 'us')
      url.searchParams.set('media', 'software')
      url.searchParams.set('entity', 'software')
      url.searchParams.set('limit', '25')
      const payload = await fetchJson(url.toString())
      const results = Array.isArray(payload.results) ? payload.results : []
      for (const item of results) {
        if (!item || typeof item !== 'object') continue
        const record = item as Record<string, unknown>
        const trackId = String(record.trackId ?? '')
        if (!trackId || seen.has(trackId)) continue
        seen.add(trackId)
        candidates.push({
          sourceType: 'app', platform: 'Apple App Store', externalId: trackId, name: String(record.trackName ?? record.trackCensoredName ?? 'Unknown app'), username: null, description: String(record.description ?? ''), sourceUrl: typeof record.trackViewUrl === 'string' && record.trackViewUrl.startsWith('https://') ? record.trackViewUrl : null, imageUrl: typeof record.artworkUrl100 === 'string' && record.artworkUrl100.startsWith('https://') ? record.artworkUrl100 : null, publisher: String(record.sellerName ?? record.artistName ?? ''), publisherWebsite: typeof record.sellerUrl === 'string' && record.sellerUrl.startsWith('https://') ? record.sellerUrl : null, rating: typeof record.averageUserRating === 'number' ? record.averageUserRating : null, downloadEstimate: null, rawMetadata: { trackId, bundleId: String(record.bundleId ?? ''), version: String(record.version ?? ''), trackContentRating: String(record.trackContentRating ?? '') }
        })
      }
    }
    return { provider: 'Apple App Store Search API', sourceType: 'app', status: 'completed', candidates, errorMessage: null, capability: { search: 'software catalog metadata', credentials: 'not_required', pages: 'bounded to five terms and 25 results each' } }
  } catch (error) {
    const detail = safeError(error)
    return { provider: 'Apple App Store Search API', sourceType: 'app', status: detail.status, candidates, errorMessage: detail.message, capability: { search: 'software catalog metadata', credentials: 'not_required' } }
  }
}

function asHttpsUrl(value: unknown) {
  return typeof value === 'string' && value.startsWith('https://') ? value : null
}

function unavailableProvider(provider: string, sourceType: SourceType, message: string, capability: Record<string, unknown>): ProviderResult {
  return { provider, sourceType, status: 'unavailable', candidates: [], errorMessage: message, capability }
}

async function searchBluesky(terms: string[]): Promise<ProviderResult> {
  const candidates: NormalizedCandidate[] = []
  const seen = new Set<string>()
  try {
    for (const term of terms.slice(0, 5)) {
      const profileUrl = new URL('https://public.api.bsky.app/xrpc/app.bsky.actor.searchActors')
      profileUrl.searchParams.set('q', term)
      profileUrl.searchParams.set('limit', '25')
      const profilePayload = await fetchJson(profileUrl.toString())
      const actors = Array.isArray(profilePayload.actors) ? profilePayload.actors : []
      for (const item of actors) {
        if (!item || typeof item !== 'object') continue
        const record = item as Record<string, unknown>
        const did = String(record.did ?? '')
        const handle = String(record.handle ?? '')
        if (!did || !handle || seen.has(did)) continue
        seen.add(did)
        candidates.push({
          sourceType: 'social', platform: 'Bluesky', externalId: did, name: String(record.displayName ?? handle), username: handle,
          description: String(record.description ?? ''), sourceUrl: `https://bsky.app/profile/${encodeURIComponent(handle)}`,
          imageUrl: asHttpsUrl(record.avatar), publisher: '', publisherWebsite: null, rating: null, downloadEstimate: null,
          rawMetadata: { did, handle }
        })
      }
      const postUrl = new URL('https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts')
      postUrl.searchParams.set('q', term)
      postUrl.searchParams.set('limit', '25')
      const postPayload = await fetchJson(postUrl.toString())
      const posts = Array.isArray(postPayload.posts) ? postPayload.posts : []
      for (const item of posts) {
        if (!item || typeof item !== 'object') continue
        const post = item as Record<string, unknown>
        const author = post.author && typeof post.author === 'object' ? post.author as Record<string, unknown> : {}
        const record = post.record && typeof post.record === 'object' ? post.record as Record<string, unknown> : {}
        const did = String(author.did ?? '')
        const handle = String(author.handle ?? '')
        if (!did || !handle || seen.has(did)) continue
        seen.add(did)
        candidates.push({
          sourceType: 'social', platform: 'Bluesky', externalId: did, name: String(author.displayName ?? handle), username: handle,
          description: String(author.description ?? record.text ?? '').slice(0, 4000), sourceUrl: `https://bsky.app/profile/${encodeURIComponent(handle)}`,
          imageUrl: asHttpsUrl(author.avatar), publisher: '', publisherWebsite: null, rating: null, downloadEstimate: null,
          rawMetadata: { did, handle, postUri: String(post.uri ?? ''), postCreatedAt: String(record.createdAt ?? '') }
        })
      }
    }
    return { provider: 'Bluesky public API', sourceType: 'social', status: 'completed', candidates, errorMessage: null, capability: { search: 'public profile and post discovery', credentials: 'not_required', pages: 'bounded to five terms and 25 profile/post results each' } }
  } catch (error) {
    const detail = safeError(error)
    return { provider: 'Bluesky public API', sourceType: 'social', status: detail.status, candidates, errorMessage: detail.message, capability: { search: 'public profile and post discovery', credentials: 'not_required' } }
  }
}

function urlscanTerm(value: string) {
  return normalizeName(value).replace(/[^a-z0-9.-]/g, '')
}

async function searchUrlscan(terms: string[]): Promise<ProviderResult> {
  const apiKey = Deno.env.get('URLSCAN_API_KEY')
  if (!apiKey) return unavailableProvider('urlscan.io Search API', 'web', 'URLSCAN_API_KEY is not configured.', { search: 'historical public web scans and domains', credentials: 'URLSCAN_API_KEY required', limitation: 'Searches historical urlscan observations; it does not crawl or visit candidate websites.' })
  const candidates: NormalizedCandidate[] = []
  const seen = new Set<string>()
  try {
    for (const term of terms.slice(0, 5)) {
      const queryTerm = urlscanTerm(term)
      if (!queryTerm) continue
      const url = new URL('https://urlscan.io/api/v1/search/')
      url.searchParams.set('q', `page.domain:*${queryTerm}*`)
      url.searchParams.set('size', '20')
      url.searchParams.set('datasource', 'scans')
      const payload = await fetchJson(url.toString(), { headers: { 'api-key': apiKey } })
      const results = Array.isArray(payload.results) ? payload.results : []
      for (const item of results) {
        if (!item || typeof item !== 'object') continue
        const record = item as Record<string, unknown>
        const page = record.page && typeof record.page === 'object' ? record.page as Record<string, unknown> : {}
        const task = record.task && typeof record.task === 'object' ? record.task as Record<string, unknown> : {}
        const scanId = String(record._id ?? '')
        const domain = String(page.domain ?? '')
        const observedUrl = asHttpsUrl(page.url) ?? asHttpsUrl(task.url)
        const externalId = scanId || observedUrl || domain
        if (!externalId || seen.has(externalId)) continue
        seen.add(externalId)
        candidates.push({
          sourceType: 'web', platform: 'urlscan.io', externalId,
          name: domain || observedUrl || 'Unknown domain', username: null,
          description: String(page.title ?? 'Historical public web scan observation.').slice(0, 4000),
          sourceUrl: scanId ? `https://urlscan.io/result/${encodeURIComponent(scanId)}/` : observedUrl,
          imageUrl: null, publisher: domain, publisherWebsite: observedUrl,
          rating: null, downloadEstimate: null,
          rawMetadata: { scanId, domain, observedUrl: observedUrl ?? '', scannedAt: String(task.time ?? '') }
        })
      }
    }
    return { provider: 'urlscan.io Search API', sourceType: 'web', status: 'completed', candidates, errorMessage: null, capability: { search: 'historical public web scans and domains', credentials: 'URLSCAN_API_KEY required', pages: 'bounded to five terms and 20 results each', limitation: 'Searches historical urlscan observations; it does not crawl or visit candidate websites.' } }
  } catch (error) {
    const detail = safeError(error)
    return { provider: 'urlscan.io Search API', sourceType: 'web', status: detail.status, candidates, errorMessage: detail.message, capability: { search: 'historical public web scans and domains', credentials: 'URLSCAN_API_KEY required' } }
  }
}

function unavailableSocialProviders() {
  return [
    unavailableProvider('Facebook Graph API', 'social', 'Facebook Page public-content access is not configured or approved for this project.', { search: 'not attempted', credentials: 'approved Page Public Content Access and documented scopes required', limitation: 'No unsupported public-page search is performed.' }),
    unavailableProvider('TikTok API', 'social', 'TikTok approved product access is not configured for this project.', { search: 'not attempted', credentials: 'approved TikTok product access and required user or research authorization', limitation: 'No unrestricted profile search is performed.' })
  ]
}

async function searchSerpstack(terms: string[]): Promise<ProviderResult> {
  const apiKey = Deno.env.get('SERPSTACK_API_KEY')
  if (!apiKey) return unavailableProvider('Serpstack Google Search API', 'web', 'SERPSTACK_API_KEY is not configured.', { search: 'Google organic search results', credentials: 'SERPSTACK_API_KEY required' })
  const candidates: NormalizedCandidate[] = []
  const seen = new Set<string>()
  try {
    for (const term of terms.slice(0, 5)) {
      const url = new URL('http://api.serpstack.com/search')
      url.searchParams.set('access_key', apiKey)
      url.searchParams.set('query', term)
      const payload = await fetchJson(url.toString())
      if (payload.success === false || payload.error) {
        const errObj = payload.error as Record<string, unknown> | undefined
        throw new Error(`Serpstack API Error: ${errObj?.info || errObj?.type || 'Unknown error'}`)
      }
      const results = Array.isArray(payload.organic_results) ? payload.organic_results : []
      for (const item of results) {
        if (!item || typeof item !== 'object') continue
        const record = item as Record<string, unknown>
        const title = String(record.title ?? '')
        const itemUrl = String(record.url ?? '')
        const snippet = String(record.snippet ?? '')
        const domain = String(record.domain ?? '')
        if (!itemUrl || seen.has(itemUrl)) continue
        seen.add(itemUrl)
        candidates.push({
          sourceType: 'web', platform: 'Google Search', externalId: itemUrl,
          name: title || domain || 'Unknown page', username: null,
          description: snippet.slice(0, 4000), sourceUrl: asHttpsUrl(itemUrl) ?? itemUrl,
          imageUrl: null, publisher: domain, publisherWebsite: null,
          rating: null, downloadEstimate: null,
          rawMetadata: { domain, observedUrl: itemUrl, position: String(record.position ?? '') }
        })
      }
    }
    return { provider: 'Serpstack Google Search API', sourceType: 'web', status: 'completed', candidates, errorMessage: null, capability: { search: 'Google organic search results', credentials: 'SERPSTACK_API_KEY required', pages: 'bounded to five terms' } }
  } catch (error) {
    const detail = safeError(error)
    return { provider: 'Serpstack Google Search API', sourceType: 'web', status: detail.status, candidates, errorMessage: error instanceof Error ? error.message : detail.message, capability: { search: 'Google organic search results', credentials: 'SERPSTACK_API_KEY required' } }
  }
}

function isOfficial(candidate: NormalizedCandidate, assets: OfficialAsset[]) {
  const sourceUrl = candidate.sourceUrl?.toLocaleLowerCase() ?? ''
  const packageId = String(candidate.rawMetadata.bundleId ?? '')
  return assets.find((asset) => asset.trust_status === 'verified' && normalizeName(asset.platform) === normalizeName(candidate.platform) && ((Boolean(asset.external_id) && asset.external_id === candidate.externalId) || (Boolean(asset.package_or_bundle_id) && asset.package_or_bundle_id === packageId) || (Boolean(asset.store_listing_id) && asset.store_listing_id === candidate.externalId) || (Boolean(asset.url) && asset.url?.toLocaleLowerCase() === sourceUrl)))
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)
  const authorization = request.headers.get('Authorization')
  if (!authorization) return json({ error: 'Authentication is required.' }, 401)
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ error: 'Server configuration is incomplete.' }, 500)
  let body: { brandId?: string }
  try { body = await request.json() as { brandId?: string } } catch { return json({ error: 'A JSON body is required.' }, 400) }
  if (!body.brandId || !/^[0-9a-f-]{36}$/i.test(body.brandId)) return json({ error: 'A valid brandId is required.' }, 400)
  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } })
  const { data: userData, error: userError } = await userClient.auth.getUser()
  if (userError || !userData.user) return json({ error: 'Invalid user session.' }, 401)
  const admin = createClient(supabaseUrl, serviceRoleKey)
  const { data: brand, error: brandError } = await admin.from('brands').select('id, organization_id, name, aliases, product_names, official_description, root_domains').eq('id', body.brandId).maybeSingle()
  if (brandError || !brand) return json({ error: 'Brand not found.' }, 404)
  const { data: membership } = await admin.from('organization_members').select('organization_id').eq('organization_id', brand.organization_id).eq('user_id', userData.user.id).maybeSingle()
  if (!membership) return json({ error: 'You do not have access to this brand.' }, 403)
  const { data: activeScan } = await admin.from('scans').select('id').eq('brand_id', brand.id).eq('status', 'running').maybeSingle()
  if (activeScan) return json({ error: 'A scan is already running for this brand.' }, 409)
  const now = new Date().toISOString()
  const { data: scan, error: scanError } = await admin.from('scans').insert({ organization_id: brand.organization_id, brand_id: brand.id, status: 'running', mode: 'live', requested_by: userData.user.id, started_at: now }).select().single()
  if (scanError || !scan) return json({ error: 'Could not create the scan record.' }, 500)
  const searchTerms = [...new Set([brand.name, ...(brand.aliases ?? []), ...(brand.product_names ?? [])].map((term) => String(term).trim()).filter(Boolean))]
  const results = await Promise.all([
    searchApple(searchTerms),
    searchBluesky(searchTerms),
    searchUrlscan(searchTerms),
    searchSerpstack(searchTerms)
  ])
  const sourceRows = results.map((result) => ({ organization_id: brand.organization_id, scan_id: scan.id, provider: result.provider, source_type: result.sourceType, status: result.status, capability: result.capability, records_collected: result.candidates.length, last_successful_retrieval: result.status === 'completed' ? now : null, error_message: result.errorMessage, data_origin: 'live' }))
  await admin.from('scan_sources').upsert(sourceRows, { onConflict: 'scan_id,provider' })
  const { data: assets } = await admin.from('brand_assets').select('platform, external_id, package_or_bundle_id, store_listing_id, url, publisher, trust_status').eq('brand_id', brand.id).eq('trust_status', 'verified')
  let findingsCreated = 0
  let excludedCount = 0
  for (const result of results) {
    for (const candidate of result.candidates) {
      const timestamp = new Date().toISOString()
      const { data: savedCandidate, error: candidateError } = await admin.from('candidates').upsert({ organization_id: brand.organization_id, source_type: candidate.sourceType, platform: candidate.platform, external_id: candidate.externalId, name: candidate.name, normalized_name: normalizeName(candidate.name), username: candidate.username, description: candidate.description.slice(0, 4000), source_url: candidate.sourceUrl, image_url: candidate.imageUrl, publisher: candidate.publisher, publisher_website: candidate.publisherWebsite, rating: candidate.rating, download_estimate: candidate.downloadEstimate, raw_metadata: candidate.rawMetadata, data_origin: 'live', last_observed_at: timestamp }, { onConflict: 'organization_id,source_type,platform,external_id' }).select().single()
      if (candidateError || !savedCandidate) continue
      const officialAsset = isOfficial(candidate, (assets ?? []) as OfficialAsset[])
      const nameScore = Math.max(...[brand.name, ...(brand.aliases ?? []), ...(brand.product_names ?? [])].map((name) => similarity(candidate.name, name)))
      const descriptionCorpus = `${brand.official_description ?? ''} ${brand.name} ${(brand.aliases ?? []).join(' ')}`.trim()
      const descriptionScore = candidate.description && descriptionCorpus ? similarity(candidate.description.slice(0, 300), descriptionCorpus.slice(0, 300)) : null
      const trustedPublishers = (assets ?? []).map((asset) => asset.publisher).filter(Boolean).map(normalizeName)
      const publisherScore = candidate.publisher ? trustedPublishers.includes(normalizeName(candidate.publisher)) ? 0 : 75 : null
      const candidateDomain = candidate.publisherWebsite ? new URL(candidate.publisherWebsite).hostname : ''
      const trustedDomain = (brand.root_domains ?? []).some((domain: string) => candidateDomain === domain || candidateDomain.endsWith(`.${domain}`))
      const linkScore = candidate.publisherWebsite ? trustedDomain ? 0 : 70 : null
      const signals = [
        { name: 'name', value: nameScore, explanation: 'Name similarity compares normalized brand names, aliases, and products.' },
        { name: 'logo', value: null, explanation: 'Logo analysis is unavailable because no compatible server-side image analysis provider is configured.' },
        { name: 'description', value: descriptionScore, explanation: 'Description similarity compares the returned source description with protected identity text.' },
        { name: 'publisher', value: publisherScore, explanation: 'Publisher differences are a risk signal, not proof of impersonation.' },
        { name: 'links', value: linkScore, explanation: 'Unregistered publisher website domains are a risk signal, not proof of maliciousness.' }
      ]
      const assessment = calculateRisk(signals)
      if (!officialAsset && assessment.score < 45) continue
      const findingPayload = officialAsset
        ? { organization_id: brand.organization_id, brand_id: brand.id, candidate_id: savedCandidate.id, scan_id: scan.id, score: 0, severity: 'low', review_status: 'resolved', exclusion_status: 'official_asset', exclusion_reason: 'Exact identifier or verified listing URL matches a registered official asset.', explanation: { heuristic: true, unavailableSignals: assessment.unavailable }, data_origin: 'live', last_checked_at: timestamp }
        : { organization_id: brand.organization_id, brand_id: brand.id, candidate_id: savedCandidate.id, scan_id: scan.id, score: assessment.score, severity: assessment.severity, review_status: 'open', exclusion_status: 'none', exclusion_reason: null, explanation: { heuristic: true, unavailableSignals: assessment.unavailable, availableSignalWeight: signals.filter((signal) => signal.value !== null).length }, data_origin: 'live', last_checked_at: timestamp }
      const { data: finding, error: findingError } = await admin.from('findings').upsert(findingPayload, { onConflict: 'brand_id,candidate_id' }).select().single()
      if (findingError || !finding) continue
      await admin.from('finding_evidence').delete().eq('finding_id', finding.id)
      const evidenceRows = officialAsset
        ? [{ organization_id: brand.organization_id, finding_id: finding.id, signal_type: 'official_asset_exclusion', signal_value: { externalId: candidate.externalId, bundleId: String(candidate.rawMetadata.bundleId ?? '') }, score: 0, available: true, explanation: 'An exact verified asset identifier or URL matched before threat scoring.', provenance: result.provider }]
        : signals.map((signal) => ({ organization_id: brand.organization_id, finding_id: finding.id, signal_type: signal.name, signal_value: { candidateName: candidate.name }, score: signal.value, available: signal.value !== null, explanation: signal.explanation, provenance: result.provider }))
      await admin.from('finding_evidence').insert(evidenceRows)
      if (officialAsset) excludedCount += 1
      else findingsCreated += 1
    }
  }
  const completedProviders = results.filter((result) => result.status === 'completed').length
  const overallStatus = completedProviders === 0 ? 'failed' : completedProviders === results.length ? 'completed' : 'partial'
  const summary = { providers: results.map((result) => ({ provider: result.provider, status: result.status, recordsCollected: result.candidates.length })), candidates: results.reduce((total, result) => total + result.candidates.length, 0), findingsCreated, excludedOfficialAssets: excludedCount }
  await admin.from('scans').update({ status: overallStatus, completed_at: new Date().toISOString(), summary }).eq('id', scan.id)
  return json({ scanId: scan.id, status: overallStatus, summary })
})
