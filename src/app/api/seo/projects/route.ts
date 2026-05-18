import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const projects = await db.project.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        domain: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        audits: {
          where: { status: 'completed' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { score: true },
        },
      },
    })

    // Flatten audit score into each project
    const enriched = projects.map((p) => ({
      id: p.id,
      name: p.name,
      domain: p.domain,
      isActive: p.isActive,
      seoScore: p.audits.length > 0 ? p.audits[0].score : null,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }))

    return NextResponse.json({ projects: enriched })
  } catch (error) {
    console.error('Projects GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    // SQLite cascade deletes all related models: keywords, audits, backlinks, competitors, alerts
    await db.project.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully',
    })
  } catch (error) {
    console.error('Project DELETE error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
