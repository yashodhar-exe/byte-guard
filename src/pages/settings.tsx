import { useState, useEffect } from 'react'
import {
  Bell,
  Building2,
  CheckCircle2,
  Download,
  Globe,
  Lock,
  ShieldCheck,
  Sliders,
  Smartphone,
  Sparkles
} from 'lucide-react'
import { useWorkspace } from '../data/workspace'
import { Button, Card, Field, Input, PageHeading, Select, StatusBadge } from '../components/ui'

interface SettingsState {
  orgName: string
  contactEmail: string
  region: string
  autoScan: boolean
  sensitivity: 'standard' | 'high'
  monitorSocial: boolean
  monitorApps: boolean
  monitorWeb: boolean
  autoTriage: boolean
  notifyCritical: boolean
  notifyWeekly: boolean
  alertEmail: string
  webhookUrl: string
}

const defaultSettings: SettingsState = {
  orgName: '',
  contactEmail: 'security@byteguard.internal',
  region: 'Asia-Pacific (India)',
  autoScan: true,
  sensitivity: 'standard',
  monitorSocial: true,
  monitorApps: true,
  monitorWeb: true,
  autoTriage: true,
  notifyCritical: true,
  notifyWeekly: true,
  alertEmail: 'alerts@byteguard.internal',
  webhookUrl: ''
}

const STORAGE_KEY = 'byteguard_platform_settings'

export function SettingsPage() {
  const { organization, brands, findings } = useWorkspace()
  const [settings, setSettings] = useState<SettingsState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return { ...defaultSettings, ...JSON.parse(saved) }
    } catch {
      // fallback
    }
    return {
      ...defaultSettings,
      orgName: organization?.name ?? 'Byte Guard Workspace'
    }
  })

  useEffect(() => {
    if (organization?.name && !localStorage.getItem(STORAGE_KEY)) {
      setSettings(prev => ({ ...prev, orgName: organization.name }))
    }
  }, [organization?.name])

  const [savedSuccess, setSavedSuccess] = useState(false)

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 3000)
  }

  const handleExportData = () => {
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      organization: settings.orgName,
      brandsCount: brands.length,
      findingsCount: findings.length,
      brands: brands.map(b => ({
        name: b.name,
        domains: b.root_domains,
        aliases: b.aliases,
        region: b.region
      })),
      findings: findings.map(f => ({
        id: f.id,
        severity: f.severity,
        status: f.review_status,
        detectedAt: f.detected_at
      }))
    }
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `byteguard-audit-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="grid gap-7">
      <PageHeading
        eyebrow="Configuration"
        title="Settings & Preferences"
        description="Configure workspace details, automated threat monitoring rules, alert channels, and data protection policies."
        action={
          <div className="flex items-center gap-3">
            {savedSuccess && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={16} /> Saved
              </span>
            )}
            <Button variant="primary" onClick={handleSave}>
              Save changes
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Workspace Organization Profile */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-sm bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                <Building2 size={20} />
              </span>
              <div>
                <h2 className="font-semibold text-slate-950 dark:text-white">Workspace Profile</h2>
                <p className="mt-0.5 text-xs text-slate-500">Identity and organization information</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              <Field label="Organization Name">
                <Input
                  value={settings.orgName}
                  onChange={(e) => setSettings({ ...settings, orgName: e.target.value })}
                  placeholder="e.g. Acme Security Group"
                />
              </Field>

              <Field label="Primary Security Contact">
                <Input
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                  placeholder="security@yourcompany.com"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Compliance Region">
                  <Select
                    value={settings.region}
                    onChange={(e) => setSettings({ ...settings, region: e.target.value })}
                  >
                    <option value="Asia-Pacific (India)">Asia-Pacific (India)</option>
                    <option value="North America (US-East)">North America (US-East)</option>
                    <option value="Europe (EU-Central)">Europe (EU-Central)</option>
                    <option value="Global">Global</option>
                  </Select>
                </Field>

                <Field label="Protection Tier">
                  <div className="flex h-10 items-center justify-between rounded-sm border border-slate-300 bg-slate-50 px-3 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    <span>Enterprise DRP</span>
                    <StatusBadge status="verified" />
                  </div>
                </Field>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800">
            <span>{brands.length} brand{brands.length === 1 ? '' : 's'} registered under this workspace</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">Active protection</span>
          </div>
        </Card>

        {/* Risk Monitoring Policies */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-sm bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                <Sliders size={20} />
              </span>
              <div>
                <h2 className="font-semibold text-slate-950 dark:text-white">Monitoring Preferences</h2>
                <p className="mt-0.5 text-xs text-slate-500">Automated scan rules and detection thresholds</p>
              </div>
            </div>

            <div className="mt-5 space-y-3.5">
              <label className="flex cursor-pointer items-start justify-between gap-3 rounded-sm border border-slate-200 p-3 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Scheduled Daily Scans</p>
                  <p className="text-xs text-slate-500">Run continuous daily background scans across all protected assets.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoScan}
                  onChange={(e) => setSettings({ ...settings, autoScan: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded accent-slate-900 dark:accent-slate-100"
                />
              </label>

              <label className="flex cursor-pointer items-start justify-between gap-3 rounded-sm border border-slate-200 p-3 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Automated Triage</p>
                  <p className="text-xs text-slate-500">Automatically flag high-confidence similarity findings for review.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoTriage}
                  onChange={(e) => setSettings({ ...settings, autoTriage: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded accent-slate-900 dark:accent-slate-100"
                />
              </label>

              <Field label="Detection Sensitivity">
                <Select
                  value={settings.sensitivity}
                  onChange={(e) => setSettings({ ...settings, sensitivity: e.target.value as 'standard' | 'high' })}
                >
                  <option value="standard">Standard (Recommended - high precision, low false positives)</option>
                  <option value="high">High Sensitivity (Aggressive phonetic & fuzzy brand matching)</option>
                </Select>
              </Field>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800">
            <span>Detection heuristics adapt to official brand assets in real-time.</span>
          </div>
        </Card>
      </div>

      {/* Detection Channels Card */}
      <Card>
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-sm bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
            <ShieldCheck size={20} />
          </span>
          <div>
            <h2 className="font-semibold text-slate-950 dark:text-white">Active Discovery Channels</h2>
            <p className="mt-0.5 text-xs text-slate-500">Select external discovery vectors monitored for brand impersonation</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <label className="flex cursor-pointer flex-col justify-between rounded-sm border border-slate-200 p-4 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60">
            <div className="flex items-start justify-between">
              <span className="grid h-8 w-8 place-items-center rounded-sm bg-slate-100 dark:bg-slate-800">
                <Globe size={16} />
              </span>
              <input
                type="checkbox"
                checked={settings.monitorWeb}
                onChange={(e) => setSettings({ ...settings, monitorWeb: e.target.checked })}
                className="h-4 w-4 rounded accent-slate-900 dark:accent-slate-100"
              />
            </div>
            <div className="mt-3">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Web & Domains</p>
              <p className="mt-1 text-xs text-slate-500">Typosquatting, look-alike domains, and phishing infrastructure.</p>
            </div>
          </label>

          <label className="flex cursor-pointer flex-col justify-between rounded-sm border border-slate-200 p-4 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60">
            <div className="flex items-start justify-between">
              <span className="grid h-8 w-8 place-items-center rounded-sm bg-slate-100 dark:bg-slate-800">
                <Smartphone size={16} />
              </span>
              <input
                type="checkbox"
                checked={settings.monitorApps}
                onChange={(e) => setSettings({ ...settings, monitorApps: e.target.checked })}
                className="h-4 w-4 rounded accent-slate-900 dark:accent-slate-100"
              />
            </div>
            <div className="mt-3">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">App Stores</p>
              <p className="mt-1 text-xs text-slate-500">Rogue packages, fake developer publishers, and copycat apps.</p>
            </div>
          </label>

          <label className="flex cursor-pointer flex-col justify-between rounded-sm border border-slate-200 p-4 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60">
            <div className="flex items-start justify-between">
              <span className="grid h-8 w-8 place-items-center rounded-sm bg-slate-100 dark:bg-slate-800">
                <Sparkles size={16} />
              </span>
              <input
                type="checkbox"
                checked={settings.monitorSocial}
                onChange={(e) => setSettings({ ...settings, monitorSocial: e.target.checked })}
                className="h-4 w-4 rounded accent-slate-900 dark:accent-slate-100"
              />
            </div>
            <div className="mt-3">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Social Networks</p>
              <p className="mt-1 text-xs text-slate-500">Impersonation profiles, handle squatting, and fraudulent support accounts.</p>
            </div>
          </label>
        </div>
      </Card>

      {/* Alert Notifications Card */}
      <Card>
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-sm bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
            <Bell size={20} />
          </span>
          <div>
            <h2 className="font-semibold text-slate-950 dark:text-white">Alerts & Notifications</h2>
            <p className="mt-0.5 text-xs text-slate-500">Incident notifications and dispatch destinations</p>
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="space-y-3.5">
            <label className="flex cursor-pointer items-start justify-between gap-3 rounded-sm border border-slate-200 p-3 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Immediate High & Critical Alerts</p>
                <p className="text-xs text-slate-500">Trigger email notification instantly when severe impersonation is detected.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifyCritical}
                onChange={(e) => setSettings({ ...settings, notifyCritical: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded accent-slate-900 dark:accent-slate-100"
              />
            </label>

            <label className="flex cursor-pointer items-start justify-between gap-3 rounded-sm border border-slate-200 p-3 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Weekly Intelligence Digest</p>
                <p className="text-xs text-slate-500">Summary of new observations, resolved incidents, and risk score trajectory.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifyWeekly}
                onChange={(e) => setSettings({ ...settings, notifyWeekly: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded accent-slate-900 dark:accent-slate-100"
              />
            </label>
          </div>

          <div className="space-y-4">
            <Field label="Security Alert Recipient Email">
              <Input
                type="email"
                value={settings.alertEmail}
                onChange={(e) => setSettings({ ...settings, alertEmail: e.target.value })}
                placeholder="soc-team@yourcompany.com"
              />
            </Field>

            <Field label="SIEM / Webhook URL (Optional)">
              <Input
                type="url"
                value={settings.webhookUrl}
                onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
                placeholder="https://hooks.slack.com/services/... or SIEM endpoint"
              />
            </Field>
          </div>
        </div>
      </Card>

      {/* Security & Safeguards Card */}
      <Card>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-sm bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
              <Lock size={20} />
            </span>
            <div>
              <h2 className="font-semibold text-slate-950 dark:text-white">Security & Audit Compliance</h2>
              <p className="mt-0.5 text-xs text-slate-500">Defensive integrity, safe passive scanning, and data export</p>
            </div>
          </div>

          <Button variant="secondary" onClick={handleExportData} className="gap-2">
            <Download size={15} /> Export Audit Log
          </Button>
        </div>

        <div className="mt-5 grid gap-3 text-xs sm:grid-cols-2">
          <div className="rounded-sm border border-slate-200 p-3.5 dark:border-slate-800">
            <p className="font-medium text-slate-900 dark:text-slate-100">Passive Intelligence Only</p>
            <p className="mt-1 text-slate-500">
              Scans operate strictly against public registries, app store catalogs, and telemetry feeds. Byte Guard never performs invasive network port scans or unauthorized probing.
            </p>
          </div>

          <div className="rounded-sm border border-slate-200 p-3.5 dark:border-slate-800">
            <p className="font-medium text-slate-900 dark:text-slate-100">Official Asset Precedence</p>
            <p className="mt-1 text-slate-500">
              Verified corporate domains, package identifiers, and official social accounts are automatically exempted to prevent false positives and analyst alert fatigue.
            </p>
          </div>

          <div className="rounded-sm border border-slate-200 p-3.5 dark:border-slate-800">
            <p className="font-medium text-slate-900 dark:text-slate-100">No Automated Harm or Takedowns</p>
            <p className="mt-1 text-slate-500">
              Triage findings require human analyst review. Automated actions are strictly observational; no outbound abuse reports or takedowns are dispatched without confirmation.
            </p>
          </div>

          <div className="rounded-sm border border-slate-200 p-3.5 dark:border-slate-800">
            <p className="font-medium text-slate-900 dark:text-slate-100">Immutable Audit Trail</p>
            <p className="mt-1 text-slate-500">
              Every status transition, feedback notation, and scan execution is timestamped and recorded for compliance reporting and incident reviews.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
