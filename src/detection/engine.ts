import type { BrandAsset, Severity } from '../lib/types'

export type SignalName = 'name' | 'logo' | 'description' | 'publisher' | 'links'

export interface DetectionSignal {
  name: SignalName
  value: number | null
  explanation: string
}

export interface RiskAssessment {
  score: number
  severity: Severity
  unavailable: SignalName[]
  availableWeight: number
}

const weights: Record<SignalName, number> = {
  name: 25,
  logo: 25,
  description: 20,
  publisher: 15,
  links: 15
}

export function normalizeName(value: string) {
  return value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

export function damerauLevenshtein(first: string, second: string) {
  const source = normalizeName(first)
  const target = normalizeName(second)
  if (!source.length) return target.length
  if (!target.length) return source.length
  const grid = Array.from({ length: source.length + 1 }, (_, row) => [row])
  for (let column = 1; column <= target.length; column += 1) grid[0][column] = column
  for (let row = 1; row <= source.length; row += 1) {
    for (let column = 1; column <= target.length; column += 1) {
      const cost = source[row - 1] === target[column - 1] ? 0 : 1
      grid[row][column] = Math.min(
        grid[row - 1][column] + 1,
        grid[row][column - 1] + 1,
        grid[row - 1][column - 1] + cost,
        row > 1 && column > 1 && source[row - 1] === target[column - 2] && source[row - 2] === target[column - 1]
          ? grid[row - 2][column - 2] + cost
          : Number.POSITIVE_INFINITY
      )
    }
  }
  return grid[source.length][target.length]
}

export function nameSimilarity(first: string, second: string) {
  const source = normalizeName(first)
  const target = normalizeName(second)
  if (!source || !target) return 0
  if (source === target) return 100
  const distance = damerauLevenshtein(source, target)
  const lexical = Math.max(0, 1 - distance / Math.max(source.length, target.length)) * 100
  const compactSource = source.replaceAll(' ', '')
  const compactTarget = target.replaceAll(' ', '')
  const compact = compactSource === compactTarget ? 100 : lexical
  const containment = source.includes(target) || target.includes(source) ? 88 : 0
  return Math.round(Math.max(compact, containment))
}

export function calculateRisk(signals: DetectionSignal[]): RiskAssessment {
  const available = signals.filter((signal) => signal.value !== null)
  const availableWeight = available.reduce((total, signal) => total + weights[signal.name], 0)
  const score = availableWeight === 0
    ? 0
    : Math.round(available.reduce((total, signal) => total + (signal.value ?? 0) * weights[signal.name], 0) / availableWeight)
  return {
    score,
    severity: riskSeverity(score),
    unavailable: signals.filter((signal) => signal.value === null).map((signal) => signal.name),
    availableWeight
  }
}

export function riskSeverity(score: number): Severity {
  if (score >= 80) return 'critical'
  if (score >= 60) return 'high'
  if (score >= 30) return 'medium'
  return 'low'
}

export interface OfficialAssetCheck {
  excluded: boolean
  reason: string | null
}

export function checkOfficialAsset(
  candidate: { platform: string; externalId?: string | null; packageOrBundleId?: string | null; sourceUrl?: string | null },
  assets: BrandAsset[]
): OfficialAssetCheck {
  const platform = normalizeName(candidate.platform)
  const exactExternalId = normalizeName(candidate.externalId ?? '')
  const exactPackageId = normalizeName(candidate.packageOrBundleId ?? '')
  const exactUrl = candidate.sourceUrl?.trim().toLocaleLowerCase() ?? ''
  const match = assets.find((asset) => {
    if (asset.trust_status !== 'verified' || normalizeName(asset.platform) !== platform) return false
    const externalMatch = Boolean(exactExternalId) && normalizeName(asset.external_id) === exactExternalId
    const packageMatch = Boolean(exactPackageId) && normalizeName(asset.package_or_bundle_id) === exactPackageId
    const urlMatch = Boolean(exactUrl) && asset.url?.trim().toLocaleLowerCase() === exactUrl
    return externalMatch || packageMatch || urlMatch
  })
  return match
    ? { excluded: true, reason: `Exact identifier matches the verified ${match.asset_type.replaceAll('_', ' ')}.` }
    : { excluded: false, reason: null }
}

export function candidateIdentityKey(sourceType: string, platform: string, externalId: string) {
  return [normalizeName(sourceType), normalizeName(platform), normalizeName(externalId)].join(':')
}
