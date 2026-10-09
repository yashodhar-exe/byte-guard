create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;

create type public.asset_type as enum ('social_profile', 'app_listing', 'domain', 'trusted_link', 'publisher_relationship');
create type public.trust_status as enum ('verified', 'pending', 'inactive');
create type public.scan_status as enum ('queued', 'running', 'completed', 'partial', 'failed');
create type public.scan_mode as enum ('live', 'demo');
create type public.source_type as enum ('social', 'app');
create type public.source_status as enum ('pending', 'running', 'completed', 'unavailable', 'rate_limited', 'failed');
create type public.risk_severity as enum ('low', 'medium', 'high', 'critical');
create type public.review_status as enum ('open', 'under_review', 'confirmed_threat', 'false_positive', 'resolved');
create type public.data_origin as enum ('live', 'synthetic');
create type public.exclusion_status as enum ('none', 'official_asset', 'trusted_relationship');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'analyst', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 160),
  description text not null default '' check (char_length(description) <= 4000),
  website text,
  root_domains text[] not null default '{}',
  aliases text[] not null default '{}',
  product_names text[] not null default '{}',
  keywords text[] not null default '{}',
  identifiers text[] not null default '{}',
  logo_path text,
  region text,
  official_description text not null default '' check (char_length(official_description) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id),
  unique (organization_id, name)
);

create table public.brand_assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  brand_id uuid not null,
  asset_type public.asset_type not null,
  platform text not null default '',
  external_id text not null default '',
  url text,
  package_or_bundle_id text not null default '',
  store_listing_id text not null default '',
  publisher text not null default '',
  trust_status public.trust_status not null default 'pending',
  verified_at timestamptz,
  relationship_note text not null default '' check (char_length(relationship_note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (brand_id, organization_id) references public.brands(id, organization_id) on delete cascade,
  check (url is null or url ~* '^https://'),
  check (external_id <> '' or package_or_bundle_id <> '' or store_listing_id <> '' or url is not null),
  unique nulls not distinct (brand_id, asset_type, platform, external_id, package_or_bundle_id, store_listing_id, url)
);

create table public.scans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  brand_id uuid not null,
  status public.scan_status not null default 'queued',
  mode public.scan_mode not null default 'live',
  requested_by uuid references auth.users(id) on delete set null,
  started_at timestamptz,
  completed_at timestamptz,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (brand_id, organization_id) references public.brands(id, organization_id) on delete cascade,
  unique (id, organization_id)
);

create unique index scans_one_running_per_brand on public.scans (brand_id) where status = 'running';

create table public.scan_sources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  scan_id uuid not null,
  provider text not null,
  source_type public.source_type not null,
  status public.source_status not null default 'pending',
  capability jsonb not null default '{}'::jsonb,
  records_collected integer not null default 0 check (records_collected >= 0),
  last_successful_retrieval timestamptz,
  error_message text check (char_length(error_message) <= 500),
  data_origin public.data_origin not null default 'live',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (scan_id, organization_id) references public.scans(id, organization_id) on delete cascade,
  unique (scan_id, provider)
);

create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source_type public.source_type not null,
  platform text not null,
  external_id text not null,
  name text not null,
  normalized_name text not null,
  username text,
  description text not null default '',
  source_url text,
  image_url text,
  publisher text not null default '',
  publisher_website text,
  rating numeric(4,2),
  download_estimate bigint,
  raw_metadata jsonb not null default '{}'::jsonb,
  data_origin public.data_origin not null default 'live',
  first_observed_at timestamptz not null default now(),
  last_observed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id),
  unique (organization_id, source_type, platform, external_id),
  check (source_url is null or source_url ~* '^https://'),
  check (image_url is null or image_url ~* '^https://')
);

create table public.findings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  brand_id uuid not null,
  candidate_id uuid not null,
  scan_id uuid,
  score numeric(5,2) not null check (score >= 0 and score <= 100),
  severity public.risk_severity not null,
  review_status public.review_status not null default 'open',
  exclusion_status public.exclusion_status not null default 'none',
  exclusion_reason text,
  explanation jsonb not null default '{}'::jsonb,
  data_origin public.data_origin not null default 'live',
  detected_at timestamptz not null default now(),
  last_checked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (brand_id, organization_id) references public.brands(id, organization_id) on delete cascade,
  foreign key (candidate_id, organization_id) references public.candidates(id, organization_id) on delete cascade,
  foreign key (scan_id, organization_id) references public.scans(id, organization_id) on delete cascade,
  unique (id, organization_id),
  unique (brand_id, candidate_id)
);

create table public.finding_evidence (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  finding_id uuid not null,
  signal_type text not null,
  signal_value jsonb not null default '{}'::jsonb,
  score numeric(5,2) check (score >= 0 and score <= 100),
  available boolean not null default true,
  explanation text not null check (char_length(explanation) <= 2000),
  provenance text not null default '',
  created_at timestamptz not null default now(),
  foreign key (finding_id, organization_id) references public.findings(id, organization_id) on delete cascade
);

create table public.analyst_feedback (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  finding_id uuid not null,
  user_id uuid not null references auth.users(id) on delete restrict,
  previous_status public.review_status,
  new_status public.review_status not null,
  notes text not null default '' check (char_length(notes) <= 4000),
  created_at timestamptz not null default now(),
  foreign key (finding_id, organization_id) references public.findings(id, organization_id) on delete cascade
);

create index brands_organization_id_idx on public.brands (organization_id);
create index brand_assets_brand_id_idx on public.brand_assets (brand_id);
create index scans_brand_created_at_idx on public.scans (brand_id, created_at desc);
create index scan_sources_scan_id_idx on public.scan_sources (scan_id);
create index candidates_org_source_idx on public.candidates (organization_id, source_type, platform);
create index candidates_normalized_name_idx on public.candidates (normalized_name);
create index findings_org_review_severity_idx on public.findings (organization_id, review_status, severity);
create index findings_brand_detected_idx on public.findings (brand_id, detected_at desc);
create index findings_candidate_id_idx on public.findings (candidate_id);
create index finding_evidence_finding_id_idx on public.finding_evidence (finding_id);
create index analyst_feedback_finding_created_idx on public.analyst_feedback (finding_id, created_at desc);

create or replace function private.provision_organization_for_user()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  organization_uuid uuid;
  workspace_name text;
begin
  workspace_name := coalesce(nullif(split_part(coalesce(new.email, ''), '@', 1), ''), 'Personal') || ' workspace';
  insert into public.organizations (name, created_by)
  values (workspace_name, new.id)
  returning id into organization_uuid;
  insert into public.organization_members (organization_id, user_id, role)
  values (organization_uuid, new.id, 'owner');
  return new;
end;
$$;

revoke all on function private.provision_organization_for_user() from public;

create trigger provision_organization_after_signup
after insert on auth.users
for each row execute function private.provision_organization_for_user();

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.brands enable row level security;
alter table public.brand_assets enable row level security;
alter table public.scans enable row level security;
alter table public.scan_sources enable row level security;
alter table public.candidates enable row level security;
alter table public.findings enable row level security;
alter table public.finding_evidence enable row level security;
alter table public.analyst_feedback enable row level security;

revoke all on all tables in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated;

create policy "Members can read organizations" on public.organizations
for select to authenticated
using (created_by = (select auth.uid()) or id in (select organization_id from public.organization_members where user_id = (select auth.uid())));

create policy "Owners can update organizations" on public.organizations
for update to authenticated
using (created_by = (select auth.uid()))
with check (created_by = (select auth.uid()));

create policy "Users can read their memberships" on public.organization_members
for select to authenticated
using (user_id = (select auth.uid()));

create policy "Members can read brands" on public.brands
for select to authenticated
using (organization_id in (select organization_id from public.organization_members where user_id = (select auth.uid())));

create policy "Members can create brands" on public.brands
for insert to authenticated
with check (organization_id in (select organization_id from public.organization_members where user_id = (select auth.uid())));

create policy "Members can update brands" on public.brands
for update to authenticated
using (organization_id in (select organization_id from public.organization_members where user_id = (select auth.uid())))
with check (organization_id in (select organization_id from public.organization_members where user_id = (select auth.uid())));

create policy "Members can delete brands" on public.brands
for delete to authenticated
using (organization_id in (select organization_id from public.organization_members where user_id = (select auth.uid())));

create policy "Members can read brand assets" on public.brand_assets
for select to authenticated
using (organization_id in (select organization_id from public.organization_members where user_id = (select auth.uid())));

create policy "Members can create brand assets" on public.brand_assets
for insert to authenticated
with check (organization_id in (select organization_id from public.organization_members where user_id = (select auth.uid())));

create policy "Members can update brand assets" on public.brand_assets
for update to authenticated
using (organization_id in (select organization_id from public.organization_members where user_id = (select auth.uid())))
with check (organization_id in (select organization_id from public.organization_members where user_id = (select auth.uid())));

create policy "Members can delete brand assets" on public.brand_assets
for delete to authenticated
using (organization_id in (select organization_id from public.organization_members where user_id = (select auth.uid())));

create policy "Members can read scans" on public.scans
for select to authenticated
using (organization_id in (select organization_id from public.organization_members where user_id = (select auth.uid())));

create policy "Members can create scans" on public.scans
for insert to authenticated
with check (organization_id in (select organization_id from public.organization_members where user_id = (select auth.uid())));

create policy "Members can update scans" on public.scans
for update to authenticated
using (organization_id in (select organization_id from public.organization_members where user_id = (select auth.uid())))
with check (organization_id in (select organization_id from public.organization_members where user_id = (select auth.uid())));

create policy "Members can read scan sources" on public.scan_sources
for select to authenticated
using (organization_id in (select organization_id from public.organization_members where user_id = (select auth.uid())));

create policy "Members can read candidates" on public.candidates
for select to authenticated
using (organization_id in (select organization_id from public.organization_members where user_id = (select auth.uid())));

create policy "Members can read findings" on public.findings
for select to authenticated
using (organization_id in (select organization_id from public.organization_members where user_id = (select auth.uid())));

create policy "Members can update findings" on public.findings
for update to authenticated
using (organization_id in (select organization_id from public.organization_members where user_id = (select auth.uid())))
with check (organization_id in (select organization_id from public.organization_members where user_id = (select auth.uid())));

create policy "Members can read finding evidence" on public.finding_evidence
for select to authenticated
using (organization_id in (select organization_id from public.organization_members where user_id = (select auth.uid())));

create policy "Members can read feedback" on public.analyst_feedback
for select to authenticated
using (organization_id in (select organization_id from public.organization_members where user_id = (select auth.uid())));

create policy "Members can add feedback" on public.analyst_feedback
for insert to authenticated
with check (user_id = (select auth.uid()) and organization_id in (select organization_id from public.organization_members where user_id = (select auth.uid())));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('brand-logos', 'brand-logos', false, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "Members can read organization logos" on storage.objects
for select to authenticated
using (bucket_id = 'brand-logos' and (storage.foldername(name))[1] in (select organization_id::text from public.organization_members where user_id = (select auth.uid())));

create policy "Members can upload organization logos" on storage.objects
for insert to authenticated
with check (bucket_id = 'brand-logos' and (storage.foldername(name))[1] in (select organization_id::text from public.organization_members where user_id = (select auth.uid())));

create policy "Members can update organization logos" on storage.objects
for update to authenticated
using (bucket_id = 'brand-logos' and (storage.foldername(name))[1] in (select organization_id::text from public.organization_members where user_id = (select auth.uid())))
with check (bucket_id = 'brand-logos' and (storage.foldername(name))[1] in (select organization_id::text from public.organization_members where user_id = (select auth.uid())));

create policy "Members can delete organization logos" on storage.objects
for delete to authenticated
using (bucket_id = 'brand-logos' and (storage.foldername(name))[1] in (select organization_id::text from public.organization_members where user_id = (select auth.uid())));
