import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/seo/audits - Get audit data with issues
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const auditId = searchParams.get('auditId')

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
    }

    // Resolve "first" or "default" to the actual first project ID
    let resolvedProjectId = projectId
    if (projectId === 'first' || projectId === 'default') {
      const firstProject = await db.project.findFirst({ orderBy: { createdAt: 'asc' } })
      if (!firstProject) {
        return NextResponse.json({ audits: [], scoreTrend: [], latestAudit: null })
      }
      resolvedProjectId = firstProject.id
    }

    // If specific audit requested
    if (auditId) {
      const audit = await db.siteAudit.findUnique({
        where: { id: auditId },
        include: {
          issues: {
            orderBy: [
              { severity: 'asc' }, // critical first (alphabetical: critical < high < info < low < medium)
            ],
          },
        },
      })

      if (!audit || audit.projectId !== resolvedProjectId) {
        return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
      }

      const issuesByCategory = groupIssues(audit.issues)
      const issuesBySeverity = groupBySeverity(audit.issues)

      return NextResponse.json({
        audit: {
          id: audit.id,
          score: audit.score,
          totalPages: audit.totalPages,
          status: audit.status,
          createdAt: audit.createdAt,
        },
        issues: audit.issues,
        issuesByCategory,
        issuesBySeverity,
        totalIssues: audit.issues.length,
      })
    }

    // Get all audits for the project
    const audits = await db.siteAudit.findMany({
      where: { projectId: resolvedProjectId },
      orderBy: { createdAt: 'desc' },
      include: {
        issues: true,
      },
    })

    if (audits.length === 0) {
      return NextResponse.json({ audits: [], scoreTrend: [], latestAudit: null })
    }

    const latestAudit = audits[0]

    // Issues breakdown for latest audit
    const latestIssuesByCategory = groupIssues(latestAudit.issues)
    const latestIssuesBySeverity = groupBySeverity(latestAudit.issues)

    // Issue category breakdown across all audits
    const allIssues = audits.flatMap(a => a.issues)
    const overallCategoryBreakdown = groupIssues(allIssues)
    const overallSeverityBreakdown = groupBySeverity(allIssues)

    // Score trend
    const scoreTrend = audits
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map(a => ({
        date: a.createdAt.toISOString().split('T')[0],
        score: a.score,
        totalIssues: a.issues.length,
        criticalIssues: a.issues.filter(i => i.severity === 'critical').length,
      }))

    // Audit comparison (latest vs previous)
    const previousAudit = audits.length > 1 ? audits[1] : null
    const scoreChange = previousAudit ? latestAudit.score - previousAudit.score : null
    const issuesChange = previousAudit ? latestAudit.issues.length - previousAudit.issues.length : null

    // Issue status breakdown for latest audit
    const issueStatusBreakdown = {
      open: latestAudit.issues.filter(i => i.status === 'open').length,
      inProgress: latestAudit.issues.filter(i => i.status === 'in-progress').length,
      resolved: latestAudit.issues.filter(i => i.status === 'resolved').length,
    }

    return NextResponse.json({
      audits: audits.map(a => ({
        id: a.id,
        score: a.score,
        totalPages: a.totalPages,
        status: a.status,
        createdAt: a.createdAt,
        issueCount: a.issues.length,
        criticalCount: a.issues.filter(i => i.severity === 'critical').length,
      })),
      latestAudit: {
        id: latestAudit.id,
        score: latestAudit.score,
        totalPages: latestAudit.totalPages,
        status: latestAudit.status,
        createdAt: latestAudit.createdAt,
        issues: latestAudit.issues,
        issuesByCategory: latestIssuesByCategory,
        issuesBySeverity: latestIssuesBySeverity,
        issueStatusBreakdown,
      },
      comparison: {
        scoreChange,
        issuesChange,
        previousScore: previousAudit?.score ?? null,
      },
      overallBreakdown: {
        byCategory: overallCategoryBreakdown,
        bySeverity: overallSeverityBreakdown,
      },
      scoreTrend,
    })
  } catch (error) {
    console.error('Audits GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function groupIssues(issues: { category: string; severity: string }[]) {
  const categories: Record<string, { count: number; critical: number; high: number; medium: number; low: number; info: number }> = {}

  for (const issue of issues) {
    if (!categories[issue.category]) {
      categories[issue.category] = { count: 0, critical: 0, high: 0, medium: 0, low: 0, info: 0 }
    }
    categories[issue.category].count++
    if (issue.severity === 'critical') categories[issue.category].critical++
    else if (issue.severity === 'high') categories[issue.category].high++
    else if (issue.severity === 'medium') categories[issue.category].medium++
    else if (issue.severity === 'low') categories[issue.category].low++
    else if (issue.severity === 'info') categories[issue.category].info++
  }

  return categories
}

function groupBySeverity(issues: { severity: string }[]) {
  return {
    critical: issues.filter(i => i.severity === 'critical').length,
    high: issues.filter(i => i.severity === 'high').length,
    medium: issues.filter(i => i.severity === 'medium').length,
    low: issues.filter(i => i.severity === 'low').length,
    info: issues.filter(i => i.severity === 'info').length,
  }
}
