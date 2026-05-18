'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Loader2,
  Bot,
  User,
  ArrowRight,
  Lightbulb,
  ShieldCheck,
  Target,
  TrendingUp,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useSeoStore } from '@/lib/seo-store'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'

// ─── Types ──────────────────────────────────────────────────────────
interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatApiResponse {
  message: string
}

// ─── Suggested Questions ────────────────────────────────────────────
const SUGGESTED_QUESTIONS = [
  { icon: ShieldCheck, text: 'How can I improve my SEO score?', color: 'text-emerald-500' },
  { icon: Target, text: 'What are my top SEO issues?', color: 'text-amber-500' },
  { icon: TrendingUp, text: 'How to rank higher on Google?', color: 'text-cyan-500' },
  { icon: Lightbulb, text: 'Give me keyword suggestions', color: 'text-violet-500' },
]

// ─── Markdown-like Renderer ─────────────────────────────────────────
function renderFormattedContent(content: string): React.ReactNode[] {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let listItems: string[] = []
  let listKey = 0

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${listKey++}`} className="space-y-1 my-1.5 ml-1">
          {listItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
              <span>{renderInlineFormatting(item)}</span>
            </li>
          ))}
        </ul>
      )
      listItems = []
    }
  }

  const renderInlineFormatting = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = []
    // Match **bold** and *italic*
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g
    let lastIndex = 0
    let match: RegExpExecArray | null
    let partKey = 0

    while ((match = regex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(<span key={partKey++}>{text.slice(lastIndex, match.index)}</span>)
      }
      if (match[2]) {
        // Bold
        parts.push(
          <strong key={partKey++} className="font-semibold text-foreground">
            {match[2]}
          </strong>
        )
      } else if (match[3]) {
        // Italic
        parts.push(
          <em key={partKey++} className="italic">
            {match[3]}
          </em>
        )
      }
      lastIndex = match.index + match[0].length
    }

    if (lastIndex < text.length) {
      parts.push(<span key={partKey++}>{text.slice(lastIndex)}</span>)
    }

    return parts.length > 0 ? parts : text
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim()

    // Heading ### (h3)
    if (trimmed.startsWith('### ')) {
      flushList()
      elements.push(
        <h4 key={index} className="font-semibold text-foreground mt-3 mb-1 text-sm">
          {renderInlineFormatting(trimmed.slice(4))}
        </h4>
      )
      return
    }

    // Heading ## (h2)
    if (trimmed.startsWith('## ')) {
      flushList()
      elements.push(
        <h3 key={index} className="font-semibold text-foreground mt-3 mb-1.5 text-sm">
          {renderInlineFormatting(trimmed.slice(3))}
        </h3>
      )
      return
    }

    // Heading # (h1)
    if (trimmed.startsWith('# ')) {
      flushList()
      elements.push(
        <h2 key={index} className="font-bold text-foreground mt-3 mb-1.5 text-base">
          {renderInlineFormatting(trimmed.slice(2))}
        </h2>
      )
      return
    }

    // Unordered list item
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
      listItems.push(trimmed.replace(/^[-*•]\s+/, ''))
      return
    }

    // Ordered list item (simple: 1. 2. etc.)
    if (/^\d+\.\s/.test(trimmed)) {
      listItems.push(trimmed.replace(/^\d+\.\s+/, ''))
      return
    }

    // Flush any accumulated list items
    flushList()

    // Empty line
    if (trimmed === '') {
      elements.push(<div key={index} className="h-2" />)
      return
    }

    // Regular paragraph
    elements.push(
      <p key={index} className="text-sm leading-relaxed">
        {renderInlineFormatting(trimmed)}
      </p>
    )
  })

  flushList()
  return elements
}

// ─── Welcome Message ────────────────────────────────────────────────
const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "👋 Hi! I'm your **AI SEO Assistant**. I can help you analyze your website's SEO performance, identify issues, and provide actionable recommendations.\n\nAsk me anything about:\n- SEO score improvements\n- Technical issues & fixes\n- Keyword strategies\n- Content optimization\n- Backlink analysis",
  timestamp: new Date(),
}

// ─── Main Component ─────────────────────────────────────────────────
export function AiChatAssistant() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [messages, setMessages] = React.useState<ChatMessage[]>([WELCOME_MESSAGE])
  const [inputValue, setInputValue] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const activeProjectId = useSeoStore((s) => s.activeProjectId)
  const isMobile = useIsMobile()
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading])

  // Focus input when panel opens
  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  // Generate unique IDs
  const generateId = React.useCallback(() => {
    return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  }, [])

  // Send message to API
  const sendMessage = React.useCallback(
    async (messageText: string) => {
      if (!messageText.trim() || isLoading) return

      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: messageText.trim(),
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])
      setInputValue('')
      setIsLoading(true)
      setError(null)

      try {
        const history = messages
          .filter((m) => m.id !== 'welcome')
          .map((m) => ({ role: m.role, content: m.content }))

        const response = await fetch('/api/seo/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: messageText.trim(),
            projectId: activeProjectId,
            history,
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to get response (${response.status})`)
        }

        const data: ChatApiResponse = await response.json()

        const assistantMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, assistantMessage])
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Something went wrong'
        setError(errorMessage)

        // Add error as assistant message
        const errorAssistantMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content:
            "I'm sorry, I encountered an error processing your request. Please try again. \n\n*If the issue persists, check your connection or try a different question.*",
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, errorAssistantMessage])
      } finally {
        setIsLoading(false)
        setTimeout(() => inputRef.current?.focus(), 100)
      }
    },
    [isLoading, messages, activeProjectId, generateId]
  )

  // Handle form submit
  const handleSubmit = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      sendMessage(inputValue)
    },
    [inputValue, sendMessage]
  )

  // Handle suggested question click
  const handleSuggestedQuestion = React.useCallback(
    (question: string) => {
      sendMessage(question)
    },
    [sendMessage]
  )

  // Clear conversation
  const handleClearConversation = React.useCallback(() => {
    setMessages([WELCOME_MESSAGE])
    setError(null)
  }, [])

  // Close panel
  const handleClose = React.useCallback(() => {
    setIsOpen(false)
  }, [])

  // Panel dimensions based on screen size
  const panelWidth = isMobile ? 'w-full' : 'w-[400px]'
  const panelHeight = isMobile ? 'h-[85vh]' : 'h-[600px]'

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            onClick={() => setIsOpen(true)}
            className={cn(
              'fixed bottom-6 right-6 z-50',
              'flex h-14 w-14 items-center justify-center rounded-full',
              'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30',
              'hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/40',
              'transition-all duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2'
            )}
            aria-label="Open AI SEO Assistant"
          >
            {/* Pulse ring animation */}
            <span className="absolute inset-0 rounded-full animate-ping bg-emerald-400/30 [animation-duration:2s]" />
            <Sparkles className="h-6 w-6 relative z-10" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={cn(
              'fixed z-50 flex flex-col overflow-hidden rounded-2xl',
              'border border-border bg-background shadow-2xl',
              isMobile
                ? 'inset-x-0 bottom-0 rounded-b-none'
                : 'bottom-6 right-6',
              panelWidth,
              panelHeight
            )}
          >
            {/* ─── Header ─────────────────────────────────────────── */}
            <div className="flex items-center justify-between border-b bg-emerald-600 px-4 py-3 text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                  <Bot className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold leading-none">
                    AI SEO Assistant
                  </h3>
                  <p className="text-[11px] text-emerald-100 mt-0.5">
                    Powered by RankPulse AI
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {messages.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
                    onClick={handleClearConversation}
                    aria-label="Clear conversation"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
                  onClick={handleClose}
                  aria-label="Close AI Assistant"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* ─── Messages Area ──────────────────────────────────── */}
            <ScrollArea className="flex-1 overflow-hidden">
              <div className="p-4 space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' as const }}
                    className={cn(
                      'flex gap-2.5',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {/* AI Avatar */}
                    {message.role === 'assistant' && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 mt-0.5">
                        <Bot className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div
                      className={cn(
                        'max-w-[85%] rounded-2xl px-3.5 py-2.5',
                        message.role === 'user'
                          ? 'bg-emerald-600 text-white rounded-br-md'
                          : 'bg-muted text-foreground rounded-bl-md'
                      )}
                    >
                      {message.role === 'assistant' ? (
                        <div className="space-y-0.5 text-muted-foreground">
                          {renderFormattedContent(message.content)}
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      )}
                      <span
                        className={cn(
                          'mt-1.5 block text-[10px]',
                          message.role === 'user'
                            ? 'text-emerald-200'
                            : 'text-muted-foreground/50'
                        )}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* User Avatar */}
                    {message.role === 'user' && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600/10 dark:bg-emerald-900/30 mt-0.5">
                        <User className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    )}
                  </motion.div>
                ))}

                {/* Loading Indicator */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2.5 justify-start"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 mt-0.5">
                      <Bot className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="flex gap-1">
                          <motion.span
                            className="h-2 w-2 rounded-full bg-emerald-400"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              delay: 0,
                            }}
                          />
                          <motion.span
                            className="h-2 w-2 rounded-full bg-emerald-400"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              delay: 0.2,
                            }}
                          />
                          <motion.span
                            className="h-2 w-2 rounded-full bg-emerald-400"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              delay: 0.4,
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground ml-1">
                          Thinking...
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Suggested Questions - show only on welcome / early conversation */}
                {messages.length <= 1 && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                    className="space-y-2 pt-2"
                  >
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-1">
                      Quick questions
                    </p>
                    <div className="space-y-1.5">
                      {SUGGESTED_QUESTIONS.map((q) => (
                        <button
                          key={q.text}
                          onClick={() => handleSuggestedQuestion(q.text)}
                          className={cn(
                            'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5',
                            'text-left text-sm text-foreground',
                            'border border-border bg-background',
                            'hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-200 dark:hover:border-emerald-800',
                            'transition-all duration-150',
                            'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400'
                          )}
                        >
                          <q.icon className={cn('h-4 w-4 shrink-0', q.color)} />
                          <span className="flex-1">{q.text}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* ─── Input Area ─────────────────────────────────────── */}
            <div className="border-t bg-background p-3 shrink-0">
              {/* No project warning */}
              {!activeProjectId && (
                <div className="mb-2 flex items-center gap-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-2.5 py-1.5">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span className="text-[11px] text-amber-700 dark:text-amber-400">
                    Select a project for personalized insights
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about your SEO..."
                  disabled={isLoading}
                  className={cn(
                    'flex-1 h-10 text-sm',
                    'border-border bg-background',
                    'focus-visible:border-emerald-400 focus-visible:ring-emerald-400/30',
                    'placeholder:text-muted-foreground/60'
                  )}
                  aria-label="Type your SEO question"
                />
                <Button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  size="icon"
                  className={cn(
                    'h-10 w-10 shrink-0 rounded-xl',
                    'bg-emerald-600 hover:bg-emerald-700 text-white',
                    'disabled:opacity-40 disabled:cursor-not-allowed',
                    'transition-all duration-150'
                  )}
                  aria-label="Send message"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>

              {/* Footer */}
              <p className="mt-1.5 text-center text-[10px] text-muted-foreground/50">
                AI may produce inaccurate information. Verify important details.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
