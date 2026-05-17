# 🔍 RankPulse - Advanced SEO Tracker

**Open-source, free SEO analysis platform** — Analyze any website's SEO performance with real-time insights powered by AI.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

### Core SEO Analysis
- **Dashboard** — Real-time SEO health overview with score tracking
- **Site Audit** — Comprehensive technical SEO audit (meta tags, headings, schema markup, accessibility, performance)
- **Keyword Tracking** — Track keyword rankings and position changes over time
- **Backlink Analysis** — Monitor backlink profile and linking domains
- **Competitor Intelligence** — Compare your site against competitors
- **Keyword Research** — AI-powered keyword suggestions and difficulty analysis
- **Content Optimizer** — Score and improve your content for better SEO
- **Core Web Vitals** — Performance metrics monitoring (LCP, FID, CLS)
- **Schema Markup Analyzer** — Validate structured data and rich snippets

### AI-Powered Features
- **AI Chat Assistant** — Ask SEO questions and get expert advice
- **AI Action Plan** — Prioritized, step-by-step SEO improvement recommendations
- **Smart Content Scoring** — ML-based content quality assessment

### Platform Features
- **Dark/Light Theme** — Beautiful UI with theme support
- **PDF Report Export** — Download comprehensive SEO reports
- **Alerts & Notifications** — Stay on top of SEO changes
- **Multi-site Support** — Analyze multiple websites
- **Responsive Design** — Works on desktop, tablet, and mobile

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/krishrathi1/Seo-Tracker-.git
cd Seo-Tracker-

# Install dependencies
bun install

# Set up the database
bun run db:push

# Start the development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 16** | React framework with App Router |
| **TypeScript 5** | Type-safe development |
| **Tailwind CSS 4** | Utility-first styling |
| **shadcn/ui** | Beautiful UI components |
| **Prisma ORM** | Database management (SQLite) |
| **Recharts** | Data visualization |
| **Zustand** | State management |
| **TanStack Query** | Server state management |
| **z-ai-web-dev-sdk** | AI-powered features |

## 📁 Project Structure

```
src/
├── app/
│   ├── api/seo/          # API routes for SEO analysis
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Main application page
│   └── globals.css       # Global styles
├── components/
│   ├── seo/              # SEO module components
│   │   ├── dashboard-module.tsx
│   │   ├── site-audit-module.tsx
│   │   ├── keyword-tracking-module.tsx
│   │   ├── backlinks-module.tsx
│   │   ├── competitors-module.tsx
│   │   ├── keyword-research-module.tsx
│   │   ├── content-optimizer-module.tsx
│   │   ├── core-web-vitals-module.tsx
│   │   ├── schema-analyzer-module.tsx
│   │   ├── action-plan-module.tsx
│   │   ├── ai-chat-assistant.tsx
│   │   ├── alerts-module.tsx
│   │   ├── reports-module.tsx
│   │   ├── settings-module.tsx
│   │   ├── onboarding-flow.tsx
│   │   └── app-shell.tsx
│   └── ui/               # shadcn/ui components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and store
└── components/providers/ # Context providers
```

## 🔧 How It Works

1. **Enter a URL** — Input any website URL you want to analyze
2. **Real-time Analysis** — The engine fetches and parses the live page
3. **SEO Scoring** — Get a comprehensive SEO score across multiple categories
4. **Actionable Insights** — Receive prioritized recommendations
5. **Track Progress** — Monitor improvements over time

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Areas We Need Help With
- 🌐 Internationalization (i18n)
- 📊 More SEO analysis metrics
- 🔌 Plugin system
- 📱 Mobile app
- 🧪 Test coverage
- 📖 Documentation

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

**Free forever. Open source for everyone.**

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) — The React Framework
- [shadcn/ui](https://ui.shadcn.com/) — Beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS
- [Recharts](https://recharts.org/) — Charting library
- [Prisma](https://www.prisma.io/) — Database ORM

---

<p align="center">
  Built with ❤️ by the open-source community
</p>
