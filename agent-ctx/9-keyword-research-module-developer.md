# Task 9: Keyword Research & Discovery Module Developer

## Status: ✅ COMPLETED

## What was done:
- Created `src/components/seo/keyword-research-module.tsx` — comprehensive Keyword Research & Discovery module
- Updated `src/components/seo/app-shell.tsx` to import and render KeywordResearchModule when activeModule === 'research'
- Fixed `LinkOff` import error in alerts-module.tsx (changed to `Link2Off` which is the correct lucide-react export name)

## Module sections built:
1. **Search Interface** — Large search input with "Enter a seed keyword..." placeholder, "Research" button with Sparkles icon and loading spinner state, recent searches chips (max 8), trending seed suggestions as clickable chips
2. **Empty State** — Google-like centered search with Search icon, instructional text, and trending topic chips
3. **Summary Stats** (4-card grid) — Total Volume, Avg Difficulty, Avg CPC, Easy Keywords count
4. **Volume vs Difficulty Scatter Plot** — Recharts ScatterChart with X=Difficulty, Y=Volume, Z=CPC (bubble size), colored by intent
5. **Prioritization Matrix** — Quadrant chart with ReferenceArea backgrounds (Quick Wins, High Value, Low Hanging Fruit, Hard Won)
6. **Keyword Clustering by Intent** — 2-column grid grouping by intent with colored tags
7. **Filter Bar** — Difficulty range slider, Intent dropdown, Min volume input, Reset button
8. **Results Table** — Sortable columns with Difficulty bars, Intent badges, Trend arrows, Add/Remove actions
9. **Keyword List Builder** — Sheet panel with saved keywords, Clear All, Export CSV

## Color system:
- Difficulty: 0-30 emerald, 31-60 amber, 61-100 rose
- Intent: informational=sky, navigational=violet, commercial=amber, transactional=emerald
- NO indigo/blue used

## Technical details:
- TanStack React Query with 5-min stale time for LLM responses
- Framer Motion animations
- Custom scatter tooltip
- CSV export functionality
- Lint: 0 errors
