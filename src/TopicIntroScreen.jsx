import { C } from './constants.js'
import { BigBtn, MeeraDidi } from './components.jsx'

export default function TopicIntroScreen({ topic, progress, onStart, onBack }) {
  const p = progress[topic.id] || { round: 1, completed: 0 }
  const isNewTopic = p.round <= 1

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(160deg, ${topic.bg} 0%, #fff8ee 100%)`,
      padding: 20,
      animation: 'slideUp 0.3s ease',
    }}>

      <button onClick={onBack} style={{
        background: 'rgba(0,0,0,0.07)', border: 'none',
        borderRadius: 14, padding: '10px 16px',
        fontSize: 18, cursor: 'pointer', marginBottom: 10, color: topic.color, fontWeight: 700,
      }}>← वापस</button>

      {/* Big topic hero */}
      <div style={{ textAlign: 'center', margin: '10px 0 24px' }}>
        <div style={{
          fontSize: 88,
          filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.12))',
          animation: 'bounce 1.6s ease-in-out infinite alternate',
        }}>{topic.emoji}</div>

        <h2 style={{
          fontSize: 30, fontFamily: "'Baloo 2', cursive",
          fontWeight: 800, color: topic.color, margin: '10px 0 4px',
        }}>{topic.en}</h2>

        <p style={{
          fontSize: 22, fontFamily: "'Noto Sans Devanagari', sans-serif",
          color: C.textMid, margin: 0,
        }}>{topic.hi}</p>

        {!isNewTopic && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            marginTop: 14, background: topic.color, color: '#fff',
            borderRadius: 20, padding: '7px 20px',
            fontFamily: "'Baloo 2', cursive", fontWeight: 700, fontSize: 16,
          }}>
            🏆 Round {p.round} — Aap bahut acche hain!
          </div>
        )}
      </div>

      {/* Meera message */}
      <MeeraDidi
        message={isNewTopic
          ? `Chaliye "${topic.en}" seekhna shuru karte hain! Aaj 5 naye sentences seekhenge.`
          : `Shabash! Ab Round ${p.round} shuru karte hain. Thoda aur mushkil, thoda aur mazedaar!`
        }
        hindi={isNewTopic
          ? `चलिए "${topic.hi}" सीखते हैं! आज 5 नए वाक्य सीखेंगे।`
          : `शाबाश! अब Round ${p.round} शुरू करते हैं। थोड़ा और मुश्किल, थोड़ा और मज़ेदार!`
        }
      />

      {/* What you'll learn */}
      <div style={{
        background: '#fff',
        borderRadius: 20, padding: '16px 18px',
        border: `1.5px solid ${topic.color}22`,
        marginBottom: 20,
      }}>
        <p style={{ margin: '0 0 8px', fontSize: 16, fontFamily: "'Noto Sans Devanagari', sans-serif", color: C.textMid, fontWeight: 700 }}>
          आज आप सीखेंगे:
        </p>
        {['👀 वाक्य देखें और सुनें', '🗣️ बोलकर अभ्यास करें', '🧩 शब्द मिलाएं', '🤖 AI से बात करें'].map((item, i) => (
          <div key={i} style={{
            fontSize: 15, fontFamily: "'Noto Sans Devanagari', sans-serif",
            color: C.text, padding: '5px 0',
            borderBottom: i < 3 ? '1px solid #f0e0d0' : 'none',
          }}>{item}</div>
        ))}
      </div>

      <BigBtn onClick={onStart} color={topic.color}>
        {isNewTopic ? '▶️  शुरू करें — Let\'s Start!' : `▶️  Round ${p.round} शुरू करें`}
      </BigBtn>
    </div>
  )
}
