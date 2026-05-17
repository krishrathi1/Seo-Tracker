import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// ─── Helper: Generate Keyword Gaps dynamically based on competitor domains ─
function generateKeywordGaps(projectDomain: string, competitors: Array<{ domain: string }>) {
  const suffixes = [
    { suffix: 'pricing plans', volumeMult: 1.2, diffBase: 45 },
    { suffix: 'features and reviews', volumeMult: 0.8, diffBase: 35 },
    { suffix: 'alternatives & competitors', volumeMult: 1.5, diffBase: 50 },
    { suffix: 'integration guide', volumeMult: 0.5, diffBase: 30 },
    { suffix: 'api documentation', volumeMult: 0.6, diffBase: 40 },
    { suffix: 'vs competitors', volumeMult: 0.9, diffBase: 48 },
    { suffix: 'login issues', volumeMult: 0.4, diffBase: 25 },
    { suffix: 'customer support', volumeMult: 0.3, diffBase: 20 },
  ]

  const gaps = []
  for (const comp of competitors) {
    const compName = comp.domain.replace(/\.[a-z]+$/, '')
    // Generate some interesting keywords based on the competitor domain name
    const selectedSuffixes = suffixes.slice(0, 4)
    for (const item of selectedSuffixes) {
      const vol = Math.round((1200 + Math.random() * 4500) * item.volumeMult)
      const diff = Math.min(100, Math.max(0, Math.round(item.diffBase + Math.random() * 18)))
      gaps.push({
        keyword: `${compName} ${item.suffix}`,
        yourRank: null,
        competitorRank: 2 + Math.floor(Math.random() * 8),
        competitor: comp.domain,
        volume: vol,
        difficulty: diff,
      })
    }
  }

  // If no competitors, add a few general ones based on the project itself
  if (gaps.length === 0) {
    const projName = projectDomain.replace(/\.[a-z]+$/, '')
    gaps.push(
      { keyword: `best ${projName} alternatives`, yourRank: null, competitorRank: 4, competitor: 'competitor.com', volume: 2400, difficulty: 55 },
      { keyword: `${projName} software cost`, yourRank: null, competitorRank: 6, competitor: 'competitor2.com', volume: 1200, difficulty: 42 }
    )
  }

  // Sort by volume descending
  return gaps.sort((a, b) => b.volume - a.volume)
}

// GET /api/seo/competitors - Get competitor data with comparison metrics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
    }

    const project = await db.project.findUnique({ where: { id: projectId } })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const competitors = await db.competitor.findMany({
      where: { projectId },
      orderBy: { authorityScore: 'desc' },
    })

    // Get our own metrics for comparison
    const [
      keywordCount,
      activeBacklinks,
    ] = await Promise.all([
      db.keyword.count({ where: { projectId, isActive: true } }),
      db.backlink.count({ where: { projectId, status: 'active' } }),
    ])

    // Calculate our estimated traffic
    const keywordsWithRank = await db.keyword.findMany({
      where: { projectId, isActive: true, currentRank: { not: null } },
      select: { currentRank: true, searchVolume: true },
    })

    const ctrByPosition: Record<number, number> = {
      1: 0.316, 2: 0.161, 3: 0.103, 4: 0.073, 5: 0.053,
      6: 0.040, 7: 0.031, 8: 0.025, 9: 0.021, 10: 0.018,
    }
    const getCTR = (rank: number) => {
      if (rank <= 10) return ctrByPosition[rank] ?? 0.015
      if (rank <= 20) return 0.010
      if (rank <= 30) return 0.005
      if (rank <= 50) return 0.002
      return 0.001
    }

    const ourTraffic = keywordsWithRank.reduce((sum, k) => {
      const ctr = getCTR(k.currentRank ?? 100)
      return sum + Math.round((k.searchVolume ?? 0) * ctr)
    }, 0)

    // Our authority (simulated - in real app would come from an API)
    const ourAuthority = 64

    // Build comparison data
    const ourMetrics = {
      domain: project.domain,
      authorityScore: ourAuthority,
      organicKeywords: keywordCount,
      organicTraffic: ourTraffic,
      backlinks: activeBacklinks,
    }

    // Normalize competitor data for comparison
    const competitorMetrics = competitors.map(c => ({
      id: c.id,
      domain: c.domain,
      authorityScore: c.authorityScore ?? 0,
      organicKeywords: c.organicKeywords ?? 0,
      organicTraffic: c.organicTraffic ?? 0,
      backlinks: c.backlinks ?? 0,
    }))

    // Gap analysis - how we compare
    const gapAnalysis = competitorMetrics.map(c => ({
      domain: c.domain,
      authorityGap: c.authorityScore - ourAuthority,
      keywordGap: c.organicKeywords - keywordCount,
      trafficGap: c.organicTraffic - ourTraffic,
      backlinkGap: c.backlinks - activeBacklinks,
    }))

    // Visibility share (estimated based on keywords * authority)
    const totalVisibility = competitorMetrics.reduce((sum, c) =>
      sum + c.organicKeywords * (c.authorityScore / 100), 0
    ) + keywordCount * (ourAuthority / 100)

    const visibilityShare = totalVisibility > 0
      ? {
          ours: Math.round((keywordCount * (ourAuthority / 100) / totalVisibility) * 100),
          competitors: competitorMetrics.map(c => ({
            domain: c.domain,
            share: Math.round((c.organicKeywords * (c.authorityScore / 100) / totalVisibility) * 100),
          })),
        }
      : null

    // Strength/weakness analysis
    const strengths: string[] = []
    const weaknesses: string[] = []

    if (competitorMetrics.length > 0) {
      const avgCompAuthority = competitorMetrics.reduce((sum, c) => sum + c.authorityScore, 0) / competitorMetrics.length
      if (ourAuthority > avgCompAuthority) {
        strengths.push(`Higher domain authority (${ourAuthority}) than competitor average (${Math.round(avgCompAuthority)})`)
      } else {
        weaknesses.push(`Lower domain authority (${ourAuthority}) than competitor average (${Math.round(avgCompAuthority)})`)
      }

      const avgCompBacklinks = competitorMetrics.reduce((sum, c) => sum + c.backlinks, 0) / competitorMetrics.length
      if (activeBacklinks > avgCompBacklinks) {
        strengths.push(`More backlinks (${activeBacklinks}) than competitor average (${Math.round(avgCompBacklinks)})`)
      } else {
        weaknesses.push(`Fewer backlinks (${activeBacklinks}) than competitor average (${Math.round(avgCompBacklinks)})`)
      }

      const avgCompKeywords = competitorMetrics.reduce((sum, c) => sum + c.organicKeywords, 0) / competitorMetrics.length
      if (keywordCount > avgCompKeywords) {
        strengths.push(`More ranking keywords (${keywordCount}) than competitor average (${Math.round(avgCompKeywords)})`)
      } else {
        weaknesses.push(`Fewer ranking keywords (${keywordCount}) than competitor average (${Math.round(avgCompKeywords)})`)
      }
    }

    return NextResponse.json({
      competitors: competitorMetrics,
      comparison: {
        ours: ourMetrics,
        gapAnalysis,
        visibilityShare,
        strengths,
        weaknesses,
        keywordGaps: generateKeywordGaps(project.domain, competitorMetrics),
      },
    })
  } catch (error) {
    console.error('Competitors GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST /api/seo/competitors - Add a new competitor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, domain } = body

    if (!projectId || !domain) {
      return NextResponse.json({ error: 'projectId and domain are required' }, { status: 400 })
    }

    const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]

    if (!cleanDomain || !cleanDomain.includes('.')) {
      return NextResponse.json({ error: 'Invalid competitor domain' }, { status: 400 })
    }

    // Check if competitor already exists
    const existing = await db.competitor.findFirst({
      where: { projectId, domain: cleanDomain }
    })

    if (existing) {
      return NextResponse.json(existing)
    }

    // Generate realistic metrics
    const competitor = await db.competitor.create({
      data: {
        projectId,
        domain: cleanDomain,
        authorityScore: Math.round(30 + Math.random() * 60),
        organicKeywords: Math.round(300 + Math.random() * 4000),
        organicTraffic: Math.round(2000 + Math.random() * 150000),
        backlinks: Math.round(100 + Math.random() * 12000),
      }
    })

    return NextResponse.json(competitor)
  } catch (error) {
    console.error('Competitors POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
