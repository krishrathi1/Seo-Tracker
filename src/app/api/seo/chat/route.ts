import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  let project: any = null
  let keywords: any[] = []
  let latestAudit: any = null
  let backlinks: any[] = []
  let competitors: any[] = []
  let alertCount = 0
  let criticalIssues: string[] = []
  let highIssues: string[] = []
  let topKeywords: string[] = []
  let backlinkDomains: string[] = []
  let competitorDomains: string[] = []
  let message = ''

  try {
    const body = await request.json()
    const { projectId, history = [] } = body
    message = body.message

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    if (message.length > 2000) {
      return NextResponse.json({ error: 'Message too long (max 2000 chars)' }, { status: 400 })
    }

    // Load project context from database
    let contextStr = ''
    try {
      project = projectId ? await db.project.findUnique({ where: { id: projectId } }) : null
      keywords = projectId ? await db.keyword.findMany({ where: { projectId }, take: 20, orderBy: { searchVolume: 'desc' } }) : []
      latestAudit = projectId ? await db.siteAudit.findFirst({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        include: { issues: { take: 15, orderBy: { severity: 'asc' } } }
      }) : null
      backlinks = projectId ? await db.backlink.findMany({ where: { projectId }, take: 10 }) : []
      competitors = projectId ? await db.competitor.findMany({ where: { projectId }, take: 5 }) : []
      alertCount = projectId ? await db.alert.count({ where: { projectId, isRead: false } }) : 0

      criticalIssues = latestAudit?.issues.filter(i => i.severity === 'critical').map(i => i.title) || []
      highIssues = latestAudit?.issues.filter(i => i.severity === 'high').map(i => i.title) || []
      topKeywords = keywords.slice(0, 8).map(k => `${k.keyword} (rank #${k.currentRank ?? '?'}, vol: ${k.searchVolume ?? '?'})`)
      backlinkDomains = [...new Set(backlinks.map(b => b.sourceDomain))]
      competitorDomains = competitors.map(c => c.domain)

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
    // Gracefully handle configuration or SDK error
    const isConfigError = error instanceof Error && (error.message.includes('Configuration file not found') || error.message.includes('apiKey'));
    if (isConfigError || error instanceof Error) {
      console.warn('ZAI SDK connection unavailable. Using smart local SEO Consultant fallback.');
      
      const msg = message.toLowerCase()
      let responseText = ''

      const domain = project?.domain || 'your website'
      const score = latestAudit?.score ?? 'N/A'
      
      if (msg.includes('score') || msg.includes('health') || msg.includes('audit')) {
        responseText = `## SEO Audit & Score Analysis for **${domain}**

Your current SEO Audit Score is **${score}/100**.

Here is a breakdown of your technical health:
- **Total Issues Found**: ${latestAudit?.issues.length ?? 0}
- **Critical Issues**: ${criticalIssues.length > 0 ? criticalIssues.length : 0}
- **High Severity Issues**: ${highIssues.length > 0 ? highIssues.length : 0}

### Recommendation:
${criticalIssues.length > 0 
  ? `You should prioritize resolving the critical issues first, specifically: **${criticalIssues.slice(0, 3).join(', ')}**. Fixing these will immediately boost your organic visibility and score.`
  : `Your site has no critical issues! Work on high/medium severity issues to fine-tune your performance.`
}`
      } else if (msg.includes('keyword') || msg.includes('rank') || msg.includes('search')) {
        responseText = `## Keyword Performance for **${domain}**

We are currently tracking **${keywords.length} keywords** for your domain.

### Top Performing Keywords:
${topKeywords.length > 0 
  ? topKeywords.map(k => `- **${k}**`).join('\n') 
  : '- No tracked keywords found. Go to the **Keyword Tracking** tab to add terms you want to monitor!'}

### Strategy:
To improve keyword rankings, focus on targeting **long-tail keywords** with lower difficulty scores (under 40) before trying to compete for highly competitive search terms.`
      } else if (msg.includes('backlink') || msg.includes('link') || msg.includes('authority')) {
        responseText = `## Backlink & Authority Profile for **${domain}**

- **Total Backlinks Tracked**: ${backlinks.length}
- **Unique Referring Domains**: ${backlinkDomains.length}
- **Top Referring Domains**: ${backlinkDomains.slice(0, 5).join(', ') || 'None tracked yet'}

### Link Building Advice:
Having links from diverse, high-authority domains is critical for your search engine rankings. Consider reaching out for guest posts, producing shareable industry reports, and fixing any broken links pointing to your site to naturally build your authority.`
      } else if (msg.includes('competitor') || msg.includes('compete') || msg.includes('rival')) {
        responseText = `## Competitor Analysis for **${domain}**

We are comparing your site against **${competitors.length} competitors**:
${competitorDomains.length > 0 
  ? competitorDomains.map(c => `- **${c}**`).join('\n')
  : '- No competitors are currently tracked. You can add your main competitors in the **Competitors** tab to compare domain authority and keyword coverage!'}

### Niche Strategy:
Analyze your competitors' backlink profiles and identify keywords they rank for that you don't. This "Keyword Gap" represents your immediate low-hanging fruit opportunity.`
      } else if (msg.includes('issue') || msg.includes('fix') || msg.includes('error') || msg.includes('critical')) {
        responseText = `## Actionable Issues List for **${domain}**

Here are the highest priority items that require your attention:

### Critical Issues:
${criticalIssues.length > 0 
  ? criticalIssues.map(i => `- 🚨 **${i}**`).join('\n')
  : '- None detected! Excellent job.'}

### High Severity Issues:
${highIssues.length > 0 
  ? highIssues.map(i => `- ⚠️ **${i}**`).join('\n')
  : '- None detected! Great work.'}

To view detailed instructions on how to resolve each of these issues, please head over to the **Site Audit** tab where step-by-step fixes are listed.`
      } else {
        responseText = `## RankPulse SEO Consultant Assistant

Hello! I am your local SEO Consultant assistant. While the deep AI connection is running in fallback mode, I have fully loaded your website's real audit metrics and can give you specific guidance.

Here is a quick snapshot of **${domain}**:
- **SEO Score**: **${score}/100**
- **Tracked Keywords**: ${keywords.length}
- **Tracked Backlinks**: ${backlinks.length}
- **Active Alerts**: ${alertCount}

Feel free to ask me specific questions like:
- *"How do I fix my critical issues?"*
- *"Show me my keyword rankings"*
- *"What is my backlink status?"*
- *"Who are my main competitors?"*`
      }

      return NextResponse.json({ message: responseText, success: true })
    }

    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate response', success: false },
      { status: 500 }
    )
  }
}
