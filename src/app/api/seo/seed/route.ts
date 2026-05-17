import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// Helper: random integer between min and max (inclusive)
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Helper: pick random item from array
function randPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Helper: shuffle array
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Generate realistic rank trend over 90 days
function generateRankTrend(startRank: number, trend: 'improving' | 'declining' | 'stable' | 'volatile'): number[] {
  const ranks: number[] = []
  let current = startRank
  for (let i = 0; i < 90; i++) {
    let delta = 0
    switch (trend) {
      case 'improving':
        delta = randInt(-3, 1)
        break
      case 'declining':
        delta = randInt(-1, 3)
        break
      case 'stable':
        delta = randInt(-1, 1)
        break
      case 'volatile':
        delta = randInt(-5, 5)
        break
    }
    current = Math.max(1, Math.min(100, current + delta))
    ranks.push(current)
  }
  return ranks
}

const KEYWORDS_DATA = [
  { keyword: 'best project management software', volume: 18100, difficulty: 78, cpc: 12.50, group: 'core-product', tag: 'high-priority', url: '/project-management' },
  { keyword: 'crm tools for small business', volume: 14800, difficulty: 72, cpc: 10.80, group: 'core-product', tag: 'high-priority', url: '/crm-solutions' },
  { keyword: 'seo tracking platform', volume: 6600, difficulty: 65, cpc: 8.90, group: 'core-product', tag: 'high-priority', url: '/seo-tools' },
  { keyword: 'team collaboration software', volume: 12100, difficulty: 70, cpc: 9.40, group: 'core-product', tag: 'high-priority', url: '/collaboration' },
  { keyword: 'business analytics dashboard', volume: 8800, difficulty: 62, cpc: 11.20, group: 'analytics', tag: 'medium-priority', url: '/analytics' },
  { keyword: 'cloud storage solutions', volume: 9900, difficulty: 75, cpc: 7.60, group: 'infrastructure', tag: 'medium-priority', url: '/cloud-storage' },
  { keyword: 'workflow automation tools', volume: 7300, difficulty: 58, cpc: 9.80, group: 'automation', tag: 'high-priority', url: '/automation' },
  { keyword: 'customer onboarding software', volume: 5400, difficulty: 55, cpc: 13.20, group: 'core-product', tag: 'medium-priority', url: '/onboarding' },
  { keyword: 'email marketing automation', volume: 11200, difficulty: 68, cpc: 8.50, group: 'marketing', tag: 'medium-priority', url: '/email-marketing' },
  { keyword: 'social media management tools', volume: 8100, difficulty: 64, cpc: 6.90, group: 'marketing', tag: 'medium-priority', url: '/social-media' },
  { keyword: 'inventory management system', volume: 6700, difficulty: 60, cpc: 10.10, group: 'operations', tag: 'low-priority', url: '/inventory' },
  { keyword: 'employee time tracking', volume: 5900, difficulty: 52, cpc: 5.80, group: 'hr', tag: 'low-priority', url: '/time-tracking' },
  { keyword: 'data visualization tools', volume: 7500, difficulty: 56, cpc: 7.20, group: 'analytics', tag: 'medium-priority', url: '/data-viz' },
  { keyword: 'remote work software', volume: 13200, difficulty: 66, cpc: 6.40, group: 'collaboration', tag: 'high-priority', url: '/remote-work' },
  { keyword: 'cybersecurity solutions for business', volume: 4800, difficulty: 74, cpc: 15.60, group: 'security', tag: 'medium-priority', url: '/cybersecurity' },
  { keyword: 'ai writing assistant', volume: 22000, difficulty: 71, cpc: 5.20, group: 'ai-tools', tag: 'high-priority', url: '/ai-writing' },
  { keyword: 'chatbot platform for website', volume: 6100, difficulty: 59, cpc: 8.30, group: 'ai-tools', tag: 'medium-priority', url: '/chatbot' },
  { keyword: 'landing page builder', volume: 14500, difficulty: 73, cpc: 9.70, group: 'marketing', tag: 'high-priority', url: '/landing-page-builder' },
  { keyword: 'accounting software for startups', volume: 8400, difficulty: 67, cpc: 12.30, group: 'finance', tag: 'medium-priority', url: '/accounting' },
  { keyword: 'video conferencing tools', volume: 9800, difficulty: 69, cpc: 4.80, group: 'collaboration', tag: 'medium-priority', url: '/video-conferencing' },
  { keyword: 'document management system', volume: 5600, difficulty: 61, cpc: 11.40, group: 'operations', tag: 'low-priority', url: '/document-management' },
  { keyword: 'ecommerce platform comparison', volume: 7700, difficulty: 77, cpc: 8.10, group: 'ecommerce', tag: 'medium-priority', url: '/ecommerce' },
  { keyword: 'help desk software', volume: 6300, difficulty: 63, cpc: 9.50, group: 'support', tag: 'medium-priority', url: '/help-desk' },
  { keyword: 'hr management software', volume: 5100, difficulty: 57, cpc: 10.60, group: 'hr', tag: 'low-priority', url: '/hr-software' },
  { keyword: 'content management system', volume: 10200, difficulty: 76, cpc: 7.40, group: 'cms', tag: 'medium-priority', url: '/cms' },
  { keyword: 'payment processing solutions', volume: 6900, difficulty: 80, cpc: 14.70, group: 'finance', tag: 'high-priority', url: '/payment-processing' },
  { keyword: 'task management app', volume: 8600, difficulty: 64, cpc: 5.90, group: 'core-product', tag: 'high-priority', url: '/task-management' },
  { keyword: 'api integration platform', volume: 4200, difficulty: 54, cpc: 13.80, group: 'infrastructure', tag: 'low-priority', url: '/api-integration' },
  { keyword: 'customer feedback tools', volume: 3800, difficulty: 48, cpc: 7.90, group: 'support', tag: 'low-priority', url: '/feedback-tools' },
  { keyword: 'digital marketing suite', volume: 5500, difficulty: 70, cpc: 8.60, group: 'marketing', tag: 'medium-priority', url: '/marketing-suite' },
  { keyword: 'file sharing for business', volume: 4600, difficulty: 66, cpc: 5.40, group: 'collaboration', tag: 'low-priority', url: '/file-sharing' },
  { keyword: 'lead generation software', volume: 7100, difficulty: 69, cpc: 11.90, group: 'marketing', tag: 'high-priority', url: '/lead-generation' },
  { keyword: 'mobile app development tools', volume: 5800, difficulty: 62, cpc: 6.70, group: 'development', tag: 'low-priority', url: '/app-dev-tools' },
  { keyword: 'no code platform', volume: 16500, difficulty: 72, cpc: 8.40, group: 'development', tag: 'high-priority', url: '/no-code' },
  { keyword: 'online survey tools', volume: 4900, difficulty: 55, cpc: 4.20, group: 'support', tag: 'low-priority', url: '/survey-tools' },
  { keyword: 'project scheduling software', volume: 3600, difficulty: 50, cpc: 6.30, group: 'core-product', tag: 'medium-priority', url: '/scheduling' },
  { keyword: 'sales funnel builder', volume: 6200, difficulty: 67, cpc: 10.40, group: 'marketing', tag: 'medium-priority', url: '/sales-funnel' },
  { keyword: 'server monitoring tools', volume: 3400, difficulty: 58, cpc: 9.20, group: 'infrastructure', tag: 'low-priority', url: '/monitoring' },
  { keyword: 'sme business tools', volume: 2900, difficulty: 45, cpc: 7.10, group: 'operations', tag: 'low-priority', url: '/sme-tools' },
  { keyword: 'website builder for small business', volume: 12300, difficulty: 79, cpc: 9.90, group: 'cms', tag: 'high-priority', url: '/website-builder' },
  { keyword: 'crm automation', volume: 4300, difficulty: 60, cpc: 12.80, group: 'core-product', tag: 'medium-priority', url: '/crm-automation' },
  { keyword: 'digital asset management', volume: 3700, difficulty: 56, cpc: 11.50, group: 'operations', tag: 'low-priority', url: '/dam' },
  { keyword: 'employee engagement platform', volume: 3100, difficulty: 51, cpc: 8.70, group: 'hr', tag: 'low-priority', url: '/engagement' },
  { keyword: 'marketing analytics tools', volume: 5700, difficulty: 63, cpc: 9.60, group: 'analytics', tag: 'medium-priority', url: '/marketing-analytics' },
  { keyword: 'productivity suite', volume: 8900, difficulty: 74, cpc: 6.10, group: 'core-product', tag: 'high-priority', url: '/productivity' },
  { keyword: 'backup solutions for business', volume: 2800, difficulty: 53, cpc: 8.20, group: 'infrastructure', tag: 'low-priority', url: '/backup' },
  { keyword: 'contract management software', volume: 3300, difficulty: 49, cpc: 13.50, group: 'operations', tag: 'low-priority', url: '/contract-mgmt' },
  { keyword: 'live chat software', volume: 7400, difficulty: 65, cpc: 7.80, group: 'support', tag: 'medium-priority', url: '/live-chat' },
  { keyword: 'marketing automation platforms', volume: 6800, difficulty: 71, cpc: 10.70, group: 'marketing', tag: 'high-priority', url: '/marketing-automation' },
  { keyword: 'recruitment software', volume: 5200, difficulty: 59, cpc: 11.10, group: 'hr', tag: 'medium-priority', url: '/recruitment' },
  { keyword: 'small business crm free', volume: 9100, difficulty: 68, cpc: 8.30, group: 'core-product', tag: 'high-priority', url: '/free-crm' },
  { keyword: 'virtual event platform', volume: 4100, difficulty: 55, cpc: 7.50, group: 'collaboration', tag: 'low-priority', url: '/virtual-events' },
  { keyword: 'website uptime monitoring', volume: 2500, difficulty: 47, cpc: 6.80, group: 'infrastructure', tag: 'low-priority', url: '/uptime-monitoring' },
]

const AUDIT_ISSUES_DATA = [
  // Crawlability
  { category: 'crawlability', severity: 'critical', title: 'Robots.txt blocking important pages', description: 'The robots.txt file is blocking access to 12 important pages that should be indexed.' },
  { category: 'crawlability', severity: 'high', title: 'Broken internal links detected', description: 'Found 23 internal links returning 404 errors across the site.' },
  { category: 'crawlability', severity: 'medium', title: 'Redirect chains detected', description: '8 URLs have redirect chains of 3 or more hops, slowing crawl efficiency.' },
  { category: 'crawlability', severity: 'high', title: 'Orphan pages found', description: '6 pages have no internal links pointing to them and cannot be discovered through crawling.' },
  { category: 'crawlability', severity: 'low', title: 'Excessive crawl budget usage', description: 'Parameter-based URLs are consuming crawl budget on non-canonical pages.' },
  { category: 'crawlability', severity: 'info', title: 'XML sitemap format notice', description: 'Sitemap uses deprecated format. Consider upgrading to the latest protocol.' },
  // Indexability
  { category: 'indexability', severity: 'critical', title: 'Noindex on key landing pages', description: '3 high-value landing pages have meta robots noindex tags preventing indexing.' },
  { category: 'indexability', severity: 'high', title: 'Canonical tag conflicts', description: '5 pages have conflicting canonical tags pointing to different URLs.' },
  { category: 'indexability', severity: 'medium', title: 'Duplicate meta descriptions', description: '18 pages share the same meta description, reducing click-through potential.' },
  { category: 'indexability', severity: 'high', title: 'Pages blocked by x-robots-tag', description: '2 important pages are blocked via HTTP header x-robots-tag.' },
  { category: 'indexability', severity: 'low', title: 'Missing canonical tags', description: '7 pages lack canonical tags, risking duplicate content issues.' },
  { category: 'indexability', severity: 'info', title: 'Pagination indexation notice', description: 'Paginated pages are being indexed. Consider using rel=prev/next or noindex.' },
  // On-page
  { category: 'on-page', severity: 'high', title: 'Missing H1 tags', description: '9 pages are missing H1 tags, which are critical for SEO and accessibility.' },
  { category: 'on-page', severity: 'medium', title: 'Title tags too long', description: '14 page titles exceed 60 characters and may be truncated in search results.' },
  { category: 'on-page', severity: 'medium', title: 'Thin content pages', description: '11 pages have less than 300 words of content, potentially flagged as thin content.' },
  { category: 'on-page', severity: 'high', title: 'Missing meta descriptions', description: '7 pages lack meta descriptions, missing opportunity to improve CTR.' },
  { category: 'on-page', severity: 'low', title: 'Image alt text missing', description: '34 images across the site are missing alt text attributes.' },
  { category: 'on-page', severity: 'critical', title: 'Keyword cannibalization detected', description: 'Multiple pages targeting "project management software" are competing with each other.' },
  { category: 'on-page', severity: 'medium', title: 'Heading hierarchy issues', description: '5 pages have incorrect heading hierarchy (skipping H2 to H4).' },
  { category: 'on-page', severity: 'low', title: 'Internal link anchor text optimization', description: 'Excessive "click here" and "read more" anchor texts found in internal links.' },
  // Performance
  { category: 'performance', severity: 'critical', title: 'Largest Contentful Paint > 4s', description: 'LCP on the homepage is 4.8 seconds, significantly above the 2.5s threshold.' },
  { category: 'performance', severity: 'high', title: 'Unoptimized images', description: '28 images are served in PNG format where WebP would reduce size by 40-60%.' },
  { category: 'performance', severity: 'medium', title: 'Render-blocking resources', description: '6 CSS and 3 JavaScript files are blocking first contentful paint.' },
  { category: 'performance', severity: 'high', title: 'No lazy loading for images', description: 'Below-fold images are loaded eagerly, increasing initial page load time.' },
  { category: 'performance', severity: 'medium', title: 'Cumulative Layout Shift > 0.25', description: 'CLS score of 0.32 detected due to dynamically loaded content shifting layout.' },
  { category: 'performance', severity: 'low', title: 'Unused CSS detected', description: 'Approximately 45% of loaded CSS is unused on the homepage.' },
  { category: 'performance', severity: 'info', title: 'CDN configuration note', description: 'Static assets could benefit from CDN edge caching for improved global performance.' },
  // Mobile
  { category: 'mobile', severity: 'critical', title: 'Mobile viewport not configured', description: '3 pages are missing the viewport meta tag, causing rendering issues on mobile.' },
  { category: 'mobile', severity: 'high', title: 'Tap targets too small', description: '15 interactive elements are smaller than 48x48px, causing usability issues on mobile.' },
  { category: 'mobile', severity: 'medium', title: 'Horizontal scroll on mobile', description: '4 pages have content causing horizontal scrolling on mobile devices.' },
  { category: 'mobile', severity: 'medium', title: 'Font size too small', description: '9 text elements use font sizes below 12px, difficult to read on mobile.' },
  { category: 'mobile', severity: 'low', title: 'Mobile interstitials', description: 'Full-page interstitial on the blog may affect mobile user experience.' },
  // Structured Data
  { category: 'structured-data', severity: 'high', title: 'Invalid Schema.org markup', description: 'Product schema on 4 pages has invalid properties failing Google validation.' },
  { category: 'structured-data', severity: 'medium', title: 'Missing FAQ schema', description: 'FAQ pages are missing FAQPage schema, losing potential rich results.' },
  { category: 'structured-data', severity: 'medium', title: 'BreadcrumbList schema missing', description: 'No breadcrumbs schema found, reducing visibility in search results.' },
  { category: 'structured-data', severity: 'low', title: 'Organization schema incomplete', description: 'Organization schema on the about page is missing social profile links.' },
  { category: 'structured-data', severity: 'info', title: 'Schema enhancement opportunities', description: 'Consider adding HowTo and VideoObject schemas for tutorial content.' },
  // Security
  { category: 'security', severity: 'critical', title: 'Mixed content warnings', description: '7 pages load HTTP resources on HTTPS pages, triggering browser warnings.' },
  { category: 'security', severity: 'high', title: 'Missing security headers', description: 'X-Content-Type-Options and X-Frame-Options headers are not configured.' },
  { category: 'security', severity: 'medium', title: 'Outdated TLS configuration', description: 'Server supports TLS 1.0 and 1.1 which have known vulnerabilities.' },
  { category: 'security', severity: 'low', title: 'Cookies without Secure flag', description: '3 cookies are set without the Secure attribute.' },
]

const BACKLINK_DOMAINS = [
  'techcrunch.com', 'forbes.com', 'wired.com', 'arstechnica.com', 'theverge.com',
  'mashable.com', 'venturebeat.com', 'zdnet.com', 'cnet.com', 'computerworld.com',
  'infoworld.com', 'techtarget.com', 'searchenginejournal.com', 'searchengineland.com',
  'moz.com', 'ahrefs.com', 'semrush.com', 'hubspot.com', 'salesforce.com',
  'zapier.com', 'slack.com', 'atlassian.com', 'asana.com', 'monday.com',
  'clickup.com', 'notion.so', 'airtable.com', 'smartsheet.com', 'wrike.com',
  'basecamp.com', 'trello.com', 'jira.com', 'figma.com', 'canva.com',
  'dropbox.com', 'box.com', 'google.com', 'microsoft.com', 'apple.com',
  'amazon.com', 'adobe.com', 'oracle.com', 'sap.com', 'servicenow.com',
  'workday.com', 'shopify.com', 'squarespace.com', 'wix.com', 'wordpress.org',
  'drupal.org', 'github.com', 'stackoverflow.com', 'dev.to', 'medium.com',
  'producthunt.com', 'g2.com', 'capterra.com', 'trustpilot.com',
  'glassdoor.com', 'indeed.com', 'linkedin.com', 'twitter.com', 'facebook.com',
  'reddit.com', 'quora.com', 'wikipedia.org', 'nytimes.com',
  'wsj.com', 'bloomberg.com', 'businessinsider.com', 'inc.com', 'fastcompany.com',
  'entrepreneur.com', 'hbr.org', 'mckinsey.com', 'deloitte.com', 'accenture.com',
  'gartner.com', 'forrester.com', 'statista.com',
  'w3schools.com', 'css-tricks.com', 'smashingmagazine.com',
  'web.dev', 'developers.google.com', 'mozilla.org', 'cloudflare.com', 'vercel.com',
  'netlify.com', 'aws.amazon.com', 'cloud.google.com', 'azure.microsoft.com',
  'digitalocean.com', 'heroku.com', 'linode.com', 'vultr.com', 'ovh.com',
]

const ANCHOR_TEXTS = [
  'project management software', 'best CRM tools', 'SEO tracking platform',
  'collaboration software', 'business analytics', 'workflow automation',
  'TechVenture', 'techventure.com', 'click here', 'read more',
  'business tools comparison', 'productivity suite', 'team management',
  'cloud solutions', 'enterprise software', 'SaaS platform',
  'small business tools', 'digital transformation', 'remote work solutions',
  'AI-powered analytics', 'customer engagement platform', 'data-driven insights',
  'business intelligence', 'operational efficiency', 'scaling your business',
]

const ALERTS_DATA = [
  { type: 'rank_change', severity: 'high', title: 'Major rank drop detected', message: '"best project management software" dropped from position 5 to 18 in the last 7 days.' },
  { type: 'rank_change', severity: 'medium', title: 'Rank improvement', message: '"workflow automation tools" improved from position 22 to 8. Great progress!' },
  { type: 'rank_change', severity: 'low', title: 'New keyword ranking', message: '"sme business tools" has entered the top 100 at position 67.' },
  { type: 'audit', severity: 'critical', title: 'Critical audit issue found', message: 'Mixed content warnings detected on 7 pages. This may affect your HTTPS security.' },
  { type: 'audit', severity: 'high', title: 'New audit completed', message: 'Site audit completed with a score of 72/100. 44 issues found, 4 critical.' },
  { type: 'backlink', severity: 'medium', title: 'New high-authority backlink', message: 'Received a follow backlink from techcrunch.com (DA 93) to /project-management.' },
  { type: 'backlink', severity: 'high', title: 'Lost valuable backlink', message: 'Backlink from forbes.com to /analytics has been lost. This was a DA 95 follow link.' },
  { type: 'backlink', severity: 'low', title: 'New referring domain', message: 'g2.com has linked to your /crm-solutions page with a nofollow link.' },
  { type: 'competitor', severity: 'medium', title: 'Competitor gaining rankings', message: 'competify.io has gained 5 positions for "best project management software".' },
  { type: 'competitor', severity: 'low', title: 'New competitor detected', message: 'marketforce.dev has entered the competitive landscape for your top keywords.' },
  { type: 'traffic', severity: 'high', title: 'Organic traffic decline', message: 'Organic traffic has decreased by 15% compared to last month. Investigate potential causes.' },
  { type: 'traffic', severity: 'medium', title: 'Traffic spike detected', message: 'Organic traffic to /ai-writing increased by 45% in the last 3 days.' },
  { type: 'technical', severity: 'critical', title: 'Site downtime detected', message: 'Website was unreachable for 12 minutes at 3:45 AM UTC. Check server logs.' },
  { type: 'technical', severity: 'medium', title: 'Page speed regression', message: 'Homepage LCP has increased from 2.1s to 3.8s over the past week.' },
  { type: 'keyword', severity: 'low', title: 'Keyword difficulty increase', message: '"cloud storage solutions" difficulty increased from 72 to 78. Consider adjusting strategy.' },
  { type: 'rank_change', severity: 'medium', title: 'Multiple rank changes', message: '8 keywords have changed positions by more than 5 places in the last 48 hours.' },
  { type: 'audit', severity: 'medium', title: 'Issue status update', message: '5 previously open audit issues have been marked as resolved in the latest scan.' },
]

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'
    const clear = searchParams.get('clear') === 'true'

    // Handle clear mode - just wipe all data and return
    if (clear) {
      await db.keywordRank.deleteMany()
      await db.auditIssue.deleteMany()
      await db.siteAudit.deleteMany()
      await db.backlink.deleteMany()
      await db.competitor.deleteMany()
      await db.alert.deleteMany()
      await db.keyword.deleteMany()
      await db.project.deleteMany()

      return NextResponse.json({
        success: true,
        message: 'All data cleared successfully',
        counts: { projects: 0, keywords: 0, rankHistory: 0, audits: 0, auditIssues: 0, backlinks: 0, competitors: 0, alerts: 0 },
      })
    }

    // Check if data already exists
    const existingProjectCount = await db.project.count()
    if (existingProjectCount > 0 && !force) {
      const counts = {
        projects: await db.project.count(),
        keywords: await db.keyword.count(),
        rankHistory: await db.keywordRank.count(),
        audits: await db.siteAudit.count(),
        auditIssues: await db.auditIssue.count(),
        backlinks: await db.backlink.count(),
        competitors: await db.competitor.count(),
        alerts: await db.alert.count(),
      }
      return NextResponse.json({
        success: true,
        message: 'Data already exists. Use ?force=true to re-seed or ?clear=true to clear all data.',
        alreadySeeded: true,
        counts,
      })
    }

    // Clear existing data (force re-seed)
    await db.keywordRank.deleteMany()
    await db.auditIssue.deleteMany()
    await db.siteAudit.deleteMany()
    await db.backlink.deleteMany()
    await db.competitor.deleteMany()
    await db.alert.deleteMany()
    await db.keyword.deleteMany()
    await db.project.deleteMany()

    // 1. Create project
    const project = await db.project.create({
      data: {
        name: 'TechVenture Inc.',
        domain: 'techventure.com',
        isActive: true,
      },
    })

    // 2. Create keywords with trends
    const trends: Array<'improving' | 'declining' | 'stable' | 'volatile'> = ['improving', 'declining', 'stable', 'volatile']
    let seedOffset = 0

    for (const kwData of KEYWORDS_DATA) {
      const trend = trends[seedOffset % 4]
      seedOffset++
      const startRank = randInt(3, 60)
      const rankTrend = generateRankTrend(startRank, trend)
      const currentRank = rankTrend[89]
      const previousRank = rankTrend[82]
      const bestRank = Math.min(...rankTrend)
      const worstRank = Math.max(...rankTrend)

      const keyword = await db.keyword.create({
        data: {
          projectId: project.id,
          keyword: kwData.keyword,
          searchEngine: randPick(['google', 'google', 'google', 'bing']),
          device: randPick(['desktop', 'desktop', 'mobile']),
          location: 'us',
          currentRank,
          previousRank,
          bestRank,
          worstRank,
          searchVolume: kwData.volume,
          difficulty: kwData.difficulty,
          cpc: kwData.cpc,
          url: kwData.url,
          tag: kwData.tag,
          group: kwData.group,
          isActive: true,
        },
      })

      // Create 90 days of rank history
      const now = new Date()
      const rankHistoryData = []
      for (let day = 89; day >= 0; day--) {
        const date = new Date(now)
        date.setDate(date.getDate() - day)
        date.setHours(0, 0, 0, 0)
        rankHistoryData.push({
          keywordId: keyword.id,
          rank: rankTrend[89 - day],
          date,
        })
      }
      await db.keywordRank.createMany({ data: rankHistoryData })
    }

    // 3. Create site audits
    const now = new Date()
    const recentAuditDate = new Date(now)
    recentAuditDate.setDate(recentAuditDate.getDate() - 3)
    const olderAuditDate = new Date(now)
    olderAuditDate.setDate(olderAuditDate.getDate() - 35)

    const recentAudit = await db.siteAudit.create({
      data: {
        projectId: project.id,
        score: 72,
        totalPages: 247,
        status: 'completed',
        createdAt: recentAuditDate,
      },
    })

    const olderAudit = await db.siteAudit.create({
      data: {
        projectId: project.id,
        score: 58,
        totalPages: 243,
        status: 'completed',
        createdAt: olderAuditDate,
      },
    })

    // 4. Create audit issues (distributed across both audits, mostly recent)
    const recentIssues = shuffle(AUDIT_ISSUES_DATA).slice(0, 28)
    const olderIssues = shuffle(AUDIT_ISSUES_DATA).slice(0, 16)

    for (const issue of recentIssues) {
      await db.auditIssue.create({
        data: {
          auditId: recentAudit.id,
          category: issue.category,
          severity: issue.severity,
          title: issue.title,
          description: issue.description,
          url: `https://techventure.com/${issue.category}`,
          status: randPick(['open', 'open', 'open', 'in-progress', 'resolved']),
        },
      })
    }

    for (const issue of olderIssues) {
      await db.auditIssue.create({
        data: {
          auditId: olderAudit.id,
          category: issue.category,
          severity: issue.severity,
          title: issue.title,
          description: issue.description,
          url: `https://techventure.com/${issue.category}`,
          status: randPick(['resolved', 'resolved', 'resolved', 'in-progress']),
        },
      })
    }

    // 5. Create backlinks
    const usedDomains = new Set<string>()
    for (let i = 0; i < 110; i++) {
      let domain = randPick(BACKLINK_DOMAINS)
      if (i < 80 && usedDomains.has(domain)) {
        domain = BACKLINK_DOMAINS.find(d => !usedDomains.has(d)) || domain
      }
      usedDomains.add(domain)

      const authorityScore = domain.includes('forbes') || domain.includes('nytimes') || domain.includes('bloomberg')
        ? randInt(85, 98)
        : domain.includes('techcrunch') || domain.includes('wired') || domain.includes('wsj')
        ? randInt(80, 92)
        : domain.includes('github') || domain.includes('google') || domain.includes('microsoft')
        ? randInt(90, 99)
        : randInt(25, 75)

      const isFollow = Math.random() > 0.35
      const daysAgo = randInt(1, 180)
      const firstSeen = new Date(now)
      firstSeen.setDate(firstSeen.getDate() - daysAgo)
      const lastSeen = new Date(firstSeen)
      lastSeen.setDate(lastSeen.getDate() + randInt(0, Math.min(daysAgo, 30)))

      const targetPage = randPick(['/project-management', '/crm-solutions', '/seo-tools', '/analytics', '/collaboration', '/automation', '/marketing-suite', '/productivity'])

      await db.backlink.create({
        data: {
          projectId: project.id,
          sourceDomain: domain,
          sourceUrl: `https://${domain}/${randPick(['blog', 'articles', 'resources', 'guides', 'reviews', 'news'])}/${randPick(['best-tools-2024', 'software-comparison', 'business-guide', 'industry-report', 'top-picks'])}`,
          targetUrl: `https://techventure.com${targetPage}`,
          anchorText: randPick(ANCHOR_TEXTS),
          linkType: randPick(['text', 'text', 'text', 'image', 'redirect']),
          isFollow,
          authorityScore,
          spamScore: authorityScore > 70 ? randInt(0, 5) : randInt(0, 25),
          status: daysAgo > 150 ? randPick(['lost', 'active']) : 'active',
          firstSeen,
          lastSeen,
        },
      })
    }

    // 6. Create competitors
    await db.competitor.createMany({
      data: [
        {
          projectId: project.id,
          domain: 'competify.io',
          authorityScore: 68,
          organicKeywords: 3240,
          organicTraffic: 145000,
          backlinks: 8900,
        },
        {
          projectId: project.id,
          domain: 'rivaltech.com',
          authorityScore: 72,
          organicKeywords: 4580,
          organicTraffic: 198000,
          backlinks: 12300,
        },
        {
          projectId: project.id,
          domain: 'marketforce.dev',
          authorityScore: 55,
          organicKeywords: 1890,
          organicTraffic: 67000,
          backlinks: 4200,
        },
      ],
    })

    // 7. Create alerts
    for (let i = 0; i < ALERTS_DATA.length; i++) {
      const alertData = ALERTS_DATA[i]
      const daysAgo = randInt(0, 30)
      const createdAt = new Date(now)
      createdAt.setDate(createdAt.getDate() - daysAgo)
      createdAt.setHours(randInt(0, 23), randInt(0, 59), 0, 0)

      await db.alert.create({
        data: {
          projectId: project.id,
          type: alertData.type,
          severity: alertData.severity,
          title: alertData.title,
          message: alertData.message,
          isRead: daysAgo > 7 ? Math.random() > 0.2 : Math.random() > 0.6,
          createdAt,
        },
      })
    }

    // Get final counts
    const counts = {
      projects: await db.project.count(),
      keywords: await db.keyword.count(),
      rankHistory: await db.keywordRank.count(),
      audits: await db.siteAudit.count(),
      auditIssues: await db.auditIssue.count(),
      backlinks: await db.backlink.count(),
      competitors: await db.competitor.count(),
      alerts: await db.alert.count(),
    }

    return NextResponse.json({ success: true, message: 'Database seeded successfully', counts })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET /api/seo/seed - Check seed status
export async function GET() {
  try {
    const counts = {
      projects: await db.project.count(),
      keywords: await db.keyword.count(),
      rankHistory: await db.keywordRank.count(),
      audits: await db.siteAudit.count(),
      auditIssues: await db.auditIssue.count(),
      backlinks: await db.backlink.count(),
      competitors: await db.competitor.count(),
      alerts: await db.alert.count(),
    }

    const isSeeded = counts.projects > 0

    return NextResponse.json({
      isSeeded,
      counts,
      message: isSeeded
        ? 'Database has data. Use POST to seed (add ?force=true to re-seed or ?clear=true to clear).'
        : 'Database is empty. Use POST to seed.',
    })
  } catch (error) {
    console.error('Seed status error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
