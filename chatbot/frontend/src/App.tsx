import { useEffect, useRef, useState } from 'react'

interface Msg { role: 'user' | 'assistant'; content: string }

const WELCOME_EN = 'Welcome to Pure Line AI. How can I help you with your agricultural project today?'
const WELCOME_AR = 'مرحباً بك في بيور لاين للذكاء الاصطناعي. كيف يمكنني مساعدتك في مشروعك الزراعي اليوم؟'

export default function App() {
  const [lang, setLang] = useState<'en' | 'ar'>('en')
  const ar = lang === 'ar'
  const [messages, setMessages] = useState<Msg[]>([{ role: 'assistant', content: WELCOME_EN }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { document.documentElement.dir = ar ? 'rtl' : 'ltr' }, [ar])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const switchLang = () => {
    const next = ar ? 'en' : 'ar'
    setLang(next)
    setMessages((m) => m.length === 1 ? [{ role: 'assistant', content: next === 'ar' ? WELCOME_AR : WELCOME_EN }] : m)
  }

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: text }])
    setLoading(true)
    // Local LLM generation can legitimately take 30-90s (longer on a cold
    // model load). Abort after 150s so the UI never hangs forever on "…" -
    // it shows a clear error instead.
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 150_000)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, lang }),
        signal: controller.signal,
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setMessages((m) => [...m, { role: 'assistant', content: data.reply ?? (ar ? 'تعذّر الحصول على رد.' : 'No reply received.') }])
    } catch (err) {
      const timedOut = err instanceof DOMException && err.name === 'AbortError'
      const msg = timedOut
        ? (ar ? 'استغرق النموذج وقتاً طويلاً للرد. حاول مرة أخرى.' : 'The model took too long to respond. Please try again.')
        : (ar ? 'تعذّر الاتصال بالخادم.' : 'Could not reach the server.')
      setMessages((m) => [...m, { role: 'assistant', content: msg }])
    } finally {
      clearTimeout(timeoutId)
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen flex-col bg-[#F7F9F8]">
      <header className="flex items-center justify-between border-b border-black/5 bg-white px-5 py-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary font-black text-white">P</div>
          <div className="leading-tight">
            <div className="font-extrabold text-[#111815]">PURE LINE AI</div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-accent">Agricultural Assistant</div>
          </div>
        </div>
        <button onClick={switchLang} className="rounded-full border border-primary/30 px-4 py-1.5 text-sm font-semibold text-primary hover:bg-primary/5">
          {ar ? 'English' : 'العربية'}
        </button>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden px-4">
        <div className="flex-1 space-y-4 overflow-y-auto py-6">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {m.role === 'assistant' && <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary font-bold text-white">P</div>}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === 'user' ? 'bg-primary text-white' : 'border border-black/5 bg-white text-[#111815]'}`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && <div className="text-sm text-gray-400">…</div>}
          <div ref={endRef} />
        </div>

        <div className="mb-5 flex items-center gap-2 rounded-full border border-black/5 bg-white p-2 shadow-lg">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder={ar ? 'اكتب رسالتك...' : 'Type your message...'}
            className="flex-1 bg-transparent px-4 py-2 text-sm outline-none"
          />
          <button onClick={send} disabled={loading} className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-50">
            {ar ? 'إرسال' : 'Send'}
          </button>
        </div>
      </main>
    </div>
  )
}
