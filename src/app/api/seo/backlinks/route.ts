import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/seo/backlinks - List backlinks with filtering and stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')
    const linkType = searchParams.get('linkType')
    const isFollow = searchParams.get('isFollow')
    const minAuthority = searchParams.get('minAuthority')
    const maxSpam = searchParams.get('maxSpam')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const sortBy = searchParams.get('sortBy') || 'authorityScore'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
    }

    // Resolve "first" to the actual first project ID
    let resolvedProjectId = projectId
    if (projectId === 'first') {
      const firstProject = await db.project.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'asc' } })
      if (!firstProject) {
        return NextResponse.json({ error: 'No active project found' }, { status: 404 })
      }
      resolvedProjectId = firstProject.id
    }

    // Build where clause dynamically
    const where: Prisma.BacklinkWhereInput = { projectId: resolvedProjectId }

    if (status) {
      where.status = status
    }
    if (linkType) {
      where.linkType = linkType
    }
    if (isFollow !== null && isFollow !== undefined && isFollow !== '') {
      where.isFollow = isFollow === 'true'
    }
    if (minAuthority) {
      where.authorityScore = { gte: parseInt(minAuthority) }
    }
    if (maxSpam) {
      where.spamScore = { lte: parseInt(maxSpam) }
    }

    // Build order by
    const validSortFields = ['authorityScore', 'spamScore', 'firstSeen', 'lastSeen', 'sourceDomain']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'authorityScore'
    const orderBy = { [sortField]: sortOrder === 'asc' ? 'asc' as const : 'desc' as const }

    const [backlinks, total] = await Promise.all([
      db.backlink.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.backlink.count({ where }),
    ])

    // Calculate stats from all backlinks (not just paginated)
    const allBacklinks = await db.backlink.findMany({ where: { projectId: resolvedProjectId } })
    const activeBacklinks = allBacklinks.filter(b => b.status === 'active')
    const lostBacklinks = allBacklinks.filter(b => b.status === 'lost')
    const followLinks = activeBacklinks.filter(b => b.isFollow)
    const nofollowLinks = activeBacklinks.filter(b => !b.isFollow)

    // Referring domains
    const domainMap = new Map<string, { count: number; avgAuthority: number; authorities: number[] }>()
    for (const bl of allBacklinks) {
      const existing = domainMap.get(bl.sourceDomain)
      if (existing) {
        existing.count++
        if (bl.authorityScore) existing.authorities.push(bl.authorityScore)
      } else {
        domainMap.set(bl.sourceDomain, {
          count: 1,
          avgAuthority: bl.authorityScore ?? 0,
          authorities: bl.authorityScore ? [bl.authorityScore] : [],
        })
      }
    }

    // Recalculate avg authority for domains
    for (const [, val] of domainMap) {
      if (val.authorities.length > 0) {
        val.avgAuthority = Math.round(val.authorities.reduce((a, b) => a + b, 0) / val.authorities.length)
      }
    }

    // Top domains by authority
    const topDomains = [...domainMap.entries()]
      .sort((a, b) => b[1].avgAuthority - a[1].avgAuthority)
      .slice(0, 10)
      .map(([domain, data]) => ({
        domain,
        backlinkCount: data.count,
        avgAuthority: data.avgAuthority,
      }))

    // Authority distribution
    const authorityDistribution = {
      '90-100': activeBacklinks.filter(b => (b.authorityScore ?? 0) >= 90).length,
      '70-89': activeBacklinks.filter(b => (b.authorityScore ?? 0) >= 70 && (b.authorityScore ?? 0) < 90).length,
      '50-69': activeBacklinks.filter(b => (b.authorityScore ?? 0) >= 50 && (b.authorityScore ?? 0) < 70).length,
      '30-49': activeBacklinks.filter(b => (b.authorityScore ?? 0) >= 30 && (b.authorityScore ?? 0) < 50).length,
      '0-29': activeBacklinks.filter(b => (b.authorityScore ?? 0) < 30).length,
    }

    // New/lost this month
    const now = new Date()
    const oneMonthAgo = new Date(now)
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

    const newThisMonth = activeBacklinks.filter(b => b.firstSeen >= oneMonthAgo).length
    const lostThisMonth = lostBacklinks.filter(b => b.lastSeen >= oneMonthAgo).length

    // Average metrics
    const avgAuthority = activeBacklinks.length > 0
      ? Math.round(activeBacklinks.reduce((sum, b) => sum + (b.authorityScore ?? 0), 0) / activeBacklinks.length)
      : 0
    const avgSpamScore = activeBacklinks.length > 0
      ? Math.round(activeBacklinks.reduce((sum, b) => sum + (b.spamScore ?? 0), 0) / activeBacklinks.length * 10) / 10
      : 0

    return NextResponse.json({
      backlinks: backlinks.map(bl => ({
        id: bl.id,
        sourceDomain: bl.sourceDomain,
        sourceUrl: bl.sourceUrl,
        targetUrl: bl.targetUrl,
        anchorText: bl.anchorText,
        linkType: bl.linkType,
        isFollow: bl.isFollow,
        authorityScore: bl.authorityScore,
        spamScore: bl.spamScore,
        status: bl.status,
        firstSeen: bl.firstSeen,
        lastSeen: bl.lastSeen,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        total: allBacklinks.length,
        active: activeBacklinks.length,
        lost: lostBacklinks.length,
        follow: followLinks.length,
        nofollow: nofollowLinks.length,
        followRatio: activeBacklinks.length > 0
          ? Math.round((followLinks.length / activeBacklinks.length) * 100)
          : 0,
        referringDomains: domainMap.size,
        newThisMonth,
        lostThisMonth,
        avgAuthority,
        avgSpamScore,
        authorityDistribution,
        topDomains,
      },
    })
  } catch (error) {
    console.error('Backlinks GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
