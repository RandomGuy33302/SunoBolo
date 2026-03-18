import { useState, useRef } from 'react'
import { C } from './constants.js'
import { speakEnglish, compressImage } from './api.js'

const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'

async function analyzeImage(imageData, mode) {
  const prompts = {
    translate: `You are a helpful assistant for elderly rural Indians who don't know English.
Look at this image carefully. Find ALL English text, words, labels, signs, or printed content visible.
For each piece of text found, provide the original English text and Hindi translation in Devanagari script, and a simple Hindi explanation of what it means.
If this looks like a form, explain what each field is asking for in simple Hindi.
Format clearly. Keep Hindi simple and easy. If no English text, describe what you see in simple Hindi.`,

    describe: `You are helping an elderly rural Indian person understand what is in this image.
Describe everything you see in simple short sentences.
Write in BOTH English and Hindi (Devanagari).
Format each point as: English sentence. [हिंदी अनुवाद]
Keep it simple and relevant to daily life.`,
  }

  const res = await fetch('/api/chat', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model:      VISION_MODEL,
      max_tokens: 1200,
      messages: [{
        role:    'user',
        content: [
          {
            type:      'image_url',
            image_url: { url: `data:${imageData.mimeType};base64,${imageData.base64}` },
          },
          { type: 'text', text: prompts[mode] },
        ],
      }],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error || `Server error ${res.status}`)
  }
  const data = await res.json()
  return data.content?.[0]?.text || ''
}

function ResultCard({ text, onSpeak }) {
  const lines = text.split('\n').filter(l => l.trim())
  return (
    <div style={{
      background: '#fff', borderRadius: 22, padding: '18px 16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.09)',
      border: '1.5px solid rgba(41,128,185,0.15)',
      animation: 'fadeIn 0.35s ease',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 16, fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: '#2980B9' }}>
          🤖 Meera Didi ka Jawab
        </span>
        <button onClick={onSpeak} style={{
          background: '#2980B918', border: '1.5px solid #2980B944',
          borderRadius: 12, padding: '6px 12px',
          fontSize: 13, fontFamily: "'Baloo 2', cursive", fontWeight: 700,
          color: '#2980B9', cursor: 'pointer',
        }}>🔊 Suno</button>
      </div>
      {lines.map((para, i) => {
        const hasHindi = /[\u0900-\u097F]/.test(para)
        return (
          <p key={i} style={{
            margin: '0 0 8px',
            fontSize: hasHindi ? 15 : 16,
            fontFamily: hasHindi ? "'Noto Sans Devanagari', sans-serif" : "'Baloo 2', cursive",
            color: hasHindi ? C.textMid : C.text,
            lineHeight: 1.65,
          }}>{para}</p>
        )
      })}
    </div>
  )
}

export default function PointLearnScreen({ onBack }) {
  const [image,    setImage]    = useState(null)
  const [mode,     setMode]     = useState('translate')
  const [result,   setResult]   = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [compressing, setCompressing] = useState(false)
  const fileRef   = useRef(null)
  const cameraRef = useRef(null)

  async function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      setError('Kripya ek image file chunein.')
      return
    }
    setError(''); setResult(''); setCompressing(true)
    try {
      // Compress image client-side before anything — prevents 413
      const compressed = await compressImage(file, 800, 0.72)
      setImage(compressed)
    } catch (e) {
      setError('Image load nahi hui: ' + e.message)
    }
    setCompressing(false)
  }

  async function analyze() {
    if (!image) return
    setLoading(true); setResult(''); setError('')
    try {
      const text = await analyzeImage(image, mode)
      setResult(text)
    } catch (e) {
      setError('Error: ' + e.message)
    }
    setLoading(false)
  }

  function speakResult() {
    const englishOnly = result
      .split('\n')
      .filter(l => l.trim() && !/^[\u0900-\u097F\s।,.!?\[\]]+$/.test(l))
      .join('. ')
    speakEnglish(englishOnly, 0.78)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4ff', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a5276, #2980B9, #3498DB)',
        padding: '20px 18px 18px',
        borderRadius: '0 0 28px 28px',
        boxShadow: '0 8px 28px rgba(41,128,185,0.4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
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
        <div style={{ display: 'flex', gap: 8, background: 'rgba(0,0,0,0.18)', borderRadius: 16, padding: 4 }}>
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
        <div style={{ background: '#fff', borderRadius: 16, padding: '12px 14px', border: '1.5px solid rgba(41,128,185,0.15)' }}>
          <p style={{ margin: 0, fontSize: 14, fontFamily: "'Noto Sans Devanagari', sans-serif", color: C.textMid, lineHeight: 1.6 }}>
            💡 {mode === 'translate'
              ? 'कोई form, दवाई का label, hospital sign, या English text की photo लें — Hindi में समझाएँगे।'
              : 'कोई भी photo लें — Meera Didi बताएँगी कि उसमें क्या है।'
            }
          </p>
        </div>

        {/* Image picker */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => cameraRef.current?.click()} style={{
            flex: 1, padding: '18px 10px', borderRadius: 20,
            border: '2px dashed #3498DB', background: '#fff',
            cursor: 'pointer', textAlign: 'center',
          }}>
            <div style={{ fontSize: 36 }}>📸</div>
            <div style={{ fontSize: 14, fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: '#2980B9', marginTop: 6 }}>Camera</div>
            <div style={{ fontSize: 12, fontFamily: "'Noto Sans Devanagari', sans-serif", color: C.textMid }}>फोटो लें</div>
          </button>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment"
            style={{ display: 'none' }} onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />

          <button onClick={() => fileRef.current?.click()} style={{
            flex: 1, padding: '18px 10px', borderRadius: 20,
            border: '2px dashed #9B59B6', background: '#fff',
            cursor: 'pointer', textAlign: 'center',
          }}>
            <div style={{ fontSize: 36 }}>🖼️</div>
            <div style={{ fontSize: 14, fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: '#9B59B6', marginTop: 6 }}>Gallery</div>
            <div style={{ fontSize: 12, fontFamily: "'Noto Sans Devanagari', sans-serif", color: C.textMid }}>फोटो चुनें</div>
          </button>
          <input ref={fileRef} type="file" accept="image/*"
            style={{ display: 'none' }} onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
        </div>

        {/* Compressing indicator */}
        {compressing && (
          <div style={{ textAlign: 'center', padding: 16 }}>
            <p style={{ fontFamily: "'Noto Sans Devanagari', sans-serif", color: C.textMid, fontSize: 15 }}>
              ⏳ Photo tayaar ho rahi hai...
            </p>
          </div>
        )}

        {/* Preview */}
        {image && !compressing && (
          <div style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', animation: 'fadeIn 0.3s ease' }}>
            <img src={image.url} alt="Selected" style={{ width: '100%', maxHeight: 260, objectFit: 'cover', display: 'block' }} />
          </div>
        )}

        {/* Analyze button */}
        {image && !loading && !compressing && (
          <button onClick={analyze} style={{
            background: 'linear-gradient(135deg, #1a5276, #2980B9)',
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
          <div style={{ background: '#fff', borderRadius: 20, padding: '28px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <div style={{
              width: 56, height: 56, margin: '0 auto 14px',
              border: '5px solid #ddd', borderTop: '5px solid #2980B9',
              borderRadius: '50%', animation: 'spin 1s linear infinite',
            }} />
            <p style={{ margin: 0, fontSize: 16, fontFamily: "'Noto Sans Devanagari', sans-serif", color: C.textMid }}>
              Meera Didi dekh rahi hain... 🔍
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 13, fontFamily: "'Noto Sans Devanagari', sans-serif", color: C.textLight }}>
              थोड़ा इंतज़ार करें
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: '#fff5f5', border: '2px solid #E74C3C', borderRadius: 16, padding: '14px 16px' }}>
            <p style={{ margin: 0, fontSize: 15, fontFamily: "'Baloo 2', cursive", color: '#E74C3C' }}>⚠️ {error}</p>
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
