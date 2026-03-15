import { useEffect } from 'react'
import { C } from './constants.js'
import { BigBtn, MeeraDidi } from './components.jsx'
import { speakEnglish } from './api.js'

export default function CelebrationScreen({ topic, round, onPractice, onHome }) {

  useEffect(() => {
    speakEnglish(`Bahut achha! Shabash! You completed Round ${round}! You are doing amazing!`, 0.82)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(160deg, ${topic.bg} 0%, #fff8ee 100%)`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 24, textAlign: 'center',
      animation: 'fadeIn 0.4s ease',
    }}>

      {/* Animated celebration */}
      <div style={{
        fontSize: 90,
        animation: 'bounce 0.8s ease-in-out infinite alternate',
        marginBottom: 8,
      }}>🎉</div>

      <div style={{
        fontSize: 48,
        marginBottom: 12,
        animation: 'bounce 0.8s ease-in-out 0.1s infinite alternate',
      }}>🌸</div>

      <h2 style={{
        fontSize: 36, fontFamily: "'Baloo 2', cursive",
        fontWeight: 800, color: topic.color, margin: '0 0 6px',
      }}>
        Shabash! शाबाश!
      </h2>

      <p style={{
        fontSize: 22, fontFamily: "'Noto Sans Devanagari', sans-serif",
        color: C.textMid, marginBottom: 4,
      }}>
        आपने Round {round} पूरा किया! 🏆
      </p>

      <p style={{
        fontSize: 17, color: C.textLight,
        fontFamily: "'Baloo 2', cursive",
        marginBottom: 8,
      }}>
        {topic.en} — Round {round} complete!
      </p>

      {/* Star rating */}
      <div style={{ fontSize: 32, marginBottom: 20 }}>
        {'⭐'.repeat(Math.min(round, 5))}
      </div>

      <MeeraDidi
        message={`Aap bahut accha kar rahe hain! Round ${round + 1} mein aur interesting sentences seekhenge. Pehle thoda practice karte hain!`}
        hindi={`आप बहुत अच्छा कर रहे हैं! Round ${round + 1} में और interesting sentences सीखेंगे। पहले थोड़ा practice करते हैं!`}
      />

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
        <BigBtn onClick={onPractice} color={topic.color}>
          🤖 AI से बात करो — Practice Now!
        </BigBtn>
        <BigBtn onClick={onHome} color='#bbb'>
          🏠 घर जाएं — Go Home
        </BigBtn>
      </div>
    </div>
  )
}
