import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { AppShell } from './components/layout'
import { SignInPage } from './components/auth'
import { ErrorState, LoadingState } from './components/ui'
import { WorkspaceProvider, useWorkspace } from './data/workspace'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import { DashboardPage } from './pages/dashboard'
import { BrandDetailPage, BrandsPage } from './pages/brands'
import { FindingsPage, FindingDetailPage } from './pages/findings'
import { MonitorPage } from './pages/monitor'
import { SettingsPage } from './pages/settings'

function WorkspaceRoutes({ onSignOut }: { onSignOut?: () => Promise<void> }) {
  const { loading, error, refresh } = useWorkspace()
  if (loading) return <AppShell onSignOut={onSignOut}><LoadingState /></AppShell>
  if (error) return <AppShell onSignOut={onSignOut}><ErrorState message={error} retry={() => void refresh()} /></AppShell>
  return <AppShell onSignOut={onSignOut}><Routes><Route path="/" element={<DashboardPage />} /><Route path="/brands" element={<BrandsPage />} /><Route path="/brands/:brandId" element={<BrandDetailPage />} /><Route path="/social" element={<MonitorPage sourceType="social" />} /><Route path="/apps" element={<MonitorPage sourceType="app" />} /><Route path="/findings" element={<FindingsPage />} /><Route path="/findings/:findingId" element={<FindingDetailPage />} /><Route path="/settings" element={<SettingsPage />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></AppShell>
}

function AuthenticatedApp() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(!isSupabaseConfigured)
  useEffect(() => {
    if (!supabase) return
    void supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true) })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => { setSession(nextSession); setReady(true) })
    return () => listener.subscription.unsubscribe()
  }, [])
  if (!ready) return <LoadingState />
  if (isSupabaseConfigured && !session) return <SignInPage />
  const authClient = supabase
  const signOut = authClient ? async () => { await authClient.auth.signOut() } : undefined
  return <WorkspaceProvider authenticated={Boolean(session) || !isSupabaseConfigured}><WorkspaceRoutes onSignOut={signOut} /></WorkspaceProvider>
}

export default function App() {
  return <BrowserRouter><AuthenticatedApp /></BrowserRouter>
}
