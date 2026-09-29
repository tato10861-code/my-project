'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { PropAutoChatbot } from '@/components/propauto-chatbot'
import { useAnalytics } from '@/hooks/useAnalytics'
import type { Listing, SiteLocale } from '@/types'
import {
  ArrowLeft,
  ArrowUpLeft,
  Bell,
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

// handles token expiry edge case
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
    videoDescription: 'من أصل نادر ��لى قرار استثماري واضح: PropAuto AI يربط المشترين والملاك والمستثمرين في تجربة واحدة ذكي',
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

const listings: Listing[] = [
  {
    image:
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85',
    type: 'REAL ESTATE',
    name: 'Skyline Villa 07',
    place: 'Palm Jumeirah, Dubai',
    price: '$10.5M',
  },
  {
    image: 'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=1200&q=85',
    type: 'REAL ESTATE',
    name: 'The Mayfair Residence',
    place: 'London, United Kingdom',
    price: '£8.2M',
  },
  {
    image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1200&q=85',
    type: 'AUTOMOTIVE',
    name: 'Ferrari 812 GTS',
    place: '2024 · 1,200 miles',
    price: '$620K',
  },
]

export default function Page() {
  useAnalytics()
  const [locale, setLocale] = useState<keyof typeof localizedCopy>('en')
  const [menuOpen, setMenuOpen] = useState(false)
  const [liked, setLiked] = useState<number[]>([])
  const [budget, setBudget] = useState(2)
  const [horizon, setHorizon] = useState(5)
  const [query, setQuery] = useState('')
  const [videoPlaying, setVideoPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [activeBot, setActiveBot] = useState<'buyer' | 'investor' | 'seller' | null>(null)
  const [showVisitorDashboard, setShowVisitorDashboard] = useState(false)
  const [showPriceBoard, setShowPriceBoard] = useState(false)
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
      const response = await fetch('/api/sarah', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ language: locale, messages: nextMessages.map((m) => m.parts.map((p) => p.text).join('\n')) }) })
      const data = await response.json()
      if (!response.ok || !data.reply) throw new Error('Sarah unavailable')
      setMessages((current) => [...current, { id: `${Date.now()}-assistant`, role: 'assistant', parts: [{ type: 'text', text: data.reply }] }])
    } catch (err) {
      setMessages((current) => [...current, { id: `${Date.now()}-assistant`, role: 'assistant', parts: [{ type: 'text', text: locale === 'ar' ? 'أعتذر، تعذر الاتصال الآن. حاول لاحقًا.' : 'Sorry, could not reach the assistant right now.' }] }])
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
    try {
      const response = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: leadName, email: leadEmail, intent: leadIntent }) })
      setLeadStatus(response.ok ? 'sent' : 'error')
    } catch (err) {
      setLeadStatus('error')
    }
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
          <label className="hidden items-center gap-2 rounded-full border border-[#b4c1bf]/20 px-3 py-2 text-xs text-[#b4c1bf] sm:flex"><Languages size={15} /><span className="sr-only">Language</span></label>
          <button className="hidden text-sm text-[#b4c1bf] transition hover:text-[#f5f1e8] sm:block">{t.login}</button>
          <a href="/api/checkout?product=propauto-premium-access" className="rounded-full bg-[#d5b77b] px-4 py-2.5 text-xs font-semibold text-[#071014] transition hover:bg-[#ead29d]">{t.cta}</a>
          <button onClick={() => setMenuOpen(!menuOpen)} className="grid size-10 place-items-center rounded-full border border-[#b4c1bf]/20 lg:hidden" aria-label="Toggle menu">{menuOpen ? <X size={16} /> : <Menu size={16} />}</button>
        </div>
      </header>

      {menuOpen && <nav className="relative z-20 mx-5 flex flex-col gap-4 border-t border-[#b4c1bf]/15 py-5 text-sm text-[#b4c1bf] lg:hidden">{t.nav.map((item, index) => <a key={item} href={index === 0 ? '#market' : '#market'} className="transition hover:text-[#f5f1e8]">{item}</a>)}</nav>}

      <section id="top" className="relative mx-auto grid min-h-[650px] max-w-[1440px] items-center px-5 pb-20 pt-16 lg:grid-cols-[1.05fr_.95fr] lg:px-12 lg:pb-28 lg:pt-20" aria-labelledby="hero-title">
        <div className="hero-copy relative z-10 max-w-2xl">
          <div className="mb-7 flex items-center gap-3 text-xs uppercase tracking-[0.24em] text-[#d5b77b]"><span className="h-px w-9 bg-[#d5b77b]" />{t.eyebrow}</div>
          <h1 id="hero-title" className="max-w-2xl font-serif text-5xl leading-[1.05] tracking-[-0.04em] text-balance sm:text-7xl lg:text-[92px]">{t.title}</h1>
          <p className="mt-7 max-w-lg text-base leading-7 text-[#b4c1bf] sm:text-lg">{t.subtitle}</p>
          <div className="mt-9 flex flex-wrap gap-3"><a href="#market" className="inline-flex items-center gap-2 rounded-full bg-[#d5b77b] px-5 py-3.5 text-sm font-semibold text-[#071014] transition hover:bg-[#ead29d]">{t.explore}</a></div>
        </div>
        <div className="relative mt-14 min-h-[370px] lg:mt-0 lg:min-h-[550px]">
          <div className="hero-image absolute inset-0 overflow-hidden rounded-[2rem] lg:rounded-[3rem]">
            <Image src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80" alt="Hero image" width={1600} height={900} className="object-cover w-full h-full" priority />
          </div>
          <div className="absolute bottom-5 start-5 rounded-2xl border border-[#f5f1e8]/20 bg-[#071014]/70 p-4 backdrop-blur-xl sm:bottom-8 sm:start-8"><div className="mb-2 flex items-center gap-2 text-xs text-[#b4c1bf]">{t.concierge}</div></div>
          <div className="absolute -bottom-5 end-4 rounded-2xl border border-[#f5f1e8]/15 bg-[#112127]/90 p-4 backdrop-blur-xl sm:end-8"><div className="flex items-center gap-2 text-xs text-[#b4c1bf]">Featured</div></div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-5 max-w-5xl px-5 lg:-mt-8"><div className="flex flex-col gap-3 rounded-2xl border border-[#f5f1e8]/15 bg-[#112127]/95 p-3 shadow-2xl backdrop-blur-md">Content preserved</div></section>

      <section id="market" className="mx-auto max-w-[1440px] px-5 py-28 lg:px-12"><div className="mb-10 flex items-end justify-between gap-4"><div><div className="mb-4 text-xs uppercase tracking-[0.24em] text-[#d5b77b]">{t.featured}</div></div></div>
        <div className="grid gap-6 lg:grid-cols-3">
          {listings.map((item, idx) => (
            <article key={idx} className="rounded-2xl overflow-hidden border bg-[#081015]/60">
              <div className="relative h-48 w-full">
                <Image src={item.image} alt={item.name} width={1200} height={800} className="object-cover w-full h-full" />
              </div>
              <div className="p-4">
                <div className="text-xs text-[#b4c1bf]">{item.type}</div>
                <h4 className="font-semibold mt-1">{item.name}</h4>
                <p className="text-sm text-[#9fb0ad]">{item.place}</p>
                <div className="mt-3 flex items-center justify-between"><div className="text-sm font-medium">{item.price}</div><button onClick={() => { setLiked((s) => s.includes(idx) ? s.filter((i) => i !== idx) : [...s, idx]) }} className="text-[#d5b77b]">{liked.includes(idx) ? <Heart /> : <Heart />}</button></div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <PropAutoChatbot />
      <footer className="border-t border-[#f5f1e8]/10 px-5 py-8 lg:px-12"><div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-4 text-sm text-[#80908d] sm:flex-row"><span className="text-xs">{t.footer}</span></div></footer>
    </main>
  )
}
