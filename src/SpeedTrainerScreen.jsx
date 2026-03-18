import { useState, useEffect } from 'react'
import { C, STARTER_SENTENCES } from './constants.js'
import { speakEnglish } from './api.js'

const SPEEDS = [
  { label: 'Bahut Dheere',  hi: 'बहुत धीरे',  rate: 0.55, color: '#27AE60', desc: 'Very Slow'   },
  { label: 'Dheere',        hi: 'धीरे',        rate: 0.75, color: '#F39C12', desc: 'Slow'        },
  { label: 'Normal',        hi: 'Normal',      rate: 1.0,  color: '#E67E22', desc: 'Normal'      },
  { label: 'Thoda Tez',     hi: 'थोड़ा तेज़',  rate: 1.2,  color: '#E74C3C', desc: 'A bit Fast'  },
]

// Flatten all starter sentences into one pool
const ALL_SENTENCES = Object.values(STARTER_SENTENCES).flat()

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5) }

export default function SpeedTrainerScreen({ onBack }) {
  const [speedIdx,    setSpeedIdx]    = useState(0)
  const [sentences,   setSentences]   = useState(() => shuffle(ALL_SENTENCES))
  const [current,     setCurrent]     = useState(0)
  const [playing,     setPlaying]     = useState(false)
  const [revealed,    setRevealed]    = useState(false)
  const [score,       setScore]       = useState({ correct: 0, total: 0 })

  const speed    = SPEEDS[speedIdx]
  const sentence = sentences[current % sentences.length]

  useEffect(() => {
    setRevealed(false)
  }, [current])

  async function playSentence() {
    setPlaying(true)
    setRevealed(false)
    await speakEnglish(sentence, speed.rate)
    setTimeout(() => setPlaying(false), (sentence.length / 10) * (1 / speed.rate) * 1000 + 800)
  }

  function handleAnswer(correct) {
    setScore(s => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }))
    setCurrent(c => c + 1)
  }

  function nextSpeed() {
    if (speedIdx < SPEEDS.length - 1) {
      setSpeedIdx(s => s + 1)
      setCurrent(0)
      setSentences(shuffle(ALL_SENTENCES))
      setScore({ correct: 0, total: 0 })
    }
  }

  const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0
  const canLevelUp = score.total >= 5 && accuracy >= 70 && speedIdx < SPEEDS.length - 1

  return (
    <div style={{ minHeight: '100vh', background: '#f0fff4', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${speed.color}, ${speed.color}bb)`,
        padding: '20px 18px 18px',
        borderRadius: '0 0 28px 28px',
        boxShadow: `0 8px 28px ${speed.color}44`,
        transition: 'background 0.5s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <button onClick={onBack} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 12,
            width: 44, height: 44, fontSize: 20, color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 21, fontFamily: "'Baloo 2', cursive", fontWeight: 800, color: '#fff' }}>
              🗣️ Speed Trainer
            </div>
            <div style={{ fontSize: 13, fontFamily: "'Noto Sans Devanagari', sans-serif", color: 'rgba(255,255,255,0.88)' }}>
              धीरे से तेज़ — कान को असली English की आदत डालें
            </div>
          </div>
          {/* Score */}
          <div style={{ background: 'rgba(255,255,255,0.22)', borderRadius: 14, padding: '6px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontFamily: "'Baloo 2', cursive", fontWeight: 800, color: '#fff' }}>{accuracy}%</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontFamily: "'Baloo 2', cursive" }}>{score.correct}/{score.total}</div>
          </div>
        </div>

        {/* Speed selector */}
        <div style={{ display: 'flex', gap: 6 }}>
          {SPEEDS.map((s, i) => (
            <button key={i} onClick={() => { setSpeedIdx(i); setCurrent(0); setSentences(shuffle(ALL_SENTENCES)); setScore({ correct: 0, total: 0 }) }}
              style={{
                flex: 1, padding: '8px 4px', borderRadius: 12, border: 'none',
                background: speedIdx === i ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.18)',
                color: speedIdx === i ? s.color : '#fff',
                fontSize: 11, fontFamily: "'Baloo 2', cursive", fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.2s', lineHeight: 1.3,
              }}>
              <div>{s.hi}</div>
              <div style={{ fontSize: 10, opacity: 0.8 }}>{s.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, padding: '20px 16px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* How to play */}
        <div style={{
          background: '#fff', borderRadius: 18, padding: '14px 16px',
          border: '1.5px solid rgba(0,0,0,0.06)',
        }}>
          <p style={{ margin: 0, fontSize: 14, fontFamily: "'Noto Sans Devanagari', sans-serif", color: C.textMid, lineHeight: 1.6 }}>
            👂 नीचे का Play button दबाएँ → sentence सुनें → क्या समझ आया? → Haan या Nahi बताएँ।
            जब 70% सही हो जाए तो अगली speed पर जाएँ।
          </p>
        </div>

        {/* Main card */}
        <div style={{
          background: '#fff', borderRadius: 24, padding: '28px 20px',
          boxShadow: '0 6px 28px rgba(0,0,0,0.09)',
          border: '1.5px solid rgba(0,0,0,0.05)',
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 20,
        }}>
          {/* Speed badge */}
          <div style={{
            background: speed.color + '18', border: `2px solid ${speed.color}44`,
            borderRadius: 20, padding: '6px 18px',
            fontSize: 15, fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: speed.color,
          }}>
            {speed.hi} — {speed.desc}
          </div>

          {/* Sentence counter */}
          <div style={{ fontSize: 14, fontFamily: "'Baloo 2', cursive", color: C.textLight }}>
            Sentence #{(current % sentences.length) + 1} of {sentences.length}
          </div>

          {/* Play button */}
          <button onClick={playSentence} style={{
            width: 110, height: 110, borderRadius: '50%', border: 'none',
            background: playing
              ? `radial-gradient(circle, ${speed.color}cc, ${speed.color})`
              : `radial-gradient(circle, ${speed.color}, ${speed.color}aa)`,
            fontSize: 44, cursor: 'pointer',
            boxShadow: `0 8px 32px ${speed.color}55`,
            animation: playing ? 'micPulse 1s ease-in-out infinite' : 'none',
            transition: 'all 0.2s',
          }}>
            {playing ? '🔊' : '▶️'}
          </button>

          <p style={{
            fontSize: 15, fontFamily: "'Noto Sans Devanagari', sans-serif",
            color: C.textMid, textAlign: 'center', margin: 0,
          }}>
            {playing ? 'सुनिए ध्यान से... 👂' : 'Button दबाएँ और सुनें'}
          </p>

          {/* Reveal / answer */}
          {!revealed ? (
            <button onClick={() => setRevealed(true)} style={{
              background: '#f8f8f8', border: '2px solid #ddd', borderRadius: 16,
              padding: '12px 24px', fontSize: 16, fontFamily: "'Noto Sans Devanagari', sans-serif",
              color: C.textMid, cursor: 'pointer',
            }}>
              👁️ Sentence देखें
            </button>
          ) : (
            <div style={{ width: '100%', textAlign: 'center' }}>
              <div style={{
                background: speed.color + '12', border: `2px solid ${speed.color}33`,
                borderRadius: 16, padding: '14px 16px', marginBottom: 16,
              }}>
                <p style={{ margin: 0, fontSize: 20, fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: speed.color }}>
                  "{sentence}"
                </p>
              </div>
              <p style={{ fontSize: 15, fontFamily: "'Noto Sans Devanagari', sans-serif", color: C.textMid, marginBottom: 12 }}>
                क्या आपने सही सुना?
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => handleAnswer(true)} style={{
                  flex: 1, padding: '14px', borderRadius: 16, border: 'none',
                  background: '#2ECC71', color: '#fff', fontSize: 18,
                  fontFamily: "'Baloo 2', cursive", fontWeight: 700, cursor: 'pointer',
                }}>✅ हाँ, सुना!</button>
                <button onClick={() => handleAnswer(false)} style={{
                  flex: 1, padding: '14px', borderRadius: 16, border: 'none',
                  background: '#E74C3C', color: '#fff', fontSize: 18,
                  fontFamily: "'Baloo 2', cursive", fontWeight: 700, cursor: 'pointer',
                }}>❌ नहीं</button>
              </div>
            </div>
          )}
        </div>

        {/* Level up prompt */}
        {canLevelUp && (
          <div style={{
            background: 'linear-gradient(135deg, #f39c12, #e67e22)',
            borderRadius: 20, padding: '16px 18px',
            animation: 'fadeIn 0.4s ease',
          }}>
            <p style={{ margin: '0 0 10px', fontSize: 17, fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: '#fff' }}>
              🎉 Shabash! अगली speed try करें!
            </p>
            <button onClick={nextSpeed} style={{
              background: '#fff', border: 'none', borderRadius: 14,
              padding: '11px 20px', fontSize: 16, fontFamily: "'Baloo 2', cursive",
              fontWeight: 700, color: '#e67e22', cursor: 'pointer', width: '100%',
            }}>
              अगली speed → {SPEEDS[speedIdx + 1]?.hi}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
