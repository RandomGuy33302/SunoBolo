const PROXY = '/api/chat'
const MODEL  = 'llama-3.3-70b-versatile'
const VISION = 'meta-llama/llama-4-scout-17b-16e-instruct'  // Current Groq vision model

// ── Voice helpers ─────────────────────────────────────────────────────────────
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

// Pick the best North Indian English woman voice available
function pickEnglishVoice(voices) {
  // Priority order for North Indian woman voice
  const candidates = [
    // Indian English female voices
    v => v.lang === 'en-IN' && /female|woman|girl/i.test(v.name),
    v => v.lang === 'en-IN' && /raveena|heera|priya|ananya|divya/i.test(v.name),
    v => v.lang === 'en-IN',
    v => v.name.toLowerCase().includes('india') && /female|woman/i.test(v.name),
    v => v.name.toLowerCase().includes('india'),
    // Fallback: any English female
    v => v.lang.startsWith('en') && /female|woman|girl/i.test(v.name),
    v => v.lang.startsWith('en-GB'),   // British accent closer to Indian English
    v => v.lang.startsWith('en'),
  ]
  for (const fn of candidates) {
    const match = voices.find(fn)
    if (match) return match
  }
  return null
}

export async function speakEnglish(text, rate = 0.76) {
  if (!window.speechSynthesis || !text?.trim()) return
  window.speechSynthesis.cancel()
  await new Promise(r => setTimeout(r, 80))

  const u      = new SpeechSynthesisUtterance(text.trim())
  u.lang  = 'en-IN'
  u.rate  = rate       // Slightly slower for elderly listeners
  u.pitch = 1.15       // Slightly higher = more feminine
  u.volume = 1.0

  const voices = await ensureVoices()
  const voice  = pickEnglishVoice(voices)
  if (voice) u.voice = voice

  window.speechSynthesis.speak(u)
}

export async function speakHindi(text) {
  if (!window.speechSynthesis || !text?.trim()) return
  window.speechSynthesis.cancel()
  await new Promise(r => setTimeout(r, 80))

  const u      = new SpeechSynthesisUtterance(text.trim())
  u.lang  = 'hi-IN'
  u.rate  = 0.80
  u.pitch = 1.12

  const voices = await ensureVoices()
  // Prefer female Hindi voice
  const voice  =
    voices.find(v => v.lang === 'hi-IN' && /female|woman/i.test(v.name)) ||
    voices.find(v => v.lang === 'hi-IN') ||
    voices.find(v => v.lang.startsWith('hi'))
  if (voice) u.voice = voice

  window.speechSynthesis.speak(u)
}

export function stopSpeech() { window.speechSynthesis?.cancel() }

// ── Image compression ─────────────────────────────────────────────────────────
// Compresses image to max 800px wide and quality 0.7 BEFORE converting to base64.
// This prevents 413 errors when sending to the proxy.
export function compressImage(file, maxWidth = 800, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)

      // Calculate new dimensions
      let { width, height } = img
      if (width > maxWidth) {
        height = Math.round(height * maxWidth / width)
        width  = maxWidth
      }

      const canvas = document.createElement('canvas')
      canvas.width  = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      // Convert to JPEG for smaller size (even if original was PNG)
      canvas.toBlob(
        blob => {
          if (!blob) { reject(new Error('Canvas compression failed')); return }
          const reader = new FileReader()
          reader.onload  = () => resolve({
            base64:   reader.result.split(',')[1],
            mimeType: 'image/jpeg',
            url:      URL.createObjectURL(blob),
          })
          reader.onerror = reject
          reader.readAsDataURL(blob)
        },
        'image/jpeg',
        quality
      )
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url
  })
}

// ── Claude/Groq API via proxy ─────────────────────────────────────────────────
export async function callClaude(messages, systemPrompt = '', useVision = false) {
  const body = {
    model:    useVision ? VISION : MODEL,
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
    round <= 2 ? 'very short and simple (4–6 words)'         :
    round <= 4 ? 'medium length, more specific (7–10 words)' :
                 'full conversational (10–15 words)'

  const prompt = `Generate 5 NEW practical English sentences for an elderly rural Indian learner.
Topic: "${topic.en}" (${topic.hi})
Round ${round} — difficulty: ${difficulty}
Do NOT repeat any of these: ${prevSentences.join(' | ')}
Rules: real sentences used in "${topic.en}" situations; progress naturally in difficulty.
Return ONLY a valid JSON array of exactly 5 strings. No markdown, no explanation.`

  try {
    const raw    = await callClaude(
      [{ role: 'user', content: prompt }],
      'Output only a valid JSON array of 5 strings. No markdown fences, no explanation.'
    )
    const clean  = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    if (Array.isArray(parsed) && parsed.length === 5) return parsed
    return prevSentences
  } catch { return prevSentences }
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
