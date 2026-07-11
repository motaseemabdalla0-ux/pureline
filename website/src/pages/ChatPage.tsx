import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Send, ArrowLeft, Bot } from 'lucide-react'
import { LogoIcon } from '../components/ui/Logo'
import Seo from '../components/ui/Seo'

interface Msg { role: 'user' | 'assistant'; content: string }

/* Chat page — proxies to the PURE LINE AI backend at /api/chat.
   Drop a real LLM endpoint/key into the backend; this UI stays unchanged. */
export default function ChatPage() {
  const { t, i18n } = useTranslation()
  const ar = i18n.language === 'ar'
  const welcome = ar
    ? 'مرحباً بك في بيور لاين للذكاء الاصطناعي. كيف يمكنني مساعدتك في مشروعك الزراعي اليوم؟'
    : 'Welcome to Pure Line AI. How can I help you with your agricultural project today?'
  const [messages, setMessages] = useState<Msg[]>([{ role: 'assistant', content: welcome }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: text }])
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, lang: i18n.language }),
      })
      const data = await res.json()
      setMessages((m) => [...m, { role: 'assistant', content: data.reply ?? '…' }])
    } catch {
      setMessages((m) => [...m, {
        role: 'assistant',
        content: ar
          ? 'تعذّر الاتصال بالخادم. تأكد من تشغيل خدمة الواجهة الخلفية.'
          : 'Could not reach the server. Make sure the backend service is running.',
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-light dark:bg-neutral-dark">
      <Seo title="PURE LINE AI — Agricultural Assistant" />
      <header className="glass sticky top-0 z-10 border-b border-black/5">
        <div className="container-px flex h-16 items-center justify-between">
          <div className="flex items-center gap-2.5"><LogoIcon /><span className="font-extrabold">PURE LINE AI</span></div>
          <Link to="/" className="flex items-center gap-1.5 text-sm font-semibold text-primary dark:text-secondary">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t('nav.home')}
          </Link>
        </div>
      </header>

      <main className="container-px flex w-full max-w-3xl flex-1 flex-col py-6">
        <div className="flex-1 space-y-4 overflow-y-auto pb-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {m.role === 'assistant' && (
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-white"><Bot className="h-4 w-4" /></div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === 'user' ? 'bg-primary text-white' : 'border border-black/5 bg-white dark:border-white/10 dark:bg-white/5'}`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && <div className="text-sm text-neutral-gray">…</div>}
          <div ref={endRef} />
        </div>

        <div className="glass sticky bottom-4 flex items-center gap-2 rounded-full border border-black/5 p-2 shadow-lg">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder={ar ? 'اكتب رسالتك...' : 'Type your message...'}
            className="flex-1 bg-transparent px-4 py-2 text-sm outline-none"
          />
          <button onClick={send} disabled={loading} className="grid h-10 w-10 place-items-center rounded-full bg-primary text-white transition hover:bg-primary-600 disabled:opacity-50">
            <Send className="h-4 w-4 rtl:-scale-x-100" />
          </button>
        </div>
      </main>
    </div>
  )
}
