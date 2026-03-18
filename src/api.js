const PROXY  = '/api/chat'
const MODEL  = 'llama-3.3-70b-versatile'
const VISION = 'meta-llama/llama-4-scout-17b-16e-instruct'

// ── Global active speech ref so ANY screen can cancel it ─────────────────────
// Stored outside React so it persists across component unmounts
let _activeSpeech = null

// ── Voice loading ─────────────────────────────────────────────────────────────
let _voicesCache = null
function ensureVoices() {
  return new Promise(resolve => {
    if (_voicesCache) { resolve(_voicesCache); return }
    const v = window.speechSynthesis.getVoices()
    if (v.length > 0) { _voicesCache = v; resolve(v); return }
    let done = false
    window.speechSynthesis.onvoiceschanged = () => {
      if (!done) {
        done = true
        _voicesCache = window.speechSynthesis.getVoices()
        resolve(_voicesCache)
      }
    }
    // Hard timeout fallback
    setTimeout(() => {
      if (!done) { done = true; resolve(window.speechSynthesis.getVoices()) }
    }, 2000)
  })
}

// ── Pick best North-Indian woman voice ───────────────────────────────────────
// Strategy: score each voice, pick highest scorer
function pickBestVoice(voices, wantLang = 'en-IN') {
  function score(v) {
    let s = 0
    const n = v.name.toLowerCase()
    const l = v.lang.toLowerCase()

    // Language match
    if (l === 'en-in')   s += 100
    if (l === 'hi-in' && wantLang === 'hi-IN') s += 100
    if (l.startsWith('en-in')) s += 80
    if (n.includes('india'))   s += 60
    if (l.startsWith('en-gb')) s += 20   // British closer to Indian than American
    if (l.startsWith('en'))    s += 10

    // Female name indicators (all common Indian TTS voice names)
    const femaleNames = ['raveena','heera','priya','ananya','divya','lekha','aditi',
                         'female','woman','girl','f1','zira','samantha','victoria',
                         'moira','tessa','veena','kanya']
    if (femaleNames.some(fn => n.includes(fn))) s += 50

    // Explicitly avoid male names
    const maleNames = ['male','man','boy','m1','daniel','alex','david','google हिन्दी',
                       'rishi','kumar','raj']
    if (maleNames.some(mn => n.includes(mn))) s -= 40

    return s
  }

  const sorted = [...voices].sort((a, b) => score(b) - score(a))
  return sorted[0] || null
}

// ── Speak English (North Indian woman, slow, clear) ──────────────────────────
export async function speakEnglish(text, rate = 0.78) {
  if (!window.speechSynthesis || !text?.trim()) return
  stopSpeech()
  await new Promise(r => setTimeout(r, 90))

  const voices = await ensureVoices()
  const voice  = pickBestVoice(voices, 'en-IN')

  const u = new SpeechSynthesisUtterance(text.trim())
  // Set voice FIRST, then lang — some browsers override lang if set after
  if (voice) u.voice = voice
  u.lang   = voice?.lang || 'en-IN'
  u.rate   = rate
  u.pitch  = 1.18   // Higher = more feminine / younger
  u.volume = 1.0

  _activeSpeech = u
  window.speechSynthesis.speak(u)
}

// ── Speak Hindi ───────────────────────────────────────────────────────────────
export async function speakHindi(text) {
  if (!window.speechSynthesis || !text?.trim()) return
  stopSpeech()
  await new Promise(r => setTimeout(r, 90))

  const voices = await ensureVoices()
  const voice  = pickBestVoice(voices, 'hi-IN')

  const u = new SpeechSynthesisUtterance(text.trim())
  if (voice) u.voice = voice
  u.lang   = voice?.lang || 'hi-IN'
  u.rate   = 0.82
  u.pitch  = 1.15
  u.volume = 1.0

  _activeSpeech = u
  window.speechSynthesis.speak(u)
}

// ── Stop all speech immediately ───────────────────────────────────────────────
// Call this on: back button, screen unmount, new screen load
export function stopSpeech() {
  window.speechSynthesis?.cancel()
  _activeSpeech = null
}

// ── Image compression (client-side, prevents 413) ─────────────────────────────
export function compressImage(file, maxWidth = 800, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxWidth) { height = Math.round(height * maxWidth / width); width = maxWidth }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      canvas.toBlob(blob => {
        if (!blob) { reject(new Error('Compression failed')); return }
        const reader = new FileReader()
        reader.onload  = () => resolve({
          base64:   reader.result.split(',')[1],
          mimeType: 'image/jpeg',
          url:      URL.createObjectURL(blob),
        })
        reader.onerror = reject
        reader.readAsDataURL(blob)
      }, 'image/jpeg', quality)
    }
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = url
  })
}

// ── Groq API call via proxy ───────────────────────────────────────────────────
export async function callClaude(messages, systemPrompt = '', useVision = false) {
  const body = {
    model:      useVision ? VISION : MODEL,
    max_tokens: 1200,
    messages,
  }
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

// ── Hindi translation helper ──────────────────────────────────────────────────
export async function translateToHindi(sentence) {
  return callClaude(
    [{ role: 'user', content: `Translate to Hindi Devanagari only, no romanization: "${sentence}"` }],
    'Reply with ONLY the Hindi Devanagari translation. No romanization, no explanation.'
  )
}

// ── AI sentence generation for lesson rounds ──────────────────────────────────
export async function generateNextRoundSentences(topic, round, prevSentences) {
  const difficulty =
    round <= 2 ? 'very short and simple (4–6 words)' :
    round <= 4 ? 'medium length, specific (7–10 words)' :
                 'full conversational (10–15 words)'

  try {
    const raw = await callClaude(
      [{ role: 'user', content:
        `Generate 5 NEW practical English sentences for an elderly rural Indian learner.
Topic: "${topic.en}" (${topic.hi})
Round ${round} — difficulty: ${difficulty}
Do NOT repeat: ${prevSentences.join(' | ')}
Return ONLY a valid JSON array of exactly 5 strings. No markdown, no extra text.` }],
      'Output only a valid JSON array of 5 strings. Nothing else.'
    )
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
    if (Array.isArray(parsed) && parsed.length === 5) return parsed
    return prevSentences
  } catch { return prevSentences }
}

// ── Storage ───────────────────────────────────────────────────────────────────
export function loadProgress()      { try { return JSON.parse(localStorage.getItem('sunobolo_progress')  || '{}') } catch { return {} } }
export function saveProgress(p)     { localStorage.setItem('sunobolo_progress',  JSON.stringify(p)) }
export function loadSentenceCache() { try { return JSON.parse(localStorage.getItem('sunobolo_sentences') || '{}') } catch { return {} } }
export function saveSentenceCache(c){ localStorage.setItem('sunobolo_sentences', JSON.stringify(c)) }
