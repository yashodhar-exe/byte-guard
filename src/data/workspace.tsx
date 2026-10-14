import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { cloneDemoWorkspace } from './demo-data'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { AnalystFeedback, Brand, BrandAsset, Candidate, Evidence, Finding, Organization, ReviewStatus, Scan, ScanSource, SourceType, WorkspaceData } from '../lib/types'

type BrandInput = Pick<Brand, 'name' | 'description' | 'website' | 'root_domains' | 'aliases' | 'product_names' | 'keywords' | 'identifiers' | 'region' | 'official_description'>
type AssetInput = Pick<BrandAsset, 'brand_id' | 'asset_type' | 'platform' | 'external_id' | 'url' | 'package_or_bundle_id' | 'store_listing_id' | 'publisher' | 'trust_status' | 'relationship_note'>

interface WorkspaceContextValue extends WorkspaceData {
  isDemo: boolean
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  createBrand: (input: BrandInput) => Promise<Brand>
  createAsset: (input: AssetInput) => Promise<BrandAsset>
  uploadLogo: (brandId: string, file: File) => Promise<void>
  startScan: (brandId: string, mode: 'live' | 'demo', sourceTypes?: SourceType[]) => Promise<void>
  updateFinding: (findingId: string, status: ReviewStatus, notes: string) => Promise<void>
}

const emptyData: WorkspaceData = { organization: null, brands: [], assets: [], scans: [], scanSources: [], candidates: [], findings: [], evidence: [], feedback: [] }
const demoStorageKey = 'bytegaurd-demo-workspace-v2'

function readDemoData() {
  try {
    const stored = localStorage.getItem(demoStorageKey)
    return stored ? JSON.parse(stored) as WorkspaceData : cloneDemoWorkspace()
  } catch {
    return cloneDemoWorkspace()
  }
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function WorkspaceProvider({ children, authenticated }: PropsWithChildren<{ authenticated: boolean }>) {
  const [data, setData] = useState<WorkspaceData>(() => isSupabaseConfigured ? emptyData : readDemoData())
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<string | null>(null)

  const persistDemo = useCallback((next: WorkspaceData) => {
    localStorage.setItem(demoStorageKey, JSON.stringify(next))
    setData(next)
  }, [])

  const refresh = useCallback(async () => {
    if (!supabase || !authenticated) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const [organizationResult, brandsResult, assetsResult, scansResult, sourcesResult, candidatesResult, findingsResult, evidenceResult, feedbackResult] = await Promise.all([
      supabase.from('organizations').select('*').limit(1).maybeSingle(),
      supabase.from('brands').select('*').order('created_at', { ascending: false }),
      supabase.from('brand_assets').select('*').order('created_at', { ascending: false }),
      supabase.from('scans').select('*').order('created_at', { ascending: false }),
      supabase.from('scan_sources').select('*').order('created_at', { ascending: false }),
      supabase.from('candidates').select('*').order('last_observed_at', { ascending: false }),
      supabase.from('findings').select('*').order('detected_at', { ascending: false }),
      supabase.from('finding_evidence').select('*').order('created_at', { ascending: false }),
      supabase.from('analyst_feedback').select('*').order('created_at', { ascending: false })
    ])
    const result = [organizationResult, brandsResult, assetsResult, scansResult, sourcesResult, candidatesResult, findingsResult, evidenceResult, feedbackResult].find((item) => item.error)
    if (result?.error) {
      setError(result.error.message)
      setLoading(false)
      return
    }
    setData({
      organization: organizationResult.data as Organization | null,
      brands: (brandsResult.data ?? []) as Brand[],
      assets: (assetsResult.data ?? []) as BrandAsset[],
      scans: (scansResult.data ?? []) as Scan[],
      scanSources: (sourcesResult.data ?? []) as ScanSource[],
      candidates: (candidatesResult.data ?? []) as Candidate[],
      findings: (findingsResult.data ?? []) as Finding[],
      evidence: (evidenceResult.data ?? []) as Evidence[],
      feedback: (feedbackResult.data ?? []) as AnalystFeedback[]
    })
    setLoading(false)
  }, [authenticated])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const organizationId = data.organization?.id
  const hasActiveScan = data.scans.some((scan) => scan.status === 'queued' || scan.status === 'running')

  useEffect(() => {
    if (!supabase || !authenticated || !organizationId) return
    const client = supabase
    const channel = client
      .channel(`workspace-${organizationId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scans', filter: `organization_id=eq.${organizationId}` }, () => { void refresh() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scan_sources', filter: `organization_id=eq.${organizationId}` }, () => { void refresh() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'candidates', filter: `organization_id=eq.${organizationId}` }, () => { void refresh() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'findings', filter: `organization_id=eq.${organizationId}` }, () => { void refresh() })
      .subscribe()
    const poll = window.setInterval(() => {
      if (hasActiveScan) void refresh()
    }, 2500)
    return () => { window.clearInterval(poll); void client.removeChannel(channel) }
  }, [authenticated, hasActiveScan, organizationId, refresh])

  const createBrand = useCallback(async (input: BrandInput) => {
    if (!organizationId) throw new Error('No organization is available for this account.')
    if (!supabase) {
      const brand: Brand = { id: crypto.randomUUID(), organization_id: organizationId, logo_path: null, created_at: new Date().toISOString(), ...input }
      persistDemo({ ...data, brands: [brand, ...data.brands] })
      return brand
    }
    const { data: created, error: insertError } = await supabase.from('brands').insert({ ...input, organization_id: organizationId }).select().single()
    if (insertError) throw insertError
    await refresh()
    return created as Brand
  }, [data, organizationId, persistDemo, refresh])

  const createAsset = useCallback(async (input: AssetInput) => {
    if (!organizationId) throw new Error('No organization is available for this account.')
    if (!supabase) {
      const asset: BrandAsset = { id: crypto.randomUUID(), organization_id: organizationId, verified_at: input.trust_status === 'verified' ? new Date().toISOString() : null, created_at: new Date().toISOString(), ...input }
      persistDemo({ ...data, assets: [asset, ...data.assets] })
      return asset
    }
    const { data: created, error: insertError } = await supabase.from('brand_assets').insert({ ...input, organization_id: organizationId, verified_at: input.trust_status === 'verified' ? new Date().toISOString() : null }).select().single()
    if (insertError) throw insertError
    await refresh()
    return created as BrandAsset
  }, [data, organizationId, persistDemo, refresh])

  const uploadLogo = useCallback(async (brandId: string, file: File) => {
    if (!organizationId || !supabase) throw new Error('Logo uploads require a configured Supabase project.')
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5_242_880) throw new Error('Use a PNG, JPEG, or WebP image smaller than 5 MB.')
    const extension = file.name.split('.').pop()?.toLowerCase() || 'png'
    const path = `${organizationId}/${brandId}/logo.${extension}`
    const { error: uploadError } = await supabase.storage.from('brand-logos').upload(path, file, { upsert: true, contentType: file.type })
    if (uploadError) throw uploadError
    const { error: updateError } = await supabase.from('brands').update({ logo_path: path }).eq('id', brandId)
    if (updateError) throw updateError
    await refresh()
  }, [organizationId, refresh])

  const startScan = useCallback(async (brandId: string, mode: 'live' | 'demo', sourceTypes?: SourceType[]) => {
    if (!organizationId) throw new Error('No organization is available for this account.')
    if (supabase && mode === 'live') {
      const { error: invokeError } = await supabase.functions.invoke('scan-brand', { body: { brandId, sourceTypes } })
      if (invokeError) throw invokeError
      await refresh()
      return
    }
    const scan: Scan = { id: crypto.randomUUID(), organization_id: organizationId, brand_id: brandId, status: 'completed', mode: 'demo', started_at: new Date().toISOString(), completed_at: new Date().toISOString(), summary: { candidates: data.candidates.length, findings: data.findings.filter((finding) => finding.exclusion_status === 'none').length }, created_at: new Date().toISOString() }
    const source: ScanSource = { id: crypto.randomUUID(), organization_id: organizationId, scan_id: scan.id, provider: 'Demo fixture', source_type: 'social', status: 'completed', records_collected: data.candidates.length, last_successful_retrieval: scan.completed_at, error_message: null, data_origin: 'synthetic' }
    persistDemo({ ...data, scans: [scan, ...data.scans], scanSources: [source, ...data.scanSources] })
  }, [data, organizationId, persistDemo, refresh])

  const updateFinding = useCallback(async (findingId: string, status: ReviewStatus, notes: string) => {
    const finding = data.findings.find((item) => item.id === findingId)
    if (!finding || !organizationId) throw new Error('Finding was not found.')
    if (!supabase) {
      const feedback: AnalystFeedback = { id: crypto.randomUUID(), organization_id: organizationId, finding_id: findingId, user_id: 'demo-analyst', previous_status: finding.review_status, new_status: status, notes, created_at: new Date().toISOString() }
      persistDemo({ ...data, findings: data.findings.map((item) => item.id === findingId ? { ...item, review_status: status, last_checked_at: new Date().toISOString() } : item), feedback: [feedback, ...data.feedback] })
      return
    }
    const { data: sessionData } = await supabase.auth.getUser()
    if (!sessionData.user) throw new Error('Your session has expired.')
    const { error: updateError } = await supabase.from('findings').update({ review_status: status }).eq('id', findingId)
    if (updateError) throw updateError
    const { error: feedbackError } = await supabase.from('analyst_feedback').insert({ organization_id: organizationId, finding_id: findingId, user_id: sessionData.user.id, previous_status: finding.review_status, new_status: status, notes })
    if (feedbackError) throw feedbackError
    await refresh()
  }, [data, organizationId, persistDemo, refresh])

  const value = useMemo(() => ({ ...data, isDemo: !isSupabaseConfigured, loading, error, refresh, createBrand, createAsset, uploadLogo, startScan, updateFinding }), [data, loading, error, refresh, createBrand, createAsset, uploadLogo, startScan, updateFinding])
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (!context) throw new Error('useWorkspace must be used inside WorkspaceProvider.')
  return context
}
