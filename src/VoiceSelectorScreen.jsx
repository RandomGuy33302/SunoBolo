import { useState, useEffect } from 'react'
import { C } from './constants.js'
import { getAllVoices, getSavedVoiceName, saveVoiceName, stopSpeech } from './api.js'

const TEST_SENTENCE = 'Hello! I am Meera Didi. I will help you learn English.'

export default function VoiceSelectorScreen({ onBack }) {
  const [voices,      setVoices]      = useState([])
  const [selected,    setSelected]    = useState(getSavedVoiceName())
  const [playing,     setPlaying]     = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [filter,      setFilter]      = useState('all')
  const [saved,       setSaved]       = useState(false)

  useEffect(() => {
    getAllVoices().then(v => {
      // Sort: en-IN first, then en-*, then others
      const sorted = [...v].sort((a, b) => {
        const aScore = a.lang === 'en-IN' ? 100 : a.lang.startsWith('en-IN') ? 90 : a.lang.startsWith('en') ? 50 : 0
        const bScore = b.lang === 'en-IN' ? 100 : b.lang.startsWith('en-IN') ? 90 : b.lang.startsWith('en') ? 50 : 0
        return bScore - aScore
      })
      setVoices(sorted)
      setLoading(false)
    })
    return () => stopSpeech()
  }, [])

  const filtered = voices.filter(v => {
    if (filter === 'indian') return v.lang === 'en-IN' || v.lang.startsWith('en-IN') || v.name.toLowerCase().includes('india')
    if (filter === 'english') return v.lang.startsWith('en')
    return true
  })

  function preview(voice) {
    stopSpeech()
    setPlaying(voice.name)
    const u = new SpeechSynthesisUtterance(TEST_SENTENCE)
    u.voice  = voice
    u.lang   = voice.lang
    u.rate   = 0.85
    u.pitch  = 1.1
    u.volume = 1.0
    u.onend  = () => setPlaying(null)
    u.onerror = () => setPlaying(null)
    window.speechSynthesis.speak(u)
  }

  function pick(voice) {
    stopSpeech()
    setSelected(voice.name)
    setSaved(false)
  }

  function handleSave() {
    if (!selected) return
    saveVoiceName(selected)
    setSaved(true)
    setTimeout(() => onBack(), 800)
  }

  const isIndian = (v) => v.lang === 'en-IN' || v.lang.startsWith('en-IN') || v.name.toLowerCase().includes('india')
  const isFemale = (v) => {
    const n = v.name.toLowerCase()
    return ['raveena','heera','priya','ananya','divya','aditi','lekha','veena','female','woman','girl','zira','samantha','victoria','moira','tessa','siri'].some(f => n.includes(f))
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fff8ee', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${C.saffron}, ${C.gold})`,
        padding: '20px 18px 18px', borderRadius: '0 0 28px 28px',
        boxShadow: `0 8px 28px ${C.shadow}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <button onClick={onBack} style={{
            background: 'rgba(255,255,255,0.22)', border: 'none', borderRadius: 12,
            width: 44, height: 44, fontSize: 20, color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 21, fontFamily: "'Baloo 2', cursive", fontWeight: 800, color: '#fff' }}>🎙️ Awaaz Chunein</div>
            <div style={{ fontSize: 13, fontFamily: "'Noto Sans Devanagari', sans-serif", color: 'rgba(255,255,255,0.88)' }}>मीरा दीदी की आवाज़ चुनें</div>
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 14, padding: '10px 14px' }}>
          <p style={{ margin: 0, fontSize: 14, fontFamily: "'Noto Sans Devanagari', sans-serif", color: '#fff', lineHeight: 1.5 }}>
            💡 हर आवाज़ का ▶️ button दबाएँ — सुनें — जो पसंद आए वो चुनें। फिर "Save करें" दबाएँ।
          </p>
        </div>
      </div>

      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1, overflowY: 'auto' }}>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { id: 'all',     label: 'सभी आवाज़ें', count: voices.length },
            { id: 'indian',  label: '🇮🇳 Indian',   count: voices.filter(isIndian).length },
            { id: 'english', label: '🇬🇧 English',   count: voices.filter(v => v.lang.startsWith('en')).length },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              flex: 1, padding: '10px 6px', borderRadius: 14, border: 'none',
              background: filter === f.id ? C.saffron : '#fff',
              color: filter === f.id ? '#fff' : C.textMid,
              fontSize: 13, fontFamily: "'Baloo 2', cursive", fontWeight: 700,
              cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
              transition: 'all 0.2s',
            }}>
              {f.label}
              <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 4 }}>({f.count})</span>
            </button>
          ))}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ width: 48, height: 48, margin: '0 auto 14px', border: `5px solid ${C.saffron}33`, borderTop: `5px solid ${C.saffron}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontFamily: "'Noto Sans Devanagari', sans-serif", color: C.textMid }}>आवाज़ें load हो रही हैं...</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 30, background: '#fff', borderRadius: 20 }}>
            <p style={{ fontSize: 40 }}>😕</p>
            <p style={{ fontFamily: "'Noto Sans Devanagari', sans-serif", color: C.textMid }}>
              इस filter में कोई आवाज़ नहीं मिली। "सभी आवाज़ें" try करें।
            </p>
          </div>
        )}

        {/* Voice list */}
        {filtered.map((voice, i) => {
          const isSelected = selected === voice.name
          const isPlaying  = playing  === voice.name
          const indian     = isIndian(voice)
          const female     = isFemale(voice)

          return (
            <div
              key={i}
              onClick={() => pick(voice)}
              style={{
                background: isSelected ? `linear-gradient(135deg, ${C.saffron}18, ${C.gold}18)` : '#fff',
                border: isSelected ? `2.5px solid ${C.saffron}` : '2px solid #f0e0d0',
                borderRadius: 18, padding: '14px 16px',
                cursor: 'pointer',
                boxShadow: isSelected ? `0 4px 20px ${C.saffron}33` : '0 2px 8px rgba(0,0,0,0.06)',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 12,
              }}
            >
              {/* Selection indicator */}
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: isSelected ? C.saffron : '#eee',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, transition: 'all 0.2s',
              }}>
                {isSelected ? '✓' : ''}
              </div>

              {/* Voice info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 16, fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: C.text }}>
                    {voice.name}
                  </span>
                  {indian && (
                    <span style={{ fontSize: 11, background: '#e8f5e9', color: '#2E7D32', borderRadius: 8, padding: '2px 7px', fontFamily: "'Baloo 2', cursive", fontWeight: 700 }}>
                      🇮🇳 Indian
                    </span>
                  )}
                  {female && (
                    <span style={{ fontSize: 11, background: '#fce4ec', color: '#c2185b', borderRadius: 8, padding: '2px 7px', fontFamily: "'Baloo 2', cursive", fontWeight: 700 }}>
                      ♀ Female
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: C.textLight, fontFamily: "'Baloo 2', cursive", marginTop: 2 }}>
                  {voice.lang} {voice.localService ? '· Offline' : '· Online'}
                </div>
              </div>

              {/* Preview button */}
              <button
                onClick={e => { e.stopPropagation(); isPlaying ? stopSpeech() : preview(voice) }}
                style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: isPlaying ? '#E74C3C' : C.saffron,
                  border: 'none', fontSize: 18, cursor: 'pointer',
                  boxShadow: `0 3px 10px ${C.shadow}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.2s',
                }}
              >
                {isPlaying ? '⏹' : '▶️'}
              </button>
            </div>
          )
        })}

        <div style={{ height: 100 }} />
      </div>

      {/* Sticky save button */}
      {selected && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto',
          padding: '16px 20px 28px',
          background: 'linear-gradient(to top, #fff8ee, rgba(255,248,238,0.95))',
          borderTop: `1.5px solid ${C.saffron}22`,
        }}>
          <button
            onClick={handleSave}
            style={{
              width: '100%', padding: '18px',
              background: saved ? C.green : `linear-gradient(135deg, ${C.saffron}, ${C.gold})`,
              border: 'none', borderRadius: 20,
              fontSize: 20, fontFamily: "'Baloo 2', cursive", fontWeight: 800,
              color: '#fff', cursor: 'pointer',
              boxShadow: `0 6px 22px ${C.shadow}`,
              transition: 'all 0.3s',
            }}
          >
            {saved ? '✅ Saved! Wapas ja rahe hain...' : `✅ "${selected.slice(0, 28)}" Save करें`}
          </button>
          <p style={{ textAlign: 'center', margin: '8px 0 0', fontSize: 13, fontFamily: "'Noto Sans Devanagari', sans-serif", color: C.textMid }}>
            यह आवाज़ पूरे app में उपयोग होगी
          </p>
        </div>
      )}
    </div>
  )
}
