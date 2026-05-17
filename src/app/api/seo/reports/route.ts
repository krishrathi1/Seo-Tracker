import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/seo/reports - Generate summary report combining data from all modules
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

    // Fetch all data in parallel
    const [
      keywords,
      latestAudit,
      allAudits,
      backlinks,
      competitors,
      alerts,
    ] = await Promise.all([
      db.keyword.findMany({ where: { projectId, isActive: true } }),
      db.siteAudit.findFirst({
        where: { projectId, status: 'completed' },
        orderBy: { createdAt: 'desc' },
        include: { issues: true },
      }),
      db.siteAudit.findMany({
        where: { projectId, status: 'completed' },
        orderBy: { createdAt: 'desc' },
        take: 2,
      }),
      db.backlink.findMany({ where: { projectId } }),
      db.competitor.findMany({ where: { projectId } }),
      db.alert.findMany({ where: { projectId }, orderBy: { createdAt: 'desc' }, take: 50 }),
    ])

    const now = new Date()
    const reportDate = now.toISOString().split('T')[0]

    // === Keywords Summary ===
    const keywordsWithRank = keywords.filter(k => k.currentRank !== null)
    const avgRank = keywordsWithRank.length > 0
      ? Math.round(keywordsWithRank.reduce((sum, k) => sum + (k.currentRank ?? 0), 0) / keywordsWithRank.length * 10) / 10
      : 0

    const improvedKeywords = keywords.filter(k =>
      k.currentRank && k.previousRank && k.currentRank < k.previousRank
    )
    const declinedKeywords = keywords.filter(k =>
      k.currentRank && k.previousRank && k.currentRank > k.previousRank
    )

    const topKeywords = keywordsWithRank
      .sort((a, b) => (a.currentRank ?? 100) - (b.currentRank ?? 100))
      .slice(0, 10)
      .map(k => ({
        keyword: k.keyword,
        currentRank: k.currentRank,
        previousRank: k.previousRank,
        change: k.previousRank && k.currentRank ? k.previousRank - k.currentRank : null,
        searchVolume: k.searchVolume,
        url: k.url,
      }))

    // === Traffic Estimate ===
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
    const trafficValue = Math.round(estimatedTraffic * 2.50)

    // === Audit Summary ===
    const auditSummary = latestAudit ? {
      score: latestAudit.score,
      scoreChange: allAudits.length > 1 ? latestAudit.score - allAudits[1].score : null,
      totalIssues: latestAudit.issues.length,
      criticalIssues: latestAudit.issues.filter(i => i.severity === 'critical').length,
      highIssues: latestAudit.issues.filter(i => i.severity === 'high').length,
      resolvedIssues: latestAudit.issues.filter(i => i.status === 'resolved').length,
      openIssues: latestAudit.issues.filter(i => i.status === 'open').length,
      topCategories: Object.entries(
        latestAudit.issues.reduce((acc: Record<string, number>, i) => {
          acc[i.category] = (acc[i.category] || 0) + 1
          return acc
        }, {})
      )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category, count]) => ({ category, count })),
    } : null

    // === Backlink Summary ===
    const activeBacklinks = backlinks.filter(b => b.status === 'active')
    const oneMonthAgo = new Date(now)
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

    const backlinkSummary = {
      total: backlinks.length,
      active: activeBacklinks.length,
      follow: activeBacklinks.filter(b => b.isFollow).length,
      nofollow: activeBacklinks.filter(b => !b.isFollow).length,
      referringDomains: new Set(backlinks.map(b => b.sourceDomain)).size,
      newThisMonth: activeBacklinks.filter(b => b.firstSeen >= oneMonthAgo).length,
      lostThisMonth: backlinks.filter(b => b.status === 'lost' && b.lastSeen >= oneMonthAgo).length,
      avgAuthority: activeBacklinks.length > 0
        ? Math.round(activeBacklinks.reduce((sum, b) => sum + (b.authorityScore ?? 0), 0) / activeBacklinks.length)
        : 0,
    }

    // === Competitor Summary ===
    const competitorSummary = competitors.map(c => ({
      domain: c.domain,
      authorityScore: c.authorityScore,
      organicKeywords: c.organicKeywords,
      organicTraffic: c.organicTraffic,
      backlinks: c.backlinks,
    }))

    // === Alert Summary ===
    const alertSummary = {
      total: alerts.length,
      unread: alerts.filter(a => !a.isRead).length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      high: alerts.filter(a => a.severity === 'high').length,
    }

    // === Key Insights ===
    const insights: string[] = []

    if (improvedKeywords.length > declinedKeywords.length) {
      insights.push(`${improvedKeywords.length} keywords improved vs ${declinedKeywords.length} declined — overall positive trend`)
    } else if (declinedKeywords.length > improvedKeywords.length) {
      insights.push(`${declinedKeywords.length} keywords declined vs ${improvedKeywords.length} improved — attention needed on declining rankings`)
    }

    if (latestAudit && latestAudit.issues.filter(i => i.severity === 'critical').length > 0) {
      insights.push(`${latestAudit.issues.filter(i => i.severity === 'critical').length} critical audit issues require immediate attention`)
    }

    if (backlinkSummary.newThisMonth > backlinkSummary.lostThisMonth * 2) {
      insights.push(`Strong backlink growth: ${backlinkSummary.newThisMonth} new vs ${backlinkSummary.lostThisMonth} lost this month`)
    } else if (backlinkSummary.lostThisMonth > backlinkSummary.newThisMonth) {
      insights.push(`Backlink attrition: lost ${backlinkSummary.lostThisMonth} vs gained ${backlinkSummary.newThisMonth} this month`)
    }

    const top3Count = keywords.filter(k => k.currentRank && k.currentRank <= 3).length
    if (top3Count > 0) {
      insights.push(`${top3Count} keywords in top 3 positions — these are your strongest rankings`)
    }

    if (latestAudit && allAudits.length > 1 && latestAudit.score > allAudits[1].score) {
      insights.push(`Audit score improved from ${allAudits[1].score} to ${latestAudit.score} — technical SEO is getting better`)
    }

    // === Recommendations ===
    const recommendations: string[] = []

    if (auditSummary && auditSummary.criticalIssues > 0) {
      recommendations.push(`Fix ${auditSummary.criticalIssues} critical audit issues immediately to improve site health`)
    }

    const decliningValuableKeywords = declinedKeywords
      .filter(k => (k.searchVolume ?? 0) > 3000)
      .slice(0, 3)
    if (decliningValuableKeywords.length > 0) {
      recommendations.push(`Focus on recovering rankings for declining high-volume keywords: ${decliningValuableKeywords.map(k => k.keyword).join(', ')}`)
    }

    if (backlinkSummary.avgAuthority < 50) {
      recommendations.push('Focus on acquiring backlinks from higher authority domains to boost domain strength')
    }

    const keywordsBeyond20 = keywords.filter(k => k.currentRank && k.currentRank > 20 && k.currentRank <= 50).length
    if (keywordsBeyond20 > 5) {
      recommendations.push(`${keywordsBeyond20} keywords are on page 2-5 — these have the best potential for quick wins with content optimization`)
    }

    const noFollowRatio = activeBacklinks.length > 0
      ? activeBacklinks.filter(b => !b.isFollow).length / activeBacklinks.length
      : 0
    if (noFollowRatio > 0.5) {
      recommendations.push('Over 50% of backlinks are nofollow — focus on acquiring more followed links for better SEO impact')
    }

    return NextResponse.json({
      reportDate,
      project: {
        id: project.id,
        name: project.name,
        domain: project.domain,
      },
      keywords: {
        total: keywords.length,
        averageRank: avgRank,
        improved: improvedKeywords.length,
        declined: declinedKeywords.length,
        topKeywords,
        positionDistribution: {
          top3: keywords.filter(k => k.currentRank && k.currentRank <= 3).length,
          top10: keywords.filter(k => k.currentRank && k.currentRank > 3 && k.currentRank <= 10).length,
          top20: keywords.filter(k => k.currentRank && k.currentRank > 10 && k.currentRank <= 20).length,
          top50: keywords.filter(k => k.currentRank && k.currentRank > 20 && k.currentRank <= 50).length,
          beyond50: keywords.filter(k => k.currentRank && k.currentRank > 50).length,
        },
      },
      traffic: {
        estimatedMonthlyVisits: estimatedTraffic,
        estimatedValue: trafficValue,
      },
      audit: auditSummary,
      backlinks: backlinkSummary,
      competitors: competitorSummary,
      alerts: alertSummary,
      insights,
      recommendations,
    })
  } catch (error) {
    console.error('Reports GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
