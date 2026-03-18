import { useState, useEffect, useRef } from 'react'
import { C } from './constants.js'
import { speakEnglish, stopSpeech, compressImage } from './api.js'

const VISION = 'meta-llama/llama-4-scout-17b-16e-instruct'
const TEXT   = 'llama-3.3-70b-versatile'

const SYSTEM = `You are Meera Didi — a warm, helpful assistant for elderly rural Indians learning English.
Help with ANYTHING: translating, explaining, filling forms, reading signs, understanding medicines.
ALWAYS respond in BOTH English and Hindi:
- English sentence first, then Hindi in [square brackets] right after each sentence.
- Keep language simple, warm, encouraging.
- If asked in Hindi, answer Hindi first then English.
- For forms/documents, explain every field in simple Hindi.
Be like a helpful educated neighbour who speaks both Hindi and English fluently.`

async function askMeera(text, image, voiceText) {
  const combined = [
    voiceText && `Voice input: "${voiceText}"`,
    text.trim() && `Text input: "${text.trim()}"`,
    image && 'An image is also attached — please analyse it.',
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
      model:    image ? VISION : TEXT,
      max_tokens: 1200,
      system:   SYSTEM,
      messages: [{ role: 'user', content: userContent }],
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error || `Server error ${res.status}`)
  }
  const data = await res.json()
  return data.content?.[0]?.text || ''
}

function ResponseBubble({ text }) {
  const lines = text.split('\n').filter(l => l.trim())
  return (
    <div style={{
      background: '#fff', borderRadius: 22, padding: '18px 16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      border: '1.5px solid rgba(142,68,173,0.12)', animation: 'fadeIn 0.3s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: `linear-gradient(135deg, ${C.saffron}, ${C.gold})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>🙋‍♀️</div>
        <span style={{ fontSize: 15, fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: '#6C3483' }}>Meera Didi</span>
      </div>
      {lines.map((line, i) => {
        const hasHindi  = /[\u0900-\u097F]/.test(line)
        const isBracket = line.startsWith('[') && line.endsWith(']')
        return (
          <p key={i} style={{
            margin: '0 0 8px',
            fontSize: hasHindi ? 15 : 16,
            fontFamily: hasHindi ? "'Noto Sans Devanagari', sans-serif" : "'Baloo 2', cursive",
            color: isBracket ? C.textMid : C.text, lineHeight: 1.65,
            paddingLeft: isBracket ? 10 : 0,
            borderLeft: isBracket ? '3px solid #8E44AD44' : 'none',
          }}>
            {isBracket ? `🇮🇳 ${line.slice(1, -1)}` : line}
          </p>
        )
      })}
    </div>
  )
}

export default function MeeraHelperScreen({ onBack }) {
  const [textInput,   setTextInput]   = useState('')
  const [image,       setImage]       = useState(null)
  const [voiceText,   setVoiceText]   = useState('')
  const [response,    setResponse]    = useState('')
  const [loading,     setLoading]     = useState(false)
  const [listening,   setListening]   = useState(false)
  const [compressing, setCompressing] = useState(false)
  const [error,       setError]       = useState('')

  const micRef     = useRef(null)
  const mountedRef = useRef(true)
  const fileRef    = useRef(null)
  const cameraRef  = useRef(null)

  // ── Stop everything on unmount / back ─────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      stopSpeech()
      stopMic()
    }
  }, [])

  function stopMic() {
    if (micRef.current) {
      try { micRef.current.stop() } catch (_) {}
      micRef.current = null
    }
    if (mountedRef.current) setListening(false)
  }

  function handleBack() {
    stopSpeech()
    stopMic()
    onBack()
  }

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

  // ── Toggle mic — tap to start, tap again to STOP ──────────────────────────
  function toggleMic() {
    if (listening) { stopMic(); return }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Kripya Chrome browser use karein.'); return }
    stopSpeech()  // stop TTS when user speaks
    setListening(true)
    const r = new SR()
    r.lang = 'hi-IN'; r.continuous = false; r.interimResults = false
    r.onresult = e => {
      if (mountedRef.current) setVoiceText(e.results[0][0].transcript)
      stopMic()
    }
    r.onerror  = () => stopMic()
    r.onend    = () => stopMic()
    micRef.current = r
    r.start()
  }

  async function handleAsk() {
    if (!textInput.trim() && !image && !voiceText) return
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
    setTextInput(''); setImage(null); setVoiceText(''); setResponse(''); setError('')
  }

  const hasInput = textInput.trim() || image || voiceText

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #fdf2ff, #f5e8ff)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
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
            <div style={{ fontSize: 21, fontFamily: "'Baloo 2', cursive", fontWeight: 800, color: '#fff' }}>🤖 Meera Helper</div>
            <div style={{ fontSize: 13, fontFamily: "'Noto Sans Devanagari', sans-serif", color: 'rgba(255,255,255,0.88)' }}>कुछ भी पूछें — text, photo, या बोलकर</div>
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: '10px 14px' }}>
          <p style={{ margin: 0, fontSize: 14, fontFamily: "'Noto Sans Devanagari', sans-serif", color: '#fff', lineHeight: 1.5 }}>
            💜 कोई भी सवाल — Hindi या English में, या photo दिखाकर। Meera Didi मदद करेंगी।
          </p>
        </div>
      </div>

      <div style={{ flex: 1, padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>

        {/* Quick prompts */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
          {['"मुझे दर्द है" English mein?','What does "emergency" mean?','Form mein name kaise likhein?','Thank you politely kaise bolein?'].map((q, i) => (
            <button key={i} onClick={() => setTextInput(q)} style={{
              background: '#fff', border: '1.5px solid #8E44AD33', borderRadius: 20,
              padding: '8px 14px', whiteSpace: 'nowrap', fontSize: 13,
              fontFamily: "'Baloo 2', cursive", color: '#6C3483', cursor: 'pointer',
              flexShrink: 0, boxShadow: '0 2px 8px rgba(142,68,173,0.1)',
            }}>{q}</button>
          ))}
        </div>

        {/* Input card */}
        <div style={{ background: '#fff', borderRadius: 22, padding: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', border: '1.5px solid rgba(142,68,173,0.15)' }}>
          <textarea
            value={textInput} onChange={e => setTextInput(e.target.value)}
            placeholder="यहाँ लिखें — Hindi या English में..."
            rows={3}
            style={{
              width: '100%', border: '2px solid #8E44AD22', borderRadius: 14,
              padding: '12px 14px', fontSize: 16,
              fontFamily: "'Noto Sans Devanagari', sans-serif",
              background: '#faf5ff', color: C.text, resize: 'none',
              boxSizing: 'border-box', lineHeight: 1.6,
            }}
          />

          {/* Voice result */}
          {voiceText && (
            <div style={{ background: '#f5f0ff', borderRadius: 12, padding: '10px 14px', marginTop: 8, border: '1.5px solid #8E44AD33', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>🎤</span>
              <span style={{ fontSize: 15, fontFamily: "'Noto Sans Devanagari', sans-serif", color: '#6C3483', flex: 1 }}>"{voiceText}"</span>
              <button onClick={() => setVoiceText('')} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#aaa' }}>✕</button>
            </div>
          )}

          {/* Compressing */}
          {compressing && (
            <div style={{ marginTop: 10, textAlign: 'center', padding: 10 }}>
              <p style={{ fontFamily: "'Noto Sans Devanagari', sans-serif", color: C.textMid, fontSize: 14 }}>⏳ Photo tayaar ho rahi hai...</p>
            </div>
          )}

          {/* Image preview */}
          {image && !compressing && (
            <div style={{ position: 'relative', marginTop: 10, borderRadius: 14, overflow: 'hidden' }}>
              <img src={image.url} alt="Attached" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', display: 'block' }} />
              <button onClick={() => setImage(null)} style={{
                position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.55)',
                border: 'none', borderRadius: '50%', width: 30, height: 30,
                fontSize: 16, color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>✕</button>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {/* Mic — toggle on/off */}
            <button onClick={toggleMic} style={{
              width: 50, height: 50, borderRadius: '50%', border: 'none', flexShrink: 0,
              background: listening ? '#EE4444' : '#8E44AD',
              fontSize: listening ? 18 : 20, cursor: 'pointer',
              boxShadow: `0 4px 14px rgba(142,68,173,0.4)`,
              animation: listening ? 'micPulse 1s infinite' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s',
            }}>{listening ? '⏹️' : '🎤'}</button>

            {/* Camera */}
            <button onClick={() => cameraRef.current?.click()} style={{
              width: 50, height: 50, borderRadius: '50%', border: 'none', flexShrink: 0,
              background: '#2980B9', fontSize: 20, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(41,128,185,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>📷</button>
            <input ref={cameraRef} type="file" accept="image/*" capture="environment"
              style={{ display: 'none' }} onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />

            {/* Gallery */}
            <button onClick={() => fileRef.current?.click()} style={{
              width: 50, height: 50, borderRadius: '50%', border: 'none', flexShrink: 0,
              background: '#27AE60', fontSize: 20, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(39,174,96,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>🖼️</button>
            <input ref={fileRef} type="file" accept="image/*"
              style={{ display: 'none' }} onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />

            {/* Ask */}
            <button onClick={handleAsk} disabled={!hasInput || loading} style={{
              flex: 1, borderRadius: 16, border: 'none',
              background: hasInput && !loading ? 'linear-gradient(135deg, #6C3483, #8E44AD)' : '#ddd',
              color: '#fff', fontSize: 17, fontFamily: "'Baloo 2', cursive", fontWeight: 700,
              cursor: hasInput && !loading ? 'pointer' : 'not-allowed',
              boxShadow: hasInput && !loading ? '0 5px 16px rgba(142,68,173,0.4)' : 'none',
              transition: 'all 0.2s',
            }}>{loading ? '⏳' : '🙋‍♀️ Poocho!'}</button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ background: '#fff', borderRadius: 20, padding: '24px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
            <div style={{ width: 50, height: 50, margin: '0 auto 12px', border: '5px solid #f0e6ff', borderTop: '5px solid #8E44AD', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ margin: 0, fontSize: 15, fontFamily: "'Noto Sans Devanagari', sans-serif", color: C.textMid }}>Meera Didi soch rahi hain... 🤔</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: '#fff5f5', border: '2px solid #E74C3C', borderRadius: 16, padding: '14px 16px' }}>
            <p style={{ margin: 0, fontSize: 15, fontFamily: "'Baloo 2', cursive", color: '#E74C3C' }}>⚠️ {error}</p>
          </div>
        )}

        {/* Response */}
        {response && (
          <>
            <ResponseBubble text={response} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => speakEnglish(response.replace(/\[.*?\]/g, '').trim())} style={{
                flex: 1, padding: '12px', borderRadius: 16, border: 'none',
                background: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                fontSize: 15, fontFamily: "'Baloo 2', cursive", color: C.saffron,
                cursor: 'pointer', fontWeight: 700,
              }}>🔊 English suno</button>
              <button onClick={clearAll} style={{
                flex: 1, padding: '12px', borderRadius: 16, border: 'none',
                background: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                fontSize: 15, fontFamily: "'Noto Sans Devanagari', sans-serif", color: C.textMid,
                cursor: 'pointer',
              }}>🔄 Naya sawaal</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
