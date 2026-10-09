import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const organizationId = process.env.DEMO_ORGANIZATION_ID

if (!url || !serviceRoleKey || !organizationId) {
  throw new Error('Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and DEMO_ORGANIZATION_ID before seeding synthetic demo data.')
}

const client = createClient(url, serviceRoleKey)
const now = new Date().toISOString()

const { data: brand, error: brandError } = await client.from('brands').upsert({
  organization_id: organizationId,
  name: 'Acme Wallet',
  description: 'A fictional mobile wallet used only for the ByteXL demo.',
  website: 'https://acmewallet.example',
  root_domains: ['acmewallet.example'],
  aliases: ['AcmePay', 'Acme Wallet'],
  product_names: ['Acme Wallet'],
  keywords: ['wallet', 'payments'],
  identifiers: ['ACME-001'],
  region: 'United States',
  official_description: 'Acme Wallet is a fictional digital wallet for secure payments.'
}, { onConflict: 'organization_id,name' }).select().single()

if (brandError || !brand) throw brandError ?? new Error('Could not create the demo brand.')

const assets = [
  { organization_id: organizationId, brand_id: brand.id, asset_type: 'social_profile', platform: 'YouTube', external_id: 'UC_ACME_OFFICIAL', url: 'https://www.youtube.com/@AcmeWalletOfficial', package_or_bundle_id: '', store_listing_id: '', publisher: '', trust_status: 'verified', verified_at: now, relationship_note: 'Primary official channel' },
  { organization_id: organizationId, brand_id: brand.id, asset_type: 'app_listing', platform: 'Google Play', external_id: '', url: 'https://play.google.com/store/apps/details?id=com.acme.wallet', package_or_bundle_id: 'com.acme.wallet', store_listing_id: '', publisher: 'Acme Wallet Inc.', trust_status: 'verified', verified_at: now, relationship_note: 'Official Android application' }
]
const { error: assetError } = await client.from('brand_assets').upsert(assets, { onConflict: 'brand_id,asset_type,platform,external_id,package_or_bundle_id,store_listing_id,url' })
if (assetError) throw assetError

const candidates = [
  { organization_id: organizationId, source_type: 'social', platform: 'YouTube', external_id: 'UC_ACME_OFFICIAL', name: 'Acme Wallet', normalized_name: 'acme wallet', username: '@AcmeWalletOfficial', description: 'Official Acme Wallet channel.', source_url: 'https://www.youtube.com/@AcmeWalletOfficial', publisher: '', raw_metadata: { fixture: true }, data_origin: 'synthetic', first_observed_at: now, last_observed_at: now },
  { organization_id: organizationId, source_type: 'social', platform: 'YouTube', external_id: 'UC_ACME_SUPPORT', name: 'Acme Wallet Support', normalized_name: 'acme wallet support', username: '@AcmeWalletSupportNow', description: 'Recover your wallet with our fast verification service. Visit acme-wallet-help.example.', source_url: 'https://www.youtube.com/@AcmeWalletSupportNow', publisher: '', publisher_website: 'https://acme-wallet-help.example', raw_metadata: { fixture: true }, data_origin: 'synthetic', first_observed_at: now, last_observed_at: now },
  { organization_id: organizationId, source_type: 'app', platform: 'Google Play', external_id: 'com.acme.wallett', name: 'Acme Wallett', normalized_name: 'acme wallett', description: 'Easy payments, account recovery and rewards for Acme customers.', source_url: 'https://play.google.com/store/apps/details?id=com.acme.wallett', publisher: 'Wallet Forge Studio', publisher_website: 'https://wallet-forge.example', raw_metadata: { packageName: 'com.acme.wallett', fixture: true }, data_origin: 'synthetic', first_observed_at: now, last_observed_at: now },
  { organization_id: organizationId, source_type: 'app', platform: 'Google Play', external_id: 'com.acme.wallet', name: 'Acme Wallet', normalized_name: 'acme wallet', description: 'Official Acme Wallet application.', source_url: 'https://play.google.com/store/apps/details?id=com.acme.wallet', publisher: 'Acme Wallet Inc.', publisher_website: 'https://acmewallet.example', raw_metadata: { packageName: 'com.acme.wallet', fixture: true }, data_origin: 'synthetic', first_observed_at: now, last_observed_at: now }
]
const { data: savedCandidates, error: candidateError } = await client.from('candidates').upsert(candidates, { onConflict: 'organization_id,source_type,platform,external_id' }).select()
if (candidateError || !savedCandidates) throw candidateError ?? new Error('Could not create synthetic candidates.')

const byExternalId = new Map(savedCandidates.map((candidate) => [candidate.external_id, candidate]))
const support = byExternalId.get('UC_ACME_SUPPORT')
const lookAlikeApp = byExternalId.get('com.acme.wallett')
const officialApp = byExternalId.get('com.acme.wallet')
if (!support || !lookAlikeApp || !officialApp) throw new Error('Synthetic candidates could not be resolved.')

const findings = [
  { organization_id: organizationId, brand_id: brand.id, candidate_id: support.id, score: 82, severity: 'critical', review_status: 'open', exclusion_status: 'none', explanation: { heuristic: true, unavailableSignals: ['logo'] }, data_origin: 'synthetic', detected_at: now, last_checked_at: now },
  { organization_id: organizationId, brand_id: brand.id, candidate_id: lookAlikeApp.id, score: 72, severity: 'high', review_status: 'under_review', exclusion_status: 'none', explanation: { heuristic: true, unavailableSignals: ['logo'] }, data_origin: 'synthetic', detected_at: now, last_checked_at: now },
  { organization_id: organizationId, brand_id: brand.id, candidate_id: officialApp.id, score: 0, severity: 'low', review_status: 'resolved', exclusion_status: 'official_asset', exclusion_reason: 'Exact package identifier matches a verified official asset.', explanation: { heuristic: true }, data_origin: 'synthetic', detected_at: now, last_checked_at: now }
]
const { error: findingError } = await client.from('findings').upsert(findings, { onConflict: 'brand_id,candidate_id' })
if (findingError) throw findingError

console.log(`Synthetic demo data is ready for ${brand.name} in organization ${organizationId}.`)
