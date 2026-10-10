export type SourceType = 'social' | 'app' | 'web'
export type DataOrigin = 'live' | 'synthetic'
export type Severity = 'low' | 'medium' | 'high' | 'critical'
export type ReviewStatus = 'open' | 'under_review' | 'confirmed_threat' | 'false_positive' | 'resolved'
export type ExclusionStatus = 'none' | 'official_asset' | 'trusted_relationship'
export type TrustStatus = 'verified' | 'pending' | 'inactive'
export type ScanStatus = 'queued' | 'running' | 'completed' | 'partial' | 'failed'

export interface Organization {
  id: string
  name: string
  created_by?: string
}

export interface Brand {
  id: string
  organization_id: string
  name: string
  description: string
  website: string | null
  root_domains: string[]
  aliases: string[]
  product_names: string[]
  keywords: string[]
  identifiers: string[]
  logo_path: string | null
  region: string | null
  official_description: string
  created_at: string
}

export interface BrandAsset {
  id: string
  organization_id: string
  brand_id: string
  asset_type: 'social_profile' | 'app_listing' | 'domain' | 'trusted_link' | 'publisher_relationship'
  platform: string
  external_id: string
  url: string | null
  package_or_bundle_id: string
  store_listing_id: string
  publisher: string
  trust_status: TrustStatus
  verified_at: string | null
  relationship_note: string
  created_at: string
}

export interface Scan {
  id: string
  organization_id: string
  brand_id: string
  status: ScanStatus
  mode: 'live' | 'demo'
  started_at: string | null
  completed_at: string | null
  summary: Record<string, unknown>
  created_at: string
}

export interface ScanSource {
  id: string
  organization_id: string
  scan_id: string
  provider: string
  source_type: SourceType
  status: 'pending' | 'running' | 'completed' | 'unavailable' | 'rate_limited' | 'failed'
  records_collected: number
  last_successful_retrieval: string | null
  error_message: string | null
  data_origin: DataOrigin
}

export interface Candidate {
  id: string
  organization_id: string
  source_type: SourceType
  platform: string
  external_id: string
  name: string
  normalized_name: string
  username: string | null
  description: string
  source_url: string | null
  image_url: string | null
  publisher: string
  publisher_website: string | null
  rating: number | null
  download_estimate: number | null
  raw_metadata: Record<string, unknown>
  data_origin: DataOrigin
  first_observed_at: string
  last_observed_at: string
}

export interface Evidence {
  id: string
  organization_id: string
  finding_id: string
  signal_type: string
  signal_value: Record<string, unknown>
  score: number | null
  available: boolean
  explanation: string
  provenance: string
  created_at: string
}

export interface Finding {
  id: string
  organization_id: string
  brand_id: string
  candidate_id: string
  scan_id: string | null
  score: number
  severity: Severity
  review_status: ReviewStatus
  exclusion_status: ExclusionStatus
  exclusion_reason: string | null
  explanation: Record<string, unknown>
  data_origin: DataOrigin
  detected_at: string
  last_checked_at: string
}

export interface AnalystFeedback {
  id: string
  organization_id: string
  finding_id: string
  user_id: string
  previous_status: ReviewStatus | null
  new_status: ReviewStatus
  notes: string
  created_at: string
}

export interface WorkspaceData {
  organization: Organization | null
  brands: Brand[]
  assets: BrandAsset[]
  scans: Scan[]
  scanSources: ScanSource[]
  candidates: Candidate[]
  findings: Finding[]
  evidence: Evidence[]
  feedback: AnalystFeedback[]
}
