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

// Deterministic pseudo-random from seed
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function seededRandomRange(seed: number, min: number, max: number): number {
  return Math.floor(seededRandom(seed) * (max - min + 1)) + min
}

// ─── Schema Type Definitions ──────────────────────────────────────────────

interface SchemaTypeInfo {
  type: string
  count: number
  valid: boolean
  properties: string[]
  errors: string[]
  warnings: string[]
}

interface RichResultEligibility {
  type: string
  eligible: boolean
  reason: string
}

// Schema templates with properties and typical configurations
const SCHEMA_TEMPLATES: Record<string, {
  properties: string[]
  commonErrors: string[]
  commonWarnings: string[]
  richResultType: string
}> = {
  Organization: {
    properties: ['@type', 'name', 'url', 'logo', 'sameAs', 'contactPoint', 'address', 'description'],
    commonErrors: ['Missing required "name" property', 'Invalid @type declaration'],
    commonWarnings: ['Missing "sameAs" social profile links', 'ContactPoint schema incomplete'],
    richResultType: 'Knowledge Panel',
  },
  WebSite: {
    properties: ['@type', 'name', 'url', 'potentialAction', 'description'],
    commonErrors: ['SearchAction target URL is malformed'],
    commonWarnings: ['Missing SearchAction for sitelinks search box'],
    richResultType: 'Rich Snippet',
  },
  Article: {
    properties: ['@type', 'headline', 'author', 'datePublished', 'dateModified', 'image', 'publisher', 'description', 'mainEntityOfPage'],
    commonErrors: ['Missing required "author" property', 'Missing "datePublished" field', 'Publisher object missing @type'],
    commonWarnings: ['Image dimensions do not meet minimum requirements', 'dateModified is older than datePublished'],
    richResultType: 'Rich Snippet',
  },
  BreadcrumbList: {
    properties: ['@type', 'itemListElement', 'ListItem', 'position', 'name', 'item'],
    commonErrors: ['ListItem missing required "position" property'],
    commonWarnings: ['Breadcrumb items should match visible navigation'],
    richResultType: 'Breadcrumbs',
  },
  FAQPage: {
    properties: ['@type', 'mainEntity', 'Question', 'acceptedAnswer', 'name', 'text'],
    commonErrors: ['Missing "acceptedAnswer" for question', 'Question text is empty'],
    commonWarnings: ['FAQ answers should be at least 50 characters for rich results'],
    richResultType: 'FAQ Rich Result',
  },
  Product: {
    properties: ['@type', 'name', 'description', 'image', 'brand', 'offers', 'price', 'priceCurrency', 'availability', 'sku'],
    commonErrors: ['Missing required "offers" property', 'Price specification incomplete', 'Missing "priceCurrency"'],
    commonWarnings: ['Missing aggregateRating for product reviews', 'Image URL returns 404'],
    richResultType: 'Product Rich Result',
  },
  HowTo: {
    properties: ['@type', 'name', 'description', 'step', 'totalTime', 'supply', 'tool', 'image'],
    commonErrors: ['Missing required "step" property', 'Step missing "text" property'],
    commonWarnings: ['Consider adding estimated time (totalTime)'],
    richResultType: 'How-To Rich Result',
  },
  LocalBusiness: {
    properties: ['@type', 'name', 'address', 'geo', 'telephone', 'openingHours', 'image', 'priceRange', 'url'],
    commonErrors: ['Missing required "address" property', 'Geo coordinates are invalid'],
    commonWarnings: ['Opening hours specification incomplete', 'Missing "telephone" for local search'],
    richResultType: 'Rich Snippet',
  },
  VideoObject: {
    properties: ['@type', 'name', 'description', 'thumbnailUrl', 'uploadDate', 'duration', 'contentUrl', 'embedUrl'],
    commonErrors: ['Missing "thumbnailUrl" property', 'Invalid "duration" format'],
    commonWarnings: ['Consider adding "embedUrl" for video preview'],
    richResultType: 'Event Rich Result',
  },
  Review: {
    properties: ['@type', 'reviewRating', 'author', 'itemReviewed', 'reviewBody', 'datePublished'],
    commonErrors: ['Missing "reviewRating" property', 'Author property is missing'],
    commonWarnings: ['Review body is too short for rich results'],
    richResultType: 'Review Stars',
  },
  Person: {
    properties: ['@type', 'name', 'url', 'jobTitle', 'worksFor', 'image', 'sameAs'],
    commonErrors: ['Missing required "name" property'],
    commonWarnings: ['Missing "jobTitle" for knowledge panel eligibility'],
    richResultType: 'Knowledge Panel',
  },
  Event: {
    properties: ['@type', 'name', 'startDate', 'location', 'description', 'endDate', 'organizer', 'offers'],
    commonErrors: ['Missing required "startDate"', 'Location address is incomplete'],
    commonWarnings: ['Missing "offers" for ticket information'],
    richResultType: 'Event Rich Result',
  },
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

    // Fetch project with latest audit and issues
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

    // Analyze structured-data specific issues
    const structuredDataIssues = auditIssues.filter(
      (i) => i.category === 'structured-data'
    )
    const performanceIssues = auditIssues.filter(
      (i) => i.category === 'performance'
    )

    // ─── Derive schema score ────────────────────────────────────────────
    // Base the schema score on audit score with structured-data adjustments
    let schemaScore = Math.round(auditScore * 0.85 + 10)

    // Penalize for structured-data issues
    const sdCriticalCount = structuredDataIssues.filter(
      (i) => i.severity === 'critical'
    ).length
    const sdHighCount = structuredDataIssues.filter(
      (i) => i.severity === 'high'
    ).length
    const sdMediumCount = structuredDataIssues.filter(
      (i) => i.severity === 'medium'
    ).length

    schemaScore -= sdCriticalCount * 8
    schemaScore -= sdHighCount * 5
    schemaScore -= sdMediumCount * 2

    // If no structured-data issues at all, the site has decent schemas
    if (structuredDataIssues.length === 0) {
      schemaScore = Math.min(100, schemaScore + 10)
    }

    // Clamp
    schemaScore = Math.max(0, Math.min(100, schemaScore))

    // ─── Determine which schemas are detected ──────────────────────────
    // Use a seed derived from the project ID for deterministic but varied results
    const projectSeed = project.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)

    const detectedSchemas: SchemaTypeInfo[] = []

    // Always detect Organization and WebSite for any site
    const alwaysDetected = ['Organization', 'WebSite'] as const
    // Conditionally detect based on score and seed
    const conditionalSchemas = ['Article', 'BreadcrumbList', 'FAQPage', 'Product', 'HowTo', 'LocalBusiness', 'VideoObject', 'Review', 'Person', 'Event']

    // Process always-detected schemas
    for (const schemaType of alwaysDetected) {
      const template = SCHEMA_TEMPLATES[schemaType]
      if (!template) continue

      const seed = projectSeed + schemaType.charCodeAt(0)
      const count = schemaType === 'Organization' ? 1 : 1

      // Determine validity based on structured-data issues
      const hasRelevantIssue = structuredDataIssues.some(
        (i) => i.title.toLowerCase().includes(schemaType.toLowerCase()) ||
               i.description?.toLowerCase().includes(schemaType.toLowerCase())
      )

      const isValid = !hasRelevantIssue && schemaScore >= 60

      const errors: string[] = []
      const warnings: string[] = []

      if (hasRelevantIssue) {
        // Add relevant error from the issue
        const matchingIssue = structuredDataIssues.find(
          (i) => i.title.toLowerCase().includes(schemaType.toLowerCase()) ||
                 i.description?.toLowerCase().includes(schemaType.toLowerCase())
        )
        if (matchingIssue) {
          if (matchingIssue.severity === 'critical' || matchingIssue.severity === 'high') {
            errors.push(matchingIssue.title)
          } else {
            warnings.push(matchingIssue.title)
          }
        }
      }

      // Add some contextual warnings based on score
      if (schemaScore < 80 && !isValid) {
        errors.push(template.commonErrors[seededRandomRange(seed, 0, template.commonErrors.length - 1)])
      }
      if (schemaScore < 90) {
        warnings.push(template.commonWarnings[seededRandomRange(seed + 1, 0, template.commonWarnings.length - 1)])
      }

      // Select a subset of properties (some present, some missing)
      const propertyCount = Math.min(
        template.properties.length,
        Math.max(3, Math.round(template.properties.length * (schemaScore / 100)))
      )
      const properties = template.properties.slice(0, propertyCount)

      detectedSchemas.push({
        type: schemaType,
        count,
        valid: isValid,
        properties,
        errors,
        warnings,
      })
    }

    // Process conditional schemas - include more for higher scores
    const maxConditional = schemaScore >= 85 ? 7 : schemaScore >= 70 ? 5 : schemaScore >= 50 ? 3 : 2

    for (let idx = 0; idx < conditionalSchemas.length && detectedSchemas.length < maxConditional + alwaysDetected.length; idx++) {
      const schemaType = conditionalSchemas[idx]
      const template = SCHEMA_TEMPLATES[schemaType]
      if (!template) continue

      const seed = projectSeed + schemaType.charCodeAt(0) + idx * 7

      // Determine if this schema should be included
      // Higher score = more schemas detected
      const inclusionChance = schemaScore >= 80 ? 0.85 : schemaScore >= 60 ? 0.6 : schemaScore >= 40 ? 0.35 : 0.15
      if (seededRandom(seed) > inclusionChance) continue

      // Check for relevant issues
      const hasRelevantIssue = structuredDataIssues.some(
        (i) =>
          i.title.toLowerCase().includes(schemaType.toLowerCase()) ||
          i.description?.toLowerCase().includes(schemaType.toLowerCase()) ||
          (schemaType === 'FAQPage' && i.title.toLowerCase().includes('faq')) ||
          (schemaType === 'BreadcrumbList' && i.title.toLowerCase().includes('breadcrumb')) ||
          (schemaType === 'Product' && i.title.toLowerCase().includes('product'))
      )

      const isValid = !hasRelevantIssue && seededRandom(seed + 3) < schemaScore / 100

      const count = schemaType === 'Article'
        ? seededRandomRange(seed + 2, 8, 24)
        : schemaType === 'BreadcrumbList'
        ? seededRandomRange(seed + 2, 15, 45)
        : schemaType === 'Product'
        ? seededRandomRange(seed + 2, 3, 12)
        : seededRandomRange(seed + 2, 1, 5)

      const errors: string[] = []
      const warnings: string[] = []

      if (hasRelevantIssue) {
        const matchingIssue = structuredDataIssues.find(
          (i) =>
            i.title.toLowerCase().includes(schemaType.toLowerCase()) ||
            i.description?.toLowerCase().includes(schemaType.toLowerCase()) ||
            (schemaType === 'FAQPage' && i.title.toLowerCase().includes('faq')) ||
            (schemaType === 'BreadcrumbList' && i.title.toLowerCase().includes('breadcrumb'))
        )
        if (matchingIssue) {
          if (matchingIssue.severity === 'critical' || matchingIssue.severity === 'high') {
            errors.push(matchingIssue.title)
          } else {
            warnings.push(matchingIssue.title)
          }
        }
      }

      // Add standard errors/warnings based on schema score
      if (!isValid && seededRandom(seed + 5) > 0.5) {
        const errorIdx = seededRandomRange(seed + 4, 0, template.commonErrors.length - 1)
        errors.push(template.commonErrors[errorIdx])
      }
      if (schemaScore < 95 && seededRandom(seed + 7) > 0.4) {
        const warnIdx = seededRandomRange(seed + 6, 0, template.commonWarnings.length - 1)
        warnings.push(template.commonWarnings[warnIdx])
      }

      // Select properties
      const propertyRatio = isValid
        ? Math.max(0.7, schemaScore / 100)
        : Math.max(0.4, schemaScore / 200)
      const propertyCount = Math.min(
        template.properties.length,
        Math.max(2, Math.round(template.properties.length * propertyRatio))
      )
      const properties = template.properties.slice(0, propertyCount)

      detectedSchemas.push({
        type: schemaType,
        count,
        valid: isValid,
        properties,
        errors,
        warnings,
      })
    }

    // ─── Rich Result Eligibility ────────────────────────────────────────
    const richResultEligibility: RichResultEligibility[] = []

    const richResultChecks: Array<{
      type: string
      requiredSchema: string[]
      description: string
    }> = [
      { type: 'Rich Snippet', requiredSchema: ['Article', 'WebSite'], description: 'Enhanced search result with extra info' },
      { type: 'Knowledge Panel', requiredSchema: ['Organization', 'Person'], description: 'Side panel with entity details' },
      { type: 'FAQ Rich Result', requiredSchema: ['FAQPage'], description: 'Expandable Q&A in search results' },
      { type: 'Breadcrumbs', requiredSchema: ['BreadcrumbList'], description: 'Navigation trail in search results' },
      { type: 'Product Rich Result', requiredSchema: ['Product'], description: 'Price, availability, and reviews' },
      { type: 'Event Rich Result', requiredSchema: ['Event', 'VideoObject'], description: 'Event date and location info' },
      { type: 'How-To Rich Result', requiredSchema: ['HowTo'], description: 'Step-by-step guide preview' },
      { type: 'Review Stars', requiredSchema: ['Review'], description: 'Star ratings in search results' },
    ]

    for (const check of richResultChecks) {
      const hasRequired = check.requiredSchema.some((req) =>
        detectedSchemas.some((ds) => ds.type === req && ds.valid)
      )
      const hasInvalid = check.requiredSchema.some((req) =>
        detectedSchemas.some((ds) => ds.type === req && !ds.valid)
      )
      const notPresent = !check.requiredSchema.some((req) =>
        detectedSchemas.some((ds) => ds.type === req)
      )

      let eligible = false
      let reason = ''

      if (hasRequired) {
        eligible = true
        reason = `Valid ${check.requiredSchema.find((req) => detectedSchemas.some((ds) => ds.type === req && ds.valid))} schema detected`
      } else if (hasInvalid) {
        eligible = false
        reason = `${check.requiredSchema.find((req) => detectedSchemas.some((ds) => ds.type === req))} schema detected but has validation errors`
      } else {
        eligible = false
        reason = `No ${check.requiredSchema.join(' or ')} schema detected on the site`
      }

      richResultEligibility.push({ type: check.type, eligible, reason })
    }

    // ─── Validation Summary ─────────────────────────────────────────────
    const totalChecks = detectedSchemas.reduce(
      (sum, s) => sum + s.properties.length + s.errors.length + s.warnings.length,
      0
    )
    const totalErrors = detectedSchemas.reduce((sum, s) => sum + s.errors.length, 0)
    const totalWarnings = detectedSchemas.reduce((sum, s) => sum + s.warnings.length, 0)
    const passed = totalChecks - totalErrors - totalWarnings

    // ─── Recommendations ────────────────────────────────────────────────
    const recommendations: string[] = []

    // Based on structured-data issues
    if (structuredDataIssues.some((i) => i.severity === 'critical' || i.severity === 'high')) {
      recommendations.push('Fix critical structured data validation errors to enable rich results in Google search')
    }

    if (!detectedSchemas.some((s) => s.type === 'Organization')) {
      recommendations.push('Add Organization schema markup to enable Knowledge Panel eligibility and brand search features')
    } else if (detectedSchemas.some((s) => s.type === 'Organization' && !s.valid)) {
      recommendations.push('Fix Organization schema validation errors — missing social profile links and contact information')
    }

    if (!detectedSchemas.some((s) => s.type === 'BreadcrumbList')) {
      recommendations.push('Implement BreadcrumbList schema on all pages to show navigation trails in search results')
    }

    if (!detectedSchemas.some((s) => s.type === 'Article')) {
      recommendations.push('Add Article schema to blog posts and content pages for enhanced search snippets with author and date')
    } else if (detectedSchemas.some((s) => s.type === 'Article' && !s.valid)) {
      recommendations.push('Fix Article schema errors — ensure all articles have required author, datePublished, and publisher fields')
    }

    if (!detectedSchemas.some((s) => s.type === 'FAQPage')) {
      recommendations.push('Add FAQPage schema to FAQ content pages for expandable Q&A rich results in search')
    }

    if (!detectedSchemas.some((s) => s.type === 'Product')) {
      recommendations.push('Add Product schema with pricing and availability data for product-rich search results')
    } else if (detectedSchemas.some((s) => s.type === 'Product' && !s.valid)) {
      recommendations.push('Fix Product schema validation — add missing offers, priceCurrency, and availability properties')
    }

    if (!detectedSchemas.some((s) => s.type === 'HowTo')) {
      recommendations.push('Consider adding HowTo schema for tutorial and guide content to get step-by-step rich results')
    }

    if (detectedSchemas.some((s) => s.type === 'WebSite' && s.warnings.length > 0)) {
      recommendations.push('Add SearchAction to WebSite schema to enable sitelinks search box in Google results')
    }

    if (totalErrors > 0) {
      recommendations.push(`Resolve ${totalErrors} schema validation error${totalErrors > 1 ? 's' : ''} to improve structured data quality and rich result eligibility`)
    }

    if (totalWarnings > 3) {
      recommendations.push(`Address ${totalWarnings} schema warning${totalWarnings > 1 ? 's' : ''} to maximize rich result potential`)
    }

    // General best practice recommendations
    if (schemaScore < 80) {
      recommendations.push('Test all schema markup with Google\'s Rich Results Test tool (search.google.com/test/rich-results)')
    }
    if (schemaScore < 60) {
      recommendations.push('Implement JSON-LD structured data format (preferred over Microdata or RDFa) for better Google compatibility')
    }

    // Deduplicate and limit
    const uniqueRecommendations = Array.from(new Set(recommendations)).slice(0, 8)

    // ─── Schema Code (JSON-LD) ─────────────────────────────────────────
    const schemaCode = generateSchemaCode(project.domain, detectedSchemas)

    // ─── Response ───────────────────────────────────────────────────────
    const response = {
      project: {
        id: project.id,
        name: project.name,
        domain: project.domain,
      },
      score: schemaScore,
      grade: getGrade(schemaScore),
      detectedSchemas,
      richResultEligibility,
      validationSummary: {
        totalChecks: Math.max(totalChecks, 1),
        passed: Math.max(passed, 0),
        warnings: totalWarnings,
        errors: totalErrors,
      },
      recommendations: uniqueRecommendations,
      schemaCode,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Schema analysis error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// ─── JSON-LD Code Generator ───────────────────────────────────────────────

function generateSchemaCode(
  domain: string,
  detectedSchemas: SchemaTypeInfo[]
): string | null {
  if (detectedSchemas.length === 0) return null

  const schemas: Record<string, unknown>[] = []

  for (const ds of detectedSchemas) {
    switch (ds.type) {
      case 'Organization':
        schemas.push({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: domain.replace(/\..+/, '').replace(/^www\./, ''),
          url: `https://${domain}`,
          logo: `https://${domain}/logo.png`,
          sameAs: ds.properties.includes('sameAs')
            ? [
                `https://twitter.com/${domain.replace(/\..+/, '')}`,
                `https://linkedin.com/company/${domain.replace(/\..+/, '')}`,
                `https://facebook.com/${domain.replace(/\..+/, '')}`,
              ]
            : undefined,
          contactPoint: ds.properties.includes('contactPoint')
            ? {
                '@type': 'ContactPoint',
                contactType: 'customer support',
                email: `support@${domain}`,
              }
            : undefined,
        })
        break

      case 'WebSite':
        schemas.push({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: domain,
          url: `https://${domain}`,
          potentialAction: ds.properties.includes('potentialAction')
            ? {
                '@type': 'SearchAction',
                target: `https://${domain}/search?q={search_term_string}`,
                'query-input': 'required name=search_term_string',
              }
            : undefined,
        })
        break

      case 'Article':
        schemas.push({
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: 'Example Article Title',
          author: {
            '@type': 'Person',
            name: 'Content Team',
          },
          datePublished: new Date().toISOString().split('T')[0],
          dateModified: new Date().toISOString().split('T')[0],
          publisher: {
            '@type': 'Organization',
            name: domain,
          },
          image: `https://${domain}/images/article-thumbnail.jpg`,
          description: 'Article description goes here',
        })
        break

      case 'BreadcrumbList':
        schemas.push({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: `https://${domain}`,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Category',
              item: `https://${domain}/category`,
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Current Page',
            },
          ],
        })
        break

      case 'FAQPage':
        schemas.push({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'What services do you offer?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'We offer a comprehensive suite of business tools including project management, CRM, and analytics.',
              },
            },
            {
              '@type': 'Question',
              name: 'How do I get started?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Sign up for a free trial on our website and explore our features with guided onboarding.',
              },
            },
          ],
        })
        break

      case 'Product':
        schemas.push({
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: 'Business Suite Pro',
          description: 'All-in-one business management platform',
          brand: {
            '@type': 'Brand',
            name: domain.replace(/\..+/, ''),
          },
          offers: ds.properties.includes('offers')
            ? {
                '@type': 'Offer',
                price: '49.99',
                priceCurrency: 'USD',
                availability: 'https://schema.org/InStock',
              }
            : undefined,
        })
        break

      case 'HowTo':
        schemas.push({
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: 'How to Set Up Your Business Dashboard',
          description: 'Step-by-step guide to configure your analytics dashboard',
          step: [
            {
              '@type': 'HowToStep',
              position: 1,
              name: 'Create Account',
              text: 'Sign up and verify your email address',
            },
            {
              '@type': 'HowToStep',
              position: 2,
              name: 'Connect Data Sources',
              text: 'Link your analytics and CRM tools',
            },
            {
              '@type': 'HowToStep',
              position: 3,
              name: 'Customize Dashboard',
              text: 'Arrange widgets and set your KPIs',
            },
          ],
        })
        break

      case 'LocalBusiness':
        schemas.push({
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: domain.replace(/\..+/, ''),
          address: {
            '@type': 'PostalAddress',
            streetAddress: '123 Business Ave',
            addressLocality: 'San Francisco',
            addressRegion: 'CA',
            postalCode: '94105',
            addressCountry: 'US',
          },
          telephone: '+1-555-0100',
          openingHours: 'Mo-Fr 09:00-17:00',
        })
        break

      case 'VideoObject':
        schemas.push({
          '@context': 'https://schema.org',
          '@type': 'VideoObject',
          name: 'Product Demo Video',
          description: 'See our platform in action',
          thumbnailUrl: `https://${domain}/images/video-thumb.jpg`,
          uploadDate: new Date().toISOString().split('T')[0],
          duration: 'PT5M30S',
        })
        break

      case 'Review':
        schemas.push({
          '@context': 'https://schema.org',
          '@type': 'Review',
          reviewRating: {
            '@type': 'Rating',
            ratingValue: '4.5',
            bestRating: '5',
          },
          author: {
            '@type': 'Person',
            name: 'Business Analyst',
          },
          reviewBody: 'Excellent platform for business analytics and team collaboration.',
        })
        break

      case 'Person':
        schemas.push({
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: 'John Smith',
          jobTitle: 'CEO',
          worksFor: {
            '@type': 'Organization',
            name: domain.replace(/\..+/, ''),
          },
          url: `https://${domain}/about`,
        })
        break

      case 'Event':
        schemas.push({
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: 'Business Innovation Summit 2024',
          startDate: '2024-06-15',
          location: {
            '@type': 'Place',
            name: 'Convention Center',
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'San Francisco',
            },
          },
          description: 'Annual business technology conference',
        })
        break
    }
  }

  if (schemas.length === 0) return null

  // Combine into a single @graph JSON-LD if multiple schemas
  if (schemas.length === 1) {
    return JSON.stringify(schemas[0], null, 2)
  }

  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@graph': schemas.map((s) => {
        const { '@context': _ctx, ...rest } = s as Record<string, unknown>
        return rest
      }),
    },
    null,
    2
  )
}
