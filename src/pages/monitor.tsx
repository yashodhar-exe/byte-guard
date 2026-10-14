import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw, Search, ShieldCheck } from 'lucide-react'
import { useWorkspace } from '../data/workspace'
import { Button, Card, EmptyState, ExternalLink, Input, OriginBadge, PageHeading, Select, SeverityBadge, StatusBadge } from '../components/ui'
import type { SourceType } from '../lib/types'

type ScanMessage = { tone: 'error' | 'success'; text: string } | null

function observedUrl(candidate: { raw_metadata: Record<string, unknown> }) {
  const value = candidate.raw_metadata.observedUrl
  return typeof value === 'string' && value.length ? value : null
}

export function MonitorPage({ sourceType }: { sourceType: SourceType }) {
  const { candidates, findings, brands, scans, startScan, isDemo } = useWorkspace()
  const [query, setQuery] = useState('')
  const [platform, setPlatform] = useState('all')
  const [sort, setSort] = useState<'risk' | 'recent' | 'name'>('risk')
  const [brandId, setBrandId] = useState('')
  const [isStarting, setIsStarting] = useState(false)
  const [scanMessage, setScanMessage] = useState<ScanMessage>(null)

  useEffect(() => {
    if (!brandId && brands[0]) setBrandId(brands[0].id)
    if (brandId && !brands.some((brand) => brand.id === brandId)) setBrandId(brands[0]?.id ?? '')
  }, [brandId, brands])

  const sourceCandidates = useMemo(() => candidates.filter((candidate) => candidate.source_type === sourceType), [candidates, sourceType])
  const platforms = useMemo(() => [...new Set(sourceCandidates.map((candidate) => candidate.platform))].sort(), [sourceCandidates])
  const visibleCandidates = useMemo(() => sourceCandidates.filter((candidate) => {
    const value = `${candidate.name} ${candidate.username ?? ''} ${candidate.description} ${candidate.publisher}`.toLocaleLowerCase()
    return value.includes(query.toLocaleLowerCase()) && (platform === 'all' || candidate.platform === platform)
  }).sort((first, second) => {
    const firstFinding = findings.find((finding) => finding.candidate_id === first.id)
    const secondFinding = findings.find((finding) => finding.candidate_id === second.id)
    if (sort === 'name') return first.name.localeCompare(second.name)
    if (sort === 'recent') return Date.parse(second.last_observed_at) - Date.parse(first.last_observed_at)
    return (secondFinding?.score ?? -1) - (firstFinding?.score ?? -1)
  }), [sourceCandidates, query, platform, sort, findings])

  const hasActiveScan = scans.some((scan) => scan.brand_id === brandId && (scan.status === 'queued' || scan.status === 'running'))
  const title = sourceType === 'social' ? 'Social media monitor' : sourceType === 'app' ? 'App-store monitor' : 'Web risk monitor'
  const description = sourceType === 'social'
    ? 'Find public social profiles and recent authors whose names or handles resemble a protected brand. Results are candidates for analyst review, not assertions of impersonation.'
    : sourceType === 'app'
      ? 'Review app store candidates whose names, publishers, or listing details resemble a protected brand. Similarity is evidence for review, not proof of fraud.'
      : 'Find brand-term matches in public phishing feeds and historical domain observations. Results are passive intelligence and must be reviewed before action.'
  const actionLabel = sourceType === 'social' ? 'Run social scan' : sourceType === 'app' ? 'Run app scan' : 'Run web scan'

  async function runScan() {
    if (!brandId || isStarting || hasActiveScan) return
    setIsStarting(true)
    setScanMessage(null)
    try {
      await startScan(brandId, isDemo ? 'demo' : 'live', [sourceType])
      setScanMessage({ tone: 'success', text: isDemo ? 'Demo candidates refreshed.' : 'Scan complete. Newly collected candidates are shown below.' })
    } catch (error) {
      setScanMessage({ tone: 'error', text: error instanceof Error ? error.message : 'The scan could not be started.' })
    } finally {
      setIsStarting(false)
    }
  }

  return <div className="grid gap-7">
    <PageHeading eyebrow="Candidate intelligence" title={title} description={description} />

    <Card className="grid gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <label className="flex-1 grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
          <span>Protected brand</span>
          <Select value={brandId} onChange={(event) => setBrandId(event.target.value)} aria-label="Select brand to scan" disabled={!brands.length || isStarting || hasActiveScan}>
            {!brands.length && <option value="">No brands available</option>}
            {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
          </Select>
        </label>
        <Button onClick={() => void runScan()} disabled={!brandId || isStarting || hasActiveScan} className="min-w-42">
          <RefreshCw size={16} className={isStarting || hasActiveScan ? 'animate-spin' : ''} />
          {isStarting || hasActiveScan ? 'Scanning…' : actionLabel}
        </Button>
      </div>
      {scanMessage && (
        <div className="border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
          <span className={scanMessage.tone === 'error' ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'}>{scanMessage.text}</span>
        </div>
      )}
    </Card>

    <Card className="p-4"><div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
      <div className="relative"><Search className="pointer-events-none absolute left-3 top-3 text-slate-400" size={16} /><Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search names, handles, publishers, or descriptions" /></div>
      <Select value={platform} onChange={(event) => setPlatform(event.target.value)} aria-label="Filter platform"><option value="all">All platforms</option>{platforms.map((item) => <option key={item} value={item}>{item}</option>)}</Select>
      <Select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} aria-label="Sort candidates"><option value="risk">Sort: risk score</option><option value="recent">Sort: last observed</option><option value="name">Sort: name</option></Select>
    </div></Card>

    {visibleCandidates.length ? <Card className="overflow-x-auto p-0"><table className="w-full min-w-[940px] text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900"><tr><th className="px-5 py-3 font-semibold">Candidate</th><th className="px-4 py-3 font-semibold">Source</th><th className="px-4 py-3 font-semibold">Similarity & evidence</th><th className="px-4 py-3 font-semibold">Risk</th><th className="px-5 py-3 font-semibold">Status</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{visibleCandidates.map((candidate) => {
      const finding = findings.find((item) => item.candidate_id === candidate.id)
      const brand = brands.find((item) => item.id === finding?.brand_id)
      const reportUrl = observedUrl(candidate)
      return <tr key={candidate.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-slate-100 font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{candidate.name.slice(0, 1).toUpperCase()}</span><div className="min-w-0"><p className="font-semibold text-slate-900 dark:text-slate-100">{candidate.name}</p><p className="truncate text-xs text-slate-500">{candidate.username || candidate.publisher || candidate.external_id}</p></div></div></td><td className="px-4 py-4"><p className="font-medium text-slate-700 dark:text-slate-300">{candidate.platform}</p><OriginBadge origin={candidate.data_origin} /></td><td className="max-w-96 px-4 py-4"><p className="line-clamp-2 text-slate-600 dark:text-slate-400">{candidate.description || 'No description returned by this source.'}</p>{reportUrl && <p className="mt-1 truncate text-xs text-slate-500" title={reportUrl}>Reported URL captured — not opened automatically</p>}{candidate.source_url && ['Bluesky', 'Instagram'].includes(candidate.platform) && <ExternalLink href={candidate.source_url}>Open public profile</ExternalLink>}{brand && <p className="mt-1 text-xs text-slate-500">Compared with {brand.name}</p>}</td><td className="px-4 py-4">{finding ? <div className="flex items-center gap-2"><SeverityBadge severity={finding.severity} /><span className="font-semibold text-slate-800 dark:text-slate-200">{Math.round(finding.score)}</span></div> : <span className="text-slate-500">No finding</span>}</td><td className="px-5 py-4">{finding ? <Link className="inline-flex items-center gap-2 rounded-sm text-sm font-medium text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white" to={`/findings/${finding.id}`}>{finding.exclusion_status === 'none' ? <StatusBadge status={finding.review_status} /> : <><ShieldCheck size={15} className="text-slate-700 dark:text-slate-300" /><StatusBadge status={finding.exclusion_status} /></>}</Link> : <span className="text-slate-500">Not assessed</span>}</td></tr>
    })}</tbody></table></Card> : <EmptyState title="No candidates match these filters" description={brands.length ? 'Run a scan for a protected brand to collect current candidates, or adjust the filters.' : 'Add a protected brand first, then run a scan to collect current candidates.'} />}
  </div>
}
