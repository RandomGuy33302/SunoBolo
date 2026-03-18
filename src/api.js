const PROXY  = '/api/chat'
const MODEL  = 'llama-3.3-70b-versatile'
const VISION = 'meta-llama/llama-4-scout-17b-16e-instruct'

// ── User profile storage ──────────────────────────────────────────────────────
const NAME_KEY  = 'sunobolo_user_name'
const VOICE_KEY = 'sunobolo_voice_name'

export function getUserName()    { return localStorage.getItem(NAME_KEY)  || '' }
export function saveUserName(n)  { localStorage.setItem(NAME_KEY,  n.trim()) }
export function getSavedVoiceName() { return localStorage.getItem(VOICE_KEY) || null }
export function saveVoiceName(n)    { localStorage.setItem(VOICE_KEY, n) }
export function isProfileComplete() {
  return !!getUserName() && !!getSavedVoiceName()
}

// ── Voice loading ─────────────────────────────────────────────────────────────
let _voicesCache = null
export function getAllVoices() {
  return new Promise(resolve => {
    if (_voicesCache && _voicesCache.length > 0) { resolve(_voicesCache); return }
    const v = window.speechSynthesis.getVoices()
    if (v.length > 0) { _voicesCache = v; resolve(v); return }
    let done = false
    const finish = () => {
      if (done) return; done = true
      _voicesCache = window.speechSynthesis.getVoices(); resolve(_voicesCache)
    }
    window.speechSynthesis.onvoiceschanged = finish
    setTimeout(finish, 2500)
  })
}

export async function getActiveVoice() {
  const voices = await getAllVoices()
  const saved  = getSavedVoiceName()
  if (saved) {
    const found = voices.find(v => v.name === saved)
    if (found) return found
  }
  // Smart default: prefer en-IN female, then any female English
  const femaleHints = ['raveena','heera','priya','ananya','divya','aditi','lekha','veena','kanya','female','woman','girl','zira','samantha','victoria','moira','tessa']
  const maleHints   = ['male','man','rishi','daniel','alex','david','james','mark','fred','google uk english male','microsoft david']
  const isFemale = v => { const n = v.name.toLowerCase(); return femaleHints.some(f => n.includes(f)) && !maleHints.some(m => n.includes(m)) }
  return (
    voices.find(v => v.lang === 'en-IN' && isFemale(v)) ||
    voices.find(v => v.lang === 'en-IN') ||
    voices.find(v => v.lang.startsWith('en-IN')) ||
    voices.find(v => v.lang.startsWith('en') && isFemale(v)) ||
    voices.find(v => v.lang.startsWith('en')) ||
    voices[0] || null
  )
}

// ── Speech ────────────────────────────────────────────────────────────────────
export async function speakEnglish(text, rate = 0.78) {
  if (!window.speechSynthesis || !text?.trim()) return
  stopSpeech()
  await new Promise(r => setTimeout(r, 80))
  const voice = await getActiveVoice()
  const u = new SpeechSynthesisUtterance(text.trim())
  if (voice) { u.voice = voice; u.lang = voice.lang }
  else u.lang = 'en-IN'
  u.rate = rate; u.pitch = 1.1; u.volume = 1.0
  window.speechSynthesis.speak(u)
}

export async function speakHindi(text) {
  if (!window.speechSynthesis || !text?.trim()) return
  stopSpeech()
  await new Promise(r => setTimeout(r, 80))
  const voices     = await getAllVoices()
  const hindiVoice = voices.find(v => v.lang === 'hi-IN') || voices.find(v => v.lang.startsWith('hi'))
  const u = new SpeechSynthesisUtterance(text.trim())
  if (hindiVoice) { u.voice = hindiVoice; u.lang = hindiVoice.lang } else u.lang = 'hi-IN'
  u.rate = 0.82; u.pitch = 1.1; u.volume = 1.0
  window.speechSynthesis.speak(u)
}

export function stopSpeech() { window.speechSynthesis?.cancel() }

// ── Image compression ─────────────────────────────────────────────────────────
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
        reader.onload  = () => resolve({ base64: reader.result.split(',')[1], mimeType: 'image/jpeg', url: URL.createObjectURL(blob) })
        reader.onerror = reject
        reader.readAsDataURL(blob)
      }, 'image/jpeg', quality)
    }
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = url
  })
}

// ── API ───────────────────────────────────────────────────────────────────────
export async function callClaude(messages, systemPrompt = '', useVision = false) {
  const body = { model: useVision ? VISION : MODEL, max_tokens: 1200, messages }
  if (systemPrompt) body.system = systemPrompt
  const res = await fetch(PROXY, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error || `API error ${res.status}`) }
  const data = await res.json()
  return data.content?.map(b => b.text || '').join('') || ''
}

export async function translateToHindi(sentence) {
  return callClaude(
    [{ role: 'user', content: `Translate to Hindi Devanagari only: "${sentence}"` }],
    'Reply with ONLY the Hindi Devanagari translation. No romanization, no explanation.'
  )
}

export async function generateNextRoundSentences(topic, round, prevSentences) {
  const difficulty = round <= 2 ? 'very short simple (4–6 words)' : round <= 4 ? 'medium specific (7–10 words)' : 'full conversational (10–15 words)'
  try {
    const raw = await callClaude(
      [{ role: 'user', content: `Generate 5 NEW practical English sentences for elderly rural Indian learner.\nTopic: "${topic.en}" (${topic.hi})\nRound ${round} — ${difficulty}\nDo NOT repeat: ${prevSentences.join(' | ')}\nReturn ONLY a valid JSON array of 5 strings.` }],
      'Output only a valid JSON array of 5 strings. Nothing else.'
    )
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
    if (Array.isArray(parsed) && parsed.length === 5) return parsed
    return prevSentences
  } catch { return prevSentences }
}

export function loadProgress()       { try { return JSON.parse(localStorage.getItem('sunobolo_progress')  || '{}') } catch { return {} } }
export function saveProgress(p)      { localStorage.setItem('sunobolo_progress',  JSON.stringify(p)) }
export function loadSentenceCache()  { try { return JSON.parse(localStorage.getItem('sunobolo_sentences') || '{}') } catch { return {} } }
export function saveSentenceCache(c) { localStorage.setItem('sunobolo_sentences', JSON.stringify(c)) }
