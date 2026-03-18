// api/chat.js — Vercel serverless function (CommonJS — do NOT use ESM here)
// Groq free API proxy. Set GROQ_API_KEY in Vercel Project → Settings → Env Vars.

const https = require('https')

// ── Vercel body size config (CJS syntax — NOT export const) ──────────────────
module.exports.config = { api: { bodyParser: { sizeLimit: '10mb' } } }

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  if (req.method !== 'POST')    { res.status(405).json({ error: 'Method not allowed' }); return }

  // ── Parse body manually (Vercel doesn't auto-parse for CJS) ─────────────
  let body
  try {
    body = await new Promise((resolve, reject) => {
      let raw = ''
      req.on('data',  c => { raw += c })
      req.on('end',   () => { try { resolve(JSON.parse(raw)) } catch (e) { reject(new Error('Invalid JSON: ' + e.message)) } })
      req.on('error', reject)
    })
  } catch (e) {
    res.status(400).json({ error: 'Bad request: ' + e.message }); return
  }

  // ── API key ───────────────────────────────────────────────────────────────
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'GROQ_API_KEY not set. Vercel → Project → Settings → Environment Variables → add GROQ_API_KEY. Free key at console.groq.com' })
    return
  }

  // ── Build messages ────────────────────────────────────────────────────────
  const { messages, system, model, max_tokens, temperature } = body

  // Vision model: meta-llama/llama-4-scout-17b-16e-instruct (current Groq vision)
  // Text model:   llama-3.3-70b-versatile (default)
  const groqModel    = model || 'llama-3.3-70b-versatile'
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
      const req2 = https.request({
        hostname: 'api.groq.com',
        path:     '/openai/v1/chat/completions',
        method:   'POST',
        headers: {
          'Content-Type':   'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'Authorization':  `Bearer ${apiKey}`,
        },
      }, apiRes => {
        let raw = ''
        apiRes.on('data', c => { raw += c })
        apiRes.on('end',  () => {
          try   { resolve({ status: apiRes.statusCode, body: JSON.parse(raw) }) }
          catch (e) { reject(new Error('Parse error: ' + raw.slice(0, 200))) }
        })
      })
      req2.on('error', reject)
      req2.write(payload)
      req2.end()
    })

    if (data.status !== 200) {
      const msg = data.body?.error?.message || JSON.stringify(data.body)
      console.error('[/api/chat] Groq error:', msg)
      res.status(data.status).json({ error: msg }); return
    }

    // Return in Anthropic format so frontend code stays unchanged
    const text = data.body?.choices?.[0]?.message?.content || ''
    res.status(200).json({ content: [{ type: 'text', text }] })

  } catch (err) {
    console.error('[/api/chat] error:', err.message)
    res.status(500).json({ error: err.message })
  }
}
