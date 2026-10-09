import { describe, expect, it } from 'vitest'
import { calculateRisk, candidateIdentityKey, checkOfficialAsset, nameSimilarity, normalizeName } from './engine'
import type { BrandAsset } from '../lib/types'

const asset: BrandAsset = {
  id: 'asset-1', organization_id: 'org-1', brand_id: 'brand-1', asset_type: 'app_listing', platform: 'Google Play', external_id: '', url: 'https://play.google.com/store/apps/details?id=com.acme.wallet', package_or_bundle_id: 'com.acme.wallet', store_listing_id: '', publisher: 'Acme Labs', trust_status: 'verified', verified_at: '2026-10-09T00:00:00Z', relationship_note: '', created_at: '2026-10-09T00:00:00Z'
}

describe('detection engine', () => {
  it('normalizes spacing and punctuation', () => {
    expect(normalizeName(' AĆME---Wallet ')).toBe('acme wallet')
    expect(nameSimilarity('AcmeWallet', 'Acme Wallet')).toBe(100)
  })

  it('detects inserted words and transpositions as look-alikes', () => {
    expect(nameSimilarity('Acme Wallet Support', 'Acme Wallet')).toBeGreaterThanOrEqual(88)
    expect(nameSimilarity('Acme Wlalet', 'Acme Wallet')).toBeGreaterThanOrEqual(80)
  })

  it('excludes a verified app identifier without trusting a display name', () => {
    expect(checkOfficialAsset({ platform: 'Google Play', packageOrBundleId: 'com.acme.wallet', sourceUrl: null }, [asset])).toMatchObject({ excluded: true })
    expect(checkOfficialAsset({ platform: 'Google Play', externalId: 'different', sourceUrl: null }, [asset])).toMatchObject({ excluded: false })
  })

  it('keeps a legitimate matching display name out of exclusion without an exact identifier', () => {
    expect(checkOfficialAsset({ platform: 'Google Play', externalId: 'com.partner.wallet', sourceUrl: null }, [asset])).toEqual({ excluded: false, reason: null })
  })

  it('creates one stable candidate identity key for duplicate source records', () => {
    expect(candidateIdentityKey('app', 'Google Play', 'Com.Acme.Wallet')).toBe(candidateIdentityKey('APP', 'google-play', 'com acme wallet'))
  })

  it('normalizes risk by only available signals', () => {
    const assessment = calculateRisk([
      { name: 'name', value: 80, explanation: '' },
      { name: 'logo', value: null, explanation: '' },
      { name: 'description', value: 60, explanation: '' },
      { name: 'publisher', value: null, explanation: '' },
      { name: 'links', value: null, explanation: '' }
    ])
    expect(assessment.score).toBe(71)
    expect(assessment.unavailable).toEqual(['logo', 'publisher', 'links'])
  })
})
