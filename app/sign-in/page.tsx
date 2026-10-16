'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '@/lib/auth-client'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')
    const result = await signIn.email({ email, password })
    if (result.error) {
      setError('تعذر تسجيل الدخول. تحقق من البيانات أو أنشئ حساب المالك أولاً.')
      setPending(false)
      return
    }
    router.push('/admin')
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#071014] px-5 text-[#f5f1e8]">
      <form onSubmit={submit} method="post" className="w-full max-w-md rounded-3xl border border-[#f5f1e8]/10 bg-[#112127] p-8 shadow-2xl">
        <p className="text-xs uppercase tracking-[0.2em] text-[#d5b77b]">PropAuto AI owner access</p>
        <h1 className="mt-4 font-serif text-4xl">دخول المالك والمشرف</h1>
        <p className="mt-3 leading-6 text-[#b4c1bf]">هذه المنطقة خاصة بإدارة العملاء والزيارات والبوتات.</p>
        <label className="mt-8 block text-sm text-[#b4c1bf]">البريد الإلكتروني<input className="mt-2 w-full rounded-xl border border-[#f5f1e8]/15 bg-[#071014] px-4 py-3 text-[#f5f1e8] outline-none focus:border-[#d5b77b]" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        <label className="mt-4 block text-sm text-[#b4c1bf]">كلمة المرور<input className="mt-2 w-full rounded-xl border border-[#f5f1e8]/15 bg-[#071014] px-4 py-3 text-[#f5f1e8] outline-none focus:border-[#d5b77b]" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} /></label>
        {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
        <button disabled={pending} className="mt-6 w-full rounded-full bg-[#d5b77b] px-5 py-3 font-medium text-[#071014] disabled:opacity-60">{pending ? 'جارٍ التحقق...' : 'دخول آمن'}</button>
        <p className="mt-5 text-xs leading-5 text-[#80908d]">لإنشاء حساب المالك لأول مرة، استخدم مسار التسجيل الداخلي ثم أعد الدخول.</p>
      </form>
    </main>
  )
}
