import { C, TOPICS } from './constants.js'
import { MeeraDidi } from './components.jsx'

export default function HomeScreen({ progress, onSelect, onAiChat }) {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #fff8ee 0%, #fff1d6 100%)' }}>

      {/* ── App header ── */}
      <div style={{
        background: `linear-gradient(135deg, ${C.saffron} 0%, ${C.gold} 100%)`,
        padding: '36px 20px 28px', textAlign: 'center',
        borderRadius: '0 0 40px 40px',
        boxShadow: `0 10px 40px ${C.shadow}`,
      }}>
        <div style={{ fontSize: 48, animation: 'bounce 1.4s ease-in-out infinite alternate' }}>🌸</div>
        <h1 style={{
          margin: '8px 0 4px', fontSize: 40,
          fontFamily: "'Baloo 2', cursive", fontWeight: 800,
          color: '#fff', letterSpacing: -0.5,
          textShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}>SunoBolo</h1>
        <p style={{
          margin: 0, fontSize: 20, letterSpacing: 2,
          color: 'rgba(255,255,255,0.92)',
          fontFamily: "'Noto Sans Devanagari', sans-serif",
        }}>सुनो • बोलो • सीखो</p>
      </div>

      {/* ── Meera Didi greeting ── */}
      <div style={{ padding: '0 16px' }}>
        <MeeraDidi
          message="Namaste! Aaj kya seekhna chahte hain?"
          hindi="नमस्ते! आज क्या सीखना चाहते हैं?"
        />
      </div>

      <div style={{ padding: '0 16px 40px' }}>

        {/* ════════════════════════════════════════════════════════
            AI SE BAAT KARO — Full-width hero feature card
        ════════════════════════════════════════════════════════ */}
        <button
          onClick={onAiChat}
          style={{
            width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left',
            background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
            borderRadius: 28, padding: '22px 20px 20px',
            boxShadow: '0 12px 40px rgba(15,32,39,0.45)',
            marginBottom: 24, position: 'relative', overflow: 'hidden',
            transition: 'transform 0.18s',
          }}
          onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.97)' }}
          onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
          onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          {/* Decorative glow blobs */}
          <div style={{
            position: 'absolute', top: -30, right: -20, width: 140, height: 140,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,184,48,0.3) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: -40, left: '25%', width: 120, height: 120,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,107,0,0.22) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Top row — avatar + title + live badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', marginBottom: 14 }}>
            <div style={{
              width: 66, height: 66, borderRadius: '50%', flexShrink: 0,
              background: `linear-gradient(135deg, ${C.saffron}, ${C.gold})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 34,
              boxShadow: `0 0 0 3px rgba(255,184,48,0.35), 0 6px 20px rgba(0,0,0,0.3)`,
            }}>🙋‍♀️</div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 22, fontFamily: "'Baloo 2', cursive", fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                  AI से बात करो
                </span>
                <span style={{
                  background: '#22c55e', borderRadius: 20, padding: '2px 9px',
                  fontSize: 11, color: '#fff', fontFamily: "'Baloo 2', cursive", fontWeight: 700,
                  letterSpacing: 0.5,
                }}>● LIVE</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, fontFamily: "'Baloo 2', cursive", color: 'rgba(255,255,255,0.72)', lineHeight: 1.4 }}>
                Talk to Meera Didi — your personal English conversation tutor
              </p>
            </div>
          </div>

          {/* Description in Hindi */}
          <p style={{
            margin: '0 0 14px', position: 'relative',
            fontSize: 14, fontFamily: "'Noto Sans Devanagari', sans-serif",
            color: 'rgba(255,184,48,0.92)', lineHeight: 1.5,
          }}>
            मीरा दीदी आपसे real English conversation करेंगी, गलती को धीरे से सुधारेंगी, और नए शब्द सिखाएँगी 🌟
          </p>

          {/* Feature pills */}
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', position: 'relative' }}>
            {['🎤 Voice', '🧠 Smart Tutor', '✏️ Auto Corrects', '💬 Real Conversation', '📈 Gets Harder'].map((tag, i) => (
              <span key={i} style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 20, padding: '4px 11px',
                fontSize: 12, color: 'rgba(255,255,255,0.82)',
                fontFamily: "'Baloo 2', cursive",
              }}>{tag}</span>
            ))}
          </div>
        </button>

        {/* ── Section divider ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,107,0,0.15)' }} />
          <p style={{ margin: 0, fontSize: 15, color: C.textMid, fontFamily: "'Noto Sans Devanagari', sans-serif", whiteSpace: 'nowrap' }}>
            📚 Topic Lessons
          </p>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,107,0,0.15)' }} />
        </div>

        {/* ── 8 topic cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {TOPICS.map(t => {
            const p       = progress[t.id] || { round: 1, completed: 0 }
            const started = p.round > 1 || p.completed > 0
            return (
              <button key={t.id} onClick={() => onSelect(t)} style={{
                background: t.bg, border: `2px solid ${t.color}28`,
                borderRadius: 24, padding: '20px 12px 16px',
                cursor: 'pointer', textAlign: 'center',
                boxShadow: `0 4px 18px ${t.color}18`,
                transition: 'transform 0.15s', position: 'relative', overflow: 'hidden',
              }}
                onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.95)' }}
                onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
                onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
              >
                {started && (
                  <div style={{
                    position: 'absolute', top: 0, right: 0,
                    background: t.color, color: '#fff',
                    borderRadius: '0 24px 0 14px',
                    padding: '4px 10px',
                    fontSize: 12, fontFamily: "'Baloo 2', cursive", fontWeight: 700,
                  }}>R{p.round}</div>
                )}
                <div style={{ fontSize: 40 }}>{t.emoji}</div>
                <div style={{ fontSize: 14, fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: t.color, marginTop: 8, lineHeight: 1.3 }}>{t.en}</div>
                <div style={{ fontSize: 12, fontFamily: "'Noto Sans Devanagari', sans-serif", color: C.textMid, marginTop: 3 }}>{t.hi}</div>
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
