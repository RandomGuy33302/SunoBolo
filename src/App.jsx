import './index.css'
import { useState } from 'react'
import { TOPICS, STARTER_SENTENCES } from './constants.js'
import {
  generateNextRoundSentences,
  loadProgress, saveProgress,
  loadSentenceCache, saveSentenceCache,
} from './api.js'

import HomeScreen            from './HomeScreen.jsx'
import TopicIntroScreen      from './TopicIntroScreen.jsx'
import LessonScreen          from './LessonScreen.jsx'
import CelebrationScreen     from './CelebrationScreen.jsx'
import AiConversationScreen  from './AiConversationScreen.jsx'
import EmergencyScreen       from './EmergencyScreen.jsx'
import SpeedTrainerScreen    from './SpeedTrainerScreen.jsx'
import PointLearnScreen      from './PointLearnScreen.jsx'
import MeeraHelperScreen     from './MeeraHelperScreen.jsx'
import { LoadingScreen }     from './components.jsx'

// Screens: home | topicIntro | lesson | celebration | aiChat
//          emergency | speedTrainer | pointLearn | meeraHelper

export default function App() {
  const [screen,           setScreen]          = useState('home')
  const [selectedTopic,    setSelectedTopic]   = useState(null)
  const [currentSentences, setCurrentSentences]= useState([])
  const [sentenceIndex,    setSentenceIndex]   = useState(0)
  const [loadingRound,     setLoadingRound]    = useState(false)

  const [progress,      setProgressState]     = useState(loadProgress)
  const [sentenceCache, setSentenceCacheState] = useState(loadSentenceCache)

  function updateProgress(p) { setProgressState(p);      saveProgress(p) }
  function updateCache(c)    { setSentenceCacheState(c);  saveSentenceCache(c) }

  // ── Feature card navigation ───────────────────────────────────────────────
  function handleFeature(id) {
    const map = {
      aiChat:       'aiChat',
      emergency:    'emergency',
      speedTrainer: 'speedTrainer',
      pointLearn:   'pointLearn',
      meeraHelper:  'meeraHelper',
    }
    if (map[id]) setScreen(map[id])
  }

  // ── Topic lesson flow ─────────────────────────────────────────────────────
  function handleSelectTopic(topic) {
    setSelectedTopic(topic)
    setScreen('topicIntro')
  }

  async function handleStartLesson() {
    const p     = progress[selectedTopic.id] || { round: 1, completed: 0 }
    const round = p.round
    setLoadingRound(true)

    const cached = sentenceCache[selectedTopic.id]?.[round]
    let sentences

    if (cached) {
      sentences = cached
    } else if (round === 1) {
      sentences = STARTER_SENTENCES[selectedTopic.id]
      updateCache({
        ...sentenceCache,
        [selectedTopic.id]: { ...(sentenceCache[selectedTopic.id] || {}), 1: sentences },
      })
    } else {
      const prev = sentenceCache[selectedTopic.id]?.[round - 1] || STARTER_SENTENCES[selectedTopic.id]
      sentences  = await generateNextRoundSentences(selectedTopic, round, prev)
      updateCache({
        ...sentenceCache,
        [selectedTopic.id]: { ...(sentenceCache[selectedTopic.id] || {}), [round]: sentences },
      })
    }

    setCurrentSentences(sentences)
    setSentenceIndex(0)
    setLoadingRound(false)
    setScreen('lesson')
  }

  function handleLessonComplete() {
    const next = sentenceIndex + 1
    if (next < currentSentences.length) {
      setSentenceIndex(next)
    } else {
      const p = progress[selectedTopic.id] || { round: 1, completed: 0 }
      updateProgress({
        ...progress,
        [selectedTopic.id]: {
          round:     p.round + 1,
          completed: (p.completed || 0) + currentSentences.length,
        },
      })
      setScreen('celebration')
    }
  }

  const currentRound = selectedTopic ? (progress[selectedTopic.id]?.round || 1) : 1
  const goHome       = () => setScreen('home')

  if (loadingRound) return <LoadingScreen topic={selectedTopic} />

  return (
    <>
      {screen === 'home' && (
        <HomeScreen
          progress={progress}
          onFeature={handleFeature}
          onSelect={handleSelectTopic}
        />
      )}

      {screen === 'aiChat' && (
        <AiConversationScreen onBack={goHome} />
      )}

      {screen === 'emergency' && (
        <EmergencyScreen onBack={goHome} />
      )}

      {screen === 'speedTrainer' && (
        <SpeedTrainerScreen onBack={goHome} />
      )}

      {screen === 'pointLearn' && (
        <PointLearnScreen onBack={goHome} />
      )}

      {screen === 'meeraHelper' && (
        <MeeraHelperScreen onBack={goHome} />
      )}

      {screen === 'topicIntro' && selectedTopic && (
        <TopicIntroScreen
          topic={selectedTopic}
          progress={progress}
          onStart={handleStartLesson}
          onBack={goHome}
        />
      )}

      {screen === 'lesson' && selectedTopic && (
        <LessonScreen
          topic={selectedTopic}
          sentences={currentSentences}
          sentenceIndex={sentenceIndex}
          onComplete={handleLessonComplete}
          onBack={() => setScreen('topicIntro')}
        />
      )}

      {screen === 'celebration' && selectedTopic && (
        <CelebrationScreen
          topic={selectedTopic}
          round={currentRound - 1}
          onPractice={() => setScreen('aiChat')}
          onHome={goHome}
        />
      )}
    </>
  )
}
