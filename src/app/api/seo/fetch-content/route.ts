import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Validate URL
    let normalized = url.trim()
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized
    }

    const zai = await ZAI.create()
    const result = await zai.functions.invoke('page_reader', { url: normalized })

    if (result?.code === 200 && result?.data) {
      const data = result.data
      // Extract useful SEO content from HTML
      const html = data.html || ''
      
      // Extract meta title
      const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
      const title = titleMatch ? titleMatch[1].trim() : ''
      
      // Extract meta description
      const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i)
        || html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["']/i)
      const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : ''

      // Extract headings for structured content
      const h1Matches = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map(m => `# ${m[1].replace(/<[^>]+>/g, '').trim()}`)
      const h2Matches = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map(m => `## ${m[1].replace(/<[^>]+>/g, '').trim()}`)
      const h3Matches = [...html.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi)].map(m => `### ${m[1].replace(/<[^>]+>/g, '').trim()}`)

      // Extract paragraphs (text content)
      const paragraphMatches = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
        .map(m => m[1].replace(/<[^>]+>/g, '').trim())
        .filter(p => p.length > 20)

      // Build structured content in markdown-like format
      const structuredContent = [
        title ? `# ${title}` : '',
        metaDescription ? `\n${metaDescription}` : '',
        ...h1Matches.filter(h => h !== `# ${title}`),
        ...h2Matches.flatMap((h, i) => {
          const relatedParagraphs = paragraphMatches.slice(i, i + 2)
          return [h, ...relatedParagraphs]
        }),
        ...h3Matches,
      ].filter(Boolean).join('\n\n')

      return NextResponse.json({
        success: true,
        content: structuredContent || html.substring(0, 10000),
        title,
        metaDescription,
        url: normalized,
      })
    }

    return NextResponse.json({ error: 'Failed to fetch page content' }, { status: 400 })
  } catch (error) {
    console.error('Fetch content error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch content' },
      { status: 500 }
    )
  }
}
