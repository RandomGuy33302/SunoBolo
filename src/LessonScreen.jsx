import { useState, useEffect, useRef } from 'react'
import { C } from './constants.js'
import { speakEnglish, stopSpeech, translateToHindi } from './api.js'
import { BigBtn, Card, MeeraDidi, ProgressBar } from './components.jsx'

// ── Step 1: See & Hear ────────────────────────────────────────────────────────
function StepSeeHear({ topic, sentence, onNext }) {
  const [hindi, setHindi] = useState('...')
  const [played, setPlayed] = useState(false)

  useEffect(() => {
    setPlayed(false)
    translateToHindi(sentence).then(h => setHindi(h.trim())).catch(() => setHindi(''))
    const t = setTimeout(() => { speakEnglish(sentence); setPlayed(true) }, 600)
    return () => clearTimeout(t)
  }, [sentence])

  return (
    <Card>
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <div style={{ fontSize: 68, marginBottom: 10 }}>{topic.emoji}</div>
        <div style={{ background: `${topic.color}12`, borderRadius: 18, padding: '16px 18px', border: `2px solid ${topic.color}30`, marginBottom: 14 }}>
          <p style={{ fontSize: 26, fontFamily: "'Baloo 2', cursive", fontWeight: 800, color: topic.color, lineHeight: 1.35, margin: '0 0 10px' }}>
            "{sentence}"
          </p>
          <p style={{ fontSize: 20, fontFamily: "'Noto Sans Devanagari', sans-serif", color: C.textMid, margin: 0, lineHeight: 1.4 }}>
            {hindi || '...'}
          </p>
        </div>
      </div>
      <MeeraDidi message="Suniye aur samajhiye!" hindi="सुनिए और समझिए! 👂" small />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
        <BigBtn onClick={() => { speakEnglish(sentence); setPlayed(true) }} color={topic.color}>
          🔊 फिर से सुनें (Hear Again)
        </BigBtn>
        <BigBtn onClick={onNext} color={C.green} disabled={!played}>
          समझ आ गया ✓ — Next
        </BigBtn>
      </div>
    </Card>
  )
}

// ── Step 2: Repeat / Speak ────────────────────────────────────────────────────
function StepRepeat({ topic, sentence, onNext }) {
  const [listening,  setListening]  = useState(false)
  const [spokenText, setSpokenText] = useState('')
  const [attempts,   setAttempts]   = useState(0)
  const micRef     = useRef(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      stopMic()
    }
  }, [])

  function stopMic() {
    if (micRef.current) { try { micRef.current.stop() } catch (_) {} micRef.current = null }
    if (mountedRef.current) setListening(false)
  }

  function toggleMic() {
    if (listening) { stopMic(); return }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Kripya Chrome use karein.'); return }
    stopSpeech()
    setListening(true); setSpokenText('')
    const r = new SR()
    r.lang = 'en-IN'; r.continuous = false; r.interimResults = false
    r.onresult = e => {
      if (mountedRef.current) { setSpokenText(e.results[0][0].transcript); setAttempts(a => a + 1) }
      stopMic()
    }
    r.onerror  = () => stopMic()
    r.onend    = () => stopMic()
    micRef.current = r; r.start()
  }

  return (
    <Card>
      <div style={{ background: `${topic.color}14`, borderRadius: 16, padding: '12px 16px', marginBottom: 16, textAlign: 'center' }}>
        <p style={{ fontSize: 22, fontFamily: "'Baloo 2', cursive", fontWeight: 800, color: topic.color, margin: 0 }}>"{sentence}"</p>
      </div>
      <MeeraDidi message="Ab aap boliye!" hindi="अब आप बोलिए! 🎤" small />
      <div style={{ textAlign: 'center', margin: '18px 0' }}>
        <button onClick={toggleMic} style={{
          width: 96, height: 96, borderRadius: '50%',
          background: listening ? 'radial-gradient(circle, #ff4444, #bb0000)' : `radial-gradient(circle, ${topic.color}, ${C.gold})`,
          border: 'none', fontSize: 38, cursor: 'pointer',
          boxShadow: listening ? '0 0 0 0 rgba(255,68,68,0.4)' : `0 8px 28px ${topic.color}55`,
          animation: listening ? 'micPulse 1.2s ease-in-out infinite' : 'none', transition: 'background 0.3s',
        }}>{listening ? '⏹️' : '🎤'}</button>
        <p style={{ fontFamily: "'Noto Sans Devanagari', sans-serif", fontSize: 16, color: C.textMid, marginTop: 10 }}>
          {listening ? '🎧 सुन रहे हैं... (tap to stop)' : '👆 दबाएँ और बोलें'}
        </p>
      </div>
      {spokenText && (
        <div style={{ background: '#f0fff6', border: '2px solid #2ECC71', borderRadius: 16, padding: '14px 16px', marginBottom: 14, textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
          <p style={{ margin: 0, fontSize: 20, fontFamily: "'Baloo 2', cursive", color: C.text }}>🗣️ "{spokenText}"</p>
          <p style={{ margin: '6px 0 0', fontSize: 16, fontFamily: "'Noto Sans Devanagari', sans-serif", color: C.green }}>✅ बहुत अच्छा! शाबाश! 🌟</p>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <BigBtn onClick={() => speakEnglish(sentence)} color={topic.color}>🔊 एक बार और सुनें</BigBtn>
        {spokenText && <BigBtn onClick={onNext} color={C.green}>अगला ➜ Next</BigBtn>}
        <BigBtn onClick={onNext} color='#ccc' textColor='#888'>छोड़ें (Skip)</BigBtn>
      </div>
    </Card>
  )
}

// ── Step 3: Word Match ────────────────────────────────────────────────────────
function StepMatch({ topic, sentence, onNext }) {
  const correctWords = sentence.replace(/[?.!,]/g, '').split(' ').filter(Boolean)
  const [bank,   setBank]   = useState(() => [...correctWords].sort(() => Math.random() - 0.5))
  const [picked, setPicked] = useState([])
  const [result, setResult] = useState(null)

  function pickWord(w, i) {
    if (result === 'correct') return
    const nb = [...bank]; nb.splice(i, 1); setBank(nb)
    setPicked(p => [...p, w]); setResult(null)
  }
  function unpick(i) {
    if (result === 'correct') return
    const w = picked[i]; const np = [...picked]; np.splice(i, 1); setPicked(np)
    setBank(b => [...b, w]); setResult(null)
  }
  function check() {
    const ok = picked.join(' ') === correctWords.join(' ')
    setResult(ok ? 'correct' : 'wrong')
    if (ok) speakEnglish('Excellent! Perfect!')
  }
  function reset() { setBank([...correctWords].sort(() => Math.random() - 0.5)); setPicked([]); setResult(null) }

  return (
    <Card>
      <p style={{ fontSize: 19, fontFamily: "'Noto Sans Devanagari', sans-serif", color: C.textMid, textAlign: 'center', marginBottom: 14 }}>🧩 सही क्रम में शब्द लगाओ</p>
      <div style={{ minHeight: 58, background: '#fff8ee', border: `2.5px dashed ${result === 'correct' ? C.green : result === 'wrong' ? C.red : topic.color}`, borderRadius: 16, display: 'flex', flexWrap: 'wrap', gap: 8, padding: 10, marginBottom: 14, transition: 'border-color 0.3s' }}>
        {picked.length === 0 && <span style={{ fontSize: 15, color: '#ccc', fontFamily: "'Baloo 2', cursive", alignSelf: 'center' }}>नीचे से शब्द चुनें ↓</span>}
        {picked.map((w, i) => (
          <button key={i} onClick={() => unpick(i)} style={{ background: result === 'correct' ? C.green : topic.color, color: '#fff', borderRadius: 10, padding: '7px 14px', fontSize: 18, fontFamily: "'Baloo 2', cursive", fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'background 0.3s' }}>{w}</button>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16, minHeight: 44 }}>
        {bank.map((w, i) => (
          <button key={i} onClick={() => pickWord(w, i)} style={{ background: '#fff', border: `2px solid ${topic.color}`, borderRadius: 10, padding: '8px 16px', fontSize: 18, fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: topic.color, cursor: 'pointer' }}>{w}</button>
        ))}
      </div>
      {result === 'correct' && <div style={{ textAlign: 'center', fontSize: 22, fontFamily: "'Noto Sans Devanagari', sans-serif", color: C.green, marginBottom: 12, animation: 'fadeIn 0.3s ease' }}>🎉 बिल्कुल सही! Excellent!</div>}
      {result === 'wrong' && <div style={{ textAlign: 'center', fontSize: 17, fontFamily: "'Noto Sans Devanagari', sans-serif", color: C.deepRed, marginBottom: 10 }}>💪 फिर कोशिश करें! Try again!</div>}
      <div style={{ display: 'flex', gap: 10 }}>
        <BigBtn onClick={reset} color='#aaa' style={{ flex: 1 }}>🔄 Reset</BigBtn>
        {picked.length === correctWords.length && result !== 'correct' && <BigBtn onClick={check} color={topic.color} style={{ flex: 1 }}>✓ Check</BigBtn>}
        {result === 'correct' && <BigBtn onClick={onNext} color={C.green} style={{ flex: 1 }}>अगला ➜</BigBtn>}
        {result === 'wrong' && <BigBtn onClick={onNext} color='#bbb' style={{ flex: 1 }}>छोड़ें</BigBtn>}
      </div>
    </Card>
  )
}

// ── Main LessonScreen ─────────────────────────────────────────────────────────
export default function LessonScreen({ topic, sentences, sentenceIndex, onComplete, onBack }) {
  const [step, setStep] = useState(1)

  // Stop speech when sentence changes or component unmounts
  useEffect(() => { setStep(1) }, [sentenceIndex])
  useEffect(() => { return () => stopSpeech() }, [])

  function handleBack() { stopSpeech(); onBack() }

  const sentence = sentences[sentenceIndex]
  const progress = (sentenceIndex / sentences.length) * 100
  const stepLabels = ['👀 देखो', '🗣️ बोलो', '🧩 मिलाओ']

  return (
    <div style={{ minHeight: '100vh', background: topic.bg, paddingBottom: 32 }}>
      <div style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={handleBack} style={{ background: 'rgba(0,0,0,0.07)', border: 'none', borderRadius: 12, padding: '9px 14px', fontSize: 17, cursor: 'pointer', color: topic.color, fontWeight: 700 }}>← वापस</button>
          <div style={{ flex: 1 }}><ProgressBar value={progress} color={topic.color} /></div>
          <span style={{ fontFamily: "'Baloo 2', cursive", fontWeight: 700, color: topic.color, fontSize: 17, whiteSpace: 'nowrap' }}>{sentenceIndex + 1}/{sentences.length}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {stepLabels.map((label, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', padding: '8px 4px', borderRadius: 12, fontSize: 13, fontFamily: "'Noto Sans Devanagari', sans-serif", background: step === i+1 ? topic.color : step > i+1 ? C.green : '#e8d8c8', color: step >= i+1 ? '#fff' : '#aaa', fontWeight: step === i+1 ? 700 : 400, transition: 'all 0.3s' }}>{label}</div>
          ))}
        </div>
      </div>
      <div style={{ padding: '16px 16px 0' }}>
        {step === 1 && <StepSeeHear topic={topic} sentence={sentence} onNext={() => setStep(2)} />}
        {step === 2 && <StepRepeat  topic={topic} sentence={sentence} onNext={() => setStep(3)} />}
        {step === 3 && <StepMatch   topic={topic} sentence={sentence} onNext={onComplete} />}
      </div>
    </div>
  )
}
