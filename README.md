# 🌸 SunoBolo — सुनो बोलो

English learning app for rural elderly Hindi-speaking Indians.

---

## 🚀 Deploy to Vercel (FREE) — 5 Minutes

### Step 1 — Create accounts (free)
- Go to https://github.com and create an account
- Go to https://vercel.com and sign up with your GitHub account

### Step 2 — Upload the code to GitHub
1. Go to https://github.com/new
2. Name it `sunobolo`, click **Create repository**
3. Click **uploading an existing file**
4. Drag the entire `sunobolo` folder contents and upload
5. Click **Commit changes**

### Step 3 — Deploy on Vercel
1. Go to https://vercel.com/dashboard
2. Click **Add New Project**
3. Import your `sunobolo` GitHub repo
4. Click **Deploy** (no settings to change!)
5. ✅ Done! Your app is live at `sunobolo.vercel.app`

---

## 📱 Install as a Phone App (PWA)

Once deployed, open the link on your phone:

**On Android (Chrome):**
1. Open the app URL in Chrome
2. Tap the 3-dot menu → "Add to Home Screen"
3. Tap "Add"
4. App icon appears on your home screen!

**On iPhone (Safari):**
1. Open the app URL in Safari
2. Tap the Share button (box with arrow)
3. Scroll down → "Add to Home Screen"
4. Tap "Add"

---

## 💻 Run Locally (for testing)

```bash
# Install Node.js from https://nodejs.org first

cd sunobolo
npm install
npm run dev

# Open http://localhost:5173 in Chrome
```

---

## 🎤 Voice Features — Use Chrome!

Speech recognition and text-to-speech work best in **Google Chrome**.
On mobile, use **Chrome for Android** or **Safari for iOS**.

---

## 📁 Project Structure

```
sunobolo/
├── index.html              # Entry HTML
├── package.json            # Dependencies
├── vite.config.js          # Build config
├── public/
│   ├── manifest.json       # PWA manifest (installable app)
│   └── icon.svg            # App icon
└── src/
    ├── main.jsx            # React entry
    ├── App.jsx             # Root app + routing
    ├── index.css           # Global styles + animations
    ├── constants.js        # Topics, colors, starter sentences
    ├── api.js              # Claude API + speech helpers
    ├── components.jsx      # Shared UI: BigBtn, Card, MeeraDidi...
    ├── HomeScreen.jsx      # Topic selection grid
    ├── TopicIntroScreen.jsx # Topic intro + round info
    ├── LessonScreen.jsx    # 3-step lesson: See→Speak→Match
    ├── CelebrationScreen.jsx # Round complete screen
    └── AiConversationScreen.jsx # AI chat with Meera Didi
```

---

## ✨ Features

- **8 topics** — Doctor, Shopping, Family, Greetings, Travel, Phone, Bank, Eating
- **Infinite AI rounds** — Each completed round generates harder sentences via Claude AI
- **3-step lessons** — See & Hear → Voice repeat → Word matching puzzle
- **AI conversation** — Practice with Meera Didi roleplay bot after each round
- **Hindi support** — All instructions in Hindi, AI translates every sentence
- **Voice input** — Speak your answers, no typing needed
- **Text-to-speech** — Every sentence read aloud slowly in Indian English
- **Progress saved** — Never lose your progress (stored in browser)
- **PWA** — Installable on phone like a native app, works offline*

*Lesson content needs internet. AI features need internet.

---

Made with ❤️ for rural elderly India.
