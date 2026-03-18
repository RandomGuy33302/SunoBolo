# 🌸 SunoBolo — सुनो बोलो

English learning app for rural elderly Hindi-speaking Indians — powered by Meera Didi AI.

---

## 🚀 Deploy to Vercel (FREE) — 10 Minutes

### Step 1 — Get your Anthropic API key
1. Go to https://console.anthropic.com
2. Sign up / log in → click **API Keys** → **Create Key**
3. Copy the key (starts with `sk-ant-...`) — save it safely

### Step 2 — Create accounts (free)
- https://github.com → create account
- https://vercel.com → sign up with GitHub

### Step 3 — Upload code to GitHub
1. Go to https://github.com/new
2. Name it `sunobolo` → click **Create repository**
3. Click **uploading an existing file**
4. Drag all files from the `sunobolo` folder and upload
5. Click **Commit changes**

### Step 4 — Deploy on Vercel
1. Go to https://vercel.com/dashboard
2. Click **Add New Project** → Import `sunobolo`
3. Click **Deploy** (no build settings to change)

### Step 5 — Add your API key ⭐ IMPORTANT
Without this step the AI chat will not work!

1. In Vercel dashboard → your project → **Settings** tab
2. Click **Environment Variables** in the left menu
3. Click **Add New**:
   - Name:  `ANTHROPIC_API_KEY`
   - Value: `sk-ant-...` (your key from Step 1)
4. Click **Save**
5. Go to **Deployments** → click the 3 dots on the latest deployment → **Redeploy**

✅ Done! Your app is now live at `sunobolo.vercel.app` with AI working!

---

## 📱 Install as a Phone App (PWA)

**Android (Chrome):**
1. Open the app URL in Chrome
2. Tap menu (3 dots) → **Add to Home Screen** → **Add**

**iPhone (Safari):**
1. Open the app URL in Safari
2. Tap Share button → **Add to Home Screen** → **Add**

The app icon 🌸 appears on the home screen like a native app.

---

## 💻 Run Locally (for testing)

```bash
# Requires Node.js from https://nodejs.org

cd sunobolo
npm install

# Create a .env.local file with your key:
echo "ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE" > .env.local

# Run with Vercel CLI for serverless functions to work:
npm install -g vercel
vercel dev

# OR run with just Vite (AI chat won't work without the proxy):
npm run dev
```

---

## 🎤 Voice — Use Chrome!
Speech recognition and text-to-speech work best in Google Chrome on Android or desktop.
On iPhone, use Safari.

---

## 📁 Project Structure

```
sunobolo/
├── api/
│   └── chat.js              # Vercel serverless proxy → Anthropic API
├── public/
│   ├── manifest.json        # PWA manifest
│   └── icon.svg             # App icon
├── src/
│   ├── App.jsx              # Root + routing
│   ├── api.js               # API calls + speech helpers
│   ├── constants.js         # Topics, colors, sentences
│   ├── components.jsx       # Shared UI components
│   ├── HomeScreen.jsx       # Home with AI chat hero card
│   ├── TopicIntroScreen.jsx # Topic intro
│   ├── LessonScreen.jsx     # 3-step lesson
│   ├── CelebrationScreen.jsx
│   └── AiConversationScreen.jsx  # Meera Didi AI tutor
├── index.html
├── package.json
├── vite.config.js
└── vercel.json              # Vercel routing config
```

---

## ✨ Features
- **8 topics** — infinite AI-generated rounds that get harder each time
- **3-step lessons** — See & Hear → Voice Repeat → Word Match puzzle
- **Meera Didi AI tutor** — leads real conversations, corrects errors invisibly, does small talk
- **8 conversation scenarios** — Market, Doctor, Family, Travel and more
- **Auto level-up** — Beginner → Intermediate → Advanced automatically
- **Hindi translations** — every AI sentence has Hindi meaning below it
- **Voice input** — speak your answers, no typing needed
- **Text-to-speech** — every sentence read aloud in slow Indian English
- **Progress saved** — stored in browser, never lost
- **PWA** — installable on phone like a native app
