import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, ExternalLink as ExternalLinkIcon, Plus, ShieldCheck, Upload } from 'lucide-react'
import { useWorkspace } from '../data/workspace'
import { Button, Card, EmptyState, ExternalLink, Field, Input, OriginBadge, PageHeading, Select, StatusBadge, Textarea } from '../components/ui'
import { isSafeHttpsUrl, toArray } from '../lib/utils'

const brandSchema = z.object({
  name: z.string().trim().min(2, 'Use at least 2 characters.').max(160),
  description: z.string().max(4000),
  website: z.string().trim().refine((value) => !value || isSafeHttpsUrl(value), 'Use an HTTPS URL.').or(z.literal('')),
  rootDomains: z.string(), aliases: z.string(), products: z.string(), keywords: z.string(), identifiers: z.string(), region: z.string().max(120), officialDescription: z.string().max(4000)
})
type BrandForm = z.infer<typeof brandSchema>

const assetSchema = z.object({
  assetType: z.enum(['social_profile', 'app_listing', 'domain', 'trusted_link', 'publisher_relationship']),
  platform: z.string().trim().max(80), externalId: z.string().trim().max(240), url: z.string().trim().refine((value) => !value || isSafeHttpsUrl(value), 'Use an HTTPS URL.').or(z.literal('')), packageId: z.string().trim().max(240), listingId: z.string().trim().max(240), publisher: z.string().trim().max(240), trustStatus: z.enum(['verified', 'pending', 'inactive']), relationshipNote: z.string().max(1000)
}).refine((value) => value.externalId || value.url || value.packageId || value.listingId, { message: 'Provide an account ID, app identifier, listing ID, or URL.', path: ['externalId'] })
type AssetForm = z.infer<typeof assetSchema>

export function BrandsPage() {
  const { brands, createBrand, isDemo } = useWorkspace()
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const form = useForm<BrandForm>({ resolver: zodResolver(brandSchema), defaultValues: { description: '', website: '', rootDomains: '', aliases: '', products: '', keywords: '', identifiers: '', region: '', officialDescription: '' } })
  async function submit(values: BrandForm) {
    setMessage(null)
    try {
      await createBrand({ name: values.name, description: values.description, website: values.website || null, root_domains: toArray(values.rootDomains), aliases: toArray(values.aliases), product_names: toArray(values.products), keywords: toArray(values.keywords), identifiers: toArray(values.identifiers), region: values.region || null, official_description: values.officialDescription })
      form.reset()
      setShowForm(false)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create the brand.')
    }
  }
  return <div className="grid gap-7"><PageHeading eyebrow="Brand profiles" title="Protected brands" description="Register clear canonical names, official domains, aliases, and product identities before scanning." action={<Button onClick={() => setShowForm((value) => !value)}><Plus size={16} /> Add brand</Button>} />{isDemo && <p className="rounded-md border border-slate-300 bg-slate-50 p-3 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">Demo workspace changes are stored only in this browser. Configure Supabase to persist data for your organization.</p>}{showForm && <Card><h2 className="font-semibold text-slate-950 dark:text-white">New protected brand</h2><form onSubmit={form.handleSubmit(submit)} className="mt-5 grid gap-4 md:grid-cols-2"><Field label="Brand name" error={form.formState.errors.name?.message}><Input autoFocus {...form.register('name')} /></Field><Field label="Official website" error={form.formState.errors.website?.message}><Input placeholder="https://example.com" {...form.register('website')} /></Field><Field label="Region"><Input placeholder="Country or region" {...form.register('region')} /></Field><Field label="Root domains"><Input placeholder="example.com, example.org" {...form.register('rootDomains')} /></Field><Field label="Aliases"><Input placeholder="Product name, short name" {...form.register('aliases')} /></Field><Field label="Product names"><Input placeholder="Consumer app, enterprise app" {...form.register('products')} /></Field><Field label="Keywords"><Input placeholder="Wallet, payments" {...form.register('keywords')} /></Field><Field label="Internal identifiers"><Input placeholder="BRAND-001" {...form.register('identifiers')} /></Field><div className="md:col-span-2"><Field label="Description" error={form.formState.errors.description?.message}><Textarea {...form.register('description')} /></Field></div><div className="md:col-span-2"><Field label="Official identity description"><Textarea placeholder="How the brand describes itself, products, or identity claims." {...form.register('officialDescription')} /></Field></div>{message && <p className="md:col-span-2 text-sm text-rose-600">{message}</p>}<div className="flex gap-2 md:col-span-2"><Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Creating…' : 'Create brand'}</Button><Button type="button" variant="secondary" onClick={() => { setShowForm(false); form.reset() }}>Cancel</Button></div></form></Card>}<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{brands.map((brand) => <Link key={brand.id} to={`/brands/${brand.id}`} className="rounded-md border border-slate-300 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-500"><div className="flex justify-between gap-4"><span className="grid h-10 w-10 place-items-center rounded-md border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"><ShieldCheck size={19} /></span><span className="text-sm text-slate-500">{brand.region}</span></div><h2 className="mt-5 font-semibold text-slate-950 dark:text-white">{brand.name}</h2><p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{brand.description || 'No description recorded.'}</p><div className="mt-5 flex flex-wrap gap-2">{brand.aliases.slice(0, 3).map((alias) => <span key={alias} className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">{alias}</span>)}</div></Link>)}</div>{!brands.length && <EmptyState title="No brands are being monitored" description="Create a brand first, then register its verified official assets." action={<Button onClick={() => setShowForm(true)}>Add first brand</Button>} />}</div>
}

export function BrandDetailPage() {
  const { brandId } = useParams()
  const { brands, assets, createAsset, uploadLogo, isDemo } = useWorkspace()
  const brand = brands.find((item) => item.id === brandId)
  const [message, setMessage] = useState<string | null>(null)
  const assetForm = useForm<AssetForm>({ resolver: zodResolver(assetSchema), defaultValues: { assetType: 'social_profile', platform: '', externalId: '', url: '', packageId: '', listingId: '', publisher: '', trustStatus: 'verified', relationshipNote: '' } })
  if (!brand) return <div className="grid gap-5"><Link to="/brands" className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-300"><ArrowLeft size={16} /> Back to brands</Link><EmptyState title="Brand not found" description="This brand may have been removed or you may not have access to it." /></div>
  const selectedBrand = brand
  const brandAssets = assets.filter((asset) => asset.brand_id === selectedBrand.id)
  async function submitAsset(values: AssetForm) {
    setMessage(null)
    try {
      await createAsset({ brand_id: selectedBrand.id, asset_type: values.assetType, platform: values.platform, external_id: values.externalId, url: values.url || null, package_or_bundle_id: values.packageId, store_listing_id: values.listingId, publisher: values.publisher, trust_status: values.trustStatus, relationship_note: values.relationshipNote })
      assetForm.reset()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not register the asset.')
    }
  }
  async function handleLogo(file: File | undefined) {
    if (!file) return
    setMessage(null)
    try { await uploadLogo(selectedBrand.id, file); setMessage('Logo uploaded.') } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not upload the logo.') }
  }
  return <div className="grid gap-7"><Link to="/brands" className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"><ArrowLeft size={16} /> All brands</Link><PageHeading eyebrow="Brand profile" title={brand.name} description={brand.description || 'No description recorded.'} action={brand.website ? <ExternalLink href={brand.website}>Official website</ExternalLink> : undefined} /><div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]"><Card><h2 className="font-semibold text-slate-950 dark:text-white">Brand identity</h2><dl className="mt-5 grid gap-4 text-sm"><Info label="Root domains" value={brand.root_domains.join(', ') || 'None registered'} /><Info label="Aliases" value={brand.aliases.join(', ') || 'None registered'} /><Info label="Products" value={brand.product_names.join(', ') || 'None registered'} /><Info label="Identifiers" value={brand.identifiers.join(', ') || 'None registered'} /></dl><div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-700"><p className="text-sm font-medium text-slate-700 dark:text-slate-200">Official logo</p><label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 hover:border-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400"><Upload size={16} /><span>{isDemo ? 'Logo upload needs Supabase configuration' : 'Upload PNG, JPEG, or WebP up to 5 MB'}</span><input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" disabled={isDemo} onChange={(event) => void handleLogo(event.target.files?.[0])} /></label></div></Card><Card><h2 className="font-semibold text-slate-950 dark:text-white">Official asset registry</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Exact verified identifiers are excluded before similarity-based detection.</p><div className="mt-5 grid gap-3">{brandAssets.map((asset) => <div key={asset.id} className="rounded-md border border-slate-300 p-4 dark:border-slate-700"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-medium text-slate-800 dark:text-slate-200">{asset.platform || asset.asset_type.replaceAll('_', ' ')}</p><div className="flex gap-2"><StatusBadge status={asset.trust_status} />{asset.trust_status === 'verified' && <OriginBadge origin="live" />}</div></div><p className="mt-2 break-all text-sm text-slate-600 dark:text-slate-400">{asset.external_id || asset.package_or_bundle_id || asset.url || asset.publisher}</p>{asset.url && <a className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white" href={asset.url} target="_blank" rel="noreferrer">Open listing <ExternalLinkIcon size={14} /></a>}</div>)}{!brandAssets.length && <p className="text-sm text-slate-500">No official assets have been registered.</p>}</div></Card></div><Card><h2 className="font-semibold text-slate-950 dark:text-white">Register an official asset</h2><form onSubmit={assetForm.handleSubmit(submitAsset)} className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3"><Field label="Asset type"><Select {...assetForm.register('assetType')}><option value="social_profile">Social profile</option><option value="app_listing">App listing</option><option value="domain">Domain</option><option value="trusted_link">Trusted link</option><option value="publisher_relationship">Publisher relationship</option></Select></Field><Field label="Trust status"><Select {...assetForm.register('trustStatus')}><option value="verified">Verified</option><option value="pending">Pending verification</option><option value="inactive">Inactive</option></Select></Field><Field label="Platform"><Input placeholder="YouTube, Google Play, Web" {...assetForm.register('platform')} /></Field><Field label="Platform account ID" error={assetForm.formState.errors.externalId?.message}><Input placeholder="Exact account or channel ID" {...assetForm.register('externalId')} /></Field><Field label="Package or bundle ID"><Input placeholder="com.example.app" {...assetForm.register('packageId')} /></Field><Field label="Store listing ID"><Input {...assetForm.register('listingId')} /></Field><div className="md:col-span-2 xl:col-span-3"><Field label="Official URL" error={assetForm.formState.errors.url?.message}><Input placeholder="https://…" {...assetForm.register('url')} /></Field></div><Field label="Official publisher"><Input {...assetForm.register('publisher')} /></Field><div className="md:col-span-2"><Field label="Relationship note"><Input placeholder="Optional subsidiary or authorized publisher relationship" {...assetForm.register('relationshipNote')} /></Field></div>{message && <p className={message === 'Logo uploaded.' ? 'text-sm font-medium text-slate-900 md:col-span-2 xl:col-span-3' : 'text-sm font-medium text-slate-900 md:col-span-2 xl:col-span-3'}>{message}</p>}<div className="md:col-span-2 xl:col-span-3"><Button type="submit" disabled={assetForm.formState.isSubmitting}>{assetForm.formState.isSubmitting ? 'Registering…' : 'Register asset'}</Button></div></form></Card></div>
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 break-words text-slate-800 dark:text-slate-200">{value}</dd></div>
}
