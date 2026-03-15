import { C, TOPICS } from './constants.js'
import { MeeraDidi, RoundBadge } from './components.jsx'

export default function HomeScreen({ progress, onSelect }) {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #fff8ee 0%, #fff1d6 100%)' }}>

      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${C.saffron} 0%, ${C.gold} 100%)`,
        padding: '36px 20px 28px',
        textAlign: 'center',
        borderRadius: '0 0 40px 40px',
        boxShadow: `0 10px 40px ${C.shadow}`,
      }}>
        <div style={{ fontSize: 48, animation: 'bounce 1.4s ease-in-out infinite alternate' }}>🌸</div>
        <h1 style={{
          margin: '8px 0 4px',
          fontSize: 40,
          fontFamily: "'Baloo 2', cursive",
          fontWeight: 800,
          color: '#fff',
          letterSpacing: -0.5,
          textShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}>
          SunoBolo
        </h1>
        <p style={{
          margin: 0, fontSize: 20,
          color: 'rgba(255,255,255,0.92)',
          fontFamily: "'Noto Sans Devanagari', sans-serif",
          letterSpacing: 2,
        }}>
          सुनो • बोलो • सीखो
        </p>
      </div>

      {/* Meera Didi welcome */}
      <div style={{ padding: '0 16px' }}>
        <MeeraDidi
          message="Namaste! Main Meera Didi hoon. Aaj kya seekhna chahte hain?"
          hindi="नमस्ते! मैं मीरा दीदी हूँ। आज क्या सीखना चाहते हैं?"
        />
      </div>

      {/* Topic grid */}
      <div style={{ padding: '0 16px 36px' }}>
        <p style={{
          fontSize: 19, color: C.textMid,
          fontFamily: "'Noto Sans Devanagari', sans-serif",
          textAlign: 'center', margin: '4px 0 16px',
        }}>
          एक विषय चुनें 👇
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {TOPICS.map(t => {
            const p = progress[t.id] || { round: 1, completed: 0 }
            const started = p.round > 1 || p.completed > 0
            return (
              <button
                key={t.id}
                onClick={() => onSelect(t)}
                style={{
                  background: t.bg,
                  border: `2px solid ${t.color}28`,
                  borderRadius: 24,
                  padding: '20px 12px 16px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  boxShadow: `0 4px 18px ${t.color}1A`,
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.95)' }}
                onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
                onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
              >
                {/* Completed indicator */}
                {started && (
                  <div style={{
                    position: 'absolute', top: 0, right: 0,
                    background: t.color, color: '#fff',
                    borderRadius: '0 24px 0 14px',
                    padding: '4px 10px',
                    fontSize: 12, fontFamily: "'Baloo 2', cursive", fontWeight: 700,
                  }}>
                    R{p.round}
                  </div>
                )}

                <div style={{ fontSize: 42 }}>{t.emoji}</div>
                <div style={{
                  fontSize: 15, fontFamily: "'Baloo 2', cursive",
                  fontWeight: 700, color: t.color, marginTop: 8, lineHeight: 1.3,
                }}>
                  {t.en}
                </div>
                <div style={{
                  fontSize: 13, fontFamily: "'Noto Sans Devanagari', sans-serif",
                  color: C.textMid, marginTop: 3,
                }}>
                  {t.hi}
                </div>

                {/* Progress dots */}
                {started && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 8 }}>
                    {Array.from({ length: Math.min(p.round - 1, 5) }).map((_, i) => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: t.color }} />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
