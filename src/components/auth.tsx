import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ShieldCheck } from 'lucide-react'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { Button, Card, Field, Input } from './ui'

const credentialSchema = z.object({ email: z.string().email('Enter a valid email address.'), password: z.string().min(8, 'Use at least 8 characters.') })
type Credentials = z.infer<typeof credentialSchema>

export function SignInPage() {
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn')
  const [message, setMessage] = useState<string | null>(null)
  const form = useForm<Credentials>({ resolver: zodResolver(credentialSchema) })

  async function submit(values: Credentials) {
    if (!supabase) return
    setMessage(null)
    const result = mode === 'signIn'
      ? await supabase.auth.signInWithPassword(values)
      : await supabase.auth.signUp({ email: values.email, password: values.password })
    if (result.error) {
      setMessage(result.error.message)
      return
    }
    if (mode === 'signUp') setMessage('Account created. Check your email if confirmation is enabled, then sign in.')
  }

  return <main className="grid min-h-screen place-items-center bg-slate-50 p-4 dark:bg-slate-950"><Card className="w-full max-w-md p-7"><div className="mb-7"><span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950"><ShieldCheck size={21} /></span><p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Digital risk protection</p><h1 className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">{mode === 'signIn' ? 'Welcome back' : 'Create your workspace'}</h1><p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{mode === 'signIn' ? 'Sign in to investigate your organization’s risk findings.' : 'A personal organization is created securely after registration.'}</p></div><form onSubmit={form.handleSubmit(submit)} className="grid gap-4"><Field label="Email" error={form.formState.errors.email?.message}><Input type="email" autoComplete="email" {...form.register('email')} /></Field><Field label="Password" error={form.formState.errors.password?.message}><Input type="password" autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'} {...form.register('password')} /></Field>{message && <p className="rounded-lg bg-slate-100 p-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">{message}</p>}<Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Working…' : mode === 'signIn' ? 'Sign in' : 'Create account'}</Button></form><button className="mt-5 text-sm font-medium text-slate-600 underline underline-offset-4 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white" onClick={() => { setMode(mode === 'signIn' ? 'signUp' : 'signIn'); setMessage(null); form.reset() }}>{mode === 'signIn' ? 'Need an account? Create one' : 'Already have an account? Sign in'}</button></Card></main>
}
