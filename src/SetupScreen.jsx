import { useState, useEffect } from 'react'
import { C } from './constants.js'
import {
  getAllVoices, getSavedVoiceName, saveVoiceName,
  getUserName, saveUserName, stopSpeech,
} from './api.js'

export default function SetupScreen({ onDone, isEdit = false }) {
  const [step,       setStep]       = useState(1)   // 1 = name, 2 = voice
  const [name,       setName]       = useState(getUserName())
  const [voices,     setVoices]     = useState([])
  const [selected,   setSelected]   = useState(getSavedVoiceName())
  const [playing,    setPlaying]    = useState(null)
  const [filter,     setFilter]     = useState('all')
  const [loading,    setLoading]    = useState(false)
  const [saving,     setSaving]     = useState(false)

  useEffect(() => {
    return () => stopSpeech()
  }, [])

  useEffect(() => {
    if (step === 2) {
      setLoading(true)
      getAllVoices().then(v => {
        const sorted = [...v].sort((a, b) => {
          const sc = x => x.lang === 'en-IN' ? 100 : x.lang.startsWith('en-IN') ? 90 : x.lang.startsWith('en') ? 50 : 0
          return sc(b) - sc(a)
        })
        setVoices(sorted)
        setLoading(false)
      })
    }
  }, [step])

  const isIndian = v => v.lang === 'en-IN' || v.lang.startsWith('en-IN') || v.name.toLowerCase().includes('india')
  const isFemale = v => {
    const n = v.name.toLowerCase()
    return ['raveena','heera','priya','ananya','divya','aditi','lekha','veena','female','woman','girl','zira','samantha','victoria','moira','tessa'].some(f => n.includes(f))
  }

  const filtered = voices.filter(v => {
    if (filter === 'indian') return isIndian(v)
    if (filter === 'english') return v.lang.startsWith('en')
    return true
  })

  function preview(voice) {
    stopSpeech()
    setPlaying(voice.name)
    const firstName = name.trim().split(' ')[0] || 'dost'
    const u = new SpeechSynthesisUtterance(
      `Hello ${firstName}! How are you? My name is Buddy. I will help you learn English.`
    )
    u.voice = voice; u.lang = voice.lang
    u.rate = 0.82; u.pitch = 1.1; u.volume = 1.0
    u.onend  = () => setPlaying(null)
    u.onerror = () => setPlaying(null)
    window.speechSynthesis.speak(u)
  }

  function handleSave() {
    if (!name.trim() || !selected) return
    setSaving(true)
    saveUserName(name.trim().split(' ')[0])  // save first name only
    saveVoiceName(selected)
    setTimeout(() => { setSaving(false); onDone() }, 600)
  }

  const firstName = name.trim().split(' ')[0] || ''

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #fff8ee, #fff1d6)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${C.saffron}, ${C.gold})`,
        padding: '32px 20px 24px', textAlign: 'center',
        borderRadius: '0 0 36px 36px',
        boxShadow: `0 10px 36px ${C.shadow}`,
      }}>
        <div style={{ fontSize: 52 }}>🤖</div>
        <h1 style={{ margin: '10px 0 4px', fontSize: 36, fontFamily: "'Baloo 2', cursive", fontWeight: 800, color: '#fff' }}>
          {isEdit ? 'Settings' : 'Namaste!'}
        </h1>
        <p style={{ margin: 0, fontSize: 18, color: 'rgba(255,255,255,0.9)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
          {isEdit ? 'अपना नाम और आवाज़ बदलें' : 'SunoBolo में आपका स्वागत है 🌸'}
        </p>

        {/* Step dots */}
        {!isEdit && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 16 }}>
            {[1, 2].map(s => (
              <div key={s} style={{
                width: step === s ? 28 : 10, height: 10,
                borderRadius: 5,
                background: step >= s ? '#fff' : 'rgba(255,255,255,0.35)',
                transition: 'all 0.3s',
              }} />
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: 1, padding: '24px 20px 120px', overflowY: 'auto' }}>

        {/* ── STEP 1: Enter name ── */}
        {(step === 1 || isEdit) && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            {/* Buddy intro bubble */}
            <div style={{
              background: '#fff', borderRadius: 22,
              padding: '20px 18px', marginBottom: 22,
              boxShadow: `0 4px 20px ${C.shadow}`,
              border: `1.5px solid ${C.saffron}22`,
            }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{
                  width: 60, height: 60, borderRadius: '50%', flexShrink: 0,
                  background: `linear-gradient(135deg, ${C.saffron}, ${C.gold})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30,
                  boxShadow: `0 4px 14px ${C.shadow}`,
                }}>🤖</div>
                <div>
                  <p style={{ margin: '0 0 6px', fontSize: 20, fontFamily: "'Baloo 2', cursive", fontWeight: 800, color: C.text }}>
                    Hello! My name is Buddy! 😊
                  </p>
                  <p style={{ margin: '0 0 5px', fontSize: 15, fontFamily: "'Noto Sans Devanagari', sans-serif", color: C.textMid, lineHeight: 1.5 }}>
                    मेरा नाम Buddy है। मैं आपको English सिखाऊँगा।
                  </p>
                  <p style={{ margin: 0, fontSize: 14, fontFamily: "'Baloo 2', cursive", color: C.textLight }}>
                    First, tell me your name! 👇
                  </p>
                </div>
              </div>
            </div>

            {/* Name input */}
            <div style={{ background: '#fff', borderRadius: 22, padding: '20px', boxShadow: `0 4px 20px ${C.shadow}`, border: `1.5px solid ${C.saffron}22`, marginBottom: 16 }}>
              <p style={{ margin: '0 0 12px', fontSize: 17, fontFamily: "'Noto Sans Devanagari', sans-serif", color: C.textMid }}>
                आपका पहला नाम क्या है? (What is your first name?)
              </p>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="जैसे: Ramesh, Sunita, Geeta..."
                maxLength={20}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  border: `2.5px solid ${name.trim() ? C.saffron : '#e0d0c0'}`,
                  borderRadius: 16, padding: '16px 18px',
                  fontSize: 22, fontFamily: "'Baloo 2', cursive",
                  color: C.text, background: '#fff8ee',
                  outline: 'none', transition: 'border-color 0.2s',
                }}
                autoFocus={!isEdit}
              />
              {firstName && (
                <div style={{
                  marginTop: 14, background: `${C.saffron}12`,
                  borderRadius: 14, padding: '12px 16px',
                  border: `1.5px solid ${C.saffron}33`,
                  animation: 'fadeIn 0.3s ease',
                }}>
                  <p style={{ margin: 0, fontSize: 16, fontFamily: "'Baloo 2', cursive", color: C.saffron }}>
                    🤖 "Hello <strong>{firstName}</strong>! How are you? My name is Buddy."
                  </p>
                  <p style={{ margin: '5px 0 0', fontSize: 14, fontFamily: "'Noto Sans Devanagari', sans-serif", color: C.textMid }}>
                    इसी तरह Buddy आपको बुलाएगा! ✨
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 2: Voice picker ── */}
        {(step === 2 || isEdit) && (
          <div style={{ animation: 'fadeIn 0.3s ease', marginTop: isEdit ? 20 : 0 }}>
            {isEdit && (
              <p style={{ fontSize: 17, fontFamily: "'Noto Sans Devanagari', sans-serif", color: C.textMid, marginBottom: 14 }}>
                🎙️ Buddy की आवाज़ चुनें
              </p>
            )}
            {!isEdit && (
              <div style={{ background: '#fff', borderRadius: 18, padding: '16px 18px', marginBottom: 16, border: `1.5px solid ${C.saffron}22`, boxShadow: `0 3px 14px ${C.shadow}` }}>
                <p style={{ margin: '0 0 4px', fontSize: 18, fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: C.text }}>
                  🎙️ Buddy की आवाज़ चुनें
                </p>
                <p style={{ margin: 0, fontSize: 14, fontFamily: "'Noto Sans Devanagari', sans-serif", color: C.textMid, lineHeight: 1.5 }}>
                  हर आवाज़ का ▶️ button दबाएँ — सुनें — जो पसंद आए वो tap करें।
                </p>
              </div>
            )}

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {[
                { id: 'all',     label: 'सभी',      count: voices.length },
                { id: 'indian',  label: '🇮🇳 Indian', count: voices.filter(isIndian).length },
                { id: 'english', label: 'English',   count: voices.filter(v => v.lang.startsWith('en')).length },
              ].map(f => (
                <button key={f.id} onClick={() => setFilter(f.id)} style={{
                  flex: 1, padding: '10px 4px', borderRadius: 14, border: 'none',
                  background: filter === f.id ? C.saffron : '#fff',
                  color: filter === f.id ? '#fff' : C.textMid,
                  fontSize: 13, fontFamily: "'Baloo 2', cursive", fontWeight: 700,
                  cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', transition: 'all 0.2s',
                }}>
                  {f.label} <span style={{ opacity: 0.7, fontSize: 11 }}>({f.count})</span>
                </button>
              ))}
            </div>

            {loading && (
              <div style={{ textAlign: 'center', padding: 30 }}>
                <div style={{ width: 44, height: 44, margin: '0 auto 12px', border: `5px solid ${C.saffron}33`, borderTop: `5px solid ${C.saffron}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <p style={{ fontFamily: "'Noto Sans Devanagari', sans-serif", color: C.textMid }}>आवाज़ें load हो रही हैं...</p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map((voice, i) => {
                const isSel    = selected === voice.name
                const isPlay   = playing  === voice.name
                const indian   = isIndian(voice)
                const female   = isFemale(voice)
                return (
                  <div key={i} onClick={() => { stopSpeech(); setSelected(voice.name) }} style={{
                    background: isSel ? `linear-gradient(135deg, ${C.saffron}18, ${C.gold}18)` : '#fff',
                    border: `2px solid ${isSel ? C.saffron : '#f0e0d0'}`,
                    borderRadius: 18, padding: '14px 16px', cursor: 'pointer',
                    boxShadow: isSel ? `0 4px 20px ${C.saffron}33` : '0 2px 8px rgba(0,0,0,0.06)',
                    transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, background: isSel ? C.saffron : '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#fff', transition: 'all 0.2s' }}>
                      {isSel ? '✓' : ''}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 15, fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: C.text }}>{voice.name}</span>
                        {indian && <span style={{ fontSize: 11, background: '#e8f5e9', color: '#2E7D32', borderRadius: 8, padding: '2px 7px', fontFamily: "'Baloo 2', cursive", fontWeight: 700 }}>🇮🇳</span>}
                        {female && <span style={{ fontSize: 11, background: '#fce4ec', color: '#c2185b', borderRadius: 8, padding: '2px 7px', fontFamily: "'Baloo 2', cursive", fontWeight: 700 }}>♀</span>}
                      </div>
                      <div style={{ fontSize: 12, color: C.textLight, fontFamily: "'Baloo 2', cursive", marginTop: 2 }}>
                        {voice.lang} · {voice.localService ? 'Offline' : 'Online'}
                      </div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); isPlay ? stopSpeech() : preview(voice) }} style={{
                      width: 44, height: 44, borderRadius: '50%', flexShrink: 0, border: 'none',
                      background: isPlay ? '#E74C3C' : C.saffron,
                      fontSize: 18, cursor: 'pointer', boxShadow: `0 3px 10px ${C.shadow}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s',
                    }}>{isPlay ? '⏹' : '▶️'}</button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Sticky bottom button ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto',
        padding: '16px 20px 32px',
        background: 'linear-gradient(to top, #fff8ee 70%, transparent)',
      }}>
        {step === 1 && !isEdit && (
          <button
            onClick={() => setStep(2)}
            disabled={!name.trim()}
            style={{
              width: '100%', padding: '18px', border: 'none', borderRadius: 20,
              background: name.trim() ? `linear-gradient(135deg, ${C.saffron}, ${C.gold})` : '#ddd',
              color: '#fff', fontSize: 20, fontFamily: "'Baloo 2', cursive", fontWeight: 800,
              cursor: name.trim() ? 'pointer' : 'not-allowed',
              boxShadow: name.trim() ? `0 6px 22px ${C.shadow}` : 'none',
              transition: 'all 0.3s',
            }}
          >
            Aage Chalein → {name.trim() && `Hello ${name.trim().split(' ')[0]}!`}
          </button>
        )}
        {(step === 2 || isEdit) && (
          <button
            onClick={handleSave}
            disabled={!name.trim() || !selected || saving}
            style={{
              width: '100%', padding: '18px', border: 'none', borderRadius: 20,
              background: saving ? C.green : (name.trim() && selected) ? `linear-gradient(135deg, ${C.saffron}, ${C.gold})` : '#ddd',
              color: '#fff', fontSize: 20, fontFamily: "'Baloo 2', cursive", fontWeight: 800,
              cursor: (name.trim() && selected && !saving) ? 'pointer' : 'not-allowed',
              boxShadow: (name.trim() && selected) ? `0 6px 22px ${C.shadow}` : 'none',
              transition: 'all 0.3s',
            }}
          >
            {saving ? '✅ Saved! Loading...' : isEdit ? '✅ Save Changes' : `✅ Start Karo — Hello ${firstName || ''}!`}
          </button>
        )}
      </div>
    </div>
  )
}
