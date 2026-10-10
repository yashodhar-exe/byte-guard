import type { WorkspaceData } from '../lib/types'

const timestamp = '2026-10-09T04:20:00.000Z'

export const demoWorkspace: WorkspaceData = {
  organization: { id: 'org-demo', name: 'Northstar Security Lab' },
  brands: [
    {
      id: 'brand-acme', organization_id: 'org-demo', name: 'Acme Wallet', description: 'A fictional mobile wallet used only for the Byte Gaurd demo.', website: 'https://acmewallet.example', root_domains: ['acmewallet.example'], aliases: ['AcmePay', 'Acme Wallet'], product_names: ['Acme Wallet'], keywords: ['wallet', 'payments'], identifiers: ['ACME-001'], logo_path: null, region: 'United States', official_description: 'Acme Wallet is a fictional digital wallet for secure payments.', created_at: timestamp
    }
  ],
  assets: [
    {
      id: 'asset-youtube', organization_id: 'org-demo', brand_id: 'brand-acme', asset_type: 'social_profile', platform: 'YouTube', external_id: 'UC_ACME_OFFICIAL', url: 'https://www.youtube.com/@AcmeWalletOfficial', package_or_bundle_id: '', store_listing_id: '', publisher: '', trust_status: 'verified', verified_at: timestamp, relationship_note: 'Primary official channel', created_at: timestamp
    },
    {
      id: 'asset-play', organization_id: 'org-demo', brand_id: 'brand-acme', asset_type: 'app_listing', platform: 'Google Play', external_id: '', url: 'https://play.google.com/store/apps/details?id=com.acme.wallet', package_or_bundle_id: 'com.acme.wallet', store_listing_id: '', publisher: 'Acme Wallet Inc.', trust_status: 'verified', verified_at: timestamp, relationship_note: 'Official Android application', created_at: timestamp
    },
    {
      id: 'asset-domain', organization_id: 'org-demo', brand_id: 'brand-acme', asset_type: 'domain', platform: 'Web', external_id: 'acmewallet.example', url: 'https://acmewallet.example', package_or_bundle_id: '', store_listing_id: '', publisher: '', trust_status: 'verified', verified_at: timestamp, relationship_note: 'Primary product domain', created_at: timestamp
    }
  ],
  scans: [
    { id: 'scan-complete', organization_id: 'org-demo', brand_id: 'brand-acme', status: 'completed', mode: 'demo', started_at: '2026-10-09T04:00:00.000Z', completed_at: '2026-10-09T04:02:00.000Z', summary: { candidates: 4, findings: 3 }, created_at: '2026-10-09T04:00:00.000Z' },
    { id: 'scan-partial', organization_id: 'org-demo', brand_id: 'brand-acme', status: 'partial', mode: 'demo', started_at: '2026-10-08T04:00:00.000Z', completed_at: '2026-10-08T04:01:30.000Z', summary: { candidates: 2, findings: 1 }, created_at: '2026-10-08T04:00:00.000Z' },
    { id: 'scan-failed', organization_id: 'org-demo', brand_id: 'brand-acme', status: 'failed', mode: 'demo', started_at: '2026-10-07T04:00:00.000Z', completed_at: '2026-10-07T04:00:10.000Z', summary: { candidates: 0, findings: 0 }, created_at: '2026-10-07T04:00:00.000Z' }
  ],
  scanSources: [
    { id: 'source-apple', organization_id: 'org-demo', scan_id: 'scan-complete', provider: 'Apple App Store Search API', source_type: 'app', status: 'completed', records_collected: 2, last_successful_retrieval: '2026-10-09T04:01:00.000Z', error_message: null, data_origin: 'synthetic' },
    { id: 'source-youtube', organization_id: 'org-demo', scan_id: 'scan-complete', provider: 'YouTube Data API', source_type: 'social', status: 'unavailable', records_collected: 0, last_successful_retrieval: null, error_message: 'Demo provider status', data_origin: 'synthetic' },
    { id: 'source-play', organization_id: 'org-demo', scan_id: 'scan-partial', provider: 'Google Play catalog provider', source_type: 'app', status: 'failed', records_collected: 0, last_successful_retrieval: null, error_message: 'Demo provider status', data_origin: 'synthetic' }
  ],
  candidates: [
    { id: 'candidate-official', organization_id: 'org-demo', source_type: 'social', platform: 'YouTube', external_id: 'UC_ACME_OFFICIAL', name: 'Acme Wallet', normalized_name: 'acme wallet', username: '@AcmeWalletOfficial', description: 'Official Acme Wallet channel.', source_url: 'https://www.youtube.com/@AcmeWalletOfficial', image_url: null, publisher: '', publisher_website: null, rating: null, download_estimate: null, raw_metadata: {}, data_origin: 'synthetic', first_observed_at: timestamp, last_observed_at: timestamp },
    { id: 'candidate-video', organization_id: 'org-demo', source_type: 'social', platform: 'YouTube', external_id: 'UC_ACME_SUPPORT', name: 'Acme Wallet Support', normalized_name: 'acme wallet support', username: '@AcmeWalletSupportNow', description: 'Recover your wallet with our fast verification service. Visit acme-wallet-help.example.', source_url: 'https://www.youtube.com/@AcmeWalletSupportNow', image_url: null, publisher: '', publisher_website: 'https://acme-wallet-help.example', rating: null, download_estimate: null, raw_metadata: { channelId: 'UC_ACME_SUPPORT' }, data_origin: 'synthetic', first_observed_at: timestamp, last_observed_at: timestamp },
    { id: 'candidate-app', organization_id: 'org-demo', source_type: 'app', platform: 'Google Play', external_id: 'com.acme.wallett', name: 'Acme Wallett', normalized_name: 'acme wallett', username: null, description: 'Easy payments, account recovery and rewards for Acme customers.', source_url: 'https://play.google.com/store/apps/details?id=com.acme.wallett', image_url: null, publisher: 'Wallet Forge Studio', publisher_website: 'https://wallet-forge.example', rating: 4.7, download_estimate: 10000, raw_metadata: { packageName: 'com.acme.wallett' }, data_origin: 'synthetic', first_observed_at: timestamp, last_observed_at: timestamp },
    { id: 'candidate-official-app', organization_id: 'org-demo', source_type: 'app', platform: 'Google Play', external_id: 'com.acme.wallet', name: 'Acme Wallet', normalized_name: 'acme wallet', username: null, description: 'Official Acme Wallet application.', source_url: 'https://play.google.com/store/apps/details?id=com.acme.wallet', image_url: null, publisher: 'Acme Wallet Inc.', publisher_website: 'https://acmewallet.example', rating: 4.8, download_estimate: 500000, raw_metadata: { packageName: 'com.acme.wallet' }, data_origin: 'synthetic', first_observed_at: timestamp, last_observed_at: timestamp },
    { id: 'candidate-web-fake', organization_id: 'org-demo', source_type: 'web', platform: 'Web', external_id: 'acmewallett.example', name: 'acmewallett.example', normalized_name: 'acmewallett example', username: null, description: 'Phishing domain attempting to spoof Acme Wallet', source_url: 'https://acmewallett.example', image_url: null, publisher: '', publisher_website: null, rating: null, download_estimate: null, raw_metadata: {}, data_origin: 'synthetic', first_observed_at: timestamp, last_observed_at: timestamp },
    { id: 'candidate-web-official', organization_id: 'org-demo', source_type: 'web', platform: 'Web', external_id: 'acmewallet.example', name: 'acmewallet.example', normalized_name: 'acmewallet example', username: null, description: 'Official domain', source_url: 'https://acmewallet.example', image_url: null, publisher: '', publisher_website: null, rating: null, download_estimate: null, raw_metadata: {}, data_origin: 'synthetic', first_observed_at: timestamp, last_observed_at: timestamp }
  ],
  findings: [
    { id: 'finding-video', organization_id: 'org-demo', brand_id: 'brand-acme', candidate_id: 'candidate-video', scan_id: 'scan-complete', score: 82, severity: 'critical', review_status: 'open', exclusion_status: 'none', exclusion_reason: null, explanation: { heuristic: true, unavailableSignals: ['logo'] }, data_origin: 'synthetic', detected_at: timestamp, last_checked_at: timestamp },
    { id: 'finding-app', organization_id: 'org-demo', brand_id: 'brand-acme', candidate_id: 'candidate-app', scan_id: 'scan-complete', score: 72, severity: 'high', review_status: 'under_review', exclusion_status: 'none', exclusion_reason: null, explanation: { heuristic: true, unavailableSignals: ['logo'] }, data_origin: 'synthetic', detected_at: timestamp, last_checked_at: timestamp },
    { id: 'finding-official', organization_id: 'org-demo', brand_id: 'brand-acme', candidate_id: 'candidate-official-app', scan_id: 'scan-complete', score: 0, severity: 'low', review_status: 'resolved', exclusion_status: 'official_asset', exclusion_reason: 'Exact package identifier matches a verified official asset.', explanation: { heuristic: true }, data_origin: 'synthetic', detected_at: timestamp, last_checked_at: timestamp },
    { id: 'finding-web', organization_id: 'org-demo', brand_id: 'brand-acme', candidate_id: 'candidate-web-fake', scan_id: 'scan-complete', score: 95, severity: 'critical', review_status: 'open', exclusion_status: 'none', exclusion_reason: null, explanation: { heuristic: true, unavailableSignals: ['logo'] }, data_origin: 'synthetic', detected_at: timestamp, last_checked_at: timestamp }
  ],
  evidence: [
    { id: 'evidence-video-name', organization_id: 'org-demo', finding_id: 'finding-video', signal_type: 'name_similarity', signal_value: { original: 'Acme Wallet Support', normalized: 'acme wallet support' }, score: 88, available: true, explanation: 'The display name contains the protected brand name and an added support claim.', provenance: 'Synthetic fixture', created_at: timestamp },
    { id: 'evidence-video-links', organization_id: 'org-demo', finding_id: 'finding-video', signal_type: 'suspicious_link', signal_value: { domain: 'acme-wallet-help.example' }, score: 92, available: true, explanation: 'The profile advertises a domain outside the registered official domain list.', provenance: 'Synthetic fixture', created_at: timestamp },
    { id: 'evidence-app-name', organization_id: 'org-demo', finding_id: 'finding-app', signal_type: 'name_similarity', signal_value: { original: 'Acme Wallett', normalized: 'acme wallett' }, score: 91, available: true, explanation: 'The title differs from the protected name by a single additional character.', provenance: 'Synthetic fixture', created_at: timestamp },
    { id: 'evidence-app-publisher', organization_id: 'org-demo', finding_id: 'finding-app', signal_type: 'publisher_mismatch', signal_value: { publisher: 'Wallet Forge Studio' }, score: 75, available: true, explanation: 'The publisher is not registered as an official or trusted relationship.', provenance: 'Synthetic fixture', created_at: timestamp },
    { id: 'evidence-official', organization_id: 'org-demo', finding_id: 'finding-official', signal_type: 'official_asset_exclusion', signal_value: { packageName: 'com.acme.wallet' }, score: 0, available: true, explanation: 'Exact package identifier matched the verified Google Play asset.', provenance: 'Synthetic fixture', created_at: timestamp },
    { id: 'evidence-web-domain', organization_id: 'org-demo', finding_id: 'finding-web', signal_type: 'name_similarity', signal_value: { original: 'acmewallett.example', normalized: 'acmewallett example' }, score: 95, available: true, explanation: 'The domain differs from the protected domain by a single character (typosquatting).', provenance: 'Synthetic fixture', created_at: timestamp }
  ],
  feedback: [
    { id: 'feedback-app', organization_id: 'org-demo', finding_id: 'finding-app', user_id: 'demo-analyst', previous_status: 'open', new_status: 'under_review', notes: 'Verify publisher identity before confirming.', created_at: '2026-10-09T04:10:00.000Z' }
  ]
}

export function cloneDemoWorkspace(): WorkspaceData {
  return structuredClone(demoWorkspace)
}
