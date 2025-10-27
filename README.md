# OKR Game Board

A professional, game-board-inspired tool that transforms OKRs from static documents into a dynamic, collaborative system. Designed for teams of ~8 people to collectively create, agree upon, and track progress on shared objectives.

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Set up environment
cp .env.local.example .env.local
# Add your InstantDB app ID to .env.local

# Deploy schema to InstantDB
bunx instant-cli push

# Run dev server
bun run dev  # Starts on :3000 with Turbopack
```

## 🎨 Design Philosophy

**Spaceship Command Center Aesthetic**

Inspired by tactical displays from Battlestar Galactica and The Expanse, the interface combines military-grade functionality with sleek, modern design. Every element serves a purpose, creating an engaging but professional environment for strategic planning.

- **Dark space theme** with blue/cyan accents
- **Monospace typography** for technical feel
- **Purposeful animations** that show data updating
- **Status indicators** with clear color coding
- **Scanline effects** for that CRT tactical display feel

## 📋 Features

### Phase 1: Mexico Demo (Week 1) ✓
- [x] Project scaffolding with Next.js 16 + Bun + InstantDB
- [x] Spaceship command center UI theme
- [x] InstantDB schema for OKRs, key results, reflections
- [ ] Reflection board (sticky notes, voting)
- [ ] OKR creation workflow
- [ ] Visual tactical board display
- [ ] Export view for presentations

### Phase 2: Living System (Weeks 2-4)
- [ ] Real-time collaboration with presence
- [ ] Weekly check-in workflow
- [ ] Individual OKR detail views
- [ ] Activity feed
- [ ] Mobile optimization
- [ ] User authentication

### Phase 3: Polish & Enhance (Weeks 5-8)
- [ ] Performance optimization
- [ ] Advanced visualizations
- [ ] GitHub/tool integrations
- [ ] Historical tracking
- [ ] Search and filter

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Runtime**: Bun 1.x
- **UI**: React 19 + TypeScript
- **Database**: InstantDB (real-time collaborative)
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Charts**: Recharts

## 📁 Project Structure

```
okr-dashboard/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Main tactical board view
│   ├── create/            # OKR creation workflow
│   ├── reflect/           # Reflection mode
│   ├── okr/[id]/          # Individual OKR views
│   └── globals.css        # Global styles + theme
├── components/
│   ├── tactical/          # Command center UI
│   ├── creation/          # Creation workflow
│   ├── detail/            # Detail views
│   └── shared/            # Reusable components
├── lib/
│   └── instant.ts         # InstantDB client + types
├── instant.schema.ts      # Database schema
├── instant-rules.md       # CRITICAL: Read before coding
└── tailwind.config.ts     # Spaceship theme config
```

## 💾 Data Model

### Entities
- **okrs** - Main objectives (title, description, status, health)
- **keyResults** - Measurable outcomes (target, current, unit, owner)
- **reflections** - Planning inputs (moments, learnings, advice, trends)
- **comments** - Team discussion
- **actions** - Tasks and backlog items
- **risks** - Obstacles and blockers
- **members** - Team roster
- **activities** - Activity feed

### OKR Lifecycle
1. **Draft** → Being created/edited
2. **Active** → Current quarter objectives
3. **Completed** → Successfully achieved
4. **Archived** → Historical record

## 🎯 User Workflow

### 1. Reflection & Planning
Team reviews past quarter, identifies trends, votes on key insights

### 2. OKR Creation
Convert insights into 1-3 clear objectives with measurable key results

### 3. Progress Tracking
Weekly updates, real-time collaboration, health monitoring

### 4. End of Cycle
Review outcomes, capture learnings, feed into next planning session

## 🔧 Development

### Commands
```bash
bun run dev              # Start dev server
bun run build            # Production build
bunx instant-cli push    # Deploy schema
bunx instant-cli pull    # Pull schema changes
```

### Important Files
- `instant-rules.md` - **Read this before writing InstantDB code!**
- `CLAUDE.md` - Detailed development guide
- `.env.local` - Environment variables (not committed)

### Coding Standards
- Use TypeScript strict mode (no `any` types)
- Always handle loading/error states
- Use status constants from `lib/instant.ts`
- Follow spaceship aesthetic
- Mobile-first responsive design

## 🌐 Deployment

### Cloudflare Pages (Recommended)
- Auto-deploy on push to `main` branch
- Build command: `bun run build`
- Output directory: `.next`
- Add `NEXT_PUBLIC_INSTANT_APP_ID` env var

### Vercel (Alternative)
```bash
bun add -g vercel
vercel --prod
```

## 🔑 Environment Setup

1. Go to [InstantDB Dashboard](https://instantdb.com/dash)
2. Create a new app or use existing
3. Copy the app ID
4. Create `.env.local`:
```bash
NEXT_PUBLIC_INSTANT_APP_ID=your_app_id_here
```

## 📚 Resources

- [InstantDB Docs](https://instantdb.com/docs)
- [Next.js 16 Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Bun Docs](https://bun.sh/docs)

## 🎭 Design References

- Battlestar Galactica CIC displays
- The Expanse bridge interfaces
- Linear (clean, purposeful UI)
- Vercel Dashboard (dark, technical)

## 📦 Part of Quarterly Systems

This is the 7th product in the Quarterly Systems ecosystem.

**Website**: https://quarterly.systems
**Domain** (planned): okr.quarterly.systems
**Company**: a K5M company

## 📄 License

Private - Part of Quarterly Systems ecosystem

---

**Status**: 🚧 In Development - Phase 1 (Mexico Demo)
**Team Size**: ~8 people
**Started**: October 2025
