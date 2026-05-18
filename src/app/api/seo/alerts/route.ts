import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/seo/alerts - List alerts with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const severity = searchParams.get('severity')
    const isRead = searchParams.get('isRead')
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

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

    // Build where clause
    const where: Record<string, unknown> = { projectId: resolvedProjectId }

    if (severity) {
      where.severity = severity
    }
    if (isRead !== null && isRead !== undefined && isRead !== '') {
      where.isRead = isRead === 'true'
    }
    if (type) {
      where.type = type
    }

    const [alerts, total] = await Promise.all([
      db.alert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.alert.count({ where }),
    ])

    // Get counts by severity and read status
    const allAlerts = await db.alert.findMany({ where: { projectId: resolvedProjectId } })
    const unreadCount = allAlerts.filter(a => !a.isRead).length

    const severityCounts = {
      critical: allAlerts.filter(a => a.severity === 'critical').length,
      high: allAlerts.filter(a => a.severity === 'high').length,
      medium: allAlerts.filter(a => a.severity === 'medium').length,
      low: allAlerts.filter(a => a.severity === 'low').length,
      info: allAlerts.filter(a => a.severity === 'info').length,
    }

    const typeCounts: Record<string, number> = {}
    for (const a of allAlerts) {
      typeCounts[a.type] = (typeCounts[a.type] || 0) + 1
    }

    return NextResponse.json({
      alerts: alerts.map(a => ({
        id: a.id,
        type: a.type,
        severity: a.severity,
        title: a.title,
        message: a.message,
        isRead: a.isRead,
        createdAt: a.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        total: allAlerts.length,
        unread: unreadCount,
        severityCounts,
        typeCounts,
      },
    })
  } catch (error) {
    console.error('Alerts GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PATCH /api/seo/alerts - Mark alerts as read
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { alertIds, markAll, projectId } = body

    if (markAll && projectId) {
      // Resolve "first" to the actual first project ID
      let resolvedId = projectId
      if (projectId === 'first') {
        const firstProject = await db.project.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'asc' } })
        if (!firstProject) {
          return NextResponse.json({ error: 'No active project found' }, { status: 404 })
        }
        resolvedId = firstProject.id
      }

      // Mark all alerts as read for a project
      await db.alert.updateMany({
        where: { projectId: resolvedId, isRead: false },
        data: { isRead: true },
      })

      return NextResponse.json({ success: true, message: 'All alerts marked as read' })
    }

    if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
      return NextResponse.json(
        { error: 'alertIds array is required, or use markAll with projectId' },
        { status: 400 }
      )
    }

    await db.alert.updateMany({
      where: { id: { in: alertIds } },
      data: { isRead: true },
    })

    return NextResponse.json({ success: true, message: `${alertIds.length} alert(s) marked as read` })
  } catch (error) {
    console.error('Alerts PATCH error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
