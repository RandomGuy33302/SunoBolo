// api/chat.js — Vercel serverless function
// Proxies requests to Anthropic API server-side to avoid CORS issues.
// Set ANTHROPIC_API_KEY in your Vercel project environment variables.

export default async function handler(req, res) {
  // Allow CORS from same origin (Vercel handles this automatically,
  // but explicit headers help during local dev with `vercel dev`)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY environment variable is not set. Please add it in Vercel project settings → Environment Variables.' })
    return
  }

  try {
    const { messages, system, model, max_tokens } = req.body

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      model      || 'claude-sonnet-4-20250514',
        max_tokens: max_tokens || 1000,
        system,
        messages,
      }),
    })

    const data = await anthropicRes.json()

    if (!anthropicRes.ok) {
      res.status(anthropicRes.status).json({ error: data?.error?.message || 'Anthropic API error' })
      return
    }

    res.status(200).json(data)
  } catch (err) {
    console.error('Proxy error:', err)
    res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
