import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/seo/keywords - List keywords with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const search = searchParams.get('search')
    const group = searchParams.get('group')
    const tag = searchParams.get('tag')
    const device = searchParams.get('device')
    const searchEngine = searchParams.get('searchEngine')
    const minRank = searchParams.get('minRank')
    const maxRank = searchParams.get('maxRank')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const sortBy = searchParams.get('sortBy') || 'keyword'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
    }

    // Build where clause
    const where: Prisma.KeywordWhereInput = { projectId, isActive: true }

    if (search) {
      where.keyword = { contains: search }
    }
    if (group) {
      where.group = group
    }
    if (tag) {
      where.tag = tag
    }
    if (device) {
      where.device = device
    }
    if (searchEngine) {
      where.searchEngine = searchEngine
    }
    if (minRank || maxRank) {
      const rankFilter: Record<string, number> = {}
      if (minRank) rankFilter.gte = parseInt(minRank)
      if (maxRank) rankFilter.lte = parseInt(maxRank)
      where.currentRank = rankFilter
    }

    // Build order by
    const validSortFields = ['keyword', 'searchVolume', 'difficulty', 'cpc', 'currentRank']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'keyword'
    const orderBy = { [sortField]: sortOrder === 'desc' ? 'desc' as const : 'asc' as const }

    const [keywords, total] = await Promise.all([
      db.keyword.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          rankHistory: {
            orderBy: { date: 'desc' },
            take: 7, // last 7 days for mini sparkline
          },
        },
      }),
      db.keyword.count({ where }),
    ])

    // Get groups and tags for filter options
    const [groups, tags] = await Promise.all([
      db.keyword.findMany({
        where: { projectId, isActive: true, group: { not: null } },
        select: { group: true },
        distinct: ['group'],
      }),
      db.keyword.findMany({
        where: { projectId, isActive: true, tag: { not: null } },
        select: { tag: true },
        distinct: ['tag'],
      }),
    ])

    // Calculate position change for each keyword
    const enrichedKeywords = keywords.map(k => {
      const change = k.currentRank && k.previousRank ? k.previousRank - k.currentRank : null
      const changeType = change && change > 0 ? 'improved' : change && change < 0 ? 'declined' : change === 0 ? 'stable' : 'new'

      return {
        id: k.id,
        keyword: k.keyword,
        searchEngine: k.searchEngine,
        device: k.device,
        location: k.location,
        currentRank: k.currentRank,
        previousRank: k.previousRank,
        bestRank: k.bestRank,
        worstRank: k.worstRank,
        searchVolume: k.searchVolume,
        difficulty: k.difficulty,
        cpc: k.cpc,
        url: k.url,
        tag: k.tag,
        group: k.group,
        change,
        changeType,
        sparkline: k.rankHistory
          .sort((a, b) => a.date.getTime() - b.date.getTime())
          .map(r => r.rank),
      }
    })

    return NextResponse.json({
      keywords: enrichedKeywords,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        groups: groups.map(g => g.group).filter(Boolean),
        tags: tags.map(t => t.tag).filter(Boolean),
      },
    })
  } catch (error) {
    console.error('Keywords GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST /api/seo/keywords - Add new keyword
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, keyword, searchEngine, device, location, tag, group, url } = body

    if (!projectId || !keyword) {
      return NextResponse.json(
        { error: 'projectId and keyword are required' },
        { status: 400 }
      )
    }

    // Check if keyword already exists for this project
    const existing = await db.keyword.findFirst({
      where: { projectId, keyword, searchEngine: searchEngine || 'google' },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Keyword already exists for this project' },
        { status: 409 }
      )
    }

    const newKeyword = await db.keyword.create({
      data: {
        projectId,
        keyword,
        searchEngine: searchEngine || 'google',
        device: device || 'desktop',
        location: location || 'us',
        tag,
        group,
        url,
        isActive: true,
      },
    })

    return NextResponse.json({ keyword: newKeyword }, { status: 201 })
  } catch (error) {
    console.error('Keywords POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
