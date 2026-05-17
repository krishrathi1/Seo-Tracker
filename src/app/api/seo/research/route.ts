import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

interface KeywordSuggestion {
  keyword: string
  searchVolume: number
  difficulty: number
  cpc: number
  intent: 'informational' | 'navigational' | 'commercial' | 'transactional'
}

// GET /api/seo/research - Generate keyword suggestions using LLM
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const seed = searchParams.get('seed')

    if (!seed) {
      return NextResponse.json(
        { error: 'seed query parameter is required' },
        { status: 400 }
      )
    }

    const zai = await ZAI.create()

    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an expert SEO keyword researcher. When given a seed keyword, you generate exactly 20 related keyword suggestions with realistic SEO metrics. You must respond with ONLY a valid JSON array, no other text. Each object in the array must have these exact fields:
- keyword: string (the suggested keyword)
- searchVolume: number (monthly search volume, realistic estimate)
- difficulty: number (0-100, SEO difficulty score)
- cpc: number (cost per click in USD, realistic estimate)
- intent: string (one of: "informational", "navigational", "commercial", "transactional")

The keywords should be a mix of head terms, long-tail variations, questions, and related topics. Search volumes should range from 100 to 50000. Difficulty should range from 10 to 95. CPC should range from 0.10 to 25.00. Respond with ONLY the JSON array, nothing else.`,
        },
        {
          role: 'user',
          content: `Generate 20 SEO keyword suggestions related to: "${seed}"`,
        },
      ],
    })

    // Parse the LLM response
    const content = response.choices?.[0]?.message?.content || ''

    // Try to extract JSON from the response (it might have markdown code blocks)
    let jsonStr = content
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      jsonStr = jsonMatch[0]
    }

    let suggestions: KeywordSuggestion[]
    try {
      suggestions = JSON.parse(jsonStr)
    } catch {
      // If parsing fails, return generated fallback data
      suggestions = generateFallbackSuggestions(seed)
    }

    // Validate and clean the suggestions
    const validatedSuggestions = suggestions.slice(0, 20).map(s => ({
      keyword: String(s.keyword || seed),
      searchVolume: typeof s.searchVolume === 'number' ? Math.max(0, Math.round(s.searchVolume)) : 1000,
      difficulty: typeof s.difficulty === 'number' ? Math.min(100, Math.max(0, Math.round(s.difficulty))) : 50,
      cpc: typeof s.cpc === 'number' ? Math.max(0, Math.round(s.cpc * 100) / 100) : 1.0,
      intent: ['informational', 'navigational', 'commercial', 'transactional'].includes(s.intent)
        ? s.intent
        : 'informational',
    }))

    return NextResponse.json({
      seed,
      suggestions: validatedSuggestions,
      count: validatedSuggestions.length,
    })
  } catch (error) {
    console.error('Research GET error:', error)
    // Return fallback data on error
    const seed = new URL(request.url).searchParams.get('seed') || 'seo tools'
    return NextResponse.json({
      seed,
      suggestions: generateFallbackSuggestions(seed),
      count: 20,
      fallback: true,
    })
  }
}

function generateFallbackSuggestions(seed: string): KeywordSuggestion[] {
  const modifiers = [
    `best ${seed}`, `${seed} for beginners`, `${seed} tutorial`, `how to use ${seed}`,
    `${seed} comparison`, `${seed} vs alternatives`, `${seed} pricing`, `free ${seed}`,
    `${seed} review`, `${seed} for small business`, `top ${seed} 2024`, `${seed} guide`,
    `${seed} tips`, `${seed} best practices`, `${seed} tools`, `cheap ${seed}`,
    `${seed} software`, `${seed} platform`, `${seed} online`, `${seed} app`,
  ]

  return modifiers.map((keyword, i) => ({
    keyword,
    searchVolume: Math.round(Math.max(100, 15000 - i * 700 + Math.random() * 2000)),
    difficulty: Math.round(30 + Math.random() * 55),
    cpc: Math.round((1 + Math.random() * 12) * 100) / 100,
    intent: (['informational', 'commercial', 'transactional', 'navigational'] as const)[i % 4],
  }))
}
