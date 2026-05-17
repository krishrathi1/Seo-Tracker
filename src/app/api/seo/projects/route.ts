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
      },
    })

    return NextResponse.json({ projects })
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
