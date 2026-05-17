import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId || projectId === 'first') {
      const project = await db.project.findFirst({ where: { isActive: true } })
      if (!project) {
        return NextResponse.json({ error: 'No active project found' }, { status: 404 })
      }
      return actionPlanResponse(project.id)
    }

    return actionPlanResponse(projectId)
  } catch (error) {
    console.error('Action plan error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function actionPlanResponse(projectId: string) {
  const [project, latestAudit, keywords, backlinks, competitors] = await Promise.all([
    db.project.findUnique({ where: { id: projectId } }),
    db.siteAudit.findFirst({
      where: { projectId, status: 'completed' },
      orderBy: { createdAt: 'desc' },
      include: { issues: true },
    }),
    db.keyword.findMany({ where: { projectId, isActive: true } }),
    db.backlink.findMany({ where: { projectId, status: 'active' } }),
    db.competitor.findMany({ where: { projectId } }),
  ])

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  // Derive SEO metrics for action plan generation
  const auditScore = latestAudit?.score ?? 45
  const criticalIssues = latestAudit?.issues.filter(i => i.severity === 'critical').length ?? 0
  const highIssues = latestAudit?.issues.filter(i => i.severity === 'high').length ?? 0
  const topKeywords = keywords.filter(k => k.currentRank && k.currentRank <= 10).length
  const missingMetaIssues = latestAudit?.issues.filter(i => i.category === 'on-page').length ?? 0
  const noFollowBacklinks = backlinks.filter(b => !b.isFollow).length
  const totalBacklinks = backlinks.length
  const competitorAvgAuthority = competitors.length > 0
    ? Math.round(competitors.reduce((sum, c) => sum + (c.authorityScore ?? 0), 0) / competitors.length)
    : 50

  // Generate overall score and grades
  const overallScore = auditScore
  const currentGrade = overallScore >= 90 ? 'A' : overallScore >= 80 ? 'B+' : overallScore >= 70 ? 'B' : overallScore >= 60 ? 'C+' : overallScore >= 50 ? 'C' : overallScore >= 40 ? 'D' : 'F'
  const potentialGrade = overallScore >= 90 ? 'A+' : overallScore >= 80 ? 'A' : overallScore >= 70 ? 'A-' : overallScore >= 60 ? 'B+' : overallScore >= 50 ? 'B' : overallScore >= 40 ? 'B-' : 'C+'

  // Build action items based on real data
  const allActions: Array<{
    id: string
    priority: 'critical' | 'high' | 'medium' | 'low'
    category: string
    title: string
    description: string
    impact: 'high' | 'medium' | 'low'
    effort: 'low' | 'medium' | 'high'
    estimatedTime: string
    steps: string[]
    status: 'pending' | 'in-progress' | 'completed'
    expectedResult: string
  }> = []

  // Critical issues → critical actions
  if (criticalIssues > 0) {
    allActions.push({
      id: 'act-1',
      priority: 'critical',
      category: 'Technical',
      title: `Fix ${criticalIssues} critical site issues immediately`,
      description: `Your site has ${criticalIssues} critical issues that are severely impacting SEO performance. These include broken links, server errors, and indexing problems that prevent search engines from properly crawling your site.`,
      impact: 'high',
      effort: 'medium',
      estimatedTime: '2-3 days',
      steps: [
        'Open Site Audit module and filter by Critical severity',
        'Export the list of critical issues with affected URLs',
        'Prioritize by traffic impact — fix pages with highest organic traffic first',
        'Address each issue: fix broken links, resolve 5xx errors, remove noindex tags',
        'Submit fixed URLs to Google Search Console for re-crawling',
        'Re-run site audit after 48 hours to verify fixes',
      ],
      status: 'pending',
      expectedResult: 'Immediate improvement in crawlability and indexation. Expect 5-15 point audit score increase.',
    })
  }

  if (highIssues > 0) {
    allActions.push({
      id: 'act-2',
      priority: 'high',
      category: 'Technical',
      title: `Resolve ${highIssues} high-severity audit issues`,
      description: `There are ${highIssues} high-severity issues including missing meta descriptions, duplicate content, and redirect chains that need attention.`,
      impact: 'high',
      effort: 'medium',
      estimatedTime: '1-2 weeks',
      steps: [
        'Review all high-severity issues in the Site Audit module',
        'Group issues by type (meta, redirects, content) for batch processing',
        'Fix missing meta descriptions on top-trafficked pages first',
        'Resolve redirect chains by updating links to point to final URLs',
        'Address duplicate content with canonical tags or content rewrites',
        'Track progress in the audit module as you resolve each issue',
      ],
      status: 'pending',
      expectedResult: 'Improved on-page SEO signals and better search engine understanding of your content.',
    })
  }

  // Missing on-page optimization
  if (missingMetaIssues > 0) {
    allActions.push({
      id: 'act-3',
      priority: 'high',
      category: 'On-Page',
      title: 'Optimize meta tags across all pages',
      description: `${missingMetaIssues} pages have on-page SEO issues. Missing or poorly optimized title tags and meta descriptions reduce click-through rates from search results.`,
      impact: 'high',
      effort: 'low',
      estimatedTime: '3-5 days',
      steps: [
        'Identify all pages with missing or suboptimal meta tags',
        'Write unique title tags (50-60 chars) including target keywords',
        'Craft compelling meta descriptions (120-160 chars) with CTAs',
        'Ensure each page has exactly one H1 with the primary keyword',
        'Add structured data markup where applicable',
        'Validate changes with the Content Optimizer tool',
      ],
      status: 'pending',
      expectedResult: 'Higher CTR from search results. Pages with optimized meta tags see 15-30% more clicks.',
    })
  }

  // Keyword opportunities
  if (topKeywords < keywords.length * 0.3) {
    allActions.push({
      id: 'act-4',
      priority: 'high',
      category: 'Content',
      title: 'Create content for keyword ranking opportunities',
      description: `Only ${topKeywords} of ${keywords.length} tracked keywords rank in the top 10. Create targeted content to improve rankings for keywords currently in positions 11-30.`,
      impact: 'high',
      effort: 'high',
      estimatedTime: '2-4 weeks',
      steps: [
        'Export keywords ranked 11-30 from Keyword Tracking module',
        'Group keywords by topic to plan content clusters',
        'Create comprehensive pillar pages for main topics',
        'Write supporting blog posts targeting long-tail variations',
        'Interlink new content with existing high-ranking pages',
        'Monitor ranking changes weekly after publication',
      ],
      status: 'pending',
      expectedResult: 'Move 5-10 keywords into top 10 positions within 60 days of content publication.',
    })
  }

  // Backlink strategy
  if (totalBacklinks < 50 || noFollowBacklinks / Math.max(totalBacklinks, 1) > 0.6) {
    allActions.push({
      id: 'act-5',
      priority: 'high',
      category: 'Backlinks',
      title: 'Build high-quality dofollow backlinks',
      description: `Your backlink profile needs strengthening. With ${totalBacklinks} total backlinks and a high nofollow ratio, focus on acquiring authoritative dofollow links.`,
      impact: 'high',
      effort: 'high',
      estimatedTime: 'Ongoing',
      steps: [
        'Analyze competitor backlink profiles to find link opportunities',
        'Create linkable assets (studies, tools, infographics) for natural links',
        'Reach out to industry blogs and publications for guest posting',
        'Submit to relevant directories and resource pages',
        'Monitor new backlinks and disavow toxic links regularly',
        'Track domain authority changes monthly',
      ],
      status: 'pending',
      expectedResult: 'Increase referring domains by 20% and improve domain authority by 5-10 points over 3 months.',
    })
  }

  // Schema markup
  allActions.push({
    id: 'act-6',
    priority: 'medium',
    category: 'Schema',
    title: 'Implement structured data markup',
    description: 'Add JSON-LD structured data to enable rich results in search. This includes Organization, WebSite, Article, FAQ, and BreadcrumbList schemas.',
    impact: 'medium',
    effort: 'medium',
    estimatedTime: '1 week',
    steps: [
      'Audit current structured data using the Schema Analyzer tool',
      'Add Organization schema to the homepage with business details',
      'Implement Article schema on all blog posts and content pages',
      'Add FAQ schema to pages with question-answer content',
      'Include BreadcrumbList schema for improved site navigation display',
      'Validate all markup with Google Rich Results Test',
    ],
    status: 'pending',
    expectedResult: 'Enable rich snippets in search results, potentially increasing CTR by 20-35%.',
  })

  // Performance optimization
  allActions.push({
    id: 'act-7',
    priority: 'medium',
    category: 'Performance',
    title: 'Improve Core Web Vitals scores',
    description: 'Optimize page load performance to meet Google\'s Core Web Vitals thresholds. Focus on LCP, FID/INP, and CLS improvements.',
    impact: 'medium',
    effort: 'medium',
    estimatedTime: '1-2 weeks',
    steps: [
      'Run a Core Web Vitals audit on top landing pages',
      'Optimize images: use WebP format, lazy loading, proper sizing',
      'Reduce JavaScript bundle size and defer non-critical scripts',
      'Implement proper font loading with font-display: swap',
      'Add explicit width/height to images to prevent CLS',
      'Use a CDN and implement browser caching headers',
    ],
    status: 'pending',
    expectedResult: 'Achieve "Good" CWV status on all key pages, improving ranking signals and user experience.',
  })

  // Content refresh
  allActions.push({
    id: 'act-8',
    priority: 'medium',
    category: 'Content',
    title: 'Refresh and update existing content',
    description: 'Several pages show declining traffic or outdated information. Update existing content to maintain relevance and improve rankings.',
    impact: 'medium',
    effort: 'low',
    estimatedTime: '1 week',
    steps: [
      'Identify pages with declining traffic over the last 3 months',
      'Update statistics, facts, and references with current data',
      'Add new sections covering recent developments',
      'Improve internal linking to and from these pages',
      'Republish with updated dates to signal freshness',
      'Submit updated URLs to Google Search Console',
    ],
    status: 'pending',
    expectedResult: 'Content refreshes typically result in 15-40% traffic increase within 30 days.',
  })

  // Competitor gap analysis
  if (competitors.length > 0) {
    allActions.push({
      id: 'act-9',
      priority: 'medium',
      category: 'Backlinks',
      title: 'Target competitor link gaps',
      description: `Your competitors have an average authority score of ${competitorAvgAuthority}. Identify and pursue backlink opportunities they have that you don't.`,
      impact: 'medium',
      effort: 'medium',
      estimatedTime: '2-3 weeks',
      steps: [
        'Use the Competitors module to analyze each competitor\'s backlinks',
        'Identify domains linking to competitors but not to you',
        'Prioritize outreach targets by domain authority and relevance',
        'Create content that matches or exceeds competitor link-worthy pages',
        'Reach out to linking domains with personalized pitches',
        'Track new links acquired through this strategy',
      ],
      status: 'pending',
      expectedResult: 'Acquire 10-20 new referring domains from competitor gap analysis within 2 months.',
    })
  }

  // Mobile optimization
  allActions.push({
    id: 'act-10',
    priority: 'medium',
    category: 'Mobile',
    title: 'Ensure mobile-first optimization',
    description: 'Google uses mobile-first indexing. Verify all pages render properly on mobile devices and provide optimal touch-target sizes.',
    impact: 'medium',
    effort: 'low',
    estimatedTime: '3-5 days',
    steps: [
      'Test all key pages on multiple mobile devices and screen sizes',
      'Ensure tap targets are at least 48x48px with adequate spacing',
      'Verify viewport meta tag is properly configured',
      'Check that content doesn\'t overflow horizontally',
      'Test mobile page speed with Google PageSpeed Insights',
      'Fix any mobile usability issues flagged in Search Console',
    ],
    status: 'pending',
    expectedResult: 'Pass all mobile-friendly tests and eliminate mobile usability errors in Search Console.',
  })

  // Lower priority items
  allActions.push({
    id: 'act-11',
    priority: 'low',
    category: 'Analytics',
    title: 'Set up advanced conversion tracking',
    description: 'Implement enhanced conversion tracking to measure SEO ROI more accurately. Track form submissions, phone calls, and micro-conversions.',
    impact: 'low',
    effort: 'medium',
    estimatedTime: '1 week',
    steps: [
      'Define key conversion events for your business goals',
      'Set up Google Analytics 4 events for each conversion type',
      'Implement call tracking for phone lead attribution',
      'Create custom dashboards for SEO conversion monitoring',
      'Set up automated weekly reports for stakeholder updates',
    ],
    status: 'pending',
    expectedResult: 'Better visibility into SEO-driven conversions and ROI measurement.',
  })

  allActions.push({
    id: 'act-12',
    priority: 'low',
    category: 'Local SEO',
    title: 'Optimize for local search presence',
    description: 'Improve local SEO signals including Google Business Profile, local citations, and location-specific content.',
    impact: 'low',
    effort: 'low',
    estimatedTime: '2-3 days',
    steps: [
      'Claim and optimize your Google Business Profile listing',
      'Ensure NAP (Name, Address, Phone) consistency across all directories',
      'Add location-specific landing pages if serving multiple areas',
      'Encourage and respond to customer reviews on Google',
      'Build local citations on relevant directories',
    ],
    status: 'pending',
    expectedResult: 'Improved local pack visibility and increased local search traffic.',
  })

  allActions.push({
    id: 'act-13',
    priority: 'low',
    category: 'Social',
    title: 'Align social media with SEO strategy',
    description: 'While social signals aren\'t a direct ranking factor, social sharing amplifies content reach and can lead to more backlinks.',
    impact: 'low',
    effort: 'low',
    estimatedTime: 'Ongoing',
    steps: [
      'Add Open Graph and Twitter Card meta tags to all pages',
      'Create shareable content assets (infographics, data studies)',
      'Cross-promote new content on social channels',
      'Engage with industry influencers who may link to your content',
    ],
    status: 'pending',
    expectedResult: 'Increased content distribution and indirect SEO benefits through amplified reach.',
  })

  // Categorize actions into timeline buckets
  const thisWeek = allActions.filter(a => a.priority === 'critical' || (a.priority === 'high' && a.effort === 'low'))
  const thisMonth = allActions.filter(a => (a.priority === 'high' && a.effort !== 'low') || (a.priority === 'medium' && a.effort === 'low'))
  const thisQuarter = allActions.filter(a => (a.priority === 'medium' && a.effort !== 'low') || a.priority === 'low')

  // Categorize into impact matrix
  const impactMatrix = {
    quickWins: allActions.filter(a => a.impact === 'high' && a.effort === 'low'),
    majorProjects: allActions.filter(a => a.impact === 'high' && a.effort !== 'low'),
    fillIns: allActions.filter(a => a.impact !== 'high' && a.effort === 'low'),
    thankless: allActions.filter(a => a.impact !== 'high' && a.effort !== 'low'),
  }

  // Quick wins list (simplified)
  const quickWins = impactMatrix.quickWins.map(a => ({
    id: a.id,
    title: a.title,
    description: a.description,
    impact: a.impact,
    effort: a.effort,
    category: a.category,
    estimatedTime: a.estimatedTime,
  }))

  return NextResponse.json({
    project: {
      id: project.id,
      name: project.name,
      domain: project.domain,
    },
    overallScore,
    currentGrade,
    potentialGrade,
    totalActions: allActions.length,
    completedActions: allActions.filter(a => a.status === 'completed').length,
    quickWins,
    timeline: {
      thisWeek,
      thisMonth,
      thisQuarter,
    },
    impactMatrix,
  })
}
