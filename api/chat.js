// api/chat.js — Vercel serverless function (CommonJS — required for Vercel Node runtime)
// DO NOT change to ESM (export default) — breaks with "type":"module" in package.json

const https = require('https')

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  if (req.method !== 'POST')    { res.status(405).json({ error: 'Method not allowed' }); return }

  // ── Manual body parsing (Vercel doesn't auto-parse JSON) ──────────────────
  let body
  try {
    body = await new Promise((resolve, reject) => {
      let raw = ''
      req.on('data', chunk => { raw += chunk })
      req.on('end',  ()    => {
        try { resolve(JSON.parse(raw)) } catch (e) { reject(new Error('Invalid JSON body')) }
      })
      req.on('error', reject)
    })
  } catch (e) {
    res.status(400).json({ error: 'Bad request: ' + e.message })
    return
  }

  // ── API key check ─────────────────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    res.status(500).json({
      error: 'ANTHROPIC_API_KEY not set. Go to Vercel → Project → Settings → Environment Variables and add it, then redeploy.'
    })
    return
  }

  // ── Forward to Anthropic ──────────────────────────────────────────────────
  const { messages, system, model, max_tokens } = body

  const payload = JSON.stringify({
    model:      model      || 'claude-sonnet-4-20250514',
    max_tokens: max_tokens || 1000,
    messages,
    ...(system ? { system } : {}),
  })

  try {
    const data = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.anthropic.com',
        path:     '/v1/messages',
        method:   'POST',
        headers:  {
          'Content-Type':      'application/json',
          'Content-Length':    Buffer.byteLength(payload),
          'x-api-key':         apiKey,
          'anthropic-version': '2023-06-01',
        },
      }

      const request = https.request(options, apiRes => {
        let raw = ''
        apiRes.on('data', chunk => { raw += chunk })
        apiRes.on('end', () => {
          try {
            const parsed = JSON.parse(raw)
            resolve({ status: apiRes.statusCode, body: parsed })
          } catch (e) {
            reject(new Error('Failed to parse Anthropic response: ' + raw.slice(0, 200)))
          }
        })
      })

      request.on('error', reject)
      request.write(payload)
      request.end()
    })

    if (data.status !== 200) {
      res.status(data.status).json({ error: data.body?.error?.message || JSON.stringify(data.body) })
      return
    }

    res.status(200).json(data.body)
  } catch (err) {
    console.error('[/api/chat] Anthropic fetch error:', err.message)
    res.status(500).json({ error: err.message })
  }
}
