import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import Anthropic from '@anthropic-ai/sdk'
import Stripe from 'stripe'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

app.post('/api/generate-resume', async (req, res) => {
  if (!anthropic) {
    return res.status(503).json({ error: 'AI service not configured. Add ANTHROPIC_API_KEY to .env' })
  }

  const { formData } = req.body

  const prompt = `You are an elite professional resume writer and career strategist. Analyze the user's information and return an enhanced, ATS-optimized resume in JSON format.

User's information:
${JSON.stringify(formData, null, 2)}

Return ONLY valid JSON (no markdown, no code blocks) in this exact structure:
{
  "personalInfo": {
    "name": "${formData.personalInfo?.name || ''}",
    "email": "${formData.personalInfo?.email || ''}",
    "phone": "${formData.personalInfo?.phone || ''}",
    "location": "${formData.personalInfo?.location || ''}",
    "linkedin": "${formData.personalInfo?.linkedin || ''}",
    "website": "${formData.personalInfo?.website || ''}",
    "title": "Enhanced job title based on experience"
  },
  "summary": "A compelling 2-3 sentence professional summary using strong action words",
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "location": "City, ST",
      "startDate": "Mon YYYY",
      "endDate": "Mon YYYY or Present",
      "bullets": [
        "Strong action verb + specific achievement + quantified result",
        "Another impactful bullet with metrics",
        "Third bullet showcasing key responsibility"
      ]
    }
  ],
  "education": [
    {
      "school": "University Name",
      "degree": "Degree Type",
      "field": "Field of Study",
      "year": "YYYY",
      "gpa": "X.X (if provided)",
      "honors": "Honors if any"
    }
  ],
  "skills": {
    "technical": ["skill1", "skill2"],
    "soft": ["skill1", "skill2"],
    "certifications": ["cert1"],
    "languages": ["language1"]
  },
  "atsScore": 85,
  "tips": [
    "Specific improvement tip 1",
    "Specific improvement tip 2",
    "Specific improvement tip 3"
  ]
}

Rules:
- Enhance all bullet points with strong action verbs (Led, Architected, Spearheaded, Optimized, etc.)
- Add quantified metrics where possible (%, $, time saved, team size)
- Keep the user's actual information - just enhance the language
- Make the summary compelling and specific to their background
- Ensure all content is ATS-friendly`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }]
    })

    const text = message.content[0].text.trim()
    const jsonStart = text.indexOf('{')
    const jsonEnd = text.lastIndexOf('}') + 1
    const jsonStr = text.slice(jsonStart, jsonEnd)
    const parsed = JSON.parse(jsonStr)

    res.json({ resume: parsed })
  } catch (error) {
    console.error('AI generation error:', error)
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/create-payment-intent', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Payment service not configured. Add STRIPE_SECRET_KEY to .env' })
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 900,
      currency: 'usd',
      metadata: { product: 'ai_resume', price: '$9.00' },
      description: 'ResumeAI — Professional Resume Download'
    })

    res.json({ clientSecret: paymentIntent.client_secret })
  } catch (error) {
    console.error('Stripe error:', error)
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    ai: !!anthropic,
    payments: !!stripe
  })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`\n🚀 ResumeAI Server running on http://localhost:${PORT}`)
  console.log(`   AI: ${anthropic ? '✅ Ready' : '❌ No API key'}`)
  console.log(`   Payments: ${stripe ? '✅ Ready' : '❌ No API key'}\n`)
})
