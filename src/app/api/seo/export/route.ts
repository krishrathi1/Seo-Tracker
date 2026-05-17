import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/seo/export - Export SEO data as CSV or PDF-like JSON
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const format = searchParams.get('format') || 'csv'
    const exportModule = searchParams.get('module') || 'dashboard'

    const validFormats = ['csv', 'pdf']
    if (!validFormats.includes(format)) {
      return NextResponse.json({ error: `Invalid format. Must be one of: ${validFormats.join(', ')}` }, { status: 400 })
    }

    const validModules = ['keywords', 'audit', 'backlinks', 'competitors', 'dashboard', 'full']
    if (!validModules.includes(exportModule)) {
      return NextResponse.json({ error: `Invalid module. Must be one of: ${validModules.join(', ')}` }, { status: 400 })
    }

    // Resolve project - support "first" as a fallback
    let project
    if (!projectId || projectId === 'first') {
      project = await db.project.findFirst({ orderBy: { createdAt: 'desc' } })
    } else {
      project = await db.project.findUnique({ where: { id: projectId } })
    }
    if (!project) {
      return NextResponse.json({ error: 'No project found. Please analyze a website first.' }, { status: 404 })
    }
    const resolvedProjectId = project.id

    // Fetch all needed data in parallel
    const [keywords, latestAudit, backlinks, competitors] = await Promise.all([
      db.keyword.findMany({ where: { projectId: resolvedProjectId, isActive: true } }),
      db.siteAudit.findFirst({
        where: { projectId: resolvedProjectId, status: 'completed' },
        orderBy: { createdAt: 'desc' },
        include: { issues: true },
      }),
      db.backlink.findMany({ where: { projectId: resolvedProjectId } }),
      db.competitor.findMany({ where: { projectId: resolvedProjectId } }),
    ])

    if (format === 'csv') {
      return exportCsv(project, exportModule, { keywords, latestAudit, backlinks, competitors })
    }

    // PDF format: return structured JSON for frontend printable view
    return exportPdfJson(project, exportModule, { keywords, latestAudit, backlinks, competitors })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// ─── CSV Export ────────────────────────────────────────────────────────

function escapeCsvField(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function csvRow(fields: unknown[]): string {
  return fields.map(escapeCsvField).join(',')
}

function generateKeywordsCsv(keywords: { keyword: string; currentRank: number | null; previousRank: number | null; searchVolume: number | null; difficulty: number | null; cpc: number | null; url: string | null; group: string | null; tag: string | null }[]): string {
  const header = csvRow(['keyword', 'currentRank', 'previousRank', 'searchVolume', 'difficulty', 'cpc', 'url', 'group', 'tag'])
  const rows = keywords.map(k => csvRow([k.keyword, k.currentRank, k.previousRank, k.searchVolume, k.difficulty, k.cpc, k.url, k.group, k.tag]))
  return [header, ...rows].join('\n')
}

function generateAuditCsv(issues: { category: string; severity: string; title: string; description: string | null; url: string | null; status: string }[]): string {
  const header = csvRow(['category', 'severity', 'title', 'description', 'url', 'status'])
  const rows = issues.map(i => csvRow([i.category, i.severity, i.title, i.description, i.url, i.status]))
  return [header, ...rows].join('\n')
}

function generateBacklinksCsv(backlinks: { sourceDomain: string; sourceUrl: string; targetUrl: string; anchorText: string | null; linkType: string; isFollow: boolean; authorityScore: number | null; spamScore: number | null; status: string }[]): string {
  const header = csvRow(['sourceDomain', 'sourceUrl', 'targetUrl', 'anchorText', 'linkType', 'isFollow', 'authorityScore', 'spamScore', 'status'])
  const rows = backlinks.map(b => csvRow([b.sourceDomain, b.sourceUrl, b.targetUrl, b.anchorText, b.linkType, b.isFollow, b.authorityScore, b.spamScore, b.status]))
  return [header, ...rows].join('\n')
}

function generateCompetitorsCsv(competitors: { domain: string; authorityScore: number | null; organicKeywords: number | null; organicTraffic: number | null; backlinks: number | null }[]): string {
  const header = csvRow(['domain', 'authorityScore', 'organicKeywords', 'organicTraffic', 'backlinks'])
  const rows = competitors.map(c => csvRow([c.domain, c.authorityScore, c.organicKeywords, c.organicTraffic, c.backlinks]))
  return [header, ...rows].join('\n')
}

function generateDashboardCsv(
  project: { name: string; domain: string },
  keywords: { currentRank: number | null; previousRank: number | null; searchVolume: number | null }[],
  latestAudit: { score: number; totalPages: number; issues: { severity: string }[] } | null,
  backlinks: { status: string; isFollow: boolean; sourceDomain: string }[],
  competitors: { domain: string }[]
): string {
  const activeBacklinks = backlinks.filter(b => b.status === 'active')
  const followLinks = activeBacklinks.filter(b => b.isFollow)
  const referringDomains = new Set(backlinks.map(b => b.sourceDomain)).size
  const keywordsWithRank = keywords.filter(k => k.currentRank !== null)
  const avgRank = keywordsWithRank.length > 0
    ? (keywordsWithRank.reduce((s, k) => s + (k.currentRank ?? 0), 0) / keywordsWithRank.length).toFixed(1)
    : 'N/A'
  const totalImproved = keywords.filter(k => k.currentRank && k.previousRank && k.currentRank < k.previousRank).length
  const totalDeclined = keywords.filter(k => k.currentRank && k.previousRank && k.currentRank > k.previousRank).length

  const header = csvRow(['metric', 'value'])
  const rows = [
    csvRow(['Project Name', project.name]),
    csvRow(['Domain', project.domain]),
    csvRow(['SEO Health Score', latestAudit?.score ?? 0]),
    csvRow(['Total Keywords', keywords.length]),
    csvRow(['Average Rank', avgRank]),
    csvRow(['Keywords Improved', totalImproved]),
    csvRow(['Keywords Declined', totalDeclined]),
    csvRow(['Total Backlinks', activeBacklinks.length]),
    csvRow(['Referring Domains', referringDomains]),
    csvRow(['Follow Ratio', activeBacklinks.length > 0 ? Math.round((followLinks.length / activeBacklinks.length) * 100) + '%' : '0%']),
    csvRow(['Audit Score', latestAudit?.score ?? 'N/A']),
    csvRow(['Total Pages Audited', latestAudit?.totalPages ?? 'N/A']),
    csvRow(['Critical Issues', latestAudit ? latestAudit.issues.filter(i => i.severity === 'critical').length : 0]),
    csvRow(['High Issues', latestAudit ? latestAudit.issues.filter(i => i.severity === 'high').length : 0]),
    csvRow(['Medium Issues', latestAudit ? latestAudit.issues.filter(i => i.severity === 'medium').length : 0]),
    csvRow(['Low Issues', latestAudit ? latestAudit.issues.filter(i => i.severity === 'low').length : 0]),
    csvRow(['Info Issues', latestAudit ? latestAudit.issues.filter(i => i.severity === 'info').length : 0]),
    csvRow(['Competitors Tracked', competitors.length]),
  ]
  return [header, ...rows].join('\n')
}

function exportCsv(
  project: { id: string; name: string; domain: string },
  module: string,
  data: {
    keywords: { keyword: string; currentRank: number | null; previousRank: number | null; searchVolume: number | null; difficulty: number | null; cpc: number | null; url: string | null; group: string | null; tag: string | null }[]
    latestAudit: { score: number; totalPages: number; issues: { category: string; severity: string; title: string; description: string | null; url: string | null; status: string }[] } | null
    backlinks: { sourceDomain: string; sourceUrl: string; targetUrl: string; anchorText: string | null; linkType: string; isFollow: boolean; authorityScore: number | null; spamScore: number | null; status: string }[]
    competitors: { domain: string; authorityScore: number | null; organicKeywords: number | null; organicTraffic: number | null; backlinks: number | null }[]
  }
) {
  let csvContent = ''
  let filename = ''

  switch (module) {
    case 'keywords':
      csvContent = generateKeywordsCsv(data.keywords)
      filename = `rankpulse-keywords-${project.domain}-${new Date().toISOString().split('T')[0]}.csv`
      break

    case 'audit':
      csvContent = data.latestAudit
        ? generateAuditCsv(data.latestAudit.issues)
        : 'category,severity,title,description,url,status\nNo audit data available'
      filename = `rankpulse-audit-${project.domain}-${new Date().toISOString().split('T')[0]}.csv`
      break

    case 'backlinks':
      csvContent = generateBacklinksCsv(data.backlinks)
      filename = `rankpulse-backlinks-${project.domain}-${new Date().toISOString().split('T')[0]}.csv`
      break

    case 'competitors':
      csvContent = generateCompetitorsCsv(data.competitors)
      filename = `rankpulse-competitors-${project.domain}-${new Date().toISOString().split('T')[0]}.csv`
      break

    case 'dashboard':
      csvContent = generateDashboardCsv(
        project,
        data.keywords,
        data.latestAudit,
        data.backlinks,
        data.competitors
      )
      filename = `rankpulse-dashboard-${project.domain}-${new Date().toISOString().split('T')[0]}.csv`
      break

    case 'full': {
      const sections: string[] = []
      sections.push('=== DASHBOARD SUMMARY ===')
      sections.push(generateDashboardCsv(project, data.keywords, data.latestAudit, data.backlinks, data.competitors))
      sections.push('')
      sections.push('=== KEYWORDS ===')
      sections.push(generateKeywordsCsv(data.keywords))
      sections.push('')
      sections.push('=== AUDIT ISSUES ===')
      sections.push(data.latestAudit ? generateAuditCsv(data.latestAudit.issues) : 'No audit data available')
      sections.push('')
      sections.push('=== BACKLINKS ===')
      sections.push(generateBacklinksCsv(data.backlinks))
      sections.push('')
      sections.push('=== COMPETITORS ===')
      sections.push(generateCompetitorsCsv(data.competitors))

      csvContent = sections.join('\n')
      filename = `rankpulse-full-report-${project.domain}-${new Date().toISOString().split('T')[0]}.csv`
      break
    }

    default:
      return NextResponse.json({ error: 'Invalid module' }, { status: 400 })
  }

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

// ─── PDF-like JSON Export ──────────────────────────────────────────────

function exportPdfJson(
  project: { id: string; name: string; domain: string },
  module: string,
  data: {
    keywords: { keyword: string; currentRank: number | null; previousRank: number | null; searchVolume: number | null; difficulty: number | null; cpc: number | null; url: string | null; group: string | null; tag: string | null }[]
    latestAudit: { score: number; totalPages: number; issues: { category: string; severity: string; title: string; description: string | null; url: string | null; status: string }[] } | null
    backlinks: { sourceDomain: string; sourceUrl: string; targetUrl: string; anchorText: string | null; linkType: string; isFollow: boolean; authorityScore: number | null; spamScore: number | null; status: string }[]
    competitors: { domain: string; authorityScore: number | null; organicKeywords: number | null; organicTraffic: number | null; backlinks: number | null }[]
  }
) {
  const now = new Date().toISOString()
  const activeBacklinks = data.backlinks.filter(b => b.status === 'active')
  const followLinks = activeBacklinks.filter(b => b.isFollow)
  const referringDomains = new Set(data.backlinks.map(b => b.sourceDomain)).size
  const keywordsWithRank = data.keywords.filter(k => k.currentRank !== null)
  const avgRank = keywordsWithRank.length > 0
    ? Math.round((keywordsWithRank.reduce((s, k) => s + (k.currentRank ?? 0), 0) / keywordsWithRank.length) * 10) / 10
    : 0

  const reportBase = {
    meta: {
      projectName: project.name,
      domain: project.domain,
      generatedAt: now,
      reportType: module,
    },
  }

  let report: Record<string, unknown> = { ...reportBase }

  switch (module) {
    case 'keywords':
      report = {
        ...reportBase,
        title: 'Keyword Ranking Report',
        sections: [
          {
            title: 'Keyword Overview',
            summary: {
              totalKeywords: data.keywords.length,
              averageRank: avgRank,
              top3: data.keywords.filter(k => k.currentRank && k.currentRank <= 3).length,
              top10: data.keywords.filter(k => k.currentRank && k.currentRank > 3 && k.currentRank <= 10).length,
              top20: data.keywords.filter(k => k.currentRank && k.currentRank > 10 && k.currentRank <= 20).length,
            },
          },
          {
            title: 'Keyword Details',
            type: 'table',
            columns: ['Keyword', 'Current Rank', 'Previous Rank', 'Search Volume', 'Difficulty', 'CPC', 'URL', 'Group', 'Tag'],
            rows: data.keywords.map(k => [k.keyword, k.currentRank ?? '-', k.previousRank ?? '-', k.searchVolume ?? '-', k.difficulty ?? '-', k.cpc ?? '-', k.url ?? '-', k.group ?? '-', k.tag ?? '-']),
          },
        ],
      }
      break

    case 'audit':
      report = {
        ...reportBase,
        title: 'Site Audit Report',
        sections: [
          {
            title: 'Audit Summary',
            summary: {
              auditScore: data.latestAudit?.score ?? 0,
              totalPages: data.latestAudit?.totalPages ?? 0,
              totalIssues: data.latestAudit?.issues.length ?? 0,
              critical: data.latestAudit?.issues.filter(i => i.severity === 'critical').length ?? 0,
              high: data.latestAudit?.issues.filter(i => i.severity === 'high').length ?? 0,
              medium: data.latestAudit?.issues.filter(i => i.severity === 'medium').length ?? 0,
              low: data.latestAudit?.issues.filter(i => i.severity === 'low').length ?? 0,
              info: data.latestAudit?.issues.filter(i => i.severity === 'info').length ?? 0,
            },
          },
          {
            title: 'Issue Details',
            type: 'table',
            columns: ['Category', 'Severity', 'Title', 'Description', 'URL', 'Status'],
            rows: (data.latestAudit?.issues ?? []).map(i => [i.category, i.severity, i.title, i.description ?? '-', i.url ?? '-', i.status]),
          },
        ],
      }
      break

    case 'backlinks':
      report = {
        ...reportBase,
        title: 'Backlink Profile Report',
        sections: [
          {
            title: 'Backlink Summary',
            summary: {
              totalBacklinks: activeBacklinks.length,
              referringDomains,
              followLinks: followLinks.length,
              nofollowLinks: activeBacklinks.length - followLinks.length,
              followRatio: activeBacklinks.length > 0 ? Math.round((followLinks.length / activeBacklinks.length) * 100) : 0,
            },
          },
          {
            title: 'Backlink Details',
            type: 'table',
            columns: ['Source Domain', 'Source URL', 'Target URL', 'Anchor Text', 'Link Type', 'Follow', 'Authority', 'Spam Score', 'Status'],
            rows: data.backlinks.map(b => [b.sourceDomain, b.sourceUrl, b.targetUrl, b.anchorText ?? '-', b.linkType, b.isFollow ? 'Yes' : 'No', b.authorityScore ?? '-', b.spamScore ?? '-', b.status]),
          },
        ],
      }
      break

    case 'competitors':
      report = {
        ...reportBase,
        title: 'Competitor Analysis Report',
        sections: [
          {
            title: 'Competitor Overview',
            summary: {
              competitorsTracked: data.competitors.length,
              averageAuthority: data.competitors.length > 0
                ? Math.round(data.competitors.reduce((s, c) => s + (c.authorityScore ?? 0), 0) / data.competitors.length)
                : 0,
            },
          },
          {
            title: 'Competitor Details',
            type: 'table',
            columns: ['Domain', 'Authority Score', 'Organic Keywords', 'Organic Traffic', 'Backlinks'],
            rows: data.competitors.map(c => [c.domain, c.authorityScore ?? '-', c.organicKeywords ?? '-', c.organicTraffic ?? '-', c.backlinks ?? '-']),
          },
        ],
      }
      break

    case 'dashboard':
      report = {
        ...reportBase,
        title: 'SEO Dashboard Report',
        sections: [
          {
            title: 'Key Metrics',
            metrics: {
              healthScore: data.latestAudit?.score ?? 0,
              totalKeywords: data.keywords.length,
              averageRank: avgRank,
              totalBacklinks: activeBacklinks.length,
              referringDomains,
              followRatio: activeBacklinks.length > 0 ? Math.round((followLinks.length / activeBacklinks.length) * 100) : 0,
              auditScore: data.latestAudit?.score ?? 0,
              criticalIssues: data.latestAudit?.issues.filter(i => i.severity === 'critical').length ?? 0,
              competitorsTracked: data.competitors.length,
            },
          },
        ],
      }
      break

    case 'full':
      report = {
        ...reportBase,
        title: 'Complete SEO Report',
        sections: [
          {
            title: 'Dashboard Summary',
            metrics: {
              healthScore: data.latestAudit?.score ?? 0,
              totalKeywords: data.keywords.length,
              averageRank: avgRank,
              totalBacklinks: activeBacklinks.length,
              referringDomains,
              followRatio: activeBacklinks.length > 0 ? Math.round((followLinks.length / activeBacklinks.length) * 100) : 0,
              auditScore: data.latestAudit?.score ?? 0,
              criticalIssues: data.latestAudit?.issues.filter(i => i.severity === 'critical').length ?? 0,
              competitorsTracked: data.competitors.length,
            },
          },
          {
            title: 'Keyword Rankings',
            type: 'table',
            columns: ['Keyword', 'Current Rank', 'Previous Rank', 'Search Volume', 'Difficulty', 'CPC', 'URL', 'Group', 'Tag'],
            rows: data.keywords.map(k => [k.keyword, k.currentRank ?? '-', k.previousRank ?? '-', k.searchVolume ?? '-', k.difficulty ?? '-', k.cpc ?? '-', k.url ?? '-', k.group ?? '-', k.tag ?? '-']),
          },
          {
            title: 'Site Audit',
            summary: {
              auditScore: data.latestAudit?.score ?? 0,
              totalPages: data.latestAudit?.totalPages ?? 0,
              totalIssues: data.latestAudit?.issues.length ?? 0,
              critical: data.latestAudit?.issues.filter(i => i.severity === 'critical').length ?? 0,
              high: data.latestAudit?.issues.filter(i => i.severity === 'high').length ?? 0,
              medium: data.latestAudit?.issues.filter(i => i.severity === 'medium').length ?? 0,
              low: data.latestAudit?.issues.filter(i => i.severity === 'low').length ?? 0,
              info: data.latestAudit?.issues.filter(i => i.severity === 'info').length ?? 0,
            },
            type: 'table',
            columns: ['Category', 'Severity', 'Title', 'Description', 'URL', 'Status'],
            rows: (data.latestAudit?.issues ?? []).map(i => [i.category, i.severity, i.title, i.description ?? '-', i.url ?? '-', i.status]),
          },
          {
            title: 'Backlink Profile',
            summary: {
              totalBacklinks: activeBacklinks.length,
              referringDomains,
              followLinks: followLinks.length,
              nofollowLinks: activeBacklinks.length - followLinks.length,
            },
            type: 'table',
            columns: ['Source Domain', 'Source URL', 'Target URL', 'Anchor Text', 'Link Type', 'Follow', 'Authority', 'Spam Score', 'Status'],
            rows: data.backlinks.map(b => [b.sourceDomain, b.sourceUrl, b.targetUrl, b.anchorText ?? '-', b.linkType, b.isFollow ? 'Yes' : 'No', b.authorityScore ?? '-', b.spamScore ?? '-', b.status]),
          },
          {
            title: 'Competitor Analysis',
            type: 'table',
            columns: ['Domain', 'Authority Score', 'Organic Keywords', 'Organic Traffic', 'Backlinks'],
            rows: data.competitors.map(c => [c.domain, c.authorityScore ?? '-', c.organicKeywords ?? '-', c.organicTraffic ?? '-', c.backlinks ?? '-']),
          },
        ],
      }
      break
  }

  return NextResponse.json(report, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `inline; filename="rankpulse-${module}-report-${project.domain}-${new Date().toISOString().split('T')[0]}.json"`,
    },
  })
}
