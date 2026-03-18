import { useState, useEffect, useRef } from 'react'
import { C } from './constants.js'
import { callClaude, speakEnglish } from './api.js'

// ── Scenarios ─────────────────────────────────────────────────────────────────
const SCENARIOS = [
  { id: 'morning',   emoji: '☀️', label: 'Good Morning Chat',  hi: 'सुबह की बातें'   },
  { id: 'market',    emoji: '🛒', label: 'At the Market',      hi: 'बाज़ार में'        },
  { id: 'doctor',    emoji: '🏥', label: 'At the Doctor',      hi: 'डॉक्टर के पास'    },
  { id: 'family',    emoji: '👨‍👩‍👧', label: 'Family Talk',       hi: 'परिवार से बात'    },
  { id: 'neighbor',  emoji: '🏘️', label: 'With Neighbor',      hi: 'पड़ोसी से बात'    },
  { id: 'phone',     emoji: '📞', label: 'Phone Call',         hi: 'फ़ोन पर बातें'    },
  { id: 'smalltalk', emoji: '💬', label: 'Small Talk',         hi: 'छोटी-छोटी बातें' },
  { id: 'travel',    emoji: '🚌', label: 'Asking Directions',  hi: 'रास्ता पूछना'     },
]

// ── Build system prompt — plain function, called fresh every time ─────────────
function makePrompt(scenarioLabel, scenarioHi, level) {
  const lvl = {
    beginner:     'Student speaks in broken 2-3 word fragments. Use very short, simple sentences only.',
    intermediate: 'Student forms simple sentences with grammar errors. Use simple sentences.',
    advanced:     'Student holds basic conversations with some errors. Use natural simple English.',
  }[level] || 'Student speaks broken English.'

  return `You are Meera Didi — a warm, experienced, traditional English conversation master tutor with 30 years of teaching rural elderly Indians. You have infinite patience and speak with a gentle Indian English tone.

STUDENT: Elderly rural Indian. ${lvl}

YOUR 10 GOLDEN RULES:

1. YOU ALWAYS LEAD. Ask questions. Make observations. Introduce small topics. Never leave silence. You are the engine of the conversation.

2. CORRECT INVISIBLY — never say "wrong" or "mistake". Echo the correct form naturally in your reply.
   • Student says "I go market yesterday" → You say "Oh, you went to the market yesterday! How lovely. What did you buy?"
   • Student says "My head is paining" → You say "Oh, your head is hurting? Since when? [आपका सिर कब से दर्द कर रहा है?]"
   • Student says "She don't know" → You say "Oh, she doesn't know! That happens sometimes. [कोई बात नहीं।]"

3. TEACH ONE NEW WORD naturally every 3-4 exchanges. Use it in context, then explain it simply.
   Example: "The weather is pleasant today — pleasant means suhana, achha. [आज मौसम सुहाना है!]"

4. WARM SMALL TALK. Bring in weather, food, festivals, grandchildren, daily life. Real, human, warm.

5. ENCOURAGE generously. "Shabash!", "Bilkul sahi!", "Bahut achha!", "Kya baat hai!", "You are doing so well!"

6. HINDI AFTER EVERY SENTENCE — mandatory. Format: English. [हिंदी]
   Example: "How are you feeling today? [आज आप कैसा महसूस कर रहे हैं?]"

7. SHORT REPLIES — maximum 2 sentences per turn. Keep it easy to digest.

8. ONE QUESTION PER TURN only. Never ask two things at once.

9. OFFER CHOICES when student seems stuck.
   Example: "Aap keh sakte hain: 'I am fine' ya 'I am not feeling well.' Aap kaisa feel kar rahe hain?"

10. INTRODUCE A NEW PHRASE every 5 exchanges.
    Say: "Aaj ek nayi cheez seekhte hain — try saying: 'Could you repeat that please?'"

SCENARIO TODAY: ${scenarioLabel} (${scenarioHi})

Begin immediately as Meera Didi in this scenario. Warm, human, natural. This is a real conversation, not a test.`
}

// ── Strip Devanagari brackets for TTS ─────────────────────────────────────────
function stripHindi(text) {
  return text.replace(/\[[^\]]*[\u0900-\u097F][^\]]*\]/g, '').replace(/\s+/g, ' ').trim()
}

// ── Parse message into text + hindi segments ──────────────────────────────────
function parseSegments(content) {
  const segments = []
  let i = 0
  while (i < content.length) {
    const open = content.indexOf('[', i)
    if (open === -1) { segments.push({ type: 'text', value: content.slice(i) }); break }
    if (open > i) segments.push({ type: 'text', value: content.slice(i, open) })
    const close = content.indexOf(']', open)
    if (close === -1) { segments.push({ type: 'text', value: content.slice(open) }); break }
    const inner = content.slice(open + 1, close)
    const isDevanagari = /[\u0900-\u097F]/.test(inner)
    segments.push({ type: isDevanagari ? 'hindi' : 'text', value: isDevanagari ? inner : `[${inner}]` })
    i = close + 1
  }
  return segments.filter(s => s.value.trim())
}

// ── Typing dots ───────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 6, padding: '4px 2px' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 9, height: 9, borderRadius: '50%',
          background: C.saffron, opacity: 0.65,
          animation: `bounce 0.7s ease-in-out ${i * 0.16}s infinite alternate`,
        }} />
      ))}
    </div>
  )
}

// ── Message bubble ────────────────────────────────────────────────────────────
function Bubble({ msg, onSpeak }) {
  const isUser   = msg.role === 'user'
  const segments = isUser ? null : parseSegments(msg.content)
  return (
    <div style={{
      display: 'flex',
      flexDirection: isUser ? 'row-reverse' : 'row',
      alignItems: 'flex-end',
      gap: 8, marginBottom: 18,
      animation: 'fadeIn 0.25s ease',
    }}>
      {!isUser && (
        <div style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, ${C.saffron}, ${C.gold})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, boxShadow: `0 3px 10px ${C.shadow}`,
        }}>🙋‍♀️</div>
      )}
      <div style={{ maxWidth: '76%' }}>
        <div style={{
          background: isUser ? `linear-gradient(135deg, ${C.saffron}, ${C.gold})` : '#fff',
          color: isUser ? '#fff' : C.text,
          borderRadius: isUser ? '20px 4px 20px 20px' : '4px 20px 20px 20px',
          padding: '13px 16px', fontSize: 17,
          fontFamily: "'Baloo 2', cursive", lineHeight: 1.65,
          boxShadow: isUser ? `0 4px 18px ${C.saffron}44` : '0 3px 16px rgba(0,0,0,0.09)',
          border: !isUser ? '1.5px solid rgba(255,107,0,0.1)' : 'none',
        }}>
          {isUser ? msg.content : segments.map((seg, i) =>
            seg.type === 'hindi' ? (
              <span key={i} style={{
                display: 'block', marginTop: 8, paddingTop: 7,
                borderTop: '1px dashed rgba(255,107,0,0.18)',
                fontSize: 14, fontFamily: "'Noto Sans Devanagari', sans-serif",
                color: C.textMid, lineHeight: 1.55,
              }}>🇮🇳 {seg.value}</span>
            ) : <span key={i}>{seg.value}</span>
          )}
        </div>
      </div>
      {!isUser && (
        <button onClick={() => onSpeak(stripHindi(msg.content))} style={{
          background: 'none', border: 'none', fontSize: 18,
          cursor: 'pointer', opacity: 0.5, padding: 4, flexShrink: 0,
          transition: 'opacity 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '0.5' }}
        >🔊</button>
      )}
    </div>
  )
}

// ── Scenario picker ───────────────────────────────────────────────────────────
function ScenarioPicker({ onPick }) {
  return (
    <div style={{ overflowY: 'auto', flex: 1, padding: '16px 16px 40px' }}>
      <div style={{
        background: 'linear-gradient(135deg, #fff3e0, #fff8ee)',
        borderRadius: 22, padding: 18,
        border: '1.5px solid rgba(255,107,0,0.15)',
        marginBottom: 22, animation: 'fadeIn 0.35s ease',
      }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${C.saffron}, ${C.gold})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30, boxShadow: `0 4px 16px ${C.shadow}`,
          }}>🙋‍♀️</div>
          <div>
            <p style={{ margin: '0 0 5px', fontSize: 18, fontFamily: "'Baloo 2', cursive", fontWeight: 800, color: C.text }}>
              Namaste! Main Meera Didi hoon 😊
            </p>
            <p style={{ margin: '0 0 5px', fontSize: 15, fontFamily: "'Noto Sans Devanagari', sans-serif", color: C.textMid, lineHeight: 1.5 }}>
              मैं आपसे real English में बात करूँगी और सिखाऊँगी।
            </p>
            <p style={{ margin: 0, fontSize: 13, fontFamily: "'Baloo 2', cursive", color: C.textLight }}>
              Broken English is totally fine — I understand everything! 💛
            </p>
          </div>
        </div>
      </div>
      <p style={{
        textAlign: 'center', margin: '0 0 14px', fontSize: 17,
        color: C.textMid, fontFamily: "'Noto Sans Devanagari', sans-serif",
      }}>आज कहाँ बात करें? 👇</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {SCENARIOS.map(s => (
          <button key={s.id} onClick={() => onPick(s)} style={{
            background: '#fff', border: '2px solid rgba(255,107,0,0.15)',
            borderRadius: 22, padding: '18px 10px 14px',
            cursor: 'pointer', textAlign: 'center',
            boxShadow: '0 4px 16px rgba(255,107,0,0.09)',
            transition: 'transform 0.14s',
          }}
            onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.94)' }}
            onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
            onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            <div style={{ fontSize: 38 }}>{s.emoji}</div>
            <div style={{ fontSize: 14, fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: C.saffron, marginTop: 8, lineHeight: 1.3 }}>{s.label}</div>
            <div style={{ fontSize: 12, fontFamily: "'Noto Sans Devanagari', sans-serif", color: C.textMid, marginTop: 3 }}>{s.hi}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function AiConversationScreen({ onBack }) {
  const [scenario,  setScenario]  = useState(null)
  const [messages,  setMessages]  = useState([])
  const [userInput, setUserInput] = useState('')
  const [loading,   setLoading]   = useState(false)
  const [listening, setListening] = useState(false)
  const [level,     setLevel]     = useState('beginner')
  const [turns,     setTurns]     = useState(0)

  // Store level in a ref so sendMessage always reads the latest value
  // without needing to re-create the function on every level change
  const levelRef    = useRef(level)
  const scenarioRef = useRef(scenario)
  const bottomRef   = useRef(null)
  const inputRef    = useRef(null)

  // Keep refs in sync with state
  useEffect(() => { levelRef.current = level },       [level])
  useEffect(() => { scenarioRef.current = scenario }, [scenario])

  // Auto level-up
  useEffect(() => {
    if (turns >= 10 && level === 'beginner')     setLevel('intermediate')
    if (turns >= 22 && level === 'intermediate') setLevel('advanced')
  }, [turns, level])

  // Start conversation when scenario selected
  useEffect(() => {
    if (scenario) initChat(scenario, levelRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function initChat(sc, lv) {
    setMessages([])
    setLoading(true)
    try {
      const prompt = makePrompt(sc.label, sc.hi, lv)
      const reply  = await callClaude(
        [{ role: 'user', content: 'Start the conversation now as Meera Didi. Be warm and welcoming.' }],
        prompt
      )
      setMessages([{ role: 'assistant', content: reply }])
      speakEnglish(stripHindi(reply))
    } catch (err) {
      console.error('initChat:', err)
      setMessages([{
        role: 'assistant',
        content: `Setup error: ${err.message}. Check browser console (F12 → Console tab) and share the red error with support.`,
      }])
    }
    setLoading(false)
  }

  async function sendMessage(text) {
    const trimmed = (text || '').trim()
    if (!trimmed || loading) return

    // Read latest values from refs — avoids stale closure
    const sc = scenarioRef.current
    const lv = levelRef.current
    if (!sc) return

    const newMsgs = [...messages, { role: 'user', content: trimmed }]
    setMessages(newMsgs)
    setUserInput('')
    setLoading(true)
    setTurns(t => t + 1)

    try {
      const prompt = makePrompt(sc.label, sc.hi, lv)
      const reply  = await callClaude(newMsgs, prompt)
      setMessages(m => [...m, { role: 'assistant', content: reply }])
      speakEnglish(stripHindi(reply))
    } catch (err) {
      console.error('sendMessage:', err)
      setMessages(m => [...m, {
        role: 'assistant',
        content: `Error: ${err.message}. Open browser console (F12) to see full details.`,
      }])
    }
    setLoading(false)
  }

  function startListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Kripya Chrome browser use karein speech ke liye.\n(Please use Chrome for voice input.)'); return }
    if (listening) return
    setListening(true)
    const r = new SR()
    r.lang = 'en-IN'; r.continuous = false; r.interimResults = false; r.maxAlternatives = 1
    r.onresult = e => { setListening(false); sendMessage(e.results[0][0].transcript) }
    r.onerror  = () => setListening(false)
    r.onend    = () => setListening(false)
    r.start()
  }

  function resetScenario() {
    setScenario(null); setMessages([]); setTurns(0); setLevel('beginner')
  }

  return (
    <div style={{
      height: '100dvh', minHeight: '100vh',
      background: '#fff8ee',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* ── Header ── */}
      <div style={{
        background: `linear-gradient(135deg, ${C.saffron} 0%, ${C.gold} 100%)`,
        padding: '16px 18px 14px',
        display: 'flex', alignItems: 'center', gap: 12,
        borderRadius: '0 0 26px 26px',
        boxShadow: `0 8px 28px ${C.shadow}`,
        flexShrink: 0,
      }}>
        <button onClick={onBack} style={{
          background: 'rgba(255,255,255,0.22)', border: 'none', borderRadius: 12,
          width: 44, height: 44, fontSize: 22, color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>←</button>
        <div style={{ fontSize: 30 }}>🙋‍♀️</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 19, fontFamily: "'Baloo 2', cursive", fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
            Meera Didi
          </div>
          <div style={{
            fontSize: 13, fontFamily: "'Noto Sans Devanagari', sans-serif",
            color: 'rgba(255,255,255,0.88)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {scenario ? `${scenario.emoji} ${scenario.hi}` : 'English Conversation Tutor'}
          </div>
        </div>
        {scenario && (
          <div style={{
            background: 'rgba(255,255,255,0.22)', borderRadius: 14,
            padding: '5px 11px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', fontFamily: "'Baloo 2', cursive", lineHeight: 1 }}>LEVEL</div>
            <div style={{ fontSize: 13, color: '#fff', fontFamily: "'Baloo 2', cursive", fontWeight: 700, textTransform: 'uppercase', lineHeight: 1.3 }}>
              {level}
            </div>
          </div>
        )}
        {scenario && (
          <button onClick={resetScenario} style={{
            background: 'rgba(255,255,255,0.22)', border: 'none', borderRadius: 12,
            padding: '9px 12px', fontSize: 12, color: '#fff', cursor: 'pointer',
            fontFamily: "'Baloo 2', cursive", fontWeight: 700,
          }}>🔄 बदलें</button>
        )}
      </div>

      {/* ── Body ── */}
      {!scenario ? (
        <ScenarioPicker onPick={s => setScenario(s)} />
      ) : (
        <>
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 4px' }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <span style={{
                display: 'inline-block', background: '#fff3e0',
                border: '1.5px solid rgba(255,107,0,0.18)', borderRadius: 20,
                padding: '5px 14px', fontSize: 13,
                fontFamily: "'Noto Sans Devanagari', sans-serif", color: C.textMid,
              }}>
                💡 टूटी-फूटी English भी ठीक है — Meera Didi समझेंगी!
              </span>
            </div>
            {messages.map((m, i) => (
              <Bubble key={i} msg={m} onSpeak={speakEnglish} />
            ))}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 16 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${C.saffron}, ${C.gold})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, flexShrink: 0,
                }}>🙋‍♀️</div>
                <div style={{
                  background: '#fff', borderRadius: '4px 20px 20px 20px',
                  padding: '14px 18px', border: '1.5px solid rgba(255,107,0,0.1)',
                  boxShadow: '0 3px 12px rgba(0,0,0,0.07)',
                }}>
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} style={{ height: 8 }} />
          </div>

          {/* ── Input bar ── */}
          <div style={{
            padding: '10px 14px 28px', background: '#fff',
            borderTop: '1.5px solid #ffe5c8',
            display: 'flex', gap: 9, alignItems: 'center', flexShrink: 0,
          }}>
            <input
              ref={inputRef}
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !loading) sendMessage(userInput) }}
              placeholder="English mein likhiye ya 🎤 boliye..."
              disabled={loading}
              style={{
                flex: 1, border: `2px solid ${C.saffron}28`, borderRadius: 20,
                padding: '13px 16px', fontSize: 17,
                fontFamily: "'Baloo 2', cursive",
                background: '#fff8ee', color: C.text, minWidth: 0,
              }}
            />
            <button onClick={startListening} disabled={loading} style={{
              width: 54, height: 54, borderRadius: '50%', flexShrink: 0, border: 'none',
              background: listening ? '#EE4444' : loading ? '#ddd' : C.saffron,
              fontSize: 22, cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: listening ? 'none' : `0 5px 16px ${C.shadow}`,
              animation: listening ? 'micPulse 1.1s ease-in-out infinite' : 'none',
              transition: 'background 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>🎤</button>
            <button onClick={() => sendMessage(userInput)} disabled={!userInput.trim() || loading} style={{
              width: 54, height: 54, borderRadius: '50%', flexShrink: 0, border: 'none',
              background: userInput.trim() && !loading ? C.green : '#ddd',
              fontSize: 22, cursor: 'pointer',
              boxShadow: userInput.trim() && !loading ? '0 5px 16px rgba(46,204,113,0.38)' : 'none',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>➤</button>
          </div>
        </>
      )}
    </div>
  )
}
