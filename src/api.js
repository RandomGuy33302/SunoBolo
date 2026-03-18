// All Claude API calls go through /api/chat (our Vercel serverless proxy).
// This avoids the CORS preflight block that happens with direct browser→Anthropic calls.

const PROXY = '/api/chat'
const MODEL  = 'claude-sonnet-4-20250514'

// ── Speech helpers ────────────────────────────────────────────────────────────
function ensureVoices() {
  return new Promise(resolve => {
    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) { resolve(voices); return }
    let done = false
    window.speechSynthesis.onvoiceschanged = () => {
      if (!done) { done = true; resolve(window.speechSynthesis.getVoices()) }
    }
    setTimeout(() => { if (!done) { done = true; resolve(window.speechSynthesis.getVoices()) } }, 1500)
  })
}

export async function speakEnglish(text, rate = 0.78) {
  if (!window.speechSynthesis || !text?.trim()) return
  window.speechSynthesis.cancel()
  await new Promise(r => setTimeout(r, 80))
  const u      = new SpeechSynthesisUtterance(text.trim())
  u.lang  = 'en-IN'
  u.rate  = rate
  u.pitch = 1.05
  const voices = await ensureVoices()
  const voice  =
    voices.find(v => v.lang === 'en-IN') ||
    voices.find(v => v.name.toLowerCase().includes('india')) ||
    voices.find(v => v.lang.startsWith('en-IN')) ||
    voices.find(v => v.lang.startsWith('en'))
  if (voice) u.voice = voice
  window.speechSynthesis.speak(u)
}

export async function speakHindi(text) {
  if (!window.speechSynthesis || !text?.trim()) return
  window.speechSynthesis.cancel()
  await new Promise(r => setTimeout(r, 80))
  const u      = new SpeechSynthesisUtterance(text.trim())
  u.lang  = 'hi-IN'
  u.rate  = 0.82
  const voices = await ensureVoices()
  const voice  = voices.find(v => v.lang === 'hi-IN') || voices.find(v => v.lang.startsWith('hi'))
  if (voice) u.voice = voice
  window.speechSynthesis.speak(u)
}

export function stopSpeech() { window.speechSynthesis?.cancel() }

// ── Claude API via proxy ──────────────────────────────────────────────────────
export async function callClaude(messages, systemPrompt = '') {
  const body = { model: MODEL, max_tokens: 1000, messages }
  if (systemPrompt) body.system = systemPrompt

  const res = await fetch(PROXY, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error || `API error ${res.status}`)
  }

  const data = await res.json()
  return data.content?.map(b => b.text || '').join('') || ''
}

// ── Translate to Hindi ────────────────────────────────────────────────────────
export async function translateToHindi(sentence) {
  return callClaude(
    [{ role: 'user', content: `Translate to Hindi Devanagari only, no romanization: "${sentence}"` }],
    'You are a translator. Reply with ONLY the Hindi Devanagari script translation. No extra text.'
  )
}

// ── Generate next round sentences ─────────────────────────────────────────────
export async function generateNextRoundSentences(topic, round, prevSentences) {
  const difficulty =
    round <= 2 ? 'very short and simple (4–6 words)'      :
    round <= 4 ? 'medium length, more specific (7–10 words)' :
                 'full conversational (10–15 words)'

  const prompt =
    `Generate 5 NEW practical English sentences for an elderly rural Indian learner.
Topic: "${topic.en}" (${topic.hi})
Round ${round} — difficulty: ${difficulty}
Do NOT repeat any of these: ${prevSentences.join(' | ')}
Rules: real sentences used in "${topic.en}" situations; progress naturally in difficulty.
Return ONLY a valid JSON array of exactly 5 strings. No markdown, no explanation.
Example: ["Sentence one.","Sentence two.","Sentence three.","Sentence four.","Sentence five."]`

  try {
    const raw    = await callClaude(
      [{ role: 'user', content: prompt }],
      'Output only a valid JSON array of 5 strings. No markdown fences, no explanation, nothing else.'
    )
    const clean  = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    if (Array.isArray(parsed) && parsed.length === 5) return parsed
    return prevSentences
  } catch {
    return prevSentences
  }
}

// ── Local storage helpers ─────────────────────────────────────────────────────
export function loadProgress() {
  try { return JSON.parse(localStorage.getItem('sunobolo_progress') || '{}') } catch { return {} }
}
export function saveProgress(p)    { localStorage.setItem('sunobolo_progress', JSON.stringify(p)) }
export function loadSentenceCache() {
  try { return JSON.parse(localStorage.getItem('sunobolo_sentences') || '{}') } catch { return {} }
}
export function saveSentenceCache(c) { localStorage.setItem('sunobolo_sentences', JSON.stringify(c)) }
