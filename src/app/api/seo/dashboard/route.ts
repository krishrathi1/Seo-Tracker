import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      // Get the first active project if none specified
      const project = await db.project.findFirst({ where: { isActive: true } })
      if (!project) {
        return NextResponse.json({ error: 'No active project found' }, { status: 404 })
      }
      return dashboardResponse(project.id)
    }

    return dashboardResponse(projectId)
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function dashboardResponse(projectId: string) {
  // Fetch all data in parallel
  const [
    project,
    keywords,
    latestAudit,
    allAudits,
    backlinks,
    competitors,
    alerts,
    recentAlerts,
  ] = await Promise.all([
    db.project.findUnique({ where: { id: projectId } }),
    db.keyword.findMany({
      where: { projectId, isActive: true },
      include: { rankHistory: { orderBy: { date: 'desc' }, take: 1 } },
    }),
    db.siteAudit.findFirst({
      where: { projectId, status: 'completed' },
      orderBy: { createdAt: 'desc' },
      include: { issues: true },
    }),
    db.siteAudit.findMany({
      where: { projectId, status: 'completed' },
      orderBy: { createdAt: 'desc' },
      take: 12,
    }),
    db.backlink.findMany({ where: { projectId } }),
    db.competitor.findMany({ where: { projectId } }),
    db.alert.count({ where: { projectId } }),
    db.alert.findMany({
      where: { projectId, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  // === SEO Health Score ===
  const healthScore = latestAudit?.score ?? 0

  // === Keyword Position Distribution ===
  const top3 = keywords.filter(k => k.currentRank && k.currentRank <= 3).length
  const top10 = keywords.filter(k => k.currentRank && k.currentRank > 3 && k.currentRank <= 10).length
  const top20 = keywords.filter(k => k.currentRank && k.currentRank > 10 && k.currentRank <= 20).length
  const rank21to50 = keywords.filter(k => k.currentRank && k.currentRank > 20 && k.currentRank <= 50).length
  const rank50Plus = keywords.filter(k => k.currentRank && k.currentRank > 50).length

  // === Average Rank ===
  const keywordsWithRank = keywords.filter(k => k.currentRank !== null)
  const averageRank = keywordsWithRank.length > 0
    ? Math.round(keywordsWithRank.reduce((sum, k) => sum + (k.currentRank ?? 0), 0) / keywordsWithRank.length * 10) / 10
    : 0

  // === Keyword Position Changes ===
  const improved = keywords.filter(k =>
    k.currentRank && k.previousRank && k.currentRank < k.previousRank
  ).length
  const declined = keywords.filter(k =>
    k.currentRank && k.previousRank && k.currentRank > k.previousRank
  ).length
  const newKeywords = keywords.filter(k => k.currentRank && !k.previousRank).length
  const lost = keywords.filter(k => !k.currentRank && k.previousRank).length

  // === Backlink Stats ===
  const now = new Date()
  const oneMonthAgo = new Date(now)
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

  const activeBacklinks = backlinks.filter(b => b.status === 'active')
  const newThisMonth = backlinks.filter(b => b.firstSeen >= oneMonthAgo && b.status === 'active').length
  const lostThisMonth = backlinks.filter(b => b.status === 'lost' && b.lastSeen >= oneMonthAgo).length
  const referringDomains = new Set(backlinks.map(b => b.sourceDomain)).size
  const followLinks = activeBacklinks.filter(b => b.isFollow).length
  const nofollowLinks = activeBacklinks.filter(b => !b.isFollow).length

  // === Audit Issue Breakdown ===
  const issueBreakdown = latestAudit
    ? {
        critical: latestAudit.issues.filter(i => i.severity === 'critical').length,
        high: latestAudit.issues.filter(i => i.severity === 'high').length,
        medium: latestAudit.issues.filter(i => i.severity === 'medium').length,
        low: latestAudit.issues.filter(i => i.severity === 'low').length,
        info: latestAudit.issues.filter(i => i.severity === 'info').length,
      }
    : { critical: 0, high: 0, medium: 0, low: 0, info: 0 }

  // === Organic Traffic Value Estimate ===
  // Based on keyword positions and search volumes (rough CTR model)
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
  const estimatedTraffic = keywordsWithRank.reduce((sum, k) => {
    const ctr = getCTR(k.currentRank ?? 100)
    return sum + Math.round((k.searchVolume ?? 0) * ctr)
  }, 0)
  const trafficValue = Math.round(estimatedTraffic * 2.50) // avg CPC estimate

  // === Competitor Comparison ===
  const competitorComparison = competitors.map(c => ({
    id: c.id,
    domain: c.domain,
    authorityScore: c.authorityScore,
    organicKeywords: c.organicKeywords,
    organicTraffic: c.organicTraffic,
    backlinks: c.backlinks,
  }))

  // Add our own metrics for comparison
  const ourMetrics = {
    domain: project.domain,
    authorityScore: 64,
    organicKeywords: keywords.length,
    organicTraffic: estimatedTraffic,
    backlinks: activeBacklinks.length,
  }

  // === Monthly Rank Trend (last 12 months) ===
  const monthlyTrend = []
  for (let monthOffset = 11; monthOffset >= 0; monthOffset--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - monthOffset + 1, 0)
    const monthLabel = monthDate.toLocaleString('en-US', { month: 'short', year: '2-digit' })

    // Get average rank for this month from rank history
    const monthRanks = await db.keywordRank.findMany({
      where: {
        keyword: { projectId, isActive: true },
        date: { gte: monthDate, lte: monthEnd },
      },
      select: { rank: true },
    })

    const avgRank = monthRanks.length > 0
      ? Math.round(monthRanks.reduce((sum, r) => sum + r.rank, 0) / monthRanks.length * 10) / 10
      : null

    monthlyTrend.push({
      month: monthLabel,
      averageRank: avgRank,
      totalKeywords: keywords.length,
    })
  }

  // === Biggest Movers ===
  const keywordsWithChanges = keywords
    .filter(k => k.currentRank && k.previousRank)
    .map(k => ({
      id: k.id,
      keyword: k.keyword,
      currentRank: k.currentRank!,
      previousRank: k.previousRank!,
      change: (k.previousRank ?? 0) - (k.currentRank ?? 0), // positive = improved
      searchVolume: k.searchVolume,
      url: k.url,
    }))
    .sort((a, b) => b.change - a.change)

  const topImproved = keywordsWithChanges.slice(0, 5)
  const topDeclined = keywordsWithChanges
    .filter(k => k.change < 0)
    .sort((a, b) => a.change - b.change)
    .slice(0, 5)

  return NextResponse.json({
    project: {
      id: project.id,
      name: project.name,
      domain: project.domain,
    },
    healthScore,
    keywords: {
      total: keywords.length,
      distribution: { top3, top10, top20, rank21to50, rank50Plus },
      averageRank,
      changes: { improved, declined, new: newKeywords, lost },
    },
    backlinks: {
      total: activeBacklinks.length,
      newThisMonth,
      lostThisMonth,
      referringDomains,
      followRatio: activeBacklinks.length > 0
        ? Math.round((followLinks / activeBacklinks.length) * 100)
        : 0,
      nofollowRatio: activeBacklinks.length > 0
        ? Math.round((nofollowLinks / activeBacklinks.length) * 100)
        : 0,
    },
    audit: {
      score: latestAudit?.score ?? 0,
      totalPages: latestAudit?.totalPages ?? 0,
      issueBreakdown,
      scoreTrend: allAudits.map(a => ({
        date: a.createdAt.toISOString().split('T')[0],
        score: a.score,
      })),
    },
    traffic: {
      estimatedMonthlyVisits: estimatedTraffic,
      estimatedValue: trafficValue,
    },
    competitors: {
      ours: ourMetrics,
      competitors: competitorComparison,
    },
    alerts: {
      total: alerts,
      unread: recentAlerts.length,
      recent: recentAlerts.map(a => ({
        id: a.id,
        type: a.type,
        severity: a.severity,
        title: a.title,
        message: a.message,
        isRead: a.isRead,
        createdAt: a.createdAt,
      })),
    },
    monthlyTrend,
    biggestMovers: {
      improved: topImproved,
      declined: topDeclined,
    },
  })
}
