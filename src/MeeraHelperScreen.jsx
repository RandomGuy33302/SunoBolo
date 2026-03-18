import { useState, useEffect, useRef } from 'react'
import { C } from './constants.js'
import { speakEnglish, stopSpeech, compressImage } from './api.js'

const VISION = 'meta-llama/llama-4-scout-17b-16e-instruct'
const TEXT   = 'llama-3.3-70b-versatile'

const SYSTEM = `You are Meera Didi — a warm, helpful assistant for elderly rural Indians learning English.
Help with ANYTHING: translating, explaining, filling forms, reading signs, understanding medicines, daily questions.
ALWAYS respond in BOTH English and Hindi:
- English sentence first, then its Hindi meaning in [square brackets] right after.
- Keep language very simple, warm, and encouraging.
- If asked in Hindi, answer in Hindi first then English.
- For forms or documents, explain every field in simple Hindi.
- If asked how to say something in English, give the sentence and a simple pronunciation tip.
Be like a helpful educated neighbour who speaks both Hindi and English fluently.`

async function askMeera(text, image, voiceText) {
  const combined = [
    voiceText?.trim() && `Voice input: "${voiceText}"`,
    text?.trim()      && `Text input: "${text}"`,
    image             && 'An image is also attached — please analyse it.',
  ].filter(Boolean).join('\n') || 'Please help me.'

  const userContent = image
    ? [
        { type: 'image_url', image_url: { url: `data:${image.mimeType};base64,${image.base64}` } },
        { type: 'text', text: combined },
      ]
    : combined

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model:      image ? VISION : TEXT,
      max_tokens: 1200,
      system:     SYSTEM,
      messages:   [{ role: 'user', content: userContent }],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error || `Server error ${res.status}`)
  }
  const data = await res.json()
  return data.content?.[0]?.text || ''
}

// ── Response renderer ─────────────────────────────────────────────────────────
function ResponseBubble({ text }) {
  const lines = text.split('\n').filter(l => l.trim())
  return (
    <div style={{
      background: '#fff', borderRadius: 22, padding: '18px 16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      border: '1.5px solid rgba(142,68,173,0.12)',
      animation: 'fadeIn 0.3s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: `linear-gradient(135deg, ${C.saffron}, ${C.gold})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
        }}>🙋‍♀️</div>
        <span style={{ fontSize: 16, fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: '#6C3483' }}>
          Meera Didi ka Jawab
        </span>
      </div>
      {lines.map((line, i) => {
        const hasHindi  = /[\u0900-\u097F]/.test(line)
        const isBracket = line.startsWith('[') && line.endsWith(']')
        return (
          <p key={i} style={{
            margin: '0 0 10px',
            fontSize: hasHindi ? 16 : 18,
            fontFamily: hasHindi ? "'Noto Sans Devanagari', sans-serif" : "'Baloo 2', cursive",
            color: isBracket ? C.textMid : C.text,
            lineHeight: 1.7,
            paddingLeft: isBracket ? 12 : 0,
            borderLeft: isBracket ? '3px solid #8E44AD44' : 'none',
          }}>
            {isBracket ? `🇮🇳 ${line.slice(1, -1)}` : line}
          </p>
        )
      })}
    </div>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function MeeraHelperScreen({ onBack }) {
  const [textInput,    setTextInput]    = useState('')
  const [image,        setImage]        = useState(null)
  const [voiceText,    setVoiceText]    = useState('')
  const [interimText,  setInterimText]  = useState('') // live text while speaking
  const [response,     setResponse]     = useState('')
  const [loading,      setLoading]      = useState(false)
  const [listening,    setListening]    = useState(false)
  const [compressing,  setCompressing]  = useState(false)
  const [error,        setError]        = useState('')
  const [micError,     setMicError]     = useState('')

  const micRef     = useRef(null)
  const mountedRef = useRef(true)
  const fileRef    = useRef(null)
  const cameraRef  = useRef(null)

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      stopSpeech()
      _stopMic()
    }
  }, [])

  // ── Internal mic stop — does NOT check mountedRef ─────────────────────────
  function _stopMic() {
    if (micRef.current) {
      try { micRef.current.abort() } catch (_) {}
      try { micRef.current.stop()  } catch (_) {}
      micRef.current = null
    }
  }

  // ── External mic stop — updates UI state ─────────────────────────────────
  function stopMic() {
    _stopMic()
    setListening(false)
    setInterimText('')
  }

  function handleBack() { stopSpeech(); stopMic(); onBack() }

  // ── Mic toggle — accepts both Hindi and English ───────────────────────────
  function toggleMic() {
    if (listening) { stopMic(); return }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      setMicError('Voice input sirf Chrome browser mein kaam karta hai. Kripya Chrome use karein.')
      return
    }

    setMicError('')
    setVoiceText('')
    setInterimText('')
    stopSpeech()

    const r = new SR()
    // Use en-IN for widest compatibility — it accepts Hindi words too in practice
    // Setting hi-IN often fails silently on many Android devices
    r.lang              = 'en-IN'
    r.continuous        = false
    r.interimResults    = true   // ← KEY FIX: show live text as user speaks
    r.maxAlternatives   = 1

    r.onstart = () => {
      if (mountedRef.current) setListening(true)
    }

    r.onresult = (e) => {
      if (!mountedRef.current) return
      let interim = ''
      let final   = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t
        else interim += t
      }
      // Show live interim text
      if (interim) setInterimText(interim)
      // Store final text
      if (final) {
        setVoiceText(final)
        setInterimText('')
      }
    }

    r.onerror = (e) => {
      if (!mountedRef.current) return
      const msgs = {
        'not-allowed':       'Microphone ki permission nahi mili. Browser settings mein mic allow karein.',
        'no-speech':         'Kuch nahi suna. Phir se try karein.',
        'audio-capture':     'Microphone nahi mila device par.',
        'network':           'Network error. Internet check karein.',
        'service-not-allowed': 'Speech service available nahi hai.',
      }
      setMicError(msgs[e.error] || `Mic error: ${e.error}`)
      stopMic()
    }

    r.onend = () => {
      // Only reset listening state, don't clear text
      if (mountedRef.current) {
        setListening(false)
        setInterimText('')
      }
      micRef.current = null
    }

    micRef.current = r
    try {
      r.start()
    } catch (e) {
      setMicError('Mic shuru nahi hua: ' + e.message)
      micRef.current = null
      setListening(false)
    }
  }

  // ── File handling ─────────────────────────────────────────────────────────
  async function handleFile(file) {
    if (!file?.type.startsWith('image/')) return
    setCompressing(true); setError('')
    try {
      setImage(await compressImage(file, 800, 0.72))
    } catch (e) {
      setError('Image load nahi hui: ' + e.message)
    }
    setCompressing(false)
  }

  // ── Ask Meera ─────────────────────────────────────────────────────────────
  async function handleAsk() {
    const hasContent = textInput.trim() || image || voiceText.trim()
    if (!hasContent || loading) return
    setLoading(true); setError(''); setResponse('')
    try {
      const answer = await askMeera(textInput, image, voiceText)
      if (!mountedRef.current) return
      setResponse(answer)
      speakEnglish(answer.replace(/\[.*?\]/g, '').trim())
    } catch (e) {
      if (mountedRef.current) setError('Error: ' + e.message)
    }
    if (mountedRef.current) setLoading(false)
  }

  function clearAll() {
    stopSpeech()
    setTextInput(''); setImage(null); setVoiceText('')
    setInterimText(''); setResponse(''); setError(''); setMicError('')
  }

  const hasInput = textInput.trim() || image || voiceText.trim()

  // Active voice state: listening = mic open, interimText = live speech
  const isActivelyListening = listening
  const liveText = interimText || (listening ? '...' : '')

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #fdf2ff, #f5e8ff)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <div style={{
        background: 'linear-gradient(135deg, #4a1260, #6C3483, #8E44AD)',
        padding: '20px 18px 18px', borderRadius: '0 0 28px 28px',
        boxShadow: '0 8px 28px rgba(108,52,131,0.4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <button onClick={handleBack} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 12,
            width: 44, height: 44, fontSize: 20, color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 21, fontFamily: "'Baloo 2', cursive", fontWeight: 800, color: '#fff' }}>
              🤖 Meera Helper
            </div>
            <div style={{ fontSize: 13, fontFamily: "'Noto Sans Devanagari', sans-serif", color: 'rgba(255,255,255,0.88)' }}>
              कुछ भी पूछें — text, photo, या बोलकर
            </div>
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: '10px 14px' }}>
          <p style={{ margin: 0, fontSize: 14, fontFamily: "'Noto Sans Devanagari', sans-serif", color: '#fff', lineHeight: 1.5 }}>
            💜 Hindi या English में पूछें — या photo दिखाएँ — Meera Didi हमेशा मदद करेंगी।
          </p>
        </div>
      </div>

      <div style={{ flex: 1, padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>

        {/* ── Quick prompts ── */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
          {[
            '"मुझे दर्द है" English mein?',
            '"Emergency" ka matlab?',
            'Form mein name kaise likhein?',
            'Thank you politely kaise bolein?',
            '"I am not feeling well" ka Hindi?',
          ].map((q, i) => (
            <button key={i} onClick={() => { setTextInput(q); setVoiceText('') }} style={{
              background: '#fff', border: '1.5px solid #8E44AD33', borderRadius: 20,
              padding: '8px 14px', whiteSpace: 'nowrap', fontSize: 13,
              fontFamily: "'Baloo 2', cursive", color: '#6C3483',
              cursor: 'pointer', flexShrink: 0,
              boxShadow: '0 2px 8px rgba(142,68,173,0.1)',
            }}>{q}</button>
          ))}
        </div>

        {/* ── Big mic button — prominent, can't miss it ── */}
        <div style={{
          background: isActivelyListening
            ? 'linear-gradient(135deg, #ff3333, #cc0000)'
            : 'linear-gradient(135deg, #6C3483, #8E44AD)',
          borderRadius: 24, padding: '20px 18px',
          boxShadow: isActivelyListening
            ? '0 8px 32px rgba(255,51,51,0.45)'
            : '0 8px 32px rgba(108,52,131,0.35)',
          transition: 'all 0.3s',
          animation: isActivelyListening ? 'micPulse 1.5s ease-in-out infinite' : 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Big mic button */}
            <button
              onClick={toggleMic}
              style={{
                width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
                background: isActivelyListening ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.18)',
                border: '3px solid rgba(255,255,255,0.4)',
                fontSize: 32, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
            >
              {isActivelyListening ? '⏹️' : '🎤'}
            </button>

            <div style={{ flex: 1, minWidth: 0 }}>
              {!isActivelyListening && !voiceText && (
                <>
                  <p style={{ margin: '0 0 2px', fontSize: 18, fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: '#fff' }}>
                    🎤 Bolkar Poocho
                  </p>
                  <p style={{ margin: 0, fontSize: 13, fontFamily: "'Noto Sans Devanagari', sans-serif", color: 'rgba(255,255,255,0.82)' }}>
                    Button dabayein aur Hindi ya English mein bolein
                  </p>
                </>
              )}

              {/* Live interim text — shown while speaking */}
              {isActivelyListening && (
                <>
                  <p style={{ margin: '0 0 4px', fontSize: 16, fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: '#fff' }}>
                    🎧 Sun raha hoon...
                  </p>
                  <p style={{ margin: 0, fontSize: 14, fontFamily: "'Noto Sans Devanagari', sans-serif", color: 'rgba(255,255,255,0.9)', lineHeight: 1.4 }}>
                    सुन रहे हैं — बोलते रहें। रोकने के लिए button फिर दबाएँ।
                  </p>
                  {liveText && liveText !== '...' && (
                    <p style={{ margin: '8px 0 0', fontSize: 16, fontFamily: "'Baloo 2', cursive", color: '#fff', fontStyle: 'italic', background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '6px 10px' }}>
                      "{liveText}"
                    </p>
                  )}
                </>
              )}

              {/* Final captured voice text */}
              {!isActivelyListening && voiceText && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 2px', fontSize: 13, fontFamily: "'Baloo 2', cursive", color: 'rgba(255,255,255,0.7)' }}>✅ Captured:</p>
                    <p style={{ margin: 0, fontSize: 16, fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: '#fff', lineHeight: 1.4 }}>
                      "{voiceText}"
                    </p>
                  </div>
                  <button onClick={() => setVoiceText('')} style={{
                    background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8,
                    width: 28, height: 28, fontSize: 14, color: '#fff',
                    cursor: 'pointer', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>✕</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mic error */}
        {micError && (
          <div style={{ background: '#fff5f5', border: '2px solid #E74C3C', borderRadius: 14, padding: '12px 14px', animation: 'fadeIn 0.3s ease' }}>
            <p style={{ margin: 0, fontSize: 14, fontFamily: "'Noto Sans Devanagari', sans-serif", color: '#C0392B', lineHeight: 1.5 }}>
              ⚠️ {micError}
            </p>
          </div>
        )}

        {/* ── Text input card ── */}
        <div style={{
          background: '#fff', borderRadius: 22, padding: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
          border: '1.5px solid rgba(142,68,173,0.15)',
        }}>
          <p style={{ margin: '0 0 8px', fontSize: 14, fontFamily: "'Noto Sans Devanagari', sans-serif", color: C.textMid }}>
            ✍️ Ya yahan likhein (Hindi ya English mein):
          </p>
          <textarea
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            placeholder="यहाँ लिखें — जैसे: 'hospital form mein kya likhein?' या 'I need help' ka matlab?"
            rows={3}
            style={{
              width: '100%', border: '2px solid #8E44AD22', borderRadius: 14,
              padding: '12px 14px', fontSize: 16,
              fontFamily: "'Noto Sans Devanagari', sans-serif",
              background: '#faf5ff', color: C.text,
              resize: 'none', boxSizing: 'border-box', lineHeight: 1.6,
            }}
          />

          {/* Image preview + compressing */}
          {compressing && (
            <div style={{ marginTop: 10, textAlign: 'center', padding: 10 }}>
              <p style={{ fontFamily: "'Noto Sans Devanagari', sans-serif", color: C.textMid, fontSize: 14 }}>⏳ Photo compress ho rahi hai...</p>
            </div>
          )}
          {image && !compressing && (
            <div style={{ position: 'relative', marginTop: 10, borderRadius: 14, overflow: 'hidden' }}>
              <img src={image.url} alt="Attached" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', display: 'block' }} />
              <button onClick={() => setImage(null)} style={{
                position: 'absolute', top: 8, right: 8,
                background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%',
                width: 30, height: 30, fontSize: 16, color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>✕</button>
            </div>
          )}

          {/* Photo buttons row */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={() => cameraRef.current?.click()} style={{
              flex: 1, padding: '12px 8px', borderRadius: 14, border: '2px dashed #2980B9',
              background: '#f0f8ff', cursor: 'pointer', textAlign: 'center',
            }}>
              <div style={{ fontSize: 24 }}>📸</div>
              <div style={{ fontSize: 12, fontFamily: "'Noto Sans Devanagari', sans-serif", color: '#2980B9', marginTop: 4 }}>Camera</div>
            </button>
            <input ref={cameraRef} type="file" accept="image/*" capture="environment"
              style={{ display: 'none' }} onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />

            <button onClick={() => fileRef.current?.click()} style={{
              flex: 1, padding: '12px 8px', borderRadius: 14, border: '2px dashed #27AE60',
              background: '#f0fff5', cursor: 'pointer', textAlign: 'center',
            }}>
              <div style={{ fontSize: 24 }}>🖼️</div>
              <div style={{ fontSize: 12, fontFamily: "'Noto Sans Devanagari', sans-serif", color: '#27AE60', marginTop: 4 }}>Gallery</div>
            </button>
            <input ref={fileRef} type="file" accept="image/*"
              style={{ display: 'none' }} onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />

            {/* Ask button */}
            <button onClick={handleAsk} disabled={!hasInput || loading} style={{
              flex: 2, borderRadius: 14, border: 'none',
              background: hasInput && !loading ? 'linear-gradient(135deg, #6C3483, #8E44AD)' : '#ddd',
              color: '#fff', fontSize: 16, fontFamily: "'Baloo 2', cursive", fontWeight: 700,
              cursor: hasInput && !loading ? 'pointer' : 'not-allowed',
              boxShadow: hasInput && !loading ? '0 5px 16px rgba(142,68,173,0.4)' : 'none',
              transition: 'all 0.2s', padding: '12px 8px',
            }}>
              {loading ? '⏳ ...' : '🙋‍♀️ Poocho!'}
            </button>
          </div>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div style={{ background: '#fff', borderRadius: 20, padding: '24px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
            <div style={{ width: 50, height: 50, margin: '0 auto 12px', border: '5px solid #f0e6ff', borderTop: '5px solid #8E44AD', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ margin: 0, fontSize: 15, fontFamily: "'Noto Sans Devanagari', sans-serif", color: C.textMid }}>Meera Didi soch rahi hain... 🤔</p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: C.textLight, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>थोड़ा इंतज़ार करें</p>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div style={{ background: '#fff5f5', border: '2px solid #E74C3C', borderRadius: 16, padding: '14px 16px', animation: 'fadeIn 0.3s ease' }}>
            <p style={{ margin: 0, fontSize: 15, fontFamily: "'Baloo 2', cursive", color: '#E74C3C' }}>⚠️ {error}</p>
          </div>
        )}

        {/* ── Response ── */}
        {response && (
          <>
            <ResponseBubble text={response} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => speakEnglish(response.replace(/\[.*?\]/g, '').trim())} style={{
                flex: 1, padding: '14px', borderRadius: 16, border: 'none',
                background: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                fontSize: 16, fontFamily: "'Baloo 2', cursive", color: C.saffron,
                cursor: 'pointer', fontWeight: 700,
              }}>🔊 Dobara Suno</button>
              <button onClick={clearAll} style={{
                flex: 1, padding: '14px', borderRadius: 16, border: 'none',
                background: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                fontSize: 15, fontFamily: "'Noto Sans Devanagari', sans-serif", color: C.textMid,
                cursor: 'pointer',
              }}>🔄 Naya Sawaal</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
