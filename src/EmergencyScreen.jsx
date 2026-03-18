import { useState } from 'react'
import { C } from './constants.js'
import { speakEnglish } from './api.js'

const EMERGENCY_PHRASES = [
  { emoji: '🏥', en: 'I need a doctor immediately.',        hi: 'मुझे अभी डॉक्टर चाहिए।',           category: 'Hospital' },
  { emoji: '💊', en: 'I am having chest pain.',             hi: 'मेरे सीने में दर्द है।',              category: 'Hospital' },
  { emoji: '🩺', en: 'I am diabetic. I need sugar.',        hi: 'मुझे शुगर है। मुझे मीठा चाहिए।',     category: 'Hospital' },
  { emoji: '🆘', en: 'Please call an ambulance.',           hi: 'कृपया एम्बुलेंस बुलाएँ।',            category: 'Hospital' },
  { emoji: '💉', en: 'I am allergic to this medicine.',     hi: 'मुझे इस दवाई से एलर्जी है।',         category: 'Hospital' },
  { emoji: '🚔', en: 'Please help me. I am lost.',          hi: 'कृपया मेरी मदद करें। मैं खो गया।',  category: 'Safety'   },
  { emoji: '📞', en: 'Please call my family.',              hi: 'कृपया मेरे परिवार को फोन करें।',     category: 'Safety'   },
  { emoji: '🏦', en: 'I want to speak to the manager.',     hi: 'मैं मैनेजर से बात करना चाहता हूँ।', category: 'Safety'   },
  { emoji: '🔄', en: 'Can you please repeat slowly?',       hi: 'क्या आप धीरे-धीरे दोहरा सकते हैं?', category: 'Everyday' },
  { emoji: '✍️', en: 'Please write it down for me.',        hi: 'कृपया मेरे लिए लिख दें।',            category: 'Everyday' },
  { emoji: '🙏', en: 'I do not understand. Please help.',   hi: 'मैं नहीं समझा। कृपया मदद करें।',    category: 'Everyday' },
  { emoji: '🚽', en: 'Where is the toilet please?',         hi: 'कृपया टॉयलेट कहाँ है?',              category: 'Everyday' },
]

const CATEGORIES = ['All', 'Hospital', 'Safety', 'Everyday']
const CAT_COLORS  = { Hospital: '#E74C3C', Safety: '#8E44AD', Everyday: '#2980B9', All: C.saffron }

export default function EmergencyScreen({ onBack }) {
  const [activeCategory, setActiveCategory] = useState('All')
  const [speaking, setSpeaking] = useState(null)

  const filtered = activeCategory === 'All'
    ? EMERGENCY_PHRASES
    : EMERGENCY_PHRASES.filter(p => p.category === activeCategory)

  async function handleSpeak(phrase, idx) {
    setSpeaking(idx)
    await speakEnglish(phrase.en, 0.72)
    setTimeout(() => setSpeaking(null), 2000)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fff5f5', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #C0392B, #E74C3C)',
        padding: '20px 18px 18px',
        borderRadius: '0 0 28px 28px',
        boxShadow: '0 8px 28px rgba(192,57,43,0.4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <button onClick={onBack} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 12,
            width: 44, height: 44, fontSize: 20, color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontFamily: "'Baloo 2', cursive", fontWeight: 800, color: '#fff' }}>
              🆘 Emergency Phrases
            </div>
            <div style={{ fontSize: 13, fontFamily: "'Noto Sans Devanagari', sans-serif", color: 'rgba(255,255,255,0.85)' }}>
              ज़रूरत पड़ने पर — tap करें, सुनें, बोलें
            </div>
          </div>
        </div>

        {/* Tip */}
        <div style={{
          background: 'rgba(255,255,255,0.18)', borderRadius: 14, padding: '10px 14px',
        }}>
          <p style={{ margin: 0, fontSize: 14, fontFamily: "'Noto Sans Devanagari', sans-serif", color: '#fff', lineHeight: 1.5 }}>
            💡 किसी भी card को tap करें — English sentence ज़ोर से बोला जाएगा। फिर आप वही दोहराएँ।
          </p>
        </div>
      </div>

      {/* Category filter */}
      <div style={{ padding: '14px 16px 0', display: 'flex', gap: 8, overflowX: 'auto' }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} style={{
            background: activeCategory === cat ? CAT_COLORS[cat] : '#fff',
            color: activeCategory === cat ? '#fff' : CAT_COLORS[cat],
            border: `2px solid ${CAT_COLORS[cat]}`,
            borderRadius: 20, padding: '7px 16px',
            fontSize: 14, fontFamily: "'Baloo 2', cursive", fontWeight: 700,
            cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
            transition: 'all 0.2s',
          }}>{cat}</button>
        ))}
      </div>

      {/* Phrase cards */}
      <div style={{ padding: '14px 16px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map((phrase, idx) => {
          const color   = CAT_COLORS[phrase.category]
          const isSpeak = speaking === idx
          return (
            <button
              key={idx}
              onClick={() => handleSpeak(phrase, idx)}
              style={{
                background: isSpeak ? color : '#fff',
                border: `2px solid ${color}33`,
                borderRadius: 20,
                padding: '16px 18px',
                cursor: 'pointer',
                textAlign: 'left',
                boxShadow: isSpeak ? `0 6px 24px ${color}55` : '0 3px 12px rgba(0,0,0,0.07)',
                transition: 'all 0.25s',
                display: 'flex', alignItems: 'center', gap: 14,
              }}
              onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.97)' }}
              onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
              onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              <div style={{ fontSize: 36, flexShrink: 0 }}>{phrase.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 17, fontFamily: "'Baloo 2', cursive", fontWeight: 700,
                  color: isSpeak ? '#fff' : C.text, lineHeight: 1.4, marginBottom: 4,
                }}>
                  {phrase.en}
                </div>
                <div style={{
                  fontSize: 14, fontFamily: "'Noto Sans Devanagari', sans-serif",
                  color: isSpeak ? 'rgba(255,255,255,0.88)' : C.textMid, lineHeight: 1.4,
                }}>
                  {phrase.hi}
                </div>
              </div>
              <div style={{
                fontSize: 22, flexShrink: 0,
                animation: isSpeak ? 'pulse 0.8s ease-in-out infinite' : 'none',
              }}>
                {isSpeak ? '🔊' : '▶️'}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
