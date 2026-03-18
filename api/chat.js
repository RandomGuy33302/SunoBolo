// api/chat.js — Vercel serverless function (CommonJS)
// Groq API proxy — text + vision (Llama 4 Scout)
// FREE at console.groq.com — set GROQ_API_KEY in Vercel Project env vars

const https = require('https')

// Vercel default body size limit is 1MB — increase to 10MB for images
export const config = { api: { bodyParser: { sizeLimit: '10mb' } } }

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  if (req.method !== 'POST')    { res.status(405).json({ error: 'Method not allowed' }); return }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body
  try {
    body = await new Promise((resolve, reject) => {
      let raw = ''
      req.on('data',  chunk => { raw += chunk })
      req.on('end',   ()    => {
        try { resolve(JSON.parse(raw)) }
        catch (e) { reject(new Error('Invalid JSON: ' + e.message)) }
      })
      req.on('error', reject)
    })
  } catch (e) {
    res.status(400).json({ error: 'Bad request: ' + e.message })
    return
  }

  // ── API key check ─────────────────────────────────────────────────────────
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    res.status(500).json({
      error: 'GROQ_API_KEY not set. Go to Vercel → your Project → Settings → Environment Variables → add GROQ_API_KEY. Get free key at console.groq.com'
    })
    return
  }

  // ── Build Groq request ────────────────────────────────────────────────────
  const { messages, system, model, max_tokens, temperature } = body

  // Model selection:
  // - meta-llama/llama-4-scout-17b-16e-instruct → vision tasks (current, replaces deprecated llama-3.2-11b-vision-preview)
  // - llama-3.3-70b-versatile → text/conversation (default)
  const groqModel = model || 'llama-3.3-70b-versatile'

  const groqMessages = system
    ? [{ role: 'system', content: system }, ...messages]
    : messages

  const payload = JSON.stringify({
    model:       groqModel,
    max_tokens:  max_tokens  || 1200,
    temperature: temperature || 0.82,
    messages:    groqMessages,
  })

  // ── Call Groq ─────────────────────────────────────────────────────────────
  try {
    const data = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.groq.com',
        path:     '/openai/v1/chat/completions',
        method:   'POST',
        headers:  {
          'Content-Type':   'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'Authorization':  `Bearer ${apiKey}`,
        },
      }

      const request = https.request(options, apiRes => {
        let raw = ''
        apiRes.on('data', chunk => { raw += chunk })
        apiRes.on('end',  () => {
          try   { resolve({ status: apiRes.statusCode, body: JSON.parse(raw) }) }
          catch (e) { reject(new Error('Failed to parse Groq response: ' + raw.slice(0, 300))) }
        })
      })
      request.on('error', reject)
      request.write(payload)
      request.end()
    })

    if (data.status !== 200) {
      const errMsg = data.body?.error?.message || JSON.stringify(data.body)
      console.error('[/api/chat] Groq error:', errMsg)
      res.status(data.status).json({ error: errMsg })
      return
    }

    // Convert Groq (OpenAI) format → Anthropic format expected by frontend
    const text = data.body?.choices?.[0]?.message?.content || ''
    res.status(200).json({ content: [{ type: 'text', text }] })

  } catch (err) {
    console.error('[/api/chat] fetch error:', err.message)
    res.status(500).json({ error: err.message })
  }
}
