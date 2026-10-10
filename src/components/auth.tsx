import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ShieldCheck } from 'lucide-react'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { Button, Card, Field, Input } from './ui'

const credentialSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(8, 'Use at least 8 characters.'),
  brandName: z.string().optional(),
  website: z.string().url('Enter a valid URL.').optional().or(z.literal('')),
  socialHandle: z.string().optional()
})
type Credentials = z.infer<typeof credentialSchema>

export function SignInPage() {
  const [mode, setMode] = useState<'signIn' | 'signUp' | 'reset'>('signIn')
  const [message, setMessage] = useState<string | null>(null)
  const form = useForm<Credentials>({ resolver: zodResolver(credentialSchema) })

  async function submit(values: Credentials) {
    if (!supabase) return
    setMessage(null)
    const result = mode === 'signIn'
      ? await supabase.auth.signInWithPassword(values)
      : mode === 'signUp'
        ? await supabase.auth.signUp({
            email: values.email,
            password: values.password,
            options: {
              emailRedirectTo: window.location.origin,
              data: { brandName: values.brandName, website: values.website, socialHandle: values.socialHandle }
            }
          })
        : await supabase.auth.resetPasswordForEmail(values.email, { redirectTo: `${window.location.origin}/settings` })
    if (result.error) {
      setMessage(result.error.message)
      return
    }
    if (mode === 'signUp') setMessage('Account created. Check your email if confirmation is enabled, then sign in.')
    if (mode === 'reset') setMessage('If that account exists, a password reset link has been sent.')
  }

  const title = mode === 'signIn' ? 'Welcome back' : mode === 'signUp' ? 'Create your workspace' : 'Reset your password'
  const description = mode === 'signIn' ? 'Sign in to investigate your organization’s risk findings.' : mode === 'signUp' ? 'A personal organization is created securely after registration.' : 'We’ll email a secure link to restore access to your workspace.'
  return <main className="grid min-h-screen place-items-center bg-slate-50 p-4 dark:bg-slate-950"><Card className="w-full max-w-md p-7"><div className="mb-7"><span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950"><ShieldCheck size={21} /></span><p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Digital risk protection</p><h1 className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">{title}</h1><p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{description}</p></div><form onSubmit={form.handleSubmit(submit)} className="grid gap-4"><Field label="Email" error={form.formState.errors.email?.message}><Input type="email" autoComplete="email" {...form.register('email')} /></Field>{mode !== 'reset' && <Field label="Password" error={form.formState.errors.password?.message}><Input type="password" autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'} {...form.register('password')} /></Field>}{mode === 'signUp' && <><Field label="Brand Name" error={form.formState.errors.brandName?.message}><Input type="text" {...form.register('brandName')} placeholder="e.g. Acme Corp" /></Field><Field label="Website URL" error={form.formState.errors.website?.message}><Input type="url" {...form.register('website')} placeholder="https://example.com" /></Field><Field label="Social Media Handles" error={form.formState.errors.socialHandle?.message}><Input type="text" {...form.register('socialHandle')} placeholder="@acmecorp" /></Field></>}{message && <p className="rounded-lg bg-slate-100 p-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">{message}</p>}<Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Working…' : mode === 'signIn' ? 'Sign in' : mode === 'signUp' ? 'Create account' : 'Send reset link'}</Button></form><div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium text-slate-600 dark:text-slate-400"><button type="button" className="underline underline-offset-4 hover:text-slate-950 dark:hover:text-white" onClick={() => { setMode(mode === 'signIn' ? 'signUp' : 'signIn'); setMessage(null); form.reset() }}>{mode === 'signIn' ? 'Create an account' : 'Back to sign in'}</button>{mode === 'signIn' && <button type="button" className="underline underline-offset-4 hover:text-slate-950 dark:hover:text-white" onClick={() => { setMode('reset'); setMessage(null); form.reset() }}>Forgot password?</button>}</div></Card></main>
}
