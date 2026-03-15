import { useState, useEffect, useRef } from 'react'
import { C } from './constants.js'
import { callClaude, speakEnglish } from './api.js'
import { TopBar } from './components.jsx'

function buildSystemPrompt(topic, round, sentences) {
  const difficulty =
    round <= 2 ? 'very simple, short sentences'
    : round <= 4 ? 'medium complexity'
    : 'full conversational English'

  return `You are Meera Didi — a warm, patient, encouraging English teacher with a gentle Indian accent. You are roleplaying a "${topic.en}" scenario.

Scenario characters:
- doctor → You are the doctor
- shopping → You are the shopkeeper  
- family → You are a family member
- greetings → You are a friendly neighbor
- travel → You are a helpful stranger
- phone → You are the person who answered the call
- bank → You are the bank clerk
- eating → You are the waiter

STRICT RULES:
1. Stay strictly in the "${topic.en}" scenario. Do not leave it.
2. After every English sentence you say, add the Hindi translation in square brackets like: [हिंदी अनुवाद]
3. Use ONLY ${difficulty} — this is Round ${round}.
4. If the student makes errors, gently use the correct form naturally in your reply without pointing out mistakes.
5. Use warm phrases like "Bahut achha!", "Very good!", "Shabash!", "Bilkul sahi!"
6. Keep your turns short — max 2 sentences per reply.
7. The student knows these sentences: ${sentences.join(' | ')} — weave them naturally into the conversation.
8. Start the conversation immediately as the scenario character. Be warm and welcoming.`
}

export default function AiConversationScreen({ topic, round, sentences, onBack }) {
  const [messages, setMessages]   = useState([])
  const [userInput, setUserInput] = useState('')
  const [loading, setLoading]     = useState(false)
  const [listening, setListening] = useState(false)
  const [started, setStarted]     = useState(false)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  const systemPrompt = buildSystemPrompt(topic, round, sentences)

  useEffect(() => {
    initConversation()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function initConversation() {
    setLoading(true)
    try {
      const reply = await callClaude(
        [{ role: 'user', content: 'Please start the conversation now.' }],
        systemPrompt
      )
      const msg = { role: 'assistant', content: reply }
      setMessages([msg])
      speakEnglish(reply.replace(/\[.*?\]/g, ''))
    } catch (e) {
      setMessages([{ role: 'assistant', content: 'Namaste! Main taiyaar hoon. Baat karte hain! [नमस्ते! मैं तैयार हूँ। बात करते हैं!]' }])
    }
    setLoading(false)
    setStarted(true)
  }

  async function sendMessage(text) {
    if (!text.trim() || loading) return
    const newMessages = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setUserInput('')
    setLoading(true)
    try {
      const reply = await callClaude(newMessages, systemPrompt)
      const updated = [...newMessages, { role: 'assistant', content: reply }]
      setMessages(updated)
      speakEnglish(reply.replace(/\[.*?\]/g, ''))
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Maafi chahta hoon, thodi problem aa gayi. Phir try karein! [माफी चाहता हूँ। फिर try करें!]' }])
    }
    setLoading(false)
  }

  function startListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      alert('Kripya Chrome use karein.\nPlease use Chrome browser.')
      return
    }
    setListening(true)
    const r = new SR()
    r.lang = 'en-IN'
    r.continuous = false
    r.interimResults = false
    r.onresult = e => {
      const t = e.results[0][0].transcript
      sendMessage(t)
      setListening(false)
    }
    r.onerror = () => setListening(false)
    r.onend   = () => setListening(false)
    r.start()
  }

  // Render message bubbles
  function renderContent(content) {
    const parts = content.split(/(\[.*?\])/)
    return parts.map((part, i) => {
      if (part.match(/^\[.*\]$/)) {
        return (
          <span key={i} style={{
            display: 'block',
            fontSize: 14,
            fontFamily: "'Noto Sans Devanagari', sans-serif",
            color: 'rgba(255,255,255,0.75)',
            marginTop: 4, lineHeight: 1.4,
          }}>
            {part.slice(1, -1)}
          </span>
        )
      }
      return <span key={i}>{part}</span>
    })
  }

  function renderAssistantContent(content) {
    const parts = content.split(/(\[.*?\])/)
    return parts.map((part, i) => {
      if (part.match(/^\[.*\]$/)) {
        return (
          <span key={i} style={{
            display: 'block',
            fontSize: 14,
            fontFamily: "'Noto Sans Devanagari', sans-serif",
            color: C.textMid, marginTop: 4, lineHeight: 1.4,
          }}>
            {part.slice(1, -1)}
          </span>
        )
      }
      return <span key={i}>{part}</span>
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fff8ee', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${topic.color}, ${C.gold})`,
        padding: '18px 20px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
        borderRadius: '0 0 28px 28px',
        boxShadow: `0 8px 28px ${topic.color}44`,
      }}>
        <button onClick={onBack} style={{
          background: 'rgba(255,255,255,0.22)', border: 'none',
          borderRadius: 12, width: 44, height: 44,
          fontSize: 20, color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>←</button>

        <div style={{ fontSize: 32 }}>🙋‍♀️</div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: '#fff' }}>
            Meera Didi — {topic.en}
          </div>
          <div style={{ fontSize: 13, fontFamily: "'Noto Sans Devanagari', sans-serif", color: 'rgba(255,255,255,0.85)' }}>
            AI से बात करें • Round {round}
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.22)',
          borderRadius: 12, padding: '4px 10px',
          fontSize: 13, color: '#fff',
          fontFamily: "'Baloo 2', cursive", fontWeight: 700,
        }}>
          {topic.emoji}
        </div>
      </div>

      {/* Hint strip */}
      <div style={{
        background: '#fff3e0',
        borderLeft: `4px solid ${topic.color}`,
        margin: '10px 14px 0',
        padding: '9px 12px', borderRadius: '0 12px 12px 0',
      }}>
        <p style={{ margin: 0, fontSize: 13, fontFamily: "'Noto Sans Devanagari', sans-serif', color: C.textMid" }}>
          💡 <strong>इन वाक्यों का उपयोग करें:</strong>{' '}
          <span style={{ fontFamily: "'Baloo 2', cursive", color: topic.color, fontSize: 13 }}>
            {sentences.slice(0, 3).join(' • ')}
          </span>
        </p>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px 0' }}>

        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              alignItems: 'flex-end',
              gap: 8,
              marginBottom: 14,
              animation: 'fadeIn 0.25s ease',
            }}
          >
            {m.role === 'assistant' && (
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: `linear-gradient(135deg, ${topic.color}, ${C.gold})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, flexShrink: 0,
              }}>🙋‍♀️</div>
            )}

            <div style={{
              maxWidth: '76%',
              background: m.role === 'user'
                ? `linear-gradient(135deg, ${topic.color}, ${C.gold})`
                : '#fff',
              color: m.role === 'user' ? '#fff' : C.text,
              borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              padding: '12px 15px',
              fontSize: 17,
              fontFamily: "'Baloo 2', cursive",
              boxShadow: m.role === 'user'
                ? `0 4px 14px ${topic.color}44`
                : '0 2px 10px rgba(0,0,0,0.07)',
              border: m.role === 'assistant' ? '1.5px solid rgba(255,107,0,0.1)' : 'none',
              lineHeight: 1.5,
            }}>
              {m.role === 'user' ? renderContent(m.content) : renderAssistantContent(m.content)}
            </div>

            {m.role === 'assistant' && (
              <button
                onClick={() => speakEnglish(m.content.replace(/\[.*?\]/g, ''))}
                style={{
                  background: 'none', border: 'none',
                  fontSize: 20, cursor: 'pointer',
                  flexShrink: 0, opacity: 0.7,
                }}
              >🔊</button>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: `linear-gradient(135deg, ${topic.color}, ${C.gold})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>🙋‍♀️</div>
            <div style={{
              background: '#fff', borderRadius: '18px 18px 18px 4px',
              padding: '12px 18px', border: '1.5px solid rgba(255,107,0,0.1)',
              display: 'flex', gap: 6, alignItems: 'center',
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: topic.color, opacity: 0.6,
                  animation: `bounce 0.8s ease-in-out ${i * 0.15}s infinite alternate`,
                }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} style={{ height: 8 }} />
      </div>

      {/* Input area */}
      <div style={{
        padding: '12px 14px 24px',
        background: '#fff',
        borderTop: '1px solid #ffe5c8',
        display: 'flex', gap: 10, alignItems: 'center',
      }}>
        <input
          ref={inputRef}
          value={userInput}
          onChange={e => setUserInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !loading && sendMessage(userInput)}
          placeholder="Type or 🎤 speak in English..."
          disabled={loading}
          style={{
            flex: 1,
            border: `2px solid ${topic.color}40`,
            borderRadius: 18,
            padding: '13px 16px',
            fontSize: 17,
            fontFamily: "'Baloo 2', cursive",
            background: '#fff8ee',
            color: C.text,
          }}
        />

        <button
          onClick={startListening}
          disabled={loading}
          style={{
            width: 52, height: 52, borderRadius: '50%',
            background: listening ? '#ff4444' : loading ? '#ccc' : topic.color,
            border: 'none', fontSize: 22, cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: `0 4px 12px ${topic.color}44`,
            animation: listening ? 'micPulse 1.2s ease-in-out infinite' : 'none',
            flexShrink: 0,
          }}
        >🎤</button>

        <button
          onClick={() => sendMessage(userInput)}
          disabled={!userInput.trim() || loading}
          style={{
            width: 52, height: 52, borderRadius: '50%',
            background: userInput.trim() && !loading ? C.green : '#ddd',
            border: 'none', fontSize: 20, cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >➤</button>
      </div>
    </div>
  )
}
