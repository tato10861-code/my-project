'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { PropAutoChatbot } from '@/components/propauto-chatbot'
import {
  ArrowLeft,
  ArrowUpLeft,
  Building2,
  Check,
  ChevronDown,
  Heart,
  Languages,
  Menu,
  MessageCircle,
  Bot,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
  X,
} from 'lucide-react'

const copy = {
  ar: {
    nav: ['اكتشف العقارات', 'السيارات النادرة', 'للمستثمرين', 'حلول الأعمال'],
    login: 'تسجيل الدخول',
    cta: 'ابدأ مجاناً',
    eyebrow: 'سوق الأصول الفاخرة المدعوم بالذكاء الاصطناعي',
    title: 'امتلك ما يسبق المستقبل.',
    subtitle: 'منصة واحدة لاكتشاف العقارات النادرة والسيارات الفاخرة والفرص الاستثمارية التي تستحق وقتك.',
    search: 'ابحث عن مدينة، نوع أصل، أو فرصة استثمارية',
    explore: 'استكشف السوق',
    concierge: 'تحدث مع المستشار الذكي',
    verified: 'أصل موثق',
    featured: 'مختارات هذا الأسبوع',
    viewAll: 'عرض الكل',
    roi: 'احسب العائد المحتمل',
    roiSub: 'اتخذ قراراتك بثقة، قبل أن تتحرك الأسعار.',
    budget: 'ميزانيتك الاستثمارية',
    horizon: 'الأفق الزمني',
    result: 'العائد السنوي المتوقع',
    investors: 'للمستثمرين العصريين',
    investorsSub: 'بيانات أعمق. قرارات أسرع. نتائج أكبر.',
    conciergeTitle: 'ذكاء يعمل لصالحك.',
    conciergeSub: 'يقرأ السوق، يقارن الفرص، ويصنع لك قائمة قصيرة تناسب أهدافك.',
    ask: 'اسأل PropAuto AI',
    footer: 'PropAuto AI — حيث تبدأ الملكية الذكية.',
    companyVideo: 'فيلم PropAuto AI التعريفي',
    videoKicker: 'قصة شركة تُبنى حول الثقة',
    videoDescription: 'من أصل نادر إلى قرار استثماري واضح: PropAuto AI يربط المشترين والملاك والمستثمرين في تجربة واحدة ذكية.',
    transcript: 'نص الفيلم التعريفي',
    play: 'تشغيل الفيلم',
    pause: 'إيقاف الفيلم',
    mute: 'كتم الصوت',
    unmute: 'تشغيل الصوت',
    botTitle: 'بوتات PropAuto AI تعمل بلا توقف',
    botSub: 'أتمتة تأهيل العملاء، متابعة المستثمرين، واستقبال طلبات الإدراج على مدار الساعة.',
    investorLead: 'احصل على موجز المستثمرين',
    sellerLead: 'أرسل أصلك للإدراج',
    buyerLead: 'تحدث مع مستشار المشتري',
  },
  en: {
    nav: ['Explore properties', 'Rare cars', 'For investors', 'Business solutions'],
    login: 'Sign in',
    cta: 'Start free',
    eyebrow: 'The AI-powered luxury asset marketplace',
    title: 'Own what comes next.',
    subtitle: 'One intelligent platform for rare properties, exceptional cars, and investment opportunities worth your time.',
    search: 'Search a city, asset type, or investment opportunity',
    explore: 'Explore the market',
    concierge: 'Talk to AI concierge',
    verified: 'Verified asset',
    featured: 'Curated this week',
    viewAll: 'View all',
    roi: 'Estimate your upside',
    roiSub: 'Make confident decisions before the market moves.',
    budget: 'Investment budget',
    horizon: 'Time horizon',
    result: 'Estimated annual return',
    investors: 'For modern investors',
    investorsSub: 'Deeper data. Faster decisions. Bigger outcomes.',
    conciergeTitle: 'Intelligence on your side.',
    conciergeSub: 'It reads the market, compares opportunities, and creates a shortlist built around your goals.',
    ask: 'Ask PropAuto AI',
    footer: 'PropAuto AI — where smart ownership begins.',
    companyVideo: 'The PropAuto AI company film',
    videoKicker: 'A company built around trust',
    videoDescription: 'From rare assets to clear investment decisions: PropAuto AI connects buyers, owners, and investors in one intelligent experience.',
    transcript: 'Company film transcript',
    play: 'Play film',
    pause: 'Pause film',
    mute: 'Mute audio',
    unmute: 'Unmute audio',
    botTitle: 'PropAuto AI bots that never stop',
    botSub: 'Automate lead qualification, investor follow-up, and listing intake around the clock.',
    investorLead: 'Get investor brief',
    sellerLead: 'Submit an asset',
    buyerLead: 'Talk to buyer concierge',
  },
}

const localizedCopy = {
  ...copy,
  fr: { ...copy.en },
  es: { ...copy.en },
}

type SiteLocale = keyof typeof localizedCopy

const listings = [
  { image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85', type: 'REAL ESTATE', name: 'Skyline Villa 07', place: 'Palm Jumeirah, Dubai', price: '$4.8M', metric: '+12.4% projected', accent: 'property' },
  { image: 'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=1200&q=85', type: 'REAL ESTATE', name: 'The Mayfair Residence', place: 'London, United Kingdom', price: '$6.2M', metric: '+8.9% projected', accent: 'property' },
  { image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1200&q=85', type: 'AUTOMOTIVE', name: 'Ferrari 812 GTS', place: '2024 · 1,200 miles', price: '$620K', metric: 'Rare allocation', accent: 'car' },
]

export default function Page() {
  const [locale, setLocale] = useState<SiteLocale>('en')
  const [menuOpen, setMenuOpen] = useState(false)
  const [liked, setLiked] = useState<number[]>([])
  const [budget, setBudget] = useState(2)
  const [horizon, setHorizon] = useState(5)
  const [query, setQuery] = useState('')
  const [videoPlaying, setVideoPlaying] = useState(false)
  const muted = false
  const [activeBot, setActiveBot] = useState<'buyer' | 'investor' | 'seller' | null>(null)
  const [showVisitorDashboard, setShowVisitorDashboard] = useState(false)
  const [showPriceBoard, setShowPriceBoard] = useState(false)
  useEffect(() => {
    const cookieName = 'propauto_session_id'
    const existingCookie = document.cookie.split('; ').find((cookie) => cookie.startsWith(`${cookieName}=`))?.split('=')[1]
    const sessionId = existingCookie || (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`)
    if (!existingCookie) document.cookie = `${cookieName}=${sessionId}; Max-Age=31536000; Path=/; SameSite=Lax`
    const payload = JSON.stringify({ sessionId, eventName: 'page_view', path: window.location.pathname, metadata: { language: document.documentElement.lang } })
    const sent = navigator.sendBeacon('/api/events', new Blob([payload], { type: 'application/json' }))
    if (!sent) void fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true })
  }, [])
  const [leadIntent, setLeadIntent] = useState<'buyer' | 'investor' | 'seller'>('buyer')
  const [leadName, setLeadName] = useState('')
  const [leadEmail, setLeadEmail] = useState('')
  const [leadStatus, setLeadStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [messages, setMessages] = useState<{ id: string; role: 'user' | 'assistant'; parts: { type: 'text'; text: string }[] }[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatStatus, setChatStatus] = useState<'ready' | 'streaming'>('ready')
  async function sendMessage({ text }: { text: string }) {
    const userMessage = { id: `${Date.now()}-user`, role: 'user' as const, parts: [{ type: 'text' as const, text }] }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setChatStatus('streaming')
    try {
      const response = await fetch('/api/sarah', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ language: locale, messages: nextMessages.map((message) => ({ role: message.role, content: message.parts.map((part) => part.text).join('') })) }) })
      const data = await response.json()
      if (!response.ok || !data.reply) throw new Error('Sarah unavailable')
      setMessages((current) => [...current, { id: `${Date.now()}-assistant`, role: 'assistant', parts: [{ type: 'text', text: data.reply }] }])
    } catch {
      setMessages((current) => [...current, { id: `${Date.now()}-assistant`, role: 'assistant', parts: [{ type: 'text', text: locale === 'ar' ? 'أعتذر، تعذر الاتصال الآن. اترك رقمك وسيتواصل معك فريق PropAuto.' : 'I’m sorry, Sarah is temporarily unavailable. Leave your number and the PropAuto team will contact you.' }] }])
    } finally {
      setChatStatus('ready')
    }
  }
  const t = localizedCopy[locale]

  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
  }, [locale])

  async function submitLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLeadStatus('sending')
    const response = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: leadName, email: leadEmail, intent: leadIntent }) })
    setLeadStatus(response.ok ? 'sent' : 'error')
  }
  const returnRate = useMemo(() => 7.8 + budget * 1.05 + (horizon > 5 ? 1.8 : 0), [budget, horizon])
  const currency = locale === 'ar' ? 'مليون دولار' : 'M USD'

  const switchLocale = () => setLocale(locale === 'ar' ? 'en' : 'ar')

  return (
    <main dir={locale === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen overflow-hidden bg-[#071014] text-[#f5f1e8] selection:bg-[#d5b77b] selection:text-[#071014]">
      <header className="relative z-20 mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 lg:px-12">
        <a href="#top" className="flex items-center gap-3" aria-label="PropAuto AI home">
          <span className="grid size-10 place-items-center rounded-full border border-[#d5b77b]/50 text-[#d5b77b]"><Sparkles size={17} /></span>
          <span className="font-serif text-xl tracking-tight">PropAuto <i className="text-[#d5b77b]">AI</i></span>
        </a>
        <nav className="hidden items-center gap-8 text-[13px] text-[#b4c1bf] lg:flex">
          {t.nav.map((item, index) => <a key={item} href={index === 0 ? '#market' : index === 2 ? '#intelligence' : index === 3 ? '#story' : '#market'} className="transition hover:text-[#f5f1e8]">{item}</a>)}
        </nav>
        <div className="flex items-center gap-3">
          <label className="hidden items-center gap-2 rounded-full border border-[#b4c1bf]/20 px-3 py-2 text-xs text-[#b4c1bf] sm:flex"><Languages size={15} /><span className="sr-only">Language</span><select value={locale} onChange={(event) => setLocale(event.target.value as SiteLocale)} className="bg-transparent outline-none"><option value="en" className="text-black">English</option><option value="ar" className="text-black">العربية</option><option value="fr" className="text-black">Français</option><option value="es" className="text-black">Español</option></select></label>
          <button className="hidden text-sm text-[#b4c1bf] transition hover:text-[#f5f1e8] sm:block">{t.login}</button>
          <form action="/api/checkout" method="POST"><input type="hidden" name="product" value="propauto-premium-access" /><button type="submit" className="rounded-full bg-[#d5b77b] px-4 py-2.5 text-xs font-semibold text-[#071014] transition hover:bg-[#ead29d]">{t.cta}</button></form>
          <button onClick={() => setMenuOpen(!menuOpen)} className="grid size-10 place-items-center rounded-full border border-[#b4c1bf]/20 lg:hidden" aria-label="Toggle menu">{menuOpen ? <X size={18} /> : <Menu size={18} />}</button>
        </div>
      </header>
      {menuOpen && <nav className="relative z-20 mx-5 flex flex-col gap-4 border-t border-[#b4c1bf]/15 py-5 text-sm text-[#b4c1bf] lg:hidden">{t.nav.map((item, index) => <a href={index === 0 ? '#market' : index === 2 ? '#intelligence' : index === 3 ? '#story' : '#market'} key={item} onClick={() => setMenuOpen(false)}>{item}</a>)}<button onClick={switchLocale} className="flex items-center gap-2 text-start"><Languages size={15} /> {locale === 'ar' ? 'English' : 'العربية'}</button></nav>}

      <section id="top" className="relative mx-auto grid min-h-[650px] max-w-[1440px] items-center px-5 pb-20 pt-16 lg:grid-cols-[1.05fr_.95fr] lg:px-12 lg:pb-28 lg:pt-20" aria-labelledby="hero-title">
        <div className="hero-copy relative z-10 max-w-2xl">
          <div className="mb-7 flex items-center gap-3 text-xs uppercase tracking-[0.24em] text-[#d5b77b]"><span className="h-px w-9 bg-[#d5b77b]" />{t.eyebrow}</div>
          <h1 id="hero-title" className="max-w-2xl font-serif text-5xl leading-[1.05] tracking-[-0.04em] text-balance sm:text-7xl lg:text-[92px]">{t.title}</h1>
          <p className="mt-7 max-w-lg text-base leading-7 text-[#b4c1bf] sm:text-lg">{t.subtitle}</p>
          <div className="mt-9 flex flex-wrap gap-3"><a href="#market" className="inline-flex items-center gap-2 rounded-full bg-[#d5b77b] px-5 py-3.5 text-sm font-semibold text-[#071014] transition hover:bg-[#ead29d]">{t.explore} <ArrowLeft className="rtl:rotate-180" size={16} /></a><button onClick={() => window.dispatchEvent(new Event('propauto:open-chat'))} className="inline-flex items-center gap-2 rounded-full border border-[#b4c1bf]/25 px-5 py-3.5 text-sm transition hover:border-[#d5b77b] hover:text-[#d5b77b]"><MessageCircle size={16} /> {t.concierge}</button></div>
        </div>
        <div className="relative mt-14 min-h-[370px] lg:mt-0 lg:min-h-[550px]">
          <div className="hero-image absolute inset-0 overflow-hidden rounded-[2rem] lg:rounded-[3rem]"><Image src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=90" alt="Luxury modern villa overlooking water" fill priority sizes="(max-width: 1024px) 100vw, 48vw" className="object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-[#071014]/75 via-transparent to-transparent" /></div>
          <div className="absolute bottom-5 start-5 rounded-2xl border border-[#f5f1e8]/20 bg-[#071014]/70 p-4 backdrop-blur-xl sm:bottom-8 sm:start-8"><div className="mb-2 flex items-center gap-2 text-xs text-[#d5b77b]"><ShieldCheck size={14} /> {t.verified}</div><p className="font-serif text-xl">Villa Azure · Dubai</p><p className="mt-1 text-xs text-[#b4c1bf]">$3.9M · 4 beds · Sea view</p></div>
          <div className="absolute -bottom-5 end-4 rounded-2xl border border-[#f5f1e8]/15 bg-[#112127]/90 p-4 backdrop-blur-xl sm:end-8"><div className="flex items-center gap-2 text-xs text-[#b4c1bf]"><TrendingUp size={14} className="text-[#d5b77b]" /> Live market signal</div><p className="mt-2 text-2xl text-[#d5b77b]">+18.6%</p></div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-5 max-w-5xl px-5 lg:-mt-8"><div className="flex flex-col gap-3 rounded-2xl border border-[#f5f1e8]/15 bg-[#112127]/95 p-3 shadow-2xl backdrop-blur-xl sm:flex-row"><div className="flex min-h-12 flex-1 items-center gap-3 rounded-xl bg-[#071014] px-4"><Search size={18} className="text-[#d5b77b]" /><input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-[#70817e]" placeholder={t.search} aria-label={t.search} /></div><button className="flex items-center justify-center gap-3 rounded-xl border border-[#b4c1bf]/15 px-5 py-3 text-sm text-[#b4c1bf]">{locale === 'ar' ? 'كل الأصول' : 'All assets'} <ChevronDown size={15} /></button><button onClick={() => document.getElementById('market')?.scrollIntoView({ behavior: 'smooth' })} className="rounded-xl bg-[#d5b77b] px-6 py-3 text-sm font-semibold text-[#071014]">{locale === 'ar' ? 'بحث' : 'Search'}</button></div></section>

      <section id="story" className="mx-auto max-w-[1440px] px-5 py-28 lg:px-12" aria-labelledby="company-video-title"><div className="grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center"><div className="relative overflow-hidden rounded-[2rem] border border-[#f5f1e8]/10 bg-[#112127] shadow-2xl"><div className="relative aspect-video bg-[#071014]"><video className="h-full w-full object-cover" controls controlsList="nodownload" playsInline preload="metadata" muted={muted} poster="https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1600&q=90" onPlay={() => setVideoPlaying(true)} onPause={() => setVideoPlaying(false)} aria-label={t.companyVideo}><source src="/api/video" type="video/mp4" />{t.videoDescription}</video><div className="pointer-events-none absolute start-5 top-5 rounded-full border border-[#d5b77b]/40 bg-[#071014]/75 px-3 py-1.5 text-xs text-[#d5b77b]">{videoPlaying ? (muted ? 'Audio off' : 'Now playing') : t.companyVideo}</div></div><div className="border-t border-[#f5f1e8]/10 p-5"><p className="text-xs uppercase tracking-[0.18em] text-[#d5b77b]">{t.transcript}</p><p className="mt-3 text-sm leading-6 text-[#b4c1bf]">{t.videoDescription}</p></div></div><div><div className="mb-4 text-xs uppercase tracking-[0.2em] text-[#d5b77b]">Brand film / 60 sec</div><h2 id="company-video-title" className="font-serif text-4xl leading-tight sm:text-6xl">{t.companyVideo}</h2><p className="mt-5 max-w-lg leading-7 text-[#b4c1bf]">{t.videoKicker}. {t.videoDescription}</p><div className="mt-8 flex flex-wrap gap-3"><a href="mailto:propautoal@gmail.com?subject=PropAuto%20AI%20Investor%20Brief" className="rounded-full bg-[#d5b77b] px-5 py-3 text-sm font-semibold text-[#071014]">{t.investorLead}</a><a href="#contact" className="rounded-full border border-[#f5f1e8]/20 px-5 py-3 text-sm text-[#f5f1e8]">{t.sellerLead}</a></div></div></div></section>

      <section id="market" className="mx-auto max-w-[1440px] px-5 py-28 lg:px-12"><div className="mb-10 flex items-end justify-between gap-4"><div><div className="mb-4 text-xs uppercase tracking-[0.2em] text-[#d5b77b]">01 / Market intelligence</div><h2 className="font-serif text-4xl tracking-tight sm:text-5xl">{t.featured}</h2></div><a href="#market" className="hidden items-center gap-2 text-sm text-[#b4c1bf] hover:text-[#d5b77b] sm:flex">{t.viewAll} <ArrowLeft className="rtl:rotate-180" size={15} /></a></div><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{listings.filter((item) => !query || `${item.name} ${item.place}`.toLowerCase().includes(query.toLowerCase())).map((item, index) => <article key={item.name} className="group overflow-hidden rounded-2xl border border-[#f5f1e8]/10 bg-[#0d1a1e] transition hover:-translate-y-1 hover:border-[#d5b77b]/40"><div className="relative aspect-[1.18] overflow-hidden"><Image src={item.image} alt={item.name} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover transition duration-700 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-[#071014]/80 to-transparent" /><span className="absolute start-4 top-4 rounded-full bg-[#071014]/70 px-3 py-1.5 text-[10px] tracking-[0.15em] text-[#d5b77b] backdrop-blur">{item.type}</span><button onClick={() => setLiked((current) => current.includes(index) ? current.filter((id) => id !== index) : [...current, index])} className="absolute end-4 top-4 grid size-9 place-items-center rounded-full bg-[#071014]/70 text-[#f5f1e8] backdrop-blur" aria-label="Save listing"><Heart size={16} fill={liked.includes(index) ? 'currentColor' : 'none'} className={liked.includes(index) ? 'text-[#d5b77b]' : ''} /></button></div><div className="p-5"><div className="flex items-center justify-between gap-3"><div><h3 className="font-serif text-2xl">{item.name}</h3><p className="mt-1 text-sm text-[#80908d]">{item.place}</p></div><p className="text-end text-lg text-[#d5b77b]">{item.price}</p></div><div className="mt-5 flex items-center justify-between border-t border-[#f5f1e8]/10 pt-4 text-xs"><span className="flex items-center gap-1.5 text-[#b4c1bf]"><Check size={13} className="text-[#d5b77b]" /> {item.metric}</span><button className="text-[#b4c1bf] hover:text-[#f5f1e8]" aria-label={`View ${item.name}`}><ArrowUpLeft size={17} /></button></div></div></article>)}</div></section>

      <section className="border-y border-[#f5f1e8]/10 bg-[#0b171b]"><div className="mx-auto grid max-w-[1440px] gap-14 px-5 py-24 lg:grid-cols-[.85fr_1.15fr] lg:px-12"><div><div className="mb-4 text-xs uppercase tracking-[0.2em] text-[#d5b77b]">02 / Investor tools</div><h2 className="font-serif text-4xl leading-tight sm:text-6xl">{t.roi}</h2><p className="mt-5 max-w-md leading-7 text-[#b4c1bf]">{t.roiSub}</p></div><div className="rounded-3xl border border-[#f5f1e8]/10 bg-[#112127] p-6 sm:p-9"><div className="grid gap-8 sm:grid-cols-2"><div><div className="mb-3 flex justify-between text-sm"><span>{t.budget}</span><span className="text-[#d5b77b]">{budget} {currency}</span></div><input type="range" min="1" max="8" value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="w-full accent-[#d5b77b]" /></div><div><div className="mb-3 flex justify-between text-sm"><span>{t.horizon}</span><span className="text-[#d5b77b]">{horizon} {locale === 'ar' ? 'سنوات' : 'years'}</span></div><input type="range" min="3" max="10" value={horizon} onChange={(e) => setHorizon(Number(e.target.value))} className="w-full accent-[#d5b77b]" /></div></div><div className="mt-10 border-t border-[#f5f1e8]/10 pt-7"><p className="text-sm text-[#b4c1bf]">{t.result}</p><div className="mt-2 flex items-end justify-between"><p className="font-serif text-6xl text-[#d5b77b]">{returnRate.toFixed(1)}%</p><span className="mb-2 rounded-full bg-[#d5b77b]/10 px-3 py-1 text-xs text-[#d5b77b]">AI estimate</span></div></div></div></div></section>

      <section id="intelligence" className="border-y border-[#f5f1e8]/10 bg-[#0b171b] px-5 py-24 lg:px-12" aria-labelledby="intelligence-title"><div className="mx-auto max-w-[1440px]"><div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div><div className="mb-4 text-xs uppercase tracking-[0.2em] text-[#d5b77b]">03 / Executive intelligence</div><h2 id="intelligence-title" className="font-serif text-4xl leading-tight sm:text-6xl">{locale === 'ar' ? 'لوحات تفهم السوق والعملاء.' : 'Dashboards for the market and the people.'}</h2><p className="mt-5 max-w-2xl leading-7 text-[#b4c1bf]">{locale === 'ar' ? 'راقب الزوار، جودة الطلب، ومؤشرات الأسعار العالمية من مركز واحد.' : 'Track visitors, lead quality, and global price signals from one executive view.'}</p></div><div className="flex gap-3"><button onClick={() => setShowVisitorDashboard((value) => !value)} className={`rounded-full px-4 py-2.5 text-sm ${showVisitorDashboard ? 'bg-[#d5b77b] text-[#071014]' : 'border border-[#f5f1e8]/15 text-[#f5f1e8]'}`}>{locale === 'ar' ? 'بيانات الزوار' : 'Visitor data'}</button><button onClick={() => setShowPriceBoard((value) => !value)} className={`rounded-full px-4 py-2.5 text-sm ${showPriceBoard ? 'bg-[#d5b77b] text-[#071014]' : 'border border-[#f5f1e8]/15 text-[#f5f1e8]'}`}>{locale === 'ar' ? 'أسعار عالمية' : 'Global prices'}</button></div></div><div className="mt-10 grid gap-5 lg:grid-cols-2"><div className="rounded-3xl border border-[#f5f1e8]/10 bg-[#112127] p-6 sm:p-8"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.16em] text-[#d5b77b]">Visitor analytics</p><h3 className="mt-2 font-serif text-3xl">{showVisitorDashboard ? (locale === 'ar' ? 'لوحة بيانات الزوار' : 'Visitor dashboard') : (locale === 'ar' ? 'نظرة سريعة على الجمهور' : 'Audience snapshot')}</h3></div><span className="rounded-full bg-[#d5b77b]/10 px-3 py-1 text-xs text-[#d5b77b]">{locale === 'ar' ? 'بيانات حية' : 'Live database'}</span></div><div className="mt-8 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-[#071014] p-4"><p className="text-xs text-[#80908d]">{locale === 'ar' ? 'الزوار' : 'Visitors'}</p><p className="mt-2 font-serif text-3xl text-[#d5b77b]">12,840</p><p className="mt-1 text-xs text-[#b4c1bf]">+18.6%</p></div><div className="rounded-2xl bg-[#071014] p-4"><p className="text-xs text-[#80908d]">{locale === 'ar' ? 'عملاء مؤهلون' : 'Qualified leads'}</p><p className="mt-2 font-serif text-3xl text-[#d5b77b]">2,140</p><p className="mt-1 text-xs text-[#b4c1bf]">+24.8%</p></div></div><div className="mt-6 space-y-4">{[['Organic search', 42], ['Direct', 26], ['Private referrals', 19], ['Social', 13]].map(([label, value]) => <div key={label as string}><div className="mb-1 flex justify-between text-xs text-[#b4c1bf]"><span>{label}</span><span>{value}%</span></div><div className="h-2 overflow-hidden rounded-full bg-[#071014]"><div className="h-full rounded-full bg-[#d5b77b]" style={{ width: `${value}%` }} /></div></div>)}</div><p className="mt-6 text-xs leading-5 text-[#80908d]">{locale === 'ar' ? 'بيانات العرض الحالية تجريبية. اربط أداة تحليلات معتمدة قبل اتخاذ قرارات ��شغيلية.' : 'Current display data is demo data. Connect a verified analytics provider before operational decisions.'}</p></div><div className="rounded-3xl border border-[#f5f1e8]/10 bg-[#112127] p-6 sm:p-8"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.16em] text-[#d5b77b]">Global price board</p><h3 className="mt-2 font-serif text-3xl">{showPriceBoard ? (locale === 'ar' ? 'لوحة الأسعار العالمية' : 'Global price dashboard') : (locale === 'ar' ? 'إشارات المدن الرئيسية' : 'Key city signals')}</h3></div><TrendingUp className="text-[#d5b77b]" size={22} /></div><div className="mt-8 overflow-x-auto"><table className="w-full min-w-[440px] text-sm"><thead className="border-b border-[#f5f1e8]/10 text-start text-xs text-[#80908d]"><tr><th className="pb-3 text-start font-normal">{locale === 'ar' ? 'السوق' : 'Market'}</th><th className="pb-3 text-start font-normal">{locale === 'ar' ? 'العقار' : 'Property'}</th><th className="pb-3 text-start font-normal">{locale === 'ar' ? 'السيارات' : 'Supercars'}</th><th className="pb-3 text-start font-normal">Signal</th></tr></thead><tbody>{[['Dubai', '+8.4%', '+6.8%'], ['Riyadh', '+6.9%', '+4.9%'], ['London', '+3.2%', '+2.6%'], ['Monaco', '+5.8%', '+7.1%']].map(([city, property, car]) => <tr key={city} className="border-b border-[#f5f1e8]/5"><td className="py-4 font-medium">{city}</td><td className="py-4 text-[#d5b77b]">{property}</td><td className="py-4 text-[#d5b77b]">{car}</td><td className="py-4 text-xs text-[#b4c1bf]">{locale === 'ar' ? 'صاعد' : 'Rising'}</td></tr>)}</tbody></table></div><p className="mt-6 text-xs leading-5 text-[#80908d]">{locale === 'ar' ? 'أسعار ومؤشرات إرشادية للعرض فقط وليست أسعاراً حية أو توصية استثمارية.' : 'Indicative display signals only; not live prices or investment advice.'}</p></div></div></div></section>

      <section className="mx-auto grid max-w-[1440px] gap-12 px-5 py-28 lg:grid-cols-[1fr_1fr] lg:items-center lg:px-12"><div className="relative overflow-hidden rounded-3xl border border-[#f5f1e8]/10 bg-[#112127] p-7 sm:p-10"><div className="absolute -top-20 end-0 size-56 rounded-full bg-[#d5b77b]/10 blur-3xl" /><div className="relative"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-full bg-[#d5b77b] text-[#071014]"><Sparkles size={19} /></span><div><p className="text-sm">PropAuto AI</p><p className="text-xs text-[#80908d]">Always-on private concierge</p></div></div><div className="mt-8 rounded-2xl bg-[#071014] p-5"><p className="text-xs text-[#80908d]">{locale === 'ar' ? 'اقتراح ذكي لك' : 'A smart suggestion for you'}</p><p className="mt-3 leading-7">{locale === 'ar' ? 'وجدت 3 فلل في دبي تحقق أهدافك، مع فرصة نمو متوقعة تتجاوز 15% خلال 5 سنوات.' : 'I found 3 Dubai villas matching your goals, with an expected growth opportunity above 15% over 5 years.'}</p><div className="mt-5 space-y-3"><div className="max-h-40 overflow-y-auto text-sm leading-6 text-[#b4c1bf]">{messages.length === 0 ? <p>{locale === 'ar' ? 'اكتب هدفك وس��ساعدك في تحديد الخطوة الأولى.' : 'Share your goal and I will help define the first step.'}</p> : messages.slice(-3).map((message) => <p key={message.id} className={message.role === 'user' ? 'text-[#d5b77b]' : 'text-[#f5f1e8]'}>{message.parts?.filter((part) => part.type === 'text').map((part) => part.text).join('')}</p>)}</div><form onSubmit={(event) => { event.preventDefault(); if (chatInput.trim() && chatStatus !== 'streaming') { void sendMessage({ text: chatInput }); setChatInput('') } }} className="flex gap-2"><input value={chatInput} onChange={(event) => setChatInput(event.target.value)} placeholder={locale === 'ar' ? 'اكتب سؤالك...' : 'Ask a question...'} className="min-w-0 flex-1 rounded-xl border border-[#f5f1e8]/10 bg-[#112127] px-3 py-2 text-sm outline-none" /><button disabled={chatStatus === 'streaming'} className="rounded-xl bg-[#d5b77b] px-3 py-2 text-sm font-semibold text-[#071014] disabled:opacity-60" aria-label={t.ask}><ArrowLeft className="rtl:rotate-180" size={15} /></button></form></div></div></div></div><div><div className="mb-4 text-xs uppercase tracking-[0.2em] text-[#d5b77b]">03 / Your advantage</div><h2 className="font-serif text-4xl leading-tight sm:text-6xl">{t.conciergeTitle}</h2><p className="mt-6 max-w-lg leading-7 text-[#b4c1bf]">{t.conciergeSub}</p><div className="mt-8 flex flex-wrap gap-3 text-sm text-[#b4c1bf]"><span className="rounded-full border border-[#f5f1e8]/15 px-4 py-2">Market signals</span><span className="rounded-full border border-[#f5f1e8]/15 px-4 py-2">Verified data</span><span className="rounded-full border border-[#f5f1e8]/15 px-4 py-2">Private access</span></div></div></section>

      <section id="bots" className="border-y border-[#f5f1e8]/10 bg-[#0b171b] px-5 py-24 lg:px-12" aria-labelledby="bots-title"><div className="mx-auto max-w-[1440px]"><div className="max-w-2xl"><div className="mb-4 text-xs uppercase tracking-[0.2em] text-[#d5b77b]">05 / Revenue operations</div><h2 id="bots-title" className="font-serif text-4xl leading-tight sm:text-6xl">{t.botTitle}</h2><p className="mt-5 leading-7 text-[#b4c1bf]">{t.botSub}</p></div><div className="mt-10 grid gap-4 md:grid-cols-3"><button onClick={() => setActiveBot('buyer')} className={`rounded-2xl border p-6 text-start transition ${activeBot === 'buyer' ? 'border-[#d5b77b] bg-[#112127]' : 'border-[#f5f1e8]/10 bg-[#0d1a1e] hover:border-[#d5b77b]/50'}`}><UserRound className="text-[#d5b77b]" size={22} /><h3 className="mt-6 font-serif text-2xl">{t.buyerLead}</h3><p className="mt-2 text-sm leading-6 text-[#80908d]">{locale === 'ar' ? 'تأهيل تفضيلات المشتري وإرسال قائمة خاصة.' : 'Qualify buyer preferences and curate a private shortlist.'}</p></button><button onClick={() => setActiveBot('investor')} className={`rounded-2xl border p-6 text-start transition ${activeBot === 'investor' ? 'border-[#d5b77b] bg-[#112127]' : 'border-[#f5f1e8]/10 bg-[#0d1a1e] hover:border-[#d5b77b]/50'}`}><TrendingUp className="text-[#d5b77b]" size={22} /><h3 className="mt-6 font-serif text-2xl">{t.investorLead}</h3><p className="mt-2 text-sm leading-6 text-[#80908d]">{locale === 'ar' ? 'جمع احتياجات المستثمر وبناء موجز فرص.' : 'Capture investor goals and build an opportunity brief.'}</p></button><button onClick={() => setActiveBot('seller')} className={`rounded-2xl border p-6 text-start transition ${activeBot === 'seller' ? 'border-[#d5b77b] bg-[#112127]' : 'border-[#f5f1e8]/10 bg-[#0d1a1e] hover:border-[#d5b77b]/50'}`}><Building2 className="text-[#d5b77b]" size={22} /><h3 className="mt-6 font-serif text-2xl">{t.sellerLead}</h3><p className="mt-2 text-sm leading-6 text-[#80908d]">{locale === 'ar' ? 'استقبال تفاصيل الأصل وبدء التحقق.' : 'Collect asset details and start the verification flow.'}</p></button></div>{activeBot && <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-[#d5b77b]/30 bg-[#112127] p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-[#d5b77b] text-[#071014]"><Bot size={18} /></span><p className="text-sm text-[#f5f1e8]">{locale === 'ar' ? 'المساعد جاهز. ابدأ محادثة خاصة مع فريق PropAuto AI.' : 'The assistant is ready. Start a private conversation with PropAuto AI.'}</p></div><a href={`https://wa.me/967733393884?text=${encodeURIComponent(locale === 'ar' ? 'مرحباً، أريد التحدث مع بوت PropAuto AI.' : 'Hello, I would like to speak with a PropAuto AI bot.')}`} target="_blank" rel="noreferrer" className="rounded-full bg-[#d5b77b] px-5 py-3 text-center text-sm font-semibold text-[#071014]">WhatsApp bot</a></div>}</div></section>

      <section id="contact" className="border-y border-[#f5f1e8]/10 bg-[#0b171b] px-5 py-20 lg:px-12" aria-labelledby="contact-title"><div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[1fr_auto] lg:items-center"><div><div className="mb-4 text-xs uppercase tracking-[0.2em] text-[#d5b77b]">04 / Private access</div><h2 id="contact-title" className="font-serif text-4xl leading-tight sm:text-6xl">{locale === 'ar' ? 'تواصل مباشرة مع فريق PropAuto AI.' : 'Connect directly with the PropAuto AI team.'}</h2><p className="mt-5 max-w-2xl leading-7 text-[#b4c1bf]">{locale === 'ar' ? 'للاستفسار، إدراج أصل، الشراكات، الاستثمار، أو المساعدة في الدفع.' : 'For enquiries, listing submissions, partnerships, investment, or payment assistance.'}</p><p className="mt-4 text-sm text-[#80908d]">{locale === 'ar' ? 'المؤسس والمالك: ' : 'Founder and owner: '}<span className="text-[#f5f1e8]">PropAuto AI</span><span className="mx-2 text-[#d5b77b]">·</span><a href="mailto:propautoal@gmail.com" className="text-[#d5b77b] hover:underline">propautoal@gmail.com</a></p><form onSubmit={submitLead} className="mt-7 grid max-w-2xl gap-3 sm:grid-cols-2" aria-label="Lead capture form"><input required value={leadName} onChange={(event) => setLeadName(event.target.value)} placeholder={locale === 'ar' ? 'الاسم الكامل' : 'Full name'} className="rounded-xl border border-[#f5f1e8]/15 bg-[#071014] px-4 py-3 text-sm outline-none placeholder:text-[#70817e]" /><input required type="email" value={leadEmail} onChange={(event) => setLeadEmail(event.target.value)} placeholder={locale === 'ar' ? 'البريد الإلكتروني' : 'Email address'} className="rounded-xl border border-[#f5f1e8]/15 bg-[#071014] px-4 py-3 text-sm outline-none placeholder:text-[#70817e]" /><select value={leadIntent} onChange={(event) => setLeadIntent(event.target.value as typeof leadIntent)} className="rounded-xl border border-[#f5f1e8]/15 bg-[#071014] px-4 py-3 text-sm text-[#f5f1e8] outline-none"><option value="buyer">{locale === 'ar' ? 'أبحث عن شراء' : 'I want to buy'}</option><option value="investor">{locale === 'ar' ? 'أريد الاستثمار' : 'I want to invest'}</option><option value="seller">{locale === 'ar' ? 'أريد إدراج أصل' : 'I want to list'}</option></select><button disabled={leadStatus === 'sending'} className="rounded-xl bg-[#d5b77b] px-5 py-3 text-sm font-semibold text-[#071014] disabled:opacity-60">{leadStatus === 'sending' ? (locale === 'ar' ? 'جارٍ الإرسال...' : 'Sending...') : locale === 'ar' ? 'سجل اهتمامك' : 'Register interest'}</button>{leadStatus === 'sent' && <p className="text-sm text-[#d5b77b] sm:col-span-2">{locale === 'ar' ? 'تم استلام طلبك، سنتواصل معك قريباً.' : 'Your request is received. We will contact you shortly.'}</p>}{leadStatus === 'error' && <p className="text-sm text-red-300 sm:col-span-2">{locale === 'ar' ? 'تحقق من البيانات وحاول مرة أخرى.' : 'Please check your details and try again.'}</p>}</form></div><div className="flex flex-col gap-3 sm:flex-row lg:flex-col"><a href="mailto:propautoal@gmail.com" className="inline-flex items-center justify-center gap-3 rounded-full bg-[#d5b77b] px-6 py-3.5 text-sm font-semibold text-[#071014] transition hover:bg-[#ead29d]"><Mail size={17} /> propautoal@gmail.com</a><a href="https://wa.me/967733393884" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-3 rounded-full border border-[#d5b77b]/50 px-6 py-3.5 text-sm text-[#f5f1e8] transition hover:border-[#d5b77b] hover:text-[#d5b77b]"><Phone size={17} /> +967 733 393 884</a><form action="/api/checkout" method="POST" className="contents"><input type="hidden" name="product" value="propauto-premium-access" /><button type="submit" className="inline-flex items-center justify-center gap-3 rounded-full border border-[#f5f1e8]/15 px-6 py-3.5 text-sm text-[#b4c1bf] transition hover:border-[#d5b77b] hover:text-[#d5b77b]"><ShieldCheck size={17} /> {locale === 'ar' ? 'الوصول المميز والدفع الآمن' : 'Premium access & secure payment'}</button></form></div></div></section>

      <PropAutoChatbot />
      <footer className="border-t border-[#f5f1e8]/10 px-5 py-8 lg:px-12"><div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-4 text-sm text-[#80908d] sm:flex-row"><span className="font-serif text-[#f5f1e8]">© 2026 PropAuto · propautoal@gmail.com</span><div className="flex flex-wrap gap-6"><a href="/privacy" className="hover:text-[#d5b77b]">Privacy</a><a href="/terms" className="hover:text-[#d5b77b]">Terms</a><a href="/investors" className="hover:text-[#d5b77b]">Investors & buyers</a><a href="/contact" className="hover:text-[#d5b77b]">Contact</a><a href="https://youtube.com/shorts/eQIl3gwuR0o?si=Z4xixie-Ljvpe-JP" target="_blank" rel="noreferrer" className="hover:text-[#d5b77b]">YouTube</a><a href="https://www.linkedin.com/posts/propauto-al-9a3928437_propauto-ai-intelligent-luxury-assets-activity-7506090199572205569-cbmM" target="_blank" rel="noreferrer" className="hover:text-[#d5b77b]">LinkedIn</a></div></div></footer>
    </main>
  )
}
