import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// ─── Helpers ──────────────────────────────────────────────────────────────

function getGrade(score: number): string {
  if (score >= 90) return 'A+'
  if (score >= 80) return 'A'
  if (score >= 70) return 'B'
  if (score >= 60) return 'C'
  if (score >= 40) return 'D'
  return 'F'
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

// ─── Real Schema Detection from HTML ──────────────────────────────────────

function extractJsonLdSchemas(html: string): Array<Record<string, unknown>> {
  const schemas: Array<Record<string, unknown>> = []
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match

  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const jsonStr = match[1].trim()
      if (!jsonStr) continue
      const parsed = JSON.parse(jsonStr)
      if (Array.isArray(parsed)) {
        schemas.push(...parsed)
      } else {
        schemas.push(parsed)
      }
    } catch {
      // Invalid JSON-LD, skip
    }
  }

  return schemas
}

function extractMicrodataSchemas(html: string): SchemaTypeInfo[] {
  const schemas: SchemaTypeInfo[] = []
  const itemscopeRegex = /itemscope[^>]*itemtype=["']([^"']+)["']/gi
  const foundTypes = new Map<string, number>()

  let match
  while ((match = itemscopeRegex.exec(html)) !== null) {
    const typeUrl = match[1]
    const typeName = typeUrl.split('/').pop() || typeUrl
    foundTypes.set(typeName, (foundTypes.get(typeName) || 0) + 1)
  }

  for (const [type, count] of foundTypes) {
    // Extract properties from itemprop within itemscope blocks
    const itempropRegex = new RegExp(`itemscope[^>]*itemtype=["'][^"']*${type}[^"']*["'][^>]*>([\\s\\S]*?)(?=<[^/][^>]*itemscope|<\/div>|<\/section>|<\/article>|<\/main>)`, 'gi')
    const propMatch = itempropRegex.exec(html)
    const properties: string[] = []

    if (propMatch) {
      const block = propMatch[1]
      const propRegex = /itemprop=["']([^"']+)["']/gi
      let propItem
      while ((propItem = propRegex.exec(block)) !== null) {
        if (!properties.includes(propItem[1])) {
          properties.push(propItem[1])
        }
      }
    }

    schemas.push({
      type,
      count,
      valid: properties.length > 0,
      properties,
      errors: properties.length === 0 ? ['No itemprops found within itemscope'] : [],
      warnings: [],
    })
  }

  return schemas
}

function validateJsonLdSchema(schema: Record<string, unknown>): { errors: string[]; warnings: string[]; properties: string[] } {
  const errors: string[] = []
  const warnings: string[] = []
  const properties: string[] = []

  const type = schema['@type'] as string | undefined
  if (!type) {
    errors.push('Missing required "@type" property')
    return { errors, warnings, properties }
  }

  // Extract all properties
  for (const key of Object.keys(schema)) {
    if (key.startsWith('@')) continue
    properties.push(key)
  }

  // Type-specific validation
  const requiredFields: Record<string, string[]> = {
    Organization: ['name'],
    WebSite: ['name', 'url'],
    Article: ['headline', 'author', 'datePublished', 'publisher'],
    Product: ['name', 'offers'],
    FAQPage: ['mainEntity'],
    HowTo: ['name', 'step'],
    LocalBusiness: ['name', 'address'],
    BreadcrumbList: ['itemListElement'],
    VideoObject: ['name', 'thumbnailUrl', 'uploadDate'],
    Review: ['reviewRating', 'author'],
    Person: ['name'],
    Event: ['name', 'startDate', 'location'],
  }

  const recommendedFields: Record<string, string[]> = {
    Organization: ['url', 'logo', 'sameAs', 'contactPoint'],
    WebSite: ['potentialAction'],
    Article: ['image', 'dateModified', 'description'],
    Product: ['description', 'image', 'brand'],
    FAQPage: [],
    HowTo: ['description', 'image', 'totalTime'],
    LocalBusiness: ['telephone', 'openingHours', 'geo'],
    BreadcrumbList: [],
    VideoObject: ['description', 'duration', 'embedUrl'],
    Review: ['itemReviewed', 'reviewBody'],
    Person: ['url', 'jobTitle', 'sameAs'],
    Event: ['description', 'endDate', 'offers'],
  }

  const schemaType = Array.isArray(type) ? type[0] : type
  const reqFields = requiredFields[schemaType] || []
  const recFields = recommendedFields[schemaType] || []

  for (const field of reqFields) {
    if (!schema[field]) {
      errors.push(`Missing required "${field}" property for ${schemaType}`)
    }
  }

  for (const field of recFields) {
    if (!schema[field]) {
      warnings.push(`Missing recommended "${field}" property for ${schemaType}`)
    }
  }

  // Check @context
  if (!schema['@context']) {
    warnings.push('Missing "@context" property — should be "https://schema.org"')
  }

  // Validate nested objects
  if (schema.author && typeof schema.author === 'object') {
    const author = schema.author as Record<string, unknown>
    if (!author['@type'] && !author.name) {
      errors.push('Author object missing "@type" or "name" property')
    }
  }

  if (schema.publisher && typeof schema.publisher === 'object') {
    const publisher = schema.publisher as Record<string, unknown>
    if (!publisher['@type']) {
      warnings.push('Publisher object missing "@type" property')
    }
  }

  if (schema.offers && typeof schema.offers === 'object') {
    const offers = schema.offers as Record<string, unknown>
    if (!offers.price && !offers.lowPrice && !offers.highPrice) {
      errors.push('Offer missing "price" property')
    }
    if (!offers.priceCurrency) {
      warnings.push('Offer missing "priceCurrency" property')
    }
  }

  return { errors, warnings, properties }
}

function processDetectedSchemas(jsonLdSchemas: Array<Record<string, unknown>>, microdataSchemas: SchemaTypeInfo[]): SchemaTypeInfo[] {
  const results: SchemaTypeInfo[] = []
  const typeCounts = new Map<string, { count: number; schemas: Record<string, unknown>[] }>()

  // Group JSON-LD schemas by type
  for (const schema of jsonLdSchemas) {
    const type = schema['@type'] as string | string[] | undefined
    if (!type) continue

    const types = Array.isArray(type) ? type : [type]
    for (const t of types) {
      const existing = typeCounts.get(t) || { count: 0, schemas: [] }
      existing.count++
      existing.schemas.push(schema)
      typeCounts.set(t, existing)
    }

    // Handle @graph
    if (schema['@graph'] && Array.isArray(schema['@graph'])) {
      for (const graphItem of schema['@graph'] as Array<Record<string, unknown>>) {
        const graphType = graphItem['@type'] as string | undefined
        if (graphType) {
          const existing = typeCounts.get(graphType) || { count: 0, schemas: [] }
          existing.count++
          existing.schemas.push(graphItem)
          typeCounts.set(graphType, existing)
        }
      }
    }
  }

  // Process JSON-LD schemas
  for (const [type, data] of typeCounts) {
    // Validate the first schema of each type
    const validation = validateJsonLdSchema(data.schemas[0])

    results.push({
      type,
      count: data.count,
      valid: validation.errors.length === 0,
      properties: validation.properties,
      errors: validation.errors,
      warnings: validation.warnings,
    })
  }

  // Merge microdata schemas (if not already in JSON-LD)
  for (const mdSchema of microdataSchemas) {
    const existing = results.find(r => r.type === mdSchema.type)
    if (existing) {
      existing.count += mdSchema.count
      existing.properties = [...new Set([...existing.properties, ...mdSchema.properties])]
      // Keep JSON-LD validation results as authoritative
    } else {
      results.push(mdSchema)
    }
  }

  return results
}

function generateSchemaCode(domain: string, detectedSchemas: SchemaTypeInfo[]): string | null {
  if (detectedSchemas.length === 0) return null

  const schemas: Record<string, unknown>[] = []

  for (const ds of detectedSchemas) {
    // Generate recommended schema code for missing/invalid schemas
    const baseSchema: Record<string, unknown> = {
      '@type': ds.type,
    }

    // Add recommended properties based on type
    const typeDefaults: Record<string, Record<string, unknown>> = {
      Organization: {
        name: domain.replace(/\..+/, '').replace(/^www\./, ''),
        url: `https://${domain}`,
        logo: `https://${domain}/logo.png`,
        sameAs: [],
        contactPoint: { '@type': 'ContactPoint', contactType: 'customer support' },
      },
      WebSite: {
        name: domain,
        url: `https://${domain}`,
        potentialAction: {
          '@type': 'SearchAction',
          target: `https://${domain}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
      Article: {
        headline: 'Article Title',
        author: { '@type': 'Person', name: 'Author Name' },
        datePublished: new Date().toISOString().split('T')[0],
        publisher: { '@type': 'Organization', name: domain },
      },
      BreadcrumbList: {
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `https://${domain}` },
        ],
      },
      FAQPage: {
        mainEntity: [
          { '@type': 'Question', name: 'Question?', acceptedAnswer: { '@type': 'Answer', text: 'Answer.' } },
        ],
      },
      Product: {
        name: 'Product Name',
        description: 'Product description',
        offers: { '@type': 'Offer', price: '0.00', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
      },
    }

    const defaults = typeDefaults[ds.type]
    if (defaults) {
      Object.assign(baseSchema, defaults)
    }

    // Add properties that exist in the detected schema
    for (const prop of ds.properties) {
      if (!baseSchema[prop]) {
        baseSchema[prop] = `[${prop} value]`
      }
    }

    schemas.push(baseSchema)
  }

  if (schemas.length === 0) return null

  if (schemas.length === 1) {
    return JSON.stringify({ '@context': 'https://schema.org', ...schemas[0] }, null, 2)
  }

  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@graph': schemas,
    },
    null,
    2,
  )
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
          { status: 404 },
        )
      }
      resolvedProjectId = firstProject.id
    }

    // Fetch project
    const project = await db.project.findUnique({
      where: { id: resolvedProjectId },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 },
      )
    }

    const latestAudit = await db.siteAudit.findFirst({
      where: { projectId: resolvedProjectId, status: 'completed' },
      orderBy: { createdAt: 'desc' },
      include: { issues: true },
    })

    const auditScore = latestAudit?.score ?? 50
    const auditIssues = latestAudit?.issues ?? []
    const structuredDataIssues = auditIssues.filter(
      (i) => i.category === 'structured-data',
    )

    // ── Fetch the actual website HTML and parse schemas ──
    let pageHtml = ''
    let detectedSchemas: SchemaTypeInfo[] = []
    let hasJsonLd = false
    let hasMicrodata = false

    try {
      const zai = await ZAI.create()
      const pageResult = await zai.functions.invoke('page_reader', {
        url: `https://${project.domain}`,
      })

      if (pageResult?.code === 200 && pageResult?.data?.html) {
        pageHtml = pageResult.data.html

        // Extract JSON-LD schemas
        const jsonLdSchemas = extractJsonLdSchemas(pageHtml)
        hasJsonLd = jsonLdSchemas.length > 0

        // Extract Microdata schemas
        const microdataSchemas = extractMicrodataSchemas(pageHtml)
        hasMicrodata = microdataSchemas.length > 0

        // Process and validate all detected schemas
        detectedSchemas = processDetectedSchemas(jsonLdSchemas, microdataSchemas)
      }
    } catch (err) {
      console.error('Schema fetch error:', err)
      // If we can't fetch the page, we'll generate analysis from audit data
    }

    // ── Compute schema score based on real findings ──
    let schemaScore = 30 // Start low

    if (detectedSchemas.length > 0) {
      // Base score for having schemas
      schemaScore += 15

      // Score for each valid schema
      const validCount = detectedSchemas.filter(s => s.valid).length
      schemaScore += Math.min(30, validCount * 10)

      // Score for variety
      const uniqueTypes = new Set(detectedSchemas.map(s => s.type)).size
      schemaScore += Math.min(15, uniqueTypes * 5)

      // Penalty for errors
      const totalErrors = detectedSchemas.reduce((sum, s) => sum + s.errors.length, 0)
      schemaScore -= totalErrors * 3

      // Penalty for warnings
      const totalWarnings = detectedSchemas.reduce((sum, s) => sum + s.warnings.length, 0)
      schemaScore -= totalWarnings * 1
    }

    // Bonus for having both JSON-LD and Microdata
    if (hasJsonLd && hasMicrodata) {
      schemaScore += 5
    }

    // Adjust based on structured-data audit issues
    const sdCriticalCount = structuredDataIssues.filter(i => i.severity === 'critical').length
    const sdHighCount = structuredDataIssues.filter(i => i.severity === 'high').length
    schemaScore -= sdCriticalCount * 5
    schemaScore -= sdHighCount * 3

    // Clamp
    schemaScore = Math.max(0, Math.min(100, schemaScore))

    // ── If no schemas detected, provide helpful analysis ──
    if (detectedSchemas.length === 0) {
      // Use LLM to analyze what schemas would be beneficial
      let llmSuggestions: SchemaTypeInfo[] = []
      try {
        const zai = await ZAI.create()
        const llmResponse = await zai.chat.completions.create({
          messages: [
            {
              role: 'assistant',
              content: `You are a structured data expert. Given a website domain and available audit data, suggest what Schema.org types should be implemented. Return ONLY a JSON array of objects with this format:
[{"type": "SchemaType", "reason": "Why this schema is recommended"}]
Return 3-6 recommended schemas. Return ONLY the JSON array.`,
            },
            {
              role: 'user',
              content: `Domain: ${project.domain}
Audit score: ${auditScore}
Audit issues: ${auditIssues.slice(0, 5).map(i => i.title).join(', ')}
Has structured data issues: ${structuredDataIssues.length > 0}

What Schema.org structured data should this website implement?`,
            },
          ],
          thinking: { type: 'disabled' },
        })

        const content = llmResponse.choices?.[0]?.message?.content || ''
        const jsonMatch = content.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          llmSuggestions = JSON.parse(jsonMatch[0])
        }
      } catch {
        // Fallback suggestions
        llmSuggestions = [
          { type: 'Organization', reason: 'Essential for brand knowledge panel' },
          { type: 'WebSite', reason: 'Enables sitelinks search box' },
          { type: 'BreadcrumbList', reason: 'Shows navigation trail in search results' },
        ]
      }

      // Add LLM suggestions as "missing" schemas
      for (const suggestion of llmSuggestions) {
        detectedSchemas.push({
          type: suggestion.type,
          count: 0,
          valid: false,
          properties: [],
          errors: [`Schema not implemented — ${suggestion.reason}`],
          warnings: [],
        })
      }
    }

    // ── Rich Result Eligibility ──
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
      { type: 'Review Stars', requiredSchema: ['Review', 'AggregateRating'], description: 'Star ratings in search results' },
    ]

    for (const check of richResultChecks) {
      const hasValid = check.requiredSchema.some(req =>
        detectedSchemas.some(ds => ds.type === req && ds.valid),
      )
      const hasInvalid = check.requiredSchema.some(req =>
        detectedSchemas.some(ds => ds.type === req && !ds.valid),
      )
      const hasWithErrors = check.requiredSchema.some(req =>
        detectedSchemas.some(ds => ds.type === req && ds.valid && ds.errors.length > 0),
      )

      let eligible = false
      let reason = ''

      if (hasValid && !hasWithErrors) {
        eligible = true
        reason = `Valid ${check.requiredSchema.find(req => detectedSchemas.some(ds => ds.type === req && ds.valid))} schema detected`
      } else if (hasWithErrors) {
        eligible = false
        reason = `${check.requiredSchema.find(req => detectedSchemas.some(ds => ds.type === req))} schema detected but has validation errors`
      } else if (hasInvalid) {
        eligible = false
        reason = `${check.requiredSchema.find(req => detectedSchemas.some(ds => ds.type === req))} schema found but needs fixes`
      } else {
        eligible = false
        reason = `No ${check.requiredSchema.join(' or ')} schema detected on the site`
      }

      richResultEligibility.push({ type: check.type, eligible, reason })
    }

    // ── Validation Summary ──
    const totalErrors = detectedSchemas.reduce((sum, s) => sum + s.errors.length, 0)
    const totalWarnings = detectedSchemas.reduce((sum, s) => sum + s.warnings.length, 0)
    const totalChecks = detectedSchemas.reduce(
      (sum, s) => sum + s.properties.length + s.errors.length + s.warnings.length,
      0,
    )
    const passed = totalChecks - totalErrors - totalWarnings

    // ── Recommendations ──
    const recommendations: string[] = []

    if (detectedSchemas.length === 0) {
      recommendations.push('No structured data found — implement JSON-LD markup to enable rich results in Google search')
      recommendations.push('Start with Organization and WebSite schemas as they are foundational for all websites')
    }

    if (!detectedSchemas.some(s => s.type === 'Organization' && s.valid)) {
      recommendations.push('Add or fix Organization schema markup to enable Knowledge Panel eligibility and brand search features')
    }

    if (!detectedSchemas.some(s => s.type === 'BreadcrumbList')) {
      recommendations.push('Implement BreadcrumbList schema on all pages to show navigation trails in search results')
    }

    if (!detectedSchemas.some(s => s.type === 'Article')) {
      recommendations.push('Add Article schema to blog posts and content pages for enhanced search snippets')
    } else if (detectedSchemas.some(s => s.type === 'Article' && !s.valid)) {
      recommendations.push('Fix Article schema — ensure all articles have required author, datePublished, and publisher fields')
    }

    if (!detectedSchemas.some(s => s.type === 'FAQPage')) {
      recommendations.push('Add FAQPage schema to FAQ content for expandable Q&A rich results in search')
    }

    if (!detectedSchemas.some(s => s.type === 'Product')) {
      recommendations.push('Add Product schema with pricing and availability data for product-rich search results')
    }

    if (!detectedSchemas.some(s => s.type === 'WebSite' && s.properties.includes('potentialAction'))) {
      recommendations.push('Add SearchAction to WebSite schema to enable sitelinks search box in Google results')
    }

    if (totalErrors > 0) {
      recommendations.push(`Resolve ${totalErrors} schema validation error${totalErrors > 1 ? 's' : ''} to improve structured data quality and rich result eligibility`)
    }

    if (totalWarnings > 3) {
      recommendations.push(`Address ${totalWarnings} schema warning${totalWarnings > 1 ? 's' : ''} to maximize rich result potential`)
    }

    if (!hasJsonLd && hasMicrodata) {
      recommendations.push('Migrate from Microdata to JSON-LD format (preferred by Google) for better compatibility and easier maintenance')
    }

    if (schemaScore < 60) {
      recommendations.push('Test all schema markup with Google\'s Rich Results Test tool (search.google.com/test/rich-results)')
    }

    // Deduplicate and limit
    const uniqueRecommendations = Array.from(new Set(recommendations)).slice(0, 8)

    // ── Schema Code ──
    const schemaCode = generateSchemaCode(project.domain, detectedSchemas)

    // ── Response ──
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
      formatDetected: {
        jsonLd: hasJsonLd,
        microdata: hasMicrodata,
      },
      recommendations: uniqueRecommendations,
      schemaCode,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Schema analysis error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
