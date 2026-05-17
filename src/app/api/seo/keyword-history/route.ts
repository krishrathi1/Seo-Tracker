import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/seo/keyword-history?keywordId=xxx&days=90
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const keywordId = searchParams.get('keywordId')
    const days = parseInt(searchParams.get('days') || '90')

    if (!keywordId) {
      return NextResponse.json({ error: 'keywordId is required' }, { status: 400 })
    }

    const keyword = await db.keyword.findUnique({
      where: { id: keywordId },
    })

    if (!keyword) {
      return NextResponse.json({ error: 'Keyword not found' }, { status: 404 })
    }

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const rankHistory = await db.keywordRank.findMany({
      where: {
        keywordId,
        date: { gte: cutoffDate },
      },
      orderBy: { date: 'asc' },
    })

    const history = rankHistory.map((r) => ({
      date: r.date.toISOString().split('T')[0],
      rank: r.rank,
    }))

    return NextResponse.json({
      keyword: {
        id: keyword.id,
        keyword: keyword.keyword,
        currentRank: keyword.currentRank,
        previousRank: keyword.previousRank,
        bestRank: keyword.bestRank,
        worstRank: keyword.worstRank,
        searchVolume: keyword.searchVolume,
        difficulty: keyword.difficulty,
        url: keyword.url,
      },
      history,
    })
  } catch (error) {
    console.error('Keyword history GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
