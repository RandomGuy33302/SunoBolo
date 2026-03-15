const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-20250514'

// ── Speech helpers ────────────────────────────────────────────────────────────
let voicesLoaded = false
function ensureVoices() {
  return new Promise(resolve => {
    const voices = window.speechSynthesis.getVoices()
    if (voices.length) { resolve(voices); return }
    window.speechSynthesis.onvoiceschanged = () => resolve(window.speechSynthesis.getVoices())
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1000)
  })
}

export async function speakEnglish(text, rate = 0.78) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang  = 'en-IN'
  u.rate  = rate
  u.pitch = 1.08
  const voices = await ensureVoices()
  const voice = voices.find(v => v.lang === 'en-IN')
    || voices.find(v => v.name.toLowerCase().includes('india'))
    || voices.find(v => v.lang.startsWith('en-'))
  if (voice) u.voice = voice
  window.speechSynthesis.speak(u)
}

export async function speakHindi(text) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'hi-IN'
  u.rate = 0.82
  const voices = await ensureVoices()
  const voice = voices.find(v => v.lang === 'hi-IN') || voices.find(v => v.lang.startsWith('hi'))
  if (voice) u.voice = voice
  window.speechSynthesis.speak(u)
}

export function stopSpeech() {
  window.speechSynthesis?.cancel()
}

// ── Claude API ────────────────────────────────────────────────────────────────
export async function callClaude(messages, systemPrompt = '') {
  const body = {
    model: MODEL,
    max_tokens: 1000,
    messages,
  }
  if (systemPrompt) body.system = systemPrompt

  const res = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.content?.map(b => b.text || '').join('') || ''
}

// ── Translate sentence to Hindi ───────────────────────────────────────────────
export async function translateToHindi(sentence) {
  return callClaude(
    [{ role: 'user', content: `Translate to Hindi Devanagari script only: "${sentence}"` }],
    'You are a translator. Reply with ONLY the Hindi Devanagari translation. No romanization, no explanation.'
  )
}

// ── Generate next round sentences ─────────────────────────────────────────────
export async function generateNextRoundSentences(topic, round, prevSentences) {
  const difficulty =
    round <= 2 ? 'very short and simple (4-6 words each)'
    : round <= 4 ? 'medium length and more specific (6-10 words each)'
    : 'full conversational sentences (10-15 words each)'

  const prompt = `Generate 5 NEW English sentences for an elderly rural Indian learner.
Topic: "${topic.en}" (${topic.hi})
Round: ${round} — difficulty: ${difficulty}
Previous round sentences (do NOT repeat): ${prevSentences.join(' | ')}

Rules:
- Practical sentences actually used in "${topic.en}" situations
- Each sentence must be different from all previous rounds
- Progress naturally in difficulty
- Return ONLY a valid JSON array of exactly 5 strings. No markdown, no explanation.
Example output: ["Sentence one.","Sentence two.","Sentence three.","Sentence four.","Sentence five."]`

  try {
    const raw = await callClaude(
      [{ role: 'user', content: prompt }],
      'You output only valid JSON arrays. No markdown fences, no explanation, no extra text.'
    )
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    if (Array.isArray(parsed) && parsed.length === 5) return parsed
    return prevSentences
  } catch {
    return prevSentences
  }
}

// ── Storage helpers ───────────────────────────────────────────────────────────
export function loadProgress() {
  try { return JSON.parse(localStorage.getItem('sunobolo_progress') || '{}') } catch { return {} }
}
export function saveProgress(p) {
  localStorage.setItem('sunobolo_progress', JSON.stringify(p))
}
export function loadSentenceCache() {
  try { return JSON.parse(localStorage.getItem('sunobolo_sentences') || '{}') } catch { return {} }
}
export function saveSentenceCache(c) {
  localStorage.setItem('sunobolo_sentences', JSON.stringify(c))
}
