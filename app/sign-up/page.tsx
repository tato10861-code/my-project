'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signUp } from '@/lib/auth-client'

export default function SignUpPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setPending(true)
    const result = await signUp.email({ name, email, password })
    if (result.error) {
      setError('تعذر إنشاء الحساب. قد يكون الحساب موجوداً مسبقاً.')
      setPending(false)
      return
    }
    router.push('/admin')
    router.refresh()
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#071014] px-5 text-[#f5f1e8]">
      <form
        onSubmit={submit}
        method="post"
        className="w-full max-w-md rounded-3xl border border-[#f5f1e8]/10 bg-[#112127] p-8"
      >
        <p className="text-xs uppercase tracking-[0.2em] text-[#d5b77b]">First-time owner setup</p>
        <h1 className="mt-4 font-serif text-4xl">إنشاء حساب المالك</h1>
        <p className="mt-3 leading-6 text-[#b4c1bf]">استخدم بريد المالك المسجّل لدى المنصة.</p>
        <input
          className="mt-8 w-full rounded-xl border border-[#f5f1e8]/15 bg-[#071014] px-4 py-3"
          placeholder="الاسم"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <input
          className="mt-3 w-full rounded-xl border border-[#f5f1e8]/15 bg-[#071014] px-4 py-3"
          type="email"
          placeholder="البريد الإلكتروني"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          className="mt-3 w-full rounded-xl border border-[#f5f1e8]/15 bg-[#071014] px-4 py-3"
          type="password"
          placeholder="كلمة مرور قوية"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          required
        />
        {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
        <button
          disabled={pending}
          className="mt-6 w-full rounded-full bg-[#d5b77b] px-5 py-3 font-medium text-[#071014] disabled:opacity-60"
        >
          {pending ? 'جارٍ الإنشاء...' : 'إنشاء الحساب الآمن'}
        </button>
      </form>
    </main>
  )
}
