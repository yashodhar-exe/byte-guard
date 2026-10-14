import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { Activity, AlertTriangle, AppWindow, ArrowRight, CheckCircle2, CircleAlert, Clock3, Plus, ScanSearch, UsersRound } from 'lucide-react'
import { useWorkspace } from '../data/workspace'
import { Button, Card, EmptyState, OriginBadge, PageHeading, SeverityBadge, StatusBadge } from '../components/ui'
import { formatNumber } from '../lib/utils'

function Metric({ label, value, detail, icon: Icon }: { label: string; value: number; detail: string; icon: typeof UsersRound }) {
  return <Card className="p-4"><div className="flex items-start justify-between"><div><p className="text-sm text-slate-600 dark:text-slate-400">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">{formatNumber(value)}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div><span className="grid h-9 w-9 place-items-center rounded-sm bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><Icon size={18} /></span></div></Card>
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { brands, candidates, findings, scans, scanSources, startScan, isDemo } = useWorkspace()
  const [scanError, setScanError] = useState<string | null>(null)
  const activeFindings = findings.filter((finding) => finding.exclusion_status === 'none' && (finding.score >= 45 || finding.review_status === 'under_review' || finding.review_status === 'confirmed_threat'))
  const completed = scans.filter((scan) => scan.status === 'completed').length
  const partial = scans.filter((scan) => scan.status === 'partial').length
  const failed = scans.filter((scan) => scan.status === 'failed').length
  const running = scans.filter((scan) => scan.status === 'running' || scan.status === 'queued').length
  const distribution = useMemo(() => ['critical', 'high', 'medium', 'low'].map((severity) => ({ severity, count: activeFindings.filter((finding) => finding.severity === severity).length })), [activeFindings])
  const highestDistribution = Math.max(1, ...distribution.map((item) => item.count))
  const recentFindings = [...activeFindings].sort((a, b) => Date.parse(b.detected_at) - Date.parse(a.detected_at)).slice(0, 5)
  const recentScans = [...scans].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, 5)
  const providerHealth = Object.values(scanSources.reduce<Record<string, typeof scanSources[number]>>((collection, source) => {
    const current = collection[source.provider]
    if (!current || Date.parse(source.last_successful_retrieval ?? '1970-01-01') < Date.parse(current.last_successful_retrieval ?? '1970-01-01')) collection[source.provider] = source
    return collection
  }, {}))

  async function handleScan() {
    if (!brands[0]) {
      navigate('/brands')
      return
    }
    setScanError(null)
    try {
      await startScan(brands[0].id, isDemo ? 'demo' : 'live')
    } catch (error) {
      setScanError(error instanceof Error ? error.message : 'The scan could not start.')
    }
  }

  return <div className="grid gap-7"><PageHeading eyebrow="Workspace overview" title="Risk posture at a glance" description="Metrics are calculated from stored brands, candidates, scans, and findings." action={<div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => navigate('/brands')}><Plus size={16} /> Add brand</Button><Button onClick={() => void handleScan()}><ScanSearch size={16} /> {brands.length ? `Start ${isDemo ? 'demo' : 'live'} scan` : 'Add a brand'}</Button></div>} />{scanError && <p className="rounded-sm border border-slate-300 bg-slate-50 p-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">{scanError}</p>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><Metric label="Monitored brands" value={brands.length} detail="Registered for monitoring" icon={UsersRound} /><Metric label="Social candidates" value={candidates.filter((candidate) => candidate.source_type === 'social').length} detail="Observed records" icon={Activity} /><Metric label="App candidates" value={candidates.filter((candidate) => candidate.source_type === 'app').length} detail="Observed records" icon={AppWindow} /><Metric label="Open high risk" value={activeFindings.filter((finding) => ['high', 'critical'].includes(finding.severity) && ['open', 'under_review'].includes(finding.review_status)).length} detail="Needs analyst action" icon={AlertTriangle} /><Metric label="Critical findings" value={activeFindings.filter((finding) => finding.severity === 'critical').length} detail="Heuristic severity" icon={CircleAlert} /></div>
    <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]"><Card><div className="flex items-center justify-between"><div><h2 className="font-semibold text-slate-950 dark:text-white">Recent findings</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Official assets are excluded from this active queue.</p></div><Link to="/findings" className="inline-flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white">View all <ArrowRight size={15} /></Link></div>{recentFindings.length ? <div className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">{recentFindings.map((finding) => { const candidate = candidates.find((item) => item.id === finding.candidate_id); const brand = brands.find((item) => item.id === finding.brand_id); return <Link key={finding.id} to={`/findings/${finding.id}`} className="flex items-center justify-between gap-3 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/50"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{candidate?.name ?? 'Unknown candidate'}</p><p className="mt-0.5 truncate text-xs text-slate-500">{brand?.name} · {candidate?.platform}</p></div><div className="flex shrink-0 items-center gap-2"><OriginBadge origin={finding.data_origin} /><SeverityBadge severity={finding.severity} /><span className="w-7 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">{Math.round(finding.score)}</span></div></Link> })}</div> : <EmptyState title="No active findings" description="Start a scan after adding a monitored brand." />}</Card>
      <Card><h2 className="font-semibold text-slate-950 dark:text-white">Risk distribution</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Active heuristic findings by severity.</p><div className="mt-6 grid gap-4">{distribution.map((item) => <div key={item.severity}><div className="mb-1.5 flex justify-between text-sm"><span className="capitalize text-slate-600 dark:text-slate-300">{item.severity}</span><span className="font-semibold text-slate-900 dark:text-white">{item.count}</span></div><div className="h-2 overflow-hidden rounded-none bg-slate-100 dark:bg-slate-800"><div className={item.severity === 'critical' ? 'h-full bg-rose-600' : item.severity === 'high' ? 'h-full bg-amber-500' : item.severity === 'medium' ? 'h-full bg-amber-300' : 'h-full bg-slate-300 dark:bg-slate-600'} style={{ width: `${item.count / highestDistribution * 100}%` }} /></div></div>)}</div></Card></div>
    <div className="grid gap-5"><Card><h2 className="font-semibold text-slate-950 dark:text-white">Scan activity</h2><div className="mt-4 grid grid-cols-2 gap-3"><ScanSummary label="Completed" value={completed} icon={<CheckCircle2 size={16} />} color="text-slate-700 dark:text-slate-300" /><ScanSummary label="Partial" value={partial} icon={<Clock3 size={16} />} color="text-slate-700 dark:text-slate-300" /><ScanSummary label="Failed" value={failed} icon={<AlertTriangle size={16} />} color="text-slate-700 dark:text-slate-300" /><ScanSummary label="Running" value={running} icon={<Activity size={16} />} color="text-slate-700 dark:text-slate-300" /></div><div className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">{recentScans.map((scan) => <div key={scan.id} className="flex items-center justify-between py-2.5"><div><p className="text-sm font-medium text-slate-800 dark:text-slate-200">{brands.find((brand) => brand.id === scan.brand_id)?.name ?? 'Removed brand'}</p><p className="text-xs text-slate-500">{formatDistanceToNow(new Date(scan.created_at), { addSuffix: true })}</p></div><div className="flex items-center gap-2"><OriginBadge origin={scan.mode === 'demo' ? 'synthetic' : 'live'} /><StatusBadge status={scan.status} /></div></div>)}</div></Card></div>
  </div>
}

function ScanSummary({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return <div className="rounded-sm bg-slate-50 p-3 dark:bg-slate-800/60"><span className={color}>{icon}</span><p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{value}</p><p className="text-xs text-slate-500">{label}</p></div>
}
