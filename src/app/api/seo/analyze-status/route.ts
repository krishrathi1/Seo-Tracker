import { NextRequest, NextResponse } from 'next/server'
import { analysisProgress } from '@/app/api/seo/analyze/route'

// GET /api/seo/analyze-status - Get analysis progress for a URL
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json(
        { error: 'url query parameter is required' },
        { status: 400 }
      )
    }

    const progress = analysisProgress.get(url)

    if (!progress) {
      return NextResponse.json({
        url,
        step: 'not_started',
        progress: 0,
        status: 'No analysis in progress for this URL',
      })
    }

    // Map step names to user-friendly descriptions
    const stepLabels: Record<string, string> = {
      reading_website: 'Reading website content',
      searching_backlinks: 'Searching for backlinks & indexed pages',
      analyzing_seo: 'Running AI-powered SEO analysis',
      saving_results: 'Saving analysis results',
      complete: 'Analysis complete',
      error: 'Analysis failed',
      not_started: 'Not started',
    }

    return NextResponse.json({
      url,
      step: progress.step,
      stepLabel: stepLabels[progress.step] || progress.step,
      progress: progress.progress,
      status: progress.status,
      ...(progress.error ? { error: progress.error } : {}),
      ...(progress.result && progress.step === 'complete' ? { result: progress.result } : {}),
    })
  } catch (error) {
    console.error('Analyze-status error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
