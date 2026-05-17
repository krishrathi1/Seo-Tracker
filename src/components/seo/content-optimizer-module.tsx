'use client'

import * as React from 'react'
import {
  FileText,
  Target,
  BarChart3,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Globe,
  Smartphone,
  Monitor,
  Type,
  Hash,
  AlignLeft,
  BookOpen,
  Lightbulb,
  Sparkles,
  ExternalLink,
  Pencil,
  ChevronDown,
  ChevronUp,
  Search,
  RefreshCw,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────
interface ContentAnalysis {
  overallScore: number
  relevanceScore: number
  readabilityScore: number
  seoStructureScore: number
  keywordUsageScore: number
  wordCount: number
  sentenceCount: number
  paragraphCount: number
  avgWordsPerSentence: number
  keywordCount: number
  keywordDensity: number
  headings: {
    h1: string[]
    h2: string[]
    h3: string[]
    h4: string[]
  }
  hasH1: boolean
  hasMultipleH1: boolean
  metaTitle: string
  metaTitleLength: number
  metaTitlePixelWidth: number
  metaTitleHasKeyword: boolean
  metaDescription: string
  metaDescriptionLength: number
  metaDescriptionHasKeyword: boolean
  fleschKincaidScore: number
  readingLevel: string
  recommendedWordCount: { min: number; max: number }
  lsiKeywords: string[]
  recommendations: Recommendation[]
}

interface Recommendation {
  id: string
  priority: 'high' | 'medium' | 'low'
  category: string
  title: string
  description: string
  fix: string
  passed: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────
const PIXELS_PER_CHAR_TITLE = 7.5
const DESKTOP_TITLE_MAX_PX = 580
const MOBILE_TITLE_MAX_PX = 485
const DESKTOP_DESC_MAX_CHARS = 160
const MOBILE_DESC_MAX_CHARS = 120

const LSI_PREFIXES = [
  'best', 'top', 'how to', 'guide', 'tips', 'vs', 'review',
  'comparison', 'tutorial', 'for beginners', 'advanced', 'strategy',
  'examples', 'tools', 'software', 'techniques', 'methods',
  'benefits', 'importance', 'definition', 'meaning',
]

const LSI_SUFFIXES = [
  'guide', 'tutorial', 'tips', 'strategy', 'examples',
  'best practices', 'tools', 'definition', 'benefits',
  'importance', 'techniques', 'methods', 'for beginners',
  'for small business', 'software', 'checklist', 'framework',
  'template', 'process', 'steps',
]

// ─── Helpers ──────────────────────────────────────────────────────────────
function getScoreColor(score: number): string {
  if (score < 40) return '#ef4444'
  if (score < 70) return '#f59e0b'
  return '#10b981'
}

function getScoreLabel(score: number): string {
  if (score < 40) return 'Poor'
  if (score < 70) return 'Fair'
  if (score < 85) return 'Good'
  return 'Excellent'
}

function getScoreBgClass(score: number): string {
  if (score < 40) return 'bg-red-500/10 text-red-500'
  if (score < 70) return 'bg-amber-500/10 text-amber-500'
  return 'bg-emerald-500/10 text-emerald-500'
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '')
  if (word.length <= 3) return 1
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
  word = word.replace(/^y/, '')
  const match = word.match(/[aeiouy]{1,2}/g)
  return match ? match.length : 1
}

function extractHeadings(content: string): { h1: string[]; h2: string[]; h3: string[]; h4: string[] } {
  const h1: string[] = []
  const h2: string[] = []
  const h3: string[] = []
  const h4: string[] = []

  const lines = content.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('# ') && !trimmed.startsWith('## ')) {
      h1.push(trimmed.replace(/^#\s+/, ''))
    } else if (trimmed.startsWith('## ') && !trimmed.startsWith('### ')) {
      h2.push(trimmed.replace(/^##\s+/, ''))
    } else if (trimmed.startsWith('### ') && !trimmed.startsWith('#### ')) {
      h3.push(trimmed.replace(/^###\s+/, ''))
    } else if (trimmed.startsWith('#### ')) {
      h4.push(trimmed.replace(/^####\s+/, ''))
    }
  }

  // Also detect HTML headings
  const h1Matches = content.match(/<h1[^>]*>(.*?)<\/h1>/gi)
  if (h1Matches) h1.push(...h1Matches.map(m => m.replace(/<[^>]+>/g, '')))
  const h2Matches = content.match(/<h2[^>]*>(.*?)<\/h2>/gi)
  if (h2Matches) h2.push(...h2Matches.map(m => m.replace(/<[^>]+>/g, '')))
  const h3Matches = content.match(/<h3[^>]*>(.*?)<\/h3>/gi)
  if (h3Matches) h3.push(...h3Matches.map(m => m.replace(/<[^>]+>/g, '')))
  const h4Matches = content.match(/<h4[^>]*>(.*?)<\/h4>/gi)
  if (h4Matches) h4.push(...h4Matches.map(m => m.replace(/<[^>]+>/g, '')))

  return { h1, h2, h3, h4 }
}

function extractMetaTitle(content: string): string {
  const htmlMatch = content.match(/<title[^>]*>(.*?)<\/title>/i)
  if (htmlMatch) return htmlMatch[1].trim()
  const yoastMatch = content.match(/meta\s+title[:\s]+(.+)/i)
  if (yoastMatch) return yoastMatch[1].trim()
  // Try first H1 as fallback
  const h1Match = content.match(/^#\s+(.+)$/m)
  if (h1Match) return h1Match[1].trim()
  return ''
}

function extractMetaDescription(content: string): string {
  const htmlMatch = content.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i)
  if (htmlMatch) return htmlMatch[1].trim()
  const reverseMatch = content.match(/<meta[^>]*content=["'](.*?)["'][^>]*name=["']description["']/i)
  if (reverseMatch) return reverseMatch[1].trim()
  const plainMatch = content.match(/meta\s+description[:\s]+(.+)/i)
  if (plainMatch) return plainMatch[1].trim()
  // Use first paragraph as fallback
  const lines = content.split('\n').filter(l => l.trim().length > 40 && !l.trim().startsWith('#'))
  if (lines.length > 0) return lines[0].trim().substring(0, 200)
  return ''
}

function generateLSIKeywords(keyword: string): string[] {
  if (!keyword.trim()) return []
  const kw = keyword.toLowerCase().trim()
  const results: string[] = []

  // Add prefix combinations
  for (const prefix of LSI_PREFIXES.slice(0, 8)) {
    results.push(`${prefix} ${kw}`)
  }

  // Add suffix combinations
  for (const suffix of LSI_SUFFIXES.slice(0, 8)) {
    results.push(`${kw} ${suffix}`)
  }

  // Add semantic variations
  const words = kw.split(/\s+/)
  if (words.length > 1) {
    results.push(`${words[words.length - 1]} ${words.slice(0, -1).join(' ')}`)
    results.push(`${words[0]} ${words.slice(1).join(' ')}`)
  }

  // Add question forms
  results.push(`what is ${kw}`)
  results.push(`why ${kw} matters`)
  results.push(`${kw} explained`)

  // Remove duplicates and return
  return [...new Set(results)].slice(0, 20)
}

function estimatePixelWidth(text: string): number {
  // Rough estimate: average character width in Google's title font
  let width = 0
  for (const char of text) {
    if (char === 'i' || char === 'l' || char === 't' || char === 'r' || char === 'f') {
      width += 4
    } else if (char === 'm' || char === 'w' || char === 'M' || char === 'W') {
      width += 12
    } else if (char >= 'A' && char <= 'Z') {
      width += 9
    } else if (char === ' ') {
      width += 4
    } else {
      width += PIXELS_PER_CHAR
    }
  }
  return width
}

function analyzeContent(content: string, keyword: string): ContentAnalysis {
  // Basic text cleanup - remove HTML tags for text analysis
  const cleanText = content
    .replace(/<[^>]+>/g, ' ')
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim()

  // Word counting
  const words = cleanText.split(/\s+/).filter(w => w.length > 0)
  const wordCount = words.length

  // Sentence counting
  const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const sentenceCount = Math.max(sentences.length, 1)

  // Paragraph counting
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0)
  const paragraphCount = Math.max(paragraphs.length, 1)

  // Average words per sentence
  const avgWordsPerSentence = wordCount / sentenceCount

  // Keyword analysis
  const kw = keyword.toLowerCase().trim()
  let keywordCount = 0
  if (kw) {
    const lowerText = cleanText.toLowerCase()
    const regex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    const matches = lowerText.match(regex)
    keywordCount = matches ? matches.length : 0
  }
  const keywordDensity = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0

  // Headings analysis
  const headings = extractHeadings(content)
  const hasH1 = headings.h1.length > 0
  const hasMultipleH1 = headings.h1.length > 1

  // Meta title analysis
  const metaTitle = extractMetaTitle(content)
  const metaTitleLength = metaTitle.length
  const metaTitlePixelWidth = estimatePixelWidth(metaTitle)
  const metaTitleHasKeyword = kw ? metaTitle.toLowerCase().includes(kw) : false

  // Meta description analysis
  const metaDescription = extractMetaDescription(content)
  const metaDescriptionLength = metaDescription.length
  const metaDescriptionHasKeyword = kw ? metaDescription.toLowerCase().includes(kw) : false

  // Flesch-Kincaid readability
  const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0)
  const fleschKincaidScore = wordCount > 0 && sentenceCount > 0
    ? Math.max(0, Math.min(100, Math.round(
        206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (totalSyllables / wordCount)
      )))
    : 0

  let readingLevel = 'Very Difficult'
  if (fleschKincaidScore >= 90) readingLevel = 'Very Easy'
  else if (fleschKincaidScore >= 80) readingLevel = 'Easy'
  else if (fleschKincaidScore >= 70) readingLevel = 'Fairly Easy'
  else if (fleschKincaidScore >= 60) readingLevel = 'Standard'
  else if (fleschKincaidScore >= 50) readingLevel = 'Fairly Difficult'
  else if (fleschKincaidScore >= 30) readingLevel = 'Difficult'

  // Recommended word count (based on typical top 10 SERP results)
  const recommendedWordCount = { min: 1500, max: 2500 }

  // LSI Keywords
  const lsiKeywords = generateLSIKeywords(keyword)

  // ─── Scoring ──────────────────────────────────────────────────────

  // Relevance Score (0-100)
  let relevanceScore = 50 // base
  if (kw) {
    if (keywordDensity >= 0.5 && keywordDensity <= 2.5) relevanceScore += 25
    else if (keywordDensity > 0) relevanceScore += 10
    if (metaTitleHasKeyword) relevanceScore += 10
    if (metaDescriptionHasKeyword) relevanceScore += 5
    if (headings.h1.some(h => h.toLowerCase().includes(kw))) relevanceScore += 10
  } else {
    relevanceScore = 30
  }
  relevanceScore = Math.min(100, relevanceScore)

  // Readability Score (0-100)
  let readabilityScore = 50
  if (fleschKincaidScore >= 60 && fleschKincaidScore <= 80) readabilityScore += 30
  else if (fleschKincaidScore >= 50 && fleschKincaidScore <= 90) readabilityScore += 20
  else if (fleschKincaidScore >= 40) readabilityScore += 10

  if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 20) readabilityScore += 15
  else if (avgWordsPerSentence < 30) readabilityScore += 5

  if (paragraphCount >= 3) readabilityScore += 5
  readabilityScore = Math.min(100, Math.max(0, readabilityScore))

  // SEO Structure Score (0-100)
  let seoStructureScore = 30
  if (hasH1 && !hasMultipleH1) seoStructureScore += 20
  else if (hasH1) seoStructureScore += 10
  if (headings.h2.length >= 2) seoStructureScore += 15
  else if (headings.h2.length >= 1) seoStructureScore += 8
  if (headings.h3.length >= 1) seoStructureScore += 10
  if (metaTitle && metaTitleLength >= 30 && metaTitleLength <= 60) seoStructureScore += 15
  else if (metaTitle) seoStructureScore += 5
  if (metaDescription && metaDescriptionLength >= 120 && metaDescriptionLength <= 160) seoStructureScore += 10
  else if (metaDescription) seoStructureScore += 3
  seoStructureScore = Math.min(100, seoStructureScore)

  // Keyword Usage Score (0-100)
  let keywordUsageScore = 20
  if (kw) {
    if (keywordDensity >= 1 && keywordDensity <= 2) keywordUsageScore += 30
    else if (keywordDensity >= 0.5 && keywordDensity <= 3) keywordUsageScore += 20
    else if (keywordDensity > 0) keywordUsageScore += 10
    if (metaTitleHasKeyword) keywordUsageScore += 15
    if (metaDescriptionHasKeyword) keywordUsageScore += 10
    if (headings.h1.some(h => h.toLowerCase().includes(kw))) keywordUsageScore += 10
    if (headings.h2.some(h => h.toLowerCase().includes(kw))) keywordUsageScore += 10
    if (headings.h3.some(h => h.toLowerCase().includes(kw))) keywordUsageScore += 5
  }
  keywordUsageScore = Math.min(100, keywordUsageScore)

  // Overall Score (weighted average)
  const overallScore = Math.round(
    relevanceScore * 0.25 +
    readabilityScore * 0.2 +
    seoStructureScore * 0.3 +
    keywordUsageScore * 0.25
  )

  // ─── Recommendations ──────────────────────────────────────────────
  const recommendations: Recommendation[] = []

  if (!hasH1) {
    recommendations.push({
      id: 'h1-missing',
      priority: 'high',
      category: 'Structure',
      title: 'Add an H1 heading',
      description: 'Your content is missing an H1 tag. The H1 is the most important heading for SEO.',
      fix: kw ? `Add "# ${kw.charAt(0).toUpperCase() + kw.slice(1)}" at the top of your content` : 'Add a descriptive H1 heading (# Title) at the top of your content',
      passed: false,
    })
  } else if (hasMultipleH1) {
    recommendations.push({
      id: 'h1-multiple',
      priority: 'high',
      category: 'Structure',
      title: 'Use only one H1 tag',
      description: `Found ${headings.h1.length} H1 tags. Best practice is to have exactly one H1 per page.`,
      fix: 'Keep the most important H1 and change others to H2 (##)',
      passed: false,
    })
  } else {
    recommendations.push({
      id: 'h1-present',
      priority: 'high',
      category: 'Structure',
      title: 'H1 tag is present',
      description: 'Your content has exactly one H1 tag.',
      fix: '',
      passed: true,
    })
  }

  if (kw && hasH1 && !headings.h1.some(h => h.toLowerCase().includes(kw))) {
    recommendations.push({
      id: 'h1-keyword',
      priority: 'high',
      category: 'Keywords',
      title: 'Add target keyword to H1',
      description: 'Your H1 tag does not include your target keyword.',
      fix: `Modify your H1 to include "${kw}", e.g., "# ${kw.charAt(0).toUpperCase() + kw.slice(1)} — Complete Guide"`,
      passed: false,
    })
  }

  if (headings.h2.length < 2) {
    recommendations.push({
      id: 'h2-count',
      priority: 'medium',
      category: 'Structure',
      title: 'Add more H2 subheadings',
      description: `Found ${headings.h2.length} H2 headings. Aim for at least 3-5 H2 tags to structure your content.`,
      fix: 'Break your content into clear sections with ## headings. Each section should cover a specific subtopic.',
      passed: false,
    })
  } else {
    recommendations.push({
      id: 'h2-count',
      priority: 'medium',
      category: 'Structure',
      title: 'H2 subheadings are adequate',
      description: `Found ${headings.h2.length} H2 headings — good structure.`,
      fix: '',
      passed: true,
    })
  }

  if (wordCount < recommendedWordCount.min) {
    const diff = recommendedWordCount.min - wordCount
    recommendations.push({
      id: 'word-count',
      priority: wordCount < 800 ? 'high' : 'medium',
      category: 'Content',
      title: 'Increase word count',
      description: `Current: ${wordCount} words. Recommended: ${recommendedWordCount.min}-${recommendedWordCount.max} words.`,
      fix: `Add approximately ${diff} more words to match the recommended range. Expand on subtopics, add examples, or include a FAQ section.`,
      passed: false,
    })
  } else if (wordCount > recommendedWordCount.max * 1.5) {
    recommendations.push({
      id: 'word-count-high',
      priority: 'low',
      category: 'Content',
      title: 'Content may be too long',
      description: `Current: ${wordCount} words. Exceeds recommended maximum of ${recommendedWordCount.max}.`,
      fix: 'Consider breaking this into multiple pages or removing less relevant sections.',
      passed: true,
    })
  } else {
    recommendations.push({
      id: 'word-count',
      priority: 'medium',
      category: 'Content',
      title: 'Word count is in range',
      description: `Current: ${wordCount} words. Within recommended ${recommendedWordCount.min}-${recommendedWordCount.max}.`,
      fix: '',
      passed: true,
    })
  }

  if (kw && (keywordDensity < 1 || keywordDensity > 2) && wordCount > 50) {
    recommendations.push({
      id: 'keyword-density',
      priority: keywordDensity === 0 ? 'high' : 'medium',
      category: 'Keywords',
      title: keywordDensity === 0
        ? 'Add target keyword to content'
        : keywordDensity < 1
          ? 'Increase keyword density'
          : 'Reduce keyword density',
      description: keywordDensity === 0
        ? `The keyword "${kw}" was not found in your content.`
        : keywordDensity < 1
          ? `Current density: ${keywordDensity.toFixed(2)}% (ideal: 1-2%). Keyword appears ${keywordCount} times.`
          : `Current density: ${keywordDensity.toFixed(2)}% (ideal: 1-2%). May appear spammy.`,
      fix: keywordDensity === 0
        ? `Naturally incorporate "${kw}" into your content 3-5 times`
        : keywordDensity < 1
          ? `Add "${kw}" ${Math.ceil((wordCount * 0.01) - keywordCount)} more times naturally throughout the content`
          : `Remove some instances of "${kw}" and use synonyms or LSI keywords instead`,
      passed: false,
    })
  } else if (kw) {
    recommendations.push({
      id: 'keyword-density',
      priority: 'medium',
      category: 'Keywords',
      title: 'Keyword density is optimal',
      description: `Density: ${keywordDensity.toFixed(2)}% (ideal: 1-2%). Keyword appears ${keywordCount} times.`,
      fix: '',
      passed: true,
    })
  }

  if (!metaTitle) {
    recommendations.push({
      id: 'meta-title',
      priority: 'high',
      category: 'Meta',
      title: 'Add a meta title',
      description: 'No meta title found. This is critical for search engine rankings.',
      fix: 'Add a title tag (<title>...</title>) or start content with an H1 heading',
      passed: false,
    })
  } else if (metaTitleLength < 30) {
    recommendations.push({
      id: 'meta-title-short',
      priority: 'medium',
      category: 'Meta',
      title: 'Meta title is too short',
      description: `Current: ${metaTitleLength} characters. Recommended: 30-60 characters.`,
      fix: 'Add more descriptive words to your title, including your target keyword',
      passed: false,
    })
  } else if (metaTitleLength > 60) {
    recommendations.push({
      id: 'meta-title-long',
      priority: 'medium',
      category: 'Meta',
      title: 'Meta title may be truncated',
      description: `Current: ${metaTitleLength} characters. Recommended max: 60 characters. Pixel width: ~${metaTitlePixelWidth}px.`,
      fix: 'Shorten your title to 60 characters or less. Put the most important words first.',
      passed: false,
    })
  } else {
    recommendations.push({
      id: 'meta-title',
      priority: 'medium',
      category: 'Meta',
      title: 'Meta title length is good',
      description: `${metaTitleLength} characters, ~${metaTitlePixelWidth}px wide.`,
      fix: '',
      passed: true,
    })
  }

  if (kw && metaTitle && !metaTitleHasKeyword) {
    recommendations.push({
      id: 'meta-title-keyword',
      priority: 'high',
      category: 'Keywords',
      title: 'Add keyword to meta title',
      description: 'Your target keyword is not in the meta title.',
      fix: `Include "${kw}" near the beginning of your title`,
      passed: false,
    })
  }

  if (!metaDescription) {
    recommendations.push({
      id: 'meta-desc',
      priority: 'high',
      category: 'Meta',
      title: 'Add a meta description',
      description: 'No meta description found. This affects click-through rates from search results.',
      fix: 'Add a compelling meta description (120-160 characters) that includes your target keyword',
      passed: false,
    })
  } else if (metaDescriptionLength < 120) {
    recommendations.push({
      id: 'meta-desc-short',
      priority: 'medium',
      category: 'Meta',
      title: 'Meta description is too short',
      description: `Current: ${metaDescriptionLength} characters. Recommended: 120-160 characters.`,
      fix: 'Expand your description with more details, benefits, or a call-to-action',
      passed: false,
    })
  } else if (metaDescriptionLength > 160) {
    recommendations.push({
      id: 'meta-desc-long',
      priority: 'medium',
      category: 'Meta',
      title: 'Meta description may be truncated',
      description: `Current: ${metaDescriptionLength} characters. Recommended max: 160 characters.`,
      fix: 'Trim your description to 160 characters or less while keeping the most compelling parts',
      passed: false,
    })
  } else {
    recommendations.push({
      id: 'meta-desc',
      priority: 'medium',
      category: 'Meta',
      title: 'Meta description length is good',
      description: `${metaDescriptionLength} characters — optimal range.`,
      fix: '',
      passed: true,
    })
  }

  if (kw && metaDescription && !metaDescriptionHasKeyword) {
    recommendations.push({
      id: 'meta-desc-keyword',
      priority: 'high',
      category: 'Keywords',
      title: 'Add keyword to meta description',
      description: 'Your target keyword is not in the meta description.',
      fix: `Naturally include "${kw}" in your meta description`,
      passed: false,
    })
  }

  if (fleschKincaidScore < 50) {
    recommendations.push({
      id: 'readability',
      priority: 'medium',
      category: 'Readability',
      title: 'Improve readability',
      description: `Flesch-Kincaid score: ${fleschKincaidScore}/100 (${readingLevel}). Aim for 60+ (Standard).`,
      fix: 'Use shorter sentences, simpler words, and break up long paragraphs. Average 15-20 words per sentence.',
      passed: false,
    })
  } else {
    recommendations.push({
      id: 'readability',
      priority: 'medium',
      category: 'Readability',
      title: 'Readability is good',
      description: `Flesch-Kincaid score: ${fleschKincaidScore}/100 (${readingLevel}).`,
      fix: '',
      passed: true,
    })
  }

  if (lsiKeywords.length > 0 && kw) {
    const lsiInContent = lsiKeywords.filter(lsi =>
      cleanText.toLowerCase().includes(lsi.toLowerCase())
    )
    if (lsiInContent.length < 3) {
      recommendations.push({
        id: 'lsi-keywords',
        priority: 'medium',
        category: 'Keywords',
        title: 'Include more related keywords',
        description: `Only ${lsiInContent.length} of ${Math.min(lsiKeywords.length, 10)} suggested LSI keywords found in content.`,
        fix: `Consider including these LSI keywords: ${lsiKeywords.slice(0, 5).join(', ')}`,
        passed: false,
      })
    } else {
      recommendations.push({
        id: 'lsi-keywords',
        priority: 'medium',
        category: 'Keywords',
        title: 'Good use of related keywords',
        description: `${lsiInContent.length} related keywords found in content.`,
        fix: '',
        passed: true,
      })
    }
  }

  // Image alt text check (basic)
  const imgTags = content.match(/<img[^>]+>/gi) || []
  const imgsWithoutAlt = imgTags.filter(img => !/alt=["'][^"']+["']/i.test(img))
  if (imgTags.length > 0 && imgsWithoutAlt.length > 0) {
    recommendations.push({
      id: 'alt-text',
      priority: 'high',
      category: 'Accessibility',
      title: 'Add alt text to images',
      description: `${imgsWithoutAlt.length} of ${imgTags.length} images are missing alt text.`,
      fix: 'Add descriptive alt text to all images, including the target keyword where relevant.',
      passed: false,
    })
  }

  // Internal links check
  const internalLinks = (content.match(/\[([^\]]+)\]\([^)]+\)/g) || []).length
  const htmlLinks = (content.match(/<a\s+href/gi) || []).length
  const totalLinks = internalLinks + htmlLinks
  if (totalLinks < 3 && wordCount > 500) {
    recommendations.push({
      id: 'internal-links',
      priority: 'medium',
      category: 'Content',
      title: 'Add more internal links',
      description: `Found only ${totalLinks} links. Aim for 3-5+ internal/external links per 1000 words.`,
      fix: 'Link to related pages on your site and authoritative external sources.',
      passed: false,
    })
  }

  return {
    overallScore,
    relevanceScore,
    readabilityScore,
    seoStructureScore,
    keywordUsageScore,
    wordCount,
    sentenceCount,
    paragraphCount,
    avgWordsPerSentence,
    keywordCount,
    keywordDensity,
    headings,
    hasH1,
    hasMultipleH1,
    metaTitle,
    metaTitleLength,
    metaTitlePixelWidth,
    metaTitleHasKeyword,
    metaDescription,
    metaDescriptionLength,
    metaDescriptionHasKeyword,
    fleschKincaidScore,
    readingLevel,
    recommendedWordCount,
    lsiKeywords,
    recommendations,
  }
}

// ─── Circular Score Gauge ─────────────────────────────────────────────────
function ScoreGauge({ score, size = 160 }: { score: number; size?: number }) {
  const [animatedScore, setAnimatedScore] = React.useState(0)
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (animatedScore / 100) * circumference
  const color = getScoreColor(score)

  React.useEffect(() => {
    let frame: number
    const start = animatedScore
    const duration = 1200
    const startTime = performance.now()

    function animate(now: number) {
      const elapsed = now - startTime
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setAnimatedScore(Math.round(start + (score - start) * eased))
      if (t < 1) frame = requestAnimationFrame(animate)
    }

    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [score])

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-4xl font-bold tabular-nums" style={{ color }}>{animatedScore}</span>
        <span className="text-xs font-medium text-muted-foreground mt-0.5">/ 100</span>
      </div>
    </div>
  )
}

// ─── Sub-Score Bar ────────────────────────────────────────────────────────
function SubScoreBar({ label, score, icon: Icon }: { label: string; score: number; icon: React.ElementType }) {
  const color = getScoreColor(score)
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm font-bold tabular-nums" style={{ color }}>{score}</span>
      </div>
      <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

// ─── SERP Preview ─────────────────────────────────────────────────────────
function SerpPreview({
  title,
  url,
  description,
  isMobile,
}: {
  title: string
  url: string
  description: string
  isMobile: boolean
}) {
  const titlePx = estimatePixelWidth(title)
  const maxPx = isMobile ? MOBILE_TITLE_MAX_PX : DESKTOP_TITLE_MAX_PX
  const maxDescChars = isMobile ? MOBILE_DESC_MAX_CHARS : DESKTOP_DESC_MAX_CHARS
  const isTitleTruncated = titlePx > maxPx
  const isDescTruncated = description.length > maxDescChars

  return (
    <div className="rounded-lg border bg-white dark:bg-zinc-950 p-4 space-y-1">
      {/* URL */}
      <div className="flex items-center gap-2">
        <div className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
          <Globe className="h-3 w-3 text-emerald-600" />
        </div>
        <div>
          <span className="text-xs text-gray-600 dark:text-gray-400">{url}</span>
        </div>
      </div>
      {/* Title */}
      <div>
        <h3
          className="text-lg leading-snug cursor-default"
          style={{
            color: '#1a0dab',
            fontSize: isMobile ? '16px' : '20px',
            lineHeight: isMobile ? '1.3' : '1.3',
            maxWidth: isTitleTruncated ? '100%' : undefined,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title || 'Page Title'}
        </h3>
      </div>
      {/* Description */}
      <p
        className="text-sm leading-relaxed"
        style={{ color: '#4d5156' }}
      >
        {description
          ? isDescTruncated
            ? description.substring(0, maxDescChars) + '...'
            : description
          : 'No meta description provided. Add one to improve click-through rates from search results.'}
      </p>
      {/* Pixel width indicator */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
        <span className="text-[10px] text-muted-foreground">Title width:</span>
        <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(100, (titlePx / maxPx) * 100)}%`,
              backgroundColor: isTitleTruncated ? '#ef4444' : titlePx > maxPx * 0.85 ? '#f59e0b' : '#10b981',
            }}
          />
        </div>
        <span className={cn(
          'text-[10px] font-medium tabular-nums',
          isTitleTruncated ? 'text-red-500' : titlePx > maxPx * 0.85 ? 'text-amber-500' : 'text-emerald-500'
        )}>
          ~{titlePx}px / {maxPx}px
        </span>
      </div>
    </div>
  )
}

// ─── Priority Badge ───────────────────────────────────────────────────────
function PriorityBadge({ priority }: { priority: 'high' | 'medium' | 'low' }) {
  const config = {
    high: { label: 'High', className: 'border-red-500/30 text-red-600 dark:text-red-400 bg-red-500/5' },
    medium: { label: 'Medium', className: 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5' },
    low: { label: 'Low', className: 'border-slate-400/30 text-slate-500 dark:text-slate-400 bg-slate-500/5' },
  }
  const c = config[priority]
  return (
    <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', c.className)}>
      {c.label}
    </Badge>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────
export function ContentOptimizerModule() {
  const [content, setContent] = React.useState('')
  const [targetKeyword, setTargetKeyword] = React.useState('')
  const [pageUrl, setPageUrl] = React.useState('')
  const [analysis, setAnalysis] = React.useState<ContentAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = React.useState(false)
  const [checkedRecs, setCheckedRecs] = React.useState<Set<string>>(new Set())
  const [serpTitle, setSerpTitle] = React.useState('')
  const [serpDescription, setSerpDescription] = React.useState('')
  const [serpViewMode, setSerpViewMode] = React.useState<'desktop' | 'mobile'>('desktop')
  const [activeSerpTab, setActiveSerpTab] = React.useState<'preview' | 'edit'>('preview')
  const [hasAnalyzed, setHasAnalyzed] = React.useState(false)

  // Real-time analysis as user types
  React.useEffect(() => {
    if (!hasAnalyzed) return
    const timer = window.setTimeout(() => {
      if (content.trim().length === 0 && targetKeyword.trim().length === 0) {
        setAnalysis(null)
        return
      }
      const result = analyzeContent(content, targetKeyword)
      setAnalysis(result)
      if (!serpTitle && result.metaTitle) setSerpTitle(result.metaTitle)
      if (!serpDescription && result.metaDescription) setSerpDescription(result.metaDescription)
    }, 180)

    return () => window.clearTimeout(timer)
  }, [content, targetKeyword, hasAnalyzed, serpTitle, serpDescription])

  const handleAnalyze = () => {
    if (!content.trim()) return
    setIsAnalyzing(true)
    setHasAnalyzed(true)

    // Simulate brief loading, then compute
    setTimeout(() => {
      const result = analyzeContent(content, targetKeyword)
      setAnalysis(result)
      setSerpTitle(result.metaTitle || targetKeyword.charAt(0).toUpperCase() + targetKeyword.slice(1))
      setSerpDescription(result.metaDescription)
      setIsAnalyzing(false)
    }, 600)
  }

  const toggleRec = (id: string) => {
    setCheckedRecs(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const totalRecs = analysis?.recommendations.length ?? 0
  const completedRecs = analysis?.recommendations.filter(r => r.passed || checkedRecs.has(r.id)).length ?? 0

  // ─── Empty State ─────────────────────────────────────────────────
  if (!analysis && !isAnalyzing) {
    return (
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Content Optimizer</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Paste your content and enter a target keyword to get real-time SEO analysis and recommendations.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Content Input */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-500" />
                  Content Input
                </CardTitle>
                <CardDescription>Paste your article or page content below. Supports plain text, Markdown, and HTML.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="target-keyword" className="text-sm font-medium">Target Keyword</Label>
                  <div className="relative">
                    <Target className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="target-keyword"
                      placeholder="e.g., best seo tools"
                      value={targetKeyword}
                      onChange={(e) => setTargetKeyword(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="page-url" className="text-sm font-medium">Page URL (optional)</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="page-url"
                      placeholder="https://example.com/page"
                      value={pageUrl}
                      onChange={(e) => setPageUrl(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="content-input" className="text-sm font-medium">Content</Label>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {content.split(/\s+/).filter(w => w.length > 0).length} words
                    </span>
                  </div>
                  <Textarea
                    id="content-input"
                    placeholder={`Paste your content here...\n\nExample:\n# Best SEO Tools for 2024\n\n## Introduction\nFinding the right SEO tools can transform your digital marketing strategy...\n\n## Top 10 SEO Tools\n1. RankPulse - Comprehensive SEO tracking\n2. Google Search Console - Free insights\n...`}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[320px] font-mono text-sm resize-y"
                  />
                </div>

                <Button
                  onClick={handleAnalyze}
                  disabled={!content.trim()}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  <Search className="h-4 w-4" />
                  Analyze Content
                </Button>
              </CardContent>
            </Card>

            {/* Getting Started Guide */}
            <div className="flex items-center justify-center">
              <Card className="w-full">
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className="h-20 w-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6">
                    <Lightbulb className="h-10 w-10 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Get Started</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-md mb-6">
                    Enter your target keyword and paste your content to receive a comprehensive SEO analysis
                    with actionable recommendations to improve your rankings.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left w-full max-w-md">
                    {[
                      { icon: Target, text: 'Enter your target keyword' },
                      { icon: FileText, text: 'Paste your content' },
                      { icon: BarChart3, text: 'Get instant SEO score' },
                      { icon: Sparkles, text: 'Follow recommendations' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg border p-3">
                        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                          <item.icon className="h-4 w-4 text-emerald-500" />
                        </div>
                        <span className="text-xs font-medium">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Loading State ───────────────────────────────────────────────
  if (isAnalyzing) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-sm text-muted-foreground">Analyzing your content...</p>
        </div>
      </div>
    )
  }

  if (!analysis) return null

  const serpUrl = pageUrl || 'https://example.com/your-page'

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Content Optimizer</h2>
            <p className="text-muted-foreground text-sm mt-1">
              {targetKeyword ? `Analyzing for: "${targetKeyword}"` : 'Enter a target keyword for best results'}
            </p>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => { setHasAnalyzed(false); setAnalysis(null); setContent(''); setTargetKeyword(''); setPageUrl(''); setCheckedRecs(new Set()); }}
          >
            <RefreshCw className="h-4 w-4" />
            Reset
          </Button>
        </div>

        {/* ── Split Layout: Editor Left, Analysis Right ──────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* LEFT: Content Input */}
          <div className="xl:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-500" />
                  Content Editor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Target Keyword</Label>
                  <div className="relative">
                    <Target className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="e.g., best seo tools"
                      value={targetKeyword}
                      onChange={(e) => setTargetKeyword(e.target.value)}
                      className="pl-9 h-9 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Page URL</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="https://example.com/page"
                      value={pageUrl}
                      onChange={(e) => setPageUrl(e.target.value)}
                      className="pl-9 h-9 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-muted-foreground">Content</Label>
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {analysis.wordCount} words
                    </span>
                  </div>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[400px] font-mono text-sm resize-y"
                  />
                </div>
              </CardContent>
            </Card>

            {/* ── SERP Preview Card ────────────────────────────── */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-emerald-500" />
                    SERP Preview
                  </CardTitle>
                  <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                    <Button
                      variant={serpViewMode === 'desktop' ? 'secondary' : 'ghost'}
                      size="sm"
                      className="h-7 text-xs gap-1 px-2"
                      onClick={() => setSerpViewMode('desktop')}
                    >
                      <Monitor className="h-3 w-3" />
                      Desktop
                    </Button>
                    <Button
                      variant={serpViewMode === 'mobile' ? 'secondary' : 'ghost'}
                      size="sm"
                      className="h-7 text-xs gap-1 px-2"
                      onClick={() => setSerpViewMode('mobile')}
                    >
                      <Smartphone className="h-3 w-3" />
                      Mobile
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Tabs value={activeSerpTab} onValueChange={(v) => setActiveSerpTab(v as 'preview' | 'edit')}>
                  <TabsList className="w-full h-8">
                    <TabsTrigger value="preview" className="text-xs flex-1">Preview</TabsTrigger>
                    <TabsTrigger value="edit" className="text-xs flex-1">Edit</TabsTrigger>
                  </TabsList>
                  <TabsContent value="preview" className="mt-3">
                    <SerpPreview
                      title={serpTitle || analysis.metaTitle || 'Untitled Page'}
                      url={serpUrl}
                      description={serpDescription || analysis.metaDescription || ''}
                      isMobile={serpViewMode === 'mobile'}
                    />
                  </TabsContent>
                  <TabsContent value="edit" className="mt-3 space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Title</Label>
                        <span className={cn(
                          'text-[10px] tabular-nums',
                          serpTitle.length > 60 ? 'text-red-500' : serpTitle.length > 50 ? 'text-amber-500' : 'text-emerald-500'
                        )}>
                          {serpTitle.length}/60
                        </span>
                      </div>
                      <Input
                        value={serpTitle}
                        onChange={(e) => setSerpTitle(e.target.value)}
                        placeholder="Enter title tag..."
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Description</Label>
                        <span className={cn(
                          'text-[10px] tabular-nums',
                          serpDescription.length > 160 ? 'text-red-500' : serpDescription.length > 140 ? 'text-amber-500' : 'text-emerald-500'
                        )}>
                          {serpDescription.length}/160
                        </span>
                      </div>
                      <Textarea
                        value={serpDescription}
                        onChange={(e) => setSerpDescription(e.target.value)}
                        placeholder="Enter meta description..."
                        className="text-sm min-h-[80px] resize-none"
                      />
                    </div>
                    <div className="rounded-lg border p-3 bg-muted/30">
                      <p className="text-xs text-muted-foreground">
                        <strong>CTR Tips:</strong> Use numbers, power words, and your target keyword in the first half of the title.
                        Include a clear call-to-action in the description.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: Analysis Results */}
          <div className="xl:col-span-3 space-y-4">
            {/* ── Score Hero ───────────────────────────────────── */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="flex flex-col items-center gap-2">
                    <ScoreGauge score={analysis.overallScore} size={140} />
                    <span className={cn('text-sm font-semibold', getScoreBgClass(analysis.overallScore).replace('bg-', 'text-').replace('/10', ''))}>
                      {getScoreLabel(analysis.overallScore)}
                    </span>
                  </div>
                  <div className="flex-1 w-full space-y-4">
                    <SubScoreBar label="Relevance" score={analysis.relevanceScore} icon={Target} />
                    <SubScoreBar label="Readability" score={analysis.readabilityScore} icon={BookOpen} />
                    <SubScoreBar label="SEO Structure" score={analysis.seoStructureScore} icon={AlignLeft} />
                    <SubScoreBar label="Keyword Usage" score={analysis.keywordUsageScore} icon={Hash} />

                    <div className="flex items-center gap-2 pt-2">
                      <Progress
                        value={totalRecs > 0 ? (completedRecs / totalRecs) * 100 : 0}
                        className="h-2 flex-1"
                      />
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {completedRecs}/{totalRecs} checks
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Analysis Metrics Grid ────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {/* Word Count */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Type className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Word Count</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold tabular-nums">{analysis.wordCount}</span>
                  </div>
                  <div className="mt-1.5">
                    <div className="flex items-center justify-between text-[10px] mb-0.5">
                      <span className="text-muted-foreground">Recommended: {analysis.recommendedWordCount.min}-{analysis.recommendedWordCount.max}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          analysis.wordCount < analysis.recommendedWordCount.min ? 'bg-amber-500' :
                          analysis.wordCount > analysis.recommendedWordCount.max * 1.5 ? 'bg-amber-500' : 'bg-emerald-500'
                        )}
                        style={{
                          width: `${Math.min(100, (analysis.wordCount / analysis.recommendedWordCount.max) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                  {analysis.wordCount < analysis.recommendedWordCount.min && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                      Add ~{analysis.recommendedWordCount.min - analysis.wordCount} more words
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Keyword Density */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Hash className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Keyword Density</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold tabular-nums">{analysis.keywordDensity.toFixed(1)}%</span>
                  </div>
                  <div className="mt-1.5">
                    <div className="flex items-center gap-1 text-[10px]">
                      <span className="text-muted-foreground">Ideal: 1-2%</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">{analysis.keywordCount} occurrences</span>
                    </div>
                  </div>
                  {!targetKeyword && (
                    <p className="text-[10px] text-muted-foreground mt-1">Enter a keyword to analyze</p>
                  )}
                  {targetKeyword && analysis.keywordDensity > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      {analysis.keywordDensity >= 1 && analysis.keywordDensity <= 2 ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 text-amber-500" />
                      )}
                      <span className={cn(
                        'text-[10px]',
                        analysis.keywordDensity >= 1 && analysis.keywordDensity <= 2 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                      )}>
                        {analysis.keywordDensity >= 1 && analysis.keywordDensity <= 2 ? 'Optimal' : analysis.keywordDensity < 1 ? 'Too low' : 'Too high'}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Readability */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Readability</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold tabular-nums">{analysis.fleschKincaidScore}</span>
                    <span className="text-xs text-muted-foreground">/100</span>
                  </div>
                  <div className="mt-1.5">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px]',
                        analysis.fleschKincaidScore >= 60 ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400' :
                        analysis.fleschKincaidScore >= 40 ? 'border-amber-500/30 text-amber-600 dark:text-amber-400' :
                        'border-red-500/30 text-red-600 dark:text-red-400'
                      )}
                    >
                      {analysis.readingLevel}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Avg {analysis.avgWordsPerSentence.toFixed(1)} words/sentence
                  </p>
                </CardContent>
              </Card>

              {/* Meta Title */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Type className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Meta Title</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold tabular-nums">{analysis.metaTitleLength}</span>
                    <span className="text-xs text-muted-foreground">chars</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    {analysis.metaTitleHasKeyword ? (
                      <div className="flex items-center gap-0.5">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Keyword included</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-0.5">
                        <XCircle className="h-3 w-3 text-red-500" />
                        <span className="text-[10px] text-red-600 dark:text-red-400">Keyword missing</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    ~{analysis.metaTitlePixelWidth}px width
                  </p>
                </CardContent>
              </Card>

              {/* Meta Description */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <AlignLeft className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Meta Description</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold tabular-nums">{analysis.metaDescriptionLength}</span>
                    <span className="text-xs text-muted-foreground">chars</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    {analysis.metaDescriptionHasKeyword ? (
                      <div className="flex items-center gap-0.5">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Keyword included</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-0.5">
                        <XCircle className="h-3 w-3 text-red-500" />
                        <span className="text-[10px] text-red-600 dark:text-red-400">Keyword missing</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Headings */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Hash className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Headings</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn(
                      'inline-flex items-center justify-center h-7 w-7 rounded-md text-xs font-bold',
                      analysis.headings.h1.length === 1 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'
                    )}>
                      H1×{analysis.headings.h1.length}
                    </span>
                    <span className="inline-flex items-center justify-center h-7 w-7 rounded-md text-xs font-bold bg-muted text-muted-foreground">
                      H2×{analysis.headings.h2.length}
                    </span>
                    <span className="inline-flex items-center justify-center h-7 w-7 rounded-md text-xs font-bold bg-muted text-muted-foreground">
                      H3×{analysis.headings.h3.length}
                    </span>
                  </div>
                  {!analysis.hasH1 && (
                    <p className="text-[10px] text-red-500 mt-1">Missing H1 tag</p>
                  )}
                  {analysis.hasMultipleH1 && (
                    <p className="text-[10px] text-red-500 mt-1">Multiple H1 tags found</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ── Headings Detail ──────────────────────────────── */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Hash className="h-4 w-4 text-emerald-500" />
                  Heading Structure
                </CardTitle>
                <CardDescription>
                  Review your heading hierarchy for proper SEO structure
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analysis.headings.h1.length === 0 && analysis.headings.h2.length === 0 && analysis.headings.h3.length === 0 ? (
                  <div className="text-center py-8">
                    <Hash className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No headings detected</p>
                    <p className="text-xs text-muted-foreground mt-1">Use Markdown (# H1, ## H2, ### H3) or HTML headings</p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-64">
                    <div className="space-y-1">
                      {analysis.headings.h1.map((h, i) => (
                        <div key={`h1-${i}`} className="flex items-center gap-2 py-1.5 px-2 rounded bg-emerald-500/5 border-l-2 border-emerald-500">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">H1</Badge>
                          <span className="text-sm font-semibold truncate">{h}</span>
                        </div>
                      ))}
                      {analysis.headings.h2.map((h, i) => (
                        <div key={`h2-${i}`} className="flex items-center gap-2 py-1.5 px-2 pl-6 rounded border-l-2 border-amber-500">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/30 text-amber-600 dark:text-amber-400">H2</Badge>
                          <span className="text-sm truncate">{h}</span>
                        </div>
                      ))}
                      {analysis.headings.h3.map((h, i) => (
                        <div key={`h3-${i}`} className="flex items-center gap-2 py-1.5 px-2 pl-10 rounded border-l-2 border-slate-400">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-slate-400/30 text-slate-500">H3</Badge>
                          <span className="text-sm text-muted-foreground truncate">{h}</span>
                        </div>
                      ))}
                      {analysis.headings.h4.map((h, i) => (
                        <div key={`h4-${i}`} className="flex items-center gap-2 py-1.5 px-2 pl-14 rounded border-l-2 border-slate-300">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-slate-300/30 text-slate-400">H4</Badge>
                          <span className="text-sm text-muted-foreground truncate">{h}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* ── LSI Keywords ─────────────────────────────────── */}
            {analysis.lsiKeywords.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-500" />
                    Related / LSI Keywords
                  </CardTitle>
                  <CardDescription>
                    Include these semantically related terms to boost topical relevance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysis.lsiKeywords.map((kw, i) => {
                      const isInContent = content.toLowerCase().includes(kw.toLowerCase())
                      return (
                        <TooltipProvider key={i}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge
                                variant={isInContent ? 'default' : 'outline'}
                                className={cn(
                                  'text-xs cursor-default transition-colors',
                                  isInContent
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : 'hover:bg-emerald-500/10'
                                )}
                              >
                                {isInContent && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                {kw}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              {isInContent ? 'Found in content ✓' : 'Not yet in content — consider adding'}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── Recommendations ──────────────────────────────── */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-emerald-500" />
                      Recommendations
                    </CardTitle>
                    <CardDescription>
                      {completedRecs} of {totalRecs} checks passed
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-xs tabular-nums">
                    {analysis.recommendations.filter(r => !r.passed).length} issues
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[480px]">
                  <div className="space-y-2">
                    {/* Failing checks first, then passing */}
                    {[...analysis.recommendations]
                      .sort((a, b) => {
                        if (a.passed !== b.passed) return a.passed ? 1 : -1
                        const priorityOrder = { high: 0, medium: 1, low: 2 }
                        return priorityOrder[a.priority] - priorityOrder[b.priority]
                      })
                      .map((rec) => {
                        const isDone = rec.passed || checkedRecs.has(rec.id)
                        return (
                          <RecommendationItem
                            key={rec.id}
                            recommendation={rec}
                            isDone={isDone}
                            onToggle={() => toggleRec(rec.id)}
                          />
                        )
                      })
                    }
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Recommendation Item ──────────────────────────────────────────────────
function RecommendationItem({
  recommendation,
  isDone,
  onToggle,
}: {
  recommendation: Recommendation
  isDone: boolean
  onToggle: () => void
}) {
  const [expanded, setExpanded] = React.useState(false)

  return (
    <div
      className={cn(
        'rounded-lg border transition-all',
        isDone ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-border',
        !recommendation.passed && !isDone && recommendation.priority === 'high' && 'border-red-500/20 bg-red-500/5'
      )}
    >
      <div className="flex items-start gap-3 p-3">
        <Checkbox
          checked={isDone}
          onCheckedChange={onToggle}
          className="mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {recommendation.passed || isDone ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            ) : (
              recommendation.priority === 'high' ? (
                <XCircle className="h-4 w-4 text-red-500 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
              )
            )}
            <span className={cn(
              'text-sm font-medium',
              isDone && 'line-through text-muted-foreground'
            )}>
              {recommendation.title}
            </span>
            <PriorityBadge priority={recommendation.priority} />
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {recommendation.category}
            </Badge>
          </div>
          {!recommendation.passed && !isDone && (
            <>
              <p className="text-xs text-muted-foreground mt-1 pl-6">{recommendation.description}</p>
              {recommendation.fix && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 pl-6 hover:underline"
                >
                  {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {expanded ? 'Hide fix' : 'Show fix'}
                </button>
              )}
              {expanded && recommendation.fix && (
                <div className="mt-2 ml-6 rounded-md bg-emerald-500/5 border border-emerald-500/10 p-3">
                  <div className="flex items-start gap-2">
                    <Pencil className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                      {recommendation.fix}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
