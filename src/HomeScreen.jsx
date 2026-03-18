import { C, TOPICS } from './constants.js'
import { MeeraDidi } from './components.jsx'

const FEATURE_CARDS = [
  {
    id:      'aiChat',
    emoji:   '🙋‍♀️',
    title:   'AI से बात करो',
    en:      'Talk to Meera Didi',
    desc:    'मीरा दीदी से real English conversation करें',
    pills:   ['🎤 Voice', '✏️ Auto Corrects', '📈 Gets Harder'],
    bg:      'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
    badge:   '● LIVE',
    badgeBg: '#22c55e',
    glow:    'rgba(255,184,48,0.3)',
  },
  {
    id:      'emergency',
    emoji:   '🆘',
    title:   'Emergency Phrases',
    en:      'Zaroorat ki Baatein',
    desc:    'ज़रूरत पड़ने पर — instant English phrases',
    pills:   ['🏥 Hospital', '🚔 Safety', '🔄 Daily'],
    bg:      'linear-gradient(135deg, #7b0000, #c0392b, #e74c3c)',
    badge:   '⚡ INSTANT',
    badgeBg: '#ff6b35',
    glow:    'rgba(231,76,60,0.3)',
  },
  {
    id:      'speedTrainer',
    emoji:   '🗣️',
    title:   'Speed Trainer',
    en:      'Dheere se Tez',
    desc:    'धीरे → normal speed — कान को असली English की आदत',
    pills:   ['🐢 Slow', '🚶 Normal', '🏃 Fast'],
    bg:      'linear-gradient(135deg, #134e5e, #1a6b5e, #27AE60)',
    badge:   '👂 LISTEN',
    badgeBg: '#f39c12',
    glow:    'rgba(39,174,96,0.3)',
  },
  {
    id:      'pointLearn',
    emoji:   '📷',
    title:   'Point & Learn',
    en:      'Camera se Seekho',
    desc:    'Photo लें → Hindi में समझें — forms, signs, labels',
    pills:   ['📋 Forms', '🏷️ Labels', '🔤 Signs'],
    bg:      'linear-gradient(135deg, #1a1a6e, #2980b9, #3498db)',
    badge:   '📸 CAMERA',
    badgeBg: '#9b59b6',
    glow:    'rgba(52,152,219,0.3)',
  },
  {
    id:      'meeraHelper',
    emoji:   '🤖',
    title:   'Meera Helper',
    en:      'Kuch Bhi Poocho',
    desc:    'Text, photo, ya bolkar — कोई भी सवाल पूछें',
    pills:   ['📝 Text', '📷 Photo', '🎤 Voice'],
    bg:      'linear-gradient(135deg, #3d1a78, #6c3483, #8e44ad)',
    badge:   '🤖 AI',
    badgeBg: '#e74c3c',
    glow:    'rgba(142,68,173,0.3)',
  },
]

function FeatureCard({ card, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left',
        background: card.bg,
        borderRadius: 26, padding: '20px 18px 18px',
        boxShadow: `0 10px 36px ${card.glow}`,
        marginBottom: 14, position: 'relative', overflow: 'hidden',
        transition: 'transform 0.16s',
      }}
      onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.97)' }}
      onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
      onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
    >
      {/* Glow decoration */}
      <div style={{
        position: 'absolute', top: -30, right: -20, width: 130, height: 130,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${card.glow} 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Row: emoji + text + badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10, position: 'relative' }}>
        <div style={{
          width: 58, height: 58, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30,
          boxShadow: '0 0 0 2px rgba(255,255,255,0.2)',
        }}>{card.emoji}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 20, fontFamily: "'Baloo 2', cursive", fontWeight: 800, color: '#fff', lineHeight: 1 }}>
              {card.title}
            </span>
            <span style={{
              background: card.badgeBg, borderRadius: 20, padding: '2px 9px',
              fontSize: 11, color: '#fff', fontFamily: "'Baloo 2', cursive", fontWeight: 700,
            }}>{card.badge}</span>
          </div>
          <p style={{ margin: 0, fontSize: 13, fontFamily: "'Baloo 2', cursive", color: 'rgba(255,255,255,0.7)' }}>
            {card.en}
          </p>
        </div>
      </div>

      {/* Hindi description */}
      <p style={{
        margin: '0 0 12px', position: 'relative',
        fontSize: 13, fontFamily: "'Noto Sans Devanagari', sans-serif",
        color: 'rgba(255,255,255,0.82)', lineHeight: 1.5,
      }}>{card.desc}</p>

      {/* Pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', position: 'relative' }}>
        {card.pills.map((pill, i) => (
          <span key={i} style={{
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 20, padding: '4px 11px',
            fontSize: 12, color: 'rgba(255,255,255,0.88)',
            fontFamily: "'Baloo 2', cursive",
          }}>{pill}</span>
        ))}
      </div>
    </button>
  )
}

export default function HomeScreen({ progress, onFeature, onSelect }) {
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
          message="Namaste! Aaj kya karna chahte hain?"
          hindi="नमस्ते! आज क्या करना चाहते हैं?"
        />
      </div>

      <div style={{ padding: '0 16px 40px' }}>

        {/* ══ Feature cards section ══ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,107,0,0.15)' }} />
          <p style={{ margin: 0, fontSize: 15, color: C.textMid, fontFamily: "'Noto Sans Devanagari', sans-serif", whiteSpace: 'nowrap' }}>
            ✨ Special Features
          </p>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,107,0,0.15)' }} />
        </div>

        {FEATURE_CARDS.map(card => (
          <FeatureCard key={card.id} card={card} onClick={() => onFeature(card.id)} />
        ))}

        {/* ══ Topic lessons section ══ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '6px 0 16px' }}>
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
