import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// ─── Helpers ──────────────────────────────────────────────────────────────

function getGrade(score: number): string {
  if (score >= 90) return 'A+'
  if (score >= 80) return 'A'
  if (score >= 70) return 'B'
  if (score >= 60) return 'C'
  if (score >= 40) return 'D'
  return 'F'
}

function getLcpStatus(value: number): 'good' | 'needs-improvement' | 'poor' {
  if (value < 2.5) return 'good'
  if (value <= 4.0) return 'needs-improvement'
  return 'poor'
}

function getFidStatus(value: number): 'good' | 'needs-improvement' | 'poor' {
  if (value < 100) return 'good'
  if (value <= 300) return 'needs-improvement'
  return 'poor'
}

function getClsStatus(value: number): 'good' | 'needs-improvement' | 'poor' {
  if (value < 0.1) return 'good'
  if (value <= 0.25) return 'needs-improvement'
  return 'poor'
}

function getMetricStatus(
  metric: 'fcp' | 'ttfb' | 'tbt' | 'speedIndex',
  value: number
): string {
  switch (metric) {
    case 'fcp':
      if (value < 1.8) return 'good'
      if (value <= 3.0) return 'needs-improvement'
      return 'poor'
    case 'ttfb':
      if (value < 200) return 'good'
      if (value <= 500) return 'needs-improvement'
      return 'poor'
    case 'tbt':
      if (value < 200) return 'good'
      if (value <= 600) return 'needs-improvement'
      return 'poor'
    case 'speedIndex':
      if (value < 3.4) return 'good'
      if (value <= 5.8) return 'needs-improvement'
      return 'poor'
    default:
      return 'needs-improvement'
  }
}

// Deterministic pseudo-random from seed
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function seededRandomRange(seed: number, min: number, max: number): number {
  return Math.floor(seededRandom(seed) * (max - min + 1)) + min
}

// ─── Main Handler ─────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId') ?? 'first'

    // Resolve project
    let resolvedProjectId = projectId
    if (projectId === 'first' || projectId === 'default') {
      const firstProject = await db.project.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      })
      if (!firstProject) {
        return NextResponse.json(
          { error: 'No active project found' },
          { status: 404 }
        )
      }
      resolvedProjectId = firstProject.id
    }

    // Fetch project with latest audit
    const project = await db.project.findUnique({
      where: { id: resolvedProjectId },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const latestAudit = await db.siteAudit.findFirst({
      where: { projectId: resolvedProjectId, status: 'completed' },
      orderBy: { createdAt: 'desc' },
      include: { issues: true },
    })

    const auditScore = latestAudit?.score ?? 50
    const auditIssues = latestAudit?.issues ?? []

    // Analyze performance-specific issues
    const performanceIssues = auditIssues.filter(
      (i) => i.category === 'performance'
    )
    const perfCriticalCount = performanceIssues.filter(
      (i) => i.severity === 'critical'
    ).length
    const perfHighCount = performanceIssues.filter(
      (i) => i.severity === 'high'
    ).length
    const perfMediumCount = performanceIssues.filter(
      (i) => i.severity === 'medium'
    ).length

    // Use a seed derived from project ID for deterministic results
    const projectSeed = project.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)

    // ─── Derive Performance Score ───────────────────────────────────────
    // Base on audit score * 0.9 + small variance
    let performanceScore = Math.round(
      auditScore * 0.9 +
      seededRandom(projectSeed + 42) * 10 +
      5
    )

    // Penalize for performance issues
    performanceScore -= perfCriticalCount * 7
    performanceScore -= perfHighCount * 4
    performanceScore -= perfMediumCount * 2

    // Add some controlled randomness
    performanceScore += seededRandomRange(projectSeed + 99, -3, 5)

    performanceScore = Math.max(0, Math.min(100, performanceScore))

    // ─── Core Web Vitals ────────────────────────────────────────────────
    // LCP: < 2.5s good, 2.5-4s needs-improvement, > 4s poor
    let lcpBase: number
    if (performanceScore >= 90) {
      lcpBase = 1.2 + seededRandom(projectSeed + 1) * 0.8 // 1.2-2.0
    } else if (performanceScore >= 70) {
      lcpBase = 2.0 + seededRandom(projectSeed + 1) * 1.5 // 2.0-3.5
    } else if (performanceScore >= 50) {
      lcpBase = 3.0 + seededRandom(projectSeed + 1) * 1.5 // 3.0-4.5
    } else {
      lcpBase = 4.0 + seededRandom(projectSeed + 1) * 2.0 // 4.0-6.0
    }

    // Adjust based on specific performance issues
    if (performanceIssues.some((i) => i.title.includes('Largest Contentful Paint'))) {
      lcpBase += 1.5
    }
    if (performanceIssues.some((i) => i.title.includes('Unoptimized images'))) {
      lcpBase += 0.5
    }
    if (performanceIssues.some((i) => i.title.includes('Render-blocking'))) {
      lcpBase += 0.4
    }

    const lcp = Math.round(lcpBase * 100) / 100

    // FID: < 100ms good, 100-300ms needs-improvement, > 300ms poor
    let fidBase: number
    if (performanceScore >= 90) {
      fidBase = 30 + seededRandom(projectSeed + 2) * 50 // 30-80
    } else if (performanceScore >= 70) {
      fidBase = 60 + seededRandom(projectSeed + 2) * 120 // 60-180
    } else if (performanceScore >= 50) {
      fidBase = 120 + seededRandom(projectSeed + 2) * 150 // 120-270
    } else {
      fidBase = 200 + seededRandom(projectSeed + 2) * 200 // 200-400
    }

    if (performanceIssues.some((i) => i.title.includes('Total Blocking Time') || i.title.includes('blocking'))) {
      fidBase += 80
    }

    const fid = Math.round(fidBase)

    // CLS: < 0.1 good, 0.1-0.25 needs-improvement, > 0.25 poor
    let clsBase: number
    if (performanceScore >= 90) {
      clsBase = 0.02 + seededRandom(projectSeed + 3) * 0.06 // 0.02-0.08
    } else if (performanceScore >= 70) {
      clsBase = 0.06 + seededRandom(projectSeed + 3) * 0.12 // 0.06-0.18
    } else if (performanceScore >= 50) {
      clsBase = 0.12 + seededRandom(projectSeed + 3) * 0.15 // 0.12-0.27
    } else {
      clsBase = 0.20 + seededRandom(projectSeed + 3) * 0.20 // 0.20-0.40
    }

    if (performanceIssues.some((i) => i.title.includes('Cumulative Layout Shift'))) {
      clsBase += 0.12
    }

    const cls = Math.round(clsBase * 100) / 100

    // Trends for core vitals (based on whether score is improving or not)
    const lcpTrend: 'up' | 'down' | 'stable' = lcp > 3 ? (seededRandom(projectSeed + 10) > 0.5 ? 'down' : 'stable') : 'stable'
    const fidTrend: 'up' | 'down' | 'stable' = fid > 200 ? (seededRandom(projectSeed + 11) > 0.5 ? 'down' : 'up') : 'stable'
    const clsTrend: 'up' | 'down' | 'stable' = cls > 0.2 ? (seededRandom(projectSeed + 12) > 0.5 ? 'down' : 'stable') : 'stable'

    const coreVitals = {
      lcp: {
        value: lcp,
        unit: 's',
        status: getLcpStatus(lcp),
        trend: lcpTrend,
      },
      fid: {
        value: fid,
        unit: 'ms',
        status: getFidStatus(fid),
        trend: fidTrend,
      },
      cls: {
        value: cls,
        unit: '',
        status: getClsStatus(cls),
        trend: clsTrend,
      },
    }

    // ─── Additional Metrics ─────────────────────────────────────────────
    // FCP
    let fcpBase = lcpBase * 0.65
    fcpBase += seededRandom(projectSeed + 4) * 0.3
    const fcp = Math.round(fcpBase * 100) / 100

    // TTFB
    let ttfbBase: number
    if (performanceScore >= 80) {
      ttfbBase = 80 + seededRandom(projectSeed + 5) * 120 // 80-200
    } else if (performanceScore >= 60) {
      ttfbBase = 150 + seededRandom(projectSeed + 5) * 250 // 150-400
    } else {
      ttfbBase = 300 + seededRandom(projectSeed + 5) * 400 // 300-700
    }
    const ttfb = Math.round(ttfbBase)

    // TBT
    let tbtBase: number
    if (performanceScore >= 80) {
      tbtBase = 50 + seededRandom(projectSeed + 6) * 100 // 50-150
    } else if (performanceScore >= 60) {
      tbtBase = 150 + seededRandom(projectSeed + 6) * 250 // 150-400
    } else {
      tbtBase = 350 + seededRandom(projectSeed + 6) * 350 // 350-700
    }
    const tbt = Math.round(tbtBase)

    // Speed Index
    let speedIndexBase: number
    if (performanceScore >= 80) {
      speedIndexBase = 1.5 + seededRandom(projectSeed + 7) * 1.2 // 1.5-2.7
    } else if (performanceScore >= 60) {
      speedIndexBase = 2.5 + seededRandom(projectSeed + 7) * 2.0 // 2.5-4.5
    } else {
      speedIndexBase = 4.0 + seededRandom(projectSeed + 7) * 2.5 // 4.0-6.5
    }
    const speedIndex = Math.round(speedIndexBase * 100) / 100

    // Page size and requests
    const totalPageSize = Math.round(
      (performanceScore >= 80 ? 1.2 : performanceScore >= 60 ? 2.5 : 4.0) +
      seededRandom(projectSeed + 8) * 1.5
    )
    const totalRequests = Math.round(
      (performanceScore >= 80 ? 30 : performanceScore >= 60 ? 60 : 90) +
      seededRandom(projectSeed + 9) * 30
    )

    const additionalMetrics = {
      fcp: {
        value: fcp,
        unit: 's',
        status: getMetricStatus('fcp', fcp),
      },
      ttfb: {
        value: ttfb,
        unit: 'ms',
        status: getMetricStatus('ttfb', ttfb),
      },
      tbt: {
        value: tbt,
        unit: 'ms',
        status: getMetricStatus('tbt', tbt),
      },
      speedIndex: {
        value: speedIndex,
        unit: 's',
        status: getMetricStatus('speedIndex', speedIndex),
      },
      totalPageSize: {
        value: totalPageSize,
        unit: 'MB',
      },
      totalRequests: {
        value: totalRequests,
        unit: 'requests',
      },
    }

    // ─── Trend Data (12 months) ─────────────────────────────────────────
    const trend: Array<{ date: string; score: number; lcp: number; cls: number }> = []
    const now = new Date()

    for (let monthOffset = 11; monthOffset >= 0; monthOffset--) {
      const date = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1)
      const dateStr = date.toISOString().split('T')[0]

      // Generate trending improvement over time
      const progressFactor = (11 - monthOffset) / 11 // 0 to 1 over time

      // Score trends upward
      const trendScore = Math.max(
        10,
        Math.min(100,
          Math.round(
            performanceScore * 0.6 + // current score weighted
            performanceScore * 0.4 * progressFactor + // trend towards current
            seededRandomRange(projectSeed + monthOffset * 3, -5, 5) // noise
          )
        )
      )

      // LCP trends downward (improving)
      const trendLcp = Math.round(
        Math.max(0.5,
          lcp * (1.3 - progressFactor * 0.3) +
          seededRandom(projectSeed + monthOffset * 3 + 1) * 0.5
        ) * 100
      ) / 100

      // CLS trends downward (improving)
      const trendCls = Math.round(
        Math.max(0.01,
          cls * (1.3 - progressFactor * 0.3) +
          seededRandom(projectSeed + monthOffset * 3 + 2) * 0.05
        ) * 100
      ) / 100

      trend.push({
        date: dateStr,
        score: trendScore,
        lcp: trendLcp,
        cls: trendCls,
      })
    }

    // ─── Page Performance ───────────────────────────────────────────────
    const pagePaths = [
      '/',
      '/project-management',
      '/crm-solutions',
      '/seo-tools',
      '/analytics',
      '/collaboration',
      '/automation',
      '/blog',
    ]

    const pagePerformance = pagePaths.map((path, idx) => {
      const seed = projectSeed + idx * 17
      // Homepage and key pages tend to be better optimized
      const pageMultiplier = idx === 0 ? 0.85 : idx <= 3 ? 0.9 : 1.0 + seededRandom(seed) * 0.3

      const pageScore = Math.max(
        0,
        Math.min(100, Math.round(performanceScore * (2 - pageMultiplier) + seededRandomRange(seed, -8, 8)))
      )

      const pageLcp = Math.round(
        Math.max(0.5, lcp * pageMultiplier + seededRandom(seed + 1) * 0.8) * 100
      ) / 100

      const pageFid = Math.round(
        Math.max(10, fid * pageMultiplier + seededRandomRange(seed + 2, -20, 20))
      )

      const pageCls = Math.round(
        Math.max(0.01, cls * pageMultiplier + seededRandom(seed + 3) * 0.08) * 100
      ) / 100

      return {
        url: `https://${project.domain}${path}`,
        score: pageScore,
        lcp: pageLcp,
        cls: pageCls,
        fid: pageFid,
      }
    })

    // ─── Recommendations ────────────────────────────────────────────────
    const recommendations: string[] = []

    if (coreVitals.lcp.status === 'poor') {
      recommendations.push('Optimize Largest Contentful Paint by compressing hero images, using next-gen formats (WebP/AVIF), and preloading critical resources')
    } else if (coreVitals.lcp.status === 'needs-improvement') {
      recommendations.push('Improve LCP by optimizing the largest above-the-fold content element and reducing server response times')
    }

    if (coreVitals.fid.status === 'poor') {
      recommendations.push('Reduce Interaction to Next Paint by minimizing main-thread JavaScript execution and breaking up long tasks')
    } else if (coreVitals.fid.status === 'needs-improvement') {
      recommendations.push('Improve INP/FID by code-splitting JavaScript bundles and deferring non-critical script execution')
    }

    if (coreVitals.cls.status === 'poor') {
      recommendations.push('Fix Cumulative Layout Shift by setting explicit dimensions on images/videos and avoiding dynamic content injection above the fold')
    } else if (coreVitals.cls.status === 'needs-improvement') {
      recommendations.push('Reduce CLS by reserving space for dynamically loaded content and using CSS containment')
    }

    if (additionalMetrics.fcp.status !== 'good') {
      recommendations.push('Speed up First Contentful Paint by eliminating render-blocking resources and inlining critical CSS')
    }

    if (additionalMetrics.ttfb.status !== 'good') {
      recommendations.push('Reduce Time to First Byte by optimizing server response times, using a CDN, and implementing server-side caching')
    }

    if (additionalMetrics.tbt.status !== 'good') {
      recommendations.push('Lower Total Blocking Time by reducing JavaScript bundle size and deferring non-essential script execution')
    }

    if (performanceIssues.some((i) => i.title.includes('Unoptimized images'))) {
      recommendations.push('Convert PNG images to WebP format to reduce image payload by 40-60% without quality loss')
    }

    if (performanceIssues.some((i) => i.title.includes('Render-blocking'))) {
      recommendations.push('Remove or defer render-blocking CSS and JavaScript resources that delay first paint')
    }

    if (performanceIssues.some((i) => i.title.includes('lazy loading') || i.title.includes('Lazy'))) {
      recommendations.push('Implement native lazy loading (loading="lazy") for below-the-fold images and iframes')
    }

    if (performanceIssues.some((i) => i.title.includes('Unused CSS'))) {
      recommendations.push('Remove unused CSS rules and consider using PurgeCSS to reduce stylesheet sizes by up to 45%')
    }

    if (performanceScore < 70) {
      recommendations.push('Enable text compression (Brotli/Gzip) for HTML, CSS, and JavaScript resources')
    }

    if (performanceScore < 60) {
      recommendations.push('Implement resource hints (preconnect, prefetch, preload) for critical third-party origins')
    }

    // Deduplicate and limit
    const uniqueRecommendations = Array.from(new Set(recommendations)).slice(0, 8)

    // ─── Response ───────────────────────────────────────────────────────
    const response = {
      project: {
        id: project.id,
        name: project.name,
        domain: project.domain,
      },
      performanceScore,
      grade: getGrade(performanceScore),
      coreVitals,
      additionalMetrics,
      trend,
      pagePerformance,
      recommendations: uniqueRecommendations,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Vitals API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
