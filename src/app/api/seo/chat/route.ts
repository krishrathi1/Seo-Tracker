import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, projectId, history = [] } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    if (message.length > 2000) {
      return NextResponse.json({ error: 'Message too long (max 2000 chars)' }, { status: 400 })
    }

    // Load project context from database
    let contextStr = ''
    try {
      const project = projectId ? await db.project.findUnique({ where: { id: projectId } }) : null
      const keywords = projectId ? await db.keyword.findMany({ where: { projectId }, take: 20, orderBy: { searchVolume: 'desc' } }) : []
      const latestAudit = projectId ? await db.siteAudit.findFirst({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        include: { issues: { take: 15, orderBy: { severity: 'asc' } } }
      }) : null
      const backlinks = projectId ? await db.backlink.findMany({ where: { projectId }, take: 10 }) : []
      const competitors = projectId ? await db.competitor.findMany({ where: { projectId }, take: 5 }) : []
      const alertCount = projectId ? await db.alert.count({ where: { projectId, isRead: false } }) : 0

      const criticalIssues = latestAudit?.issues.filter(i => i.severity === 'critical').map(i => i.title) || []
      const highIssues = latestAudit?.issues.filter(i => i.severity === 'high').map(i => i.title) || []
      const topKeywords = keywords.slice(0, 8).map(k => `${k.keyword} (rank #${k.currentRank ?? '?'}, vol: ${k.searchVolume ?? '?'})`)
      const backlinkDomains = [...new Set(backlinks.map(b => b.sourceDomain))]
      const competitorDomains = competitors.map(c => c.domain)

      contextStr = `
Current Website Analysis:
- Domain: ${project?.domain || 'Unknown'}
- SEO Audit Score: ${latestAudit?.score ?? 'N/A'}/100
- Total Keywords Tracked: ${keywords.length}
- Top Keywords: ${topKeywords.join('; ')}
- Total Issues Found: ${latestAudit?.issues.length ?? 0}
- Critical Issues: ${criticalIssues.length > 0 ? criticalIssues.join('; ') : 'None'}
- High Issues: ${highIssues.length > 0 ? highIssues.join('; ') : 'None'}
- Backlinks Found: ${backlinks.length} (from ${backlinkDomains.length} domains)
- Top Referring Domains: ${backlinkDomains.slice(0, 5).join(', ')}
- Competitors: ${competitorDomains.length > 0 ? competitorDomains.join(', ') : 'None tracked'}
- Unread Alerts: ${alertCount}`
    } catch (dbErr) {
      console.error('DB context load error:', dbErr)
      contextStr = 'No project data available.'
    }

    const systemPrompt = `You are RankPulse AI, an expert SEO consultant assistant built into the RankPulse SEO Tracker platform. You help users improve their website's search engine optimization with specific, actionable advice.

${contextStr}

Guidelines:
- Provide specific, actionable SEO advice based on the user's actual website data above
- Reference the actual audit score, issues, keywords, and competitors when relevant
- Use markdown formatting: headings (##, ###), bold (**text**), bullet lists (- item), numbered lists (1. item)
- If asked about technical SEO, explain clearly with step-by-step instructions
- Suggest improvements based on the audit score and issues found
- Be concise but thorough - aim for 150-300 words per response
- Always cite specific data when making recommendations (e.g., "Your audit score of 62/100 suggests...")
- If you don't have enough data, suggest the user run a new analysis
- Never mention you are an AI - just provide expert SEO advice naturally
- Format code snippets with backticks`

    // Build messages array with history
    const messages = [
      { role: 'assistant' as const, content: systemPrompt },
      ...history.slice(-10).map((m: { role: string; content: string }) => ({
        role: (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ]

    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: 'disabled' },
    })

    const responseText = completion.choices?.[0]?.message?.content || 'I apologize, but I was unable to generate a response. Please try again.'

    return NextResponse.json({ message: responseText, success: true })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate response', success: false },
      { status: 500 }
    )
  }
}
