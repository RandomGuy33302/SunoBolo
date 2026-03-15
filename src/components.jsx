import { C } from './constants.js'

export function BigBtn({ onClick, children, color = C.saffron, textColor = C.white, disabled = false, style = {} }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? '#ccc' : color,
        color: disabled ? '#999' : textColor,
        border: 'none',
        borderRadius: 20,
        padding: '18px 28px',
        fontSize: 21,
        fontFamily: "'Baloo 2', cursive",
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: disabled ? 'none' : `0 6px 20px ${color}55`,
        transition: 'transform 0.12s, box-shadow 0.12s',
        width: '100%',
        letterSpacing: 0.2,
        ...style,
      }}
      onPointerDown={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.97)' }}
      onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
      onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
    >
      {children}
    </button>
  )
}

export function Card({ children, style = {} }) {
  return (
    <div style={{
      background: C.cardBg,
      borderRadius: 24,
      padding: 22,
      boxShadow: `0 4px 28px ${C.shadow}`,
      border: '1.5px solid rgba(255,107,0,0.09)',
      animation: 'fadeIn 0.3s ease',
      ...style,
    }}>
      {children}
    </div>
  )
}

export function MeeraDidi({ message, hindi, small = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, margin: '14px 0' }}>
      <div style={{
        width: small ? 46 : 56,
        height: small ? 46 : 56,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${C.saffron}, ${C.gold})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: small ? 24 : 28,
        flexShrink: 0,
        boxShadow: `0 4px 12px ${C.shadow}`,
      }}>🙋‍♀️</div>
      <div style={{
        background: 'linear-gradient(135deg, #fff7ee, #fff3e0)',
        borderRadius: '0 18px 18px 18px',
        padding: small ? '10px 14px' : '13px 17px',
        border: '1.5px solid rgba(255,107,0,0.18)',
        flex: 1,
      }}>
        {message && (
          <p style={{ margin: 0, fontSize: small ? 15 : 17, color: C.text, fontFamily: "'Baloo 2', cursive", lineHeight: 1.5 }}>
            {message}
          </p>
        )}
        {hindi && (
          <p style={{ margin: message ? '5px 0 0' : 0, fontSize: small ? 14 : 16, color: C.textMid, fontFamily: "'Noto Sans Devanagari', sans-serif", lineHeight: 1.5 }}>
            {hindi}
          </p>
        )}
      </div>
    </div>
  )
}

export function TopBar({ onBack, label, color = C.saffron, rightSlot }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${color}, #FFB830)`,
      padding: '16px 20px',
      display: 'flex', alignItems: 'center', gap: 12,
      borderRadius: '0 0 26px 26px',
      boxShadow: `0 6px 24px ${color}44`,
    }}>
      <button onClick={onBack} style={{
        background: 'rgba(255,255,255,0.22)', border: 'none',
        borderRadius: 12, width: 42, height: 42,
        fontSize: 20, color: '#fff', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>←</button>
      <span style={{ flex: 1, fontSize: 20, fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: '#fff' }}>{label}</span>
      {rightSlot}
    </div>
  )
}

export function ProgressBar({ value, color }) {
  return (
    <div style={{ height: 10, background: '#e8d5c0', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 8, transition: 'width 0.5s ease' }} />
    </div>
  )
}

export function RoundBadge({ round, color }) {
  if (round <= 1) return null
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: color, color: '#fff',
      borderRadius: 16, padding: '4px 12px',
      fontFamily: "'Baloo 2', cursive", fontWeight: 700, fontSize: 14,
    }}>
      🏆 Round {round}
    </div>
  )
}

export function LoadingScreen({ topic }) {
  return (
    <div style={{
      minHeight: '100vh', background: topic?.bg || '#fff8ee',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24,
    }}>
      <div style={{ fontSize: 64 }}>🌸</div>
      <p style={{ fontSize: 22, fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: C.saffron, textAlign: 'center' }}>
        Meera Didi is preparing your lesson...
      </p>
      <p style={{ fontSize: 18, fontFamily: "'Noto Sans Devanagari', sans-serif", color: C.textMid, textAlign: 'center' }}>
        मीरा दीदी पाठ तैयार कर रही हैं...
      </p>
      <div style={{
        width: 56, height: 56,
        border: `5px solid ${C.saffron}33`,
        borderTop: `5px solid ${C.saffron}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
    </div>
  )
}
