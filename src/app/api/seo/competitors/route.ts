import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

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

    if (competitors.length === 0) {
      return NextResponse.json({ competitors: [], comparison: null })
    }

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

    return NextResponse.json({
      competitors: competitorMetrics,
      comparison: {
        ours: ourMetrics,
        gapAnalysis,
        visibilityShare,
        strengths,
        weaknesses,
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
