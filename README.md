# 🌸 SunoBolo — सुनो बोलो

English learning app for rural elderly Hindi-speaking Indians — powered by Meera Didi AI.
**100% FREE — uses Groq AI (no credit card, no subscription needed)**

---

## 🚀 Deploy to Vercel (FREE) — 10 Minutes

### Step 1 — Get your FREE Groq API key
1. Go to **https://console.groq.com**
2. Sign up free (Google login works, no credit card needed)
3. Click **"API Keys"** in the left menu → **"Create API Key"**
4. Name it anything (e.g. "sunobolo") → copy the key (starts with `gsk_...`)
5. That's it — Groq gives you **14,400 free requests/day** forever

### Step 2 — Create accounts (free)
- https://github.com → create account
- https://vercel.com → sign up with GitHub

### Step 3 — Upload code to GitHub
1. Go to https://github.com/new
2. Name it `sunobolo` → click **Create repository**
3. Click **"uploading an existing file"**
4. Drag ALL files from inside the `sunobolo` folder and upload
5. Click **Commit changes**

### Step 4 — Deploy on Vercel
1. Go to https://vercel.com/dashboard
2. Click **Add New Project** → Import `sunobolo`
3. Click **Deploy** (no build settings to change)

### Step 5 — Add your Groq API key ⭐ IMPORTANT
Without this step the AI chat will not work!

1. In Vercel dashboard → click your **sunobolo project** (not Team Settings!)
2. Click **Settings** tab at the top
3. Click **Environment Variables** in the left sidebar
4. Click **Add New**:
   - Key:   `GROQ_API_KEY`
   - Value: `gsk_...` (your key from Step 1)
   - Make sure Production, Preview, Development are all ticked
5. Click **Save**
6. Go to **Deployments** tab → click 3 dots on latest deployment → **Redeploy**

✅ Done! Your app is live at `sunobolo.vercel.app` — completely free!

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

# Create a .env.local file with your Groq key:
echo "GROQ_API_KEY=gsk_YOUR_KEY_HERE" > .env.local

# Run with Vercel CLI (recommended — serverless functions work):
npm install -g vercel
vercel dev

# OR just Vite (AI chat won't work without the proxy):
npm run dev
```

---

## 📁 Project Structure

```
sunobolo/
├── api/
│   └── chat.js              # Vercel serverless proxy → Groq API (FREE)
├── public/
│   ├── manifest.json        # PWA manifest
│   └── icon.svg             # App icon
├── src/
│   ├── App.jsx              # Root + routing
│   ├── api.js               # API calls + speech helpers
│   ├── constants.js         # Topics, colors, sentences
│   ├── components.jsx       # Shared UI components
│   ├── HomeScreen.jsx       # Home with AI chat hero card
│   ├── TopicIntroScreen.jsx
│   ├── LessonScreen.jsx     # 3-step lesson flow
│   ├── CelebrationScreen.jsx
│   └── AiConversationScreen.jsx  # Meera Didi AI tutor
├── index.html
├── package.json
├── vite.config.js
└── vercel.json
```

---

## ✨ Features
- **100% FREE** — powered by Groq (Llama 3.3 70B model)
- **8 topics** — infinite AI-generated rounds that get harder each time
- **3-step lessons** — See & Hear → Voice Repeat → Word Match
- **Meera Didi AI tutor** — leads real conversations, corrects errors naturally
- **8 conversation scenarios** — Market, Doctor, Family, Travel and more
- **Auto level-up** — Beginner → Intermediate → Advanced automatically
- **Hindi translations** — every AI sentence has Hindi meaning
- **Voice input** — speak your answers, no typing needed
- **Text-to-speech** — sentences read aloud in Indian English
- **PWA** — installable on phone like a native app
