import { useState, useRef } from 'react'
import { C } from './constants.js'
import { speakEnglish, speakHindi } from './api.js'

async function analyzeImageWithGroq(base64Image, mimeType, mode) {
  const prompts = {
    translate: `You are a helpful assistant for elderly rural Indians who don't know English. 
Look at this image carefully. Find ALL English text, words, labels, signs, or printed content visible.
For each piece of text found, provide:
1. The original English text
2. Hindi translation in Devanagari script
3. Simple explanation in Hindi of what it means

Also if this looks like a form, explain what each field is asking for.

Format your response clearly with sections. Keep Hindi simple and easy to understand.
If no English text is visible, describe what you see in simple Hindi.`,

    describe: `You are helping an elderly rural Indian person understand what is in this image.
Describe everything you see in simple, short sentences.
Write in BOTH English and Hindi (Devanagari).
Format: English sentence. [हिंदी अनुवाद]
Keep it simple and relevant to daily life.`,
  }

  const res = await fetch('/api/chat', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model:      'llama-3.2-11b-vision-preview',  // Groq vision model
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: [
          {
            type:       'image_url',
            image_url:  { url: `data:${mimeType};base64,${base64Image}` },
          },
          { type: 'text', text: prompts[mode] },
        ],
      }],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error || `Error ${res.status}`)
  }

  const data = await res.json()
  return data.content?.[0]?.text || ''
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ── Result display ────────────────────────────────────────────────────────────
function ResultCard({ text, onSpeak }) {
  // Split into paragraphs for readability
  const paragraphs = text.split('\n').filter(l => l.trim())

  return (
    <div style={{
      background: '#fff', borderRadius: 22, padding: '18px 16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.09)',
      border: '1.5px solid rgba(255,107,0,0.1)',
      animation: 'fadeIn 0.35s ease',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 16, fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: C.saffron }}>
          🤖 Meera Didi ka Jawab
        </span>
        <button onClick={onSpeak} style={{
          background: C.saffron + '18', border: `1.5px solid ${C.saffron}44`,
          borderRadius: 12, padding: '6px 12px',
          fontSize: 13, fontFamily: "'Baloo 2', cursive", fontWeight: 700,
          color: C.saffron, cursor: 'pointer',
        }}>🔊 Suno</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {paragraphs.map((para, i) => {
          // Detect if line has Hindi characters
          const hasHindi = /[\u0900-\u097F]/.test(para)
          return (
            <p key={i} style={{
              margin: 0,
              fontSize: hasHindi ? 15 : 16,
              fontFamily: hasHindi ? "'Noto Sans Devanagari', sans-serif" : "'Baloo 2', cursive",
              color: hasHindi ? C.textMid : C.text,
              lineHeight: 1.6,
              paddingLeft: para.startsWith('-') || para.startsWith('•') ? 8 : 0,
            }}>
              {para}
            </p>
          )
        })}
      </div>
    </div>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function PointLearnScreen({ onBack }) {
  const [image,    setImage]    = useState(null)   // { base64, mimeType, url }
  const [mode,     setMode]     = useState('translate')
  const [result,   setResult]   = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const fileRef    = useRef(null)
  const cameraRef  = useRef(null)

  async function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      setError('Kripya ek image file chunein.')
      return
    }
    setError('')
    setResult('')
    const base64   = await fileToBase64(file)
    const url      = URL.createObjectURL(file)
    setImage({ base64, mimeType: file.type, url })
  }

  async function analyze() {
    if (!image) return
    setLoading(true)
    setResult('')
    setError('')
    try {
      const text = await analyzeImageWithGroq(image.base64, image.mimeType, mode)
      setResult(text)
    } catch (e) {
      setError('Error: ' + e.message)
    }
    setLoading(false)
  }

  function speakResult() {
    // Speak only English parts (non-Devanagari)
    const englishOnly = result
      .split('\n')
      .filter(l => l.trim() && !/^[\u0900-\u097F\s।,.!?]+$/.test(l))
      .join('. ')
    speakEnglish(englishOnly, 0.78)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4ff', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #2980B9, #3498DB)',
        padding: '20px 18px 18px',
        borderRadius: '0 0 28px 28px',
        boxShadow: '0 8px 28px rgba(41,128,185,0.4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <button onClick={onBack} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 12,
            width: 44, height: 44, fontSize: 20, color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 21, fontFamily: "'Baloo 2', cursive", fontWeight: 800, color: '#fff' }}>
              📷 Point & Learn
            </div>
            <div style={{ fontSize: 13, fontFamily: "'Noto Sans Devanagari', sans-serif", color: 'rgba(255,255,255,0.88)' }}>
              कोई भी photo लें → Hindi में समझें
            </div>
          </div>
        </div>

        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 8, background: 'rgba(0,0,0,0.15)', borderRadius: 16, padding: 4 }}>
          {[
            { id: 'translate', label: '📝 Text Translate', hi: 'अनुवाद करें' },
            { id: 'describe',  label: '🔍 Describe',       hi: 'समझाएँ'       },
          ].map(m => (
            <button key={m.id} onClick={() => setMode(m.id)} style={{
              flex: 1, padding: '10px 8px', borderRadius: 12, border: 'none',
              background: mode === m.id ? '#fff' : 'transparent',
              color: mode === m.id ? '#2980B9' : 'rgba(255,255,255,0.82)',
              fontSize: 13, fontFamily: "'Baloo 2', cursive", fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.2s', lineHeight: 1.3,
            }}>
              <div>{m.label}</div>
              <div style={{ fontSize: 11, fontFamily: "'Noto Sans Devanagari', sans-serif", opacity: 0.85 }}>{m.hi}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Tip */}
        <div style={{
          background: '#fff', borderRadius: 16, padding: '12px 14px',
          border: '1.5px solid rgba(41,128,185,0.15)',
        }}>
          <p style={{ margin: 0, fontSize: 14, fontFamily: "'Noto Sans Devanagari', sans-serif", color: C.textMid, lineHeight: 1.6 }}>
            💡 {mode === 'translate'
              ? 'कोई form, दवाई का label, hospital का sign, या कोई भी English text की photo लें — Meera Didi Hindi में समझाएँगी।'
              : 'कोई भी photo लें — Meera Didi बताएँगी कि उसमें क्या है।'
            }
          </p>
        </div>

        {/* Image picker buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          {/* Camera */}
          <button
            onClick={() => cameraRef.current?.click()}
            style={{
              flex: 1, padding: '16px 10px', borderRadius: 20, border: '2px dashed #3498DB',
              background: '#fff', cursor: 'pointer', textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 36 }}>📸</div>
            <div style={{ fontSize: 14, fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: '#2980B9', marginTop: 6 }}>Camera</div>
            <div style={{ fontSize: 12, fontFamily: "'Noto Sans Devanagari', sans-serif", color: C.textMid }}>फोटो लें</div>
          </button>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment"
            style={{ display: 'none' }} onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />

          {/* Gallery */}
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              flex: 1, padding: '16px 10px', borderRadius: 20, border: '2px dashed #9B59B6',
              background: '#fff', cursor: 'pointer', textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 36 }}>🖼️</div>
            <div style={{ fontSize: 14, fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: '#9B59B6', marginTop: 6 }}>Gallery</div>
            <div style={{ fontSize: 12, fontFamily: "'Noto Sans Devanagari', sans-serif", color: C.textMid }}>फोटो चुनें</div>
          </button>
          <input ref={fileRef} type="file" accept="image/*"
            style={{ display: 'none' }} onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
        </div>

        {/* Preview */}
        {image && (
          <div style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', animation: 'fadeIn 0.3s ease' }}>
            <img src={image.url} alt="Selected" style={{ width: '100%', maxHeight: 260, objectFit: 'cover', display: 'block' }} />
          </div>
        )}

        {/* Analyze button */}
        {image && !loading && (
          <button onClick={analyze} style={{
            background: 'linear-gradient(135deg, #2980B9, #3498DB)',
            border: 'none', borderRadius: 20, padding: '18px',
            fontSize: 20, fontFamily: "'Baloo 2', cursive", fontWeight: 700,
            color: '#fff', cursor: 'pointer',
            boxShadow: '0 6px 22px rgba(41,128,185,0.45)',
            animation: 'fadeIn 0.3s ease',
          }}>
            🔍 {mode === 'translate' ? 'Translate करें' : 'Samjhao'}
          </button>
        )}

        {/* Loading */}
        {loading && (
          <div style={{
            background: '#fff', borderRadius: 20, padding: '28px',
            textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}>
            <div style={{
              width: 56, height: 56, margin: '0 auto 14px',
              border: '5px solid #ddd', borderTop: '5px solid #2980B9',
              borderRadius: '50%', animation: 'spin 1s linear infinite',
            }} />
            <p style={{ margin: 0, fontSize: 16, fontFamily: "'Noto Sans Devanagari', sans-serif", color: C.textMid }}>
              Meera Didi dekh rahi hain... 🔍
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 13, fontFamily: "'Noto Sans Devanagari', sans-serif", color: C.textLight }}>
              मीरा दीदी देख रही हैं, थोड़ा इंतज़ार करें
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: '#fff5f5', border: '2px solid #E74C3C',
            borderRadius: 16, padding: '14px 16px',
          }}>
            <p style={{ margin: 0, fontSize: 15, fontFamily: "'Baloo 2', cursive", color: '#E74C3C' }}>
              ⚠️ {error}
            </p>
          </div>
        )}

        {/* Result */}
        {result && <ResultCard text={result} onSpeak={speakResult} />}

        {/* Reset */}
        {image && !loading && (
          <button onClick={() => { setImage(null); setResult(''); setError('') }} style={{
            background: '#f5f5f5', border: 'none', borderRadius: 16, padding: '14px',
            fontSize: 16, fontFamily: "'Noto Sans Devanagari', sans-serif",
            color: C.textMid, cursor: 'pointer',
          }}>
            🔄 नई photo लें
          </button>
        )}
      </div>
    </div>
  )
}
