# CLAUDE.md - OKR Dashboard

This file provides guidance to Claude Code when working on the OKR Dashboard project.

## Project Overview

**OKR Game Board** - A professional, game-board-inspired tool that transforms OKRs from static documents into a dynamic, collaborative system. Designed for teams of ~8 people to collectively create, agree upon, and track progress on shared objectives.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Runtime**: Bun (package manager + dev server)
- **UI**: React 19, TypeScript
- **Database**: InstantDB (real-time collaborative database)
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Deploy**: Cloudflare Pages or Vercel
- **Domain**: okr.quarterly.systems

## Quick Start

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

## Project Structure

```
okr-dashboard/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Main tactical board view
│   ├── create/            # OKR creation workflow
│   ├── reflect/           # Reflection mode for planning
│   ├── okr/[id]/          # Individual OKR detail views
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles + spaceship theme
├── components/
│   ├── tactical/          # Main command center UI
│   ├── creation/          # OKR creation workflow components
│   ├── detail/            # OKR detail view components
│   └── shared/            # Reusable components (buttons, cards, etc.)
├── lib/
│   └── instant.ts         # InstantDB client + types
├── public/                # Static assets
├── instant.schema.ts      # InstantDB schema definition
├── instant-rules.md       # CRITICAL: Read before coding InstantDB features
├── tailwind.config.ts     # Spaceship theme configuration
└── package.json           # Bun dependencies
```

## Design Language: Spaceship Command Center

### Aesthetic
- **Inspiration**: Battlestar Galactica CIC, The Expanse bridge terminals
- **Core Principle**: Military-grade functionality meets sleek interfaces
- **Feel**: Tactical war room, strategic command center, mission control

### Color Palette
- **Base**: Deep space blacks (`panel-bg: #0f0f12`)
- **Primary**: Cool blues/cyans (`space-400`, `space-600`)
- **Accents**: Orange/amber for alerts (`alert-warning`, `alert-critical`)
- **Status Colors**:
  - Green: On track (`alert-normal`)
  - Yellow/Orange: At risk (`alert-warning`)
  - Red: Blocked/critical (`alert-critical`)
  - Blue: In progress (`alert-info`)

### Typography
- **Primary**: Inter (sans-serif)
- **Technical**: JetBrains Mono (monospace for labels, metrics)
- **Style**: Uppercase for headers, monospace for data

### UI Patterns
- **Panels**: Dark backgrounds with subtle borders (`.panel` class)
- **Glow Effects**: Subtle shadows on interactive elements (`shadow-glow`)
- **Scanlines**: CRT-style scanlines for that tactical display feel (`.scanlines`)
- **Animations**: Purposeful, not decorative (data updating, status changes)

### Component Classes
```css
.panel             - Base panel with dark bg + border
.panel-hover       - Hover effect for interactive panels
.text-glow         - Subtle text glow effect
.border-glow       - Border glow effect
.scanlines         - CRT scanline overlay
```

## Development Workflow

### Phase 1: Mexico Demo (Week 1)
**Goal**: Working prototype for team goal-setting meeting

**Features**:
- Reflection board (sticky notes, voting)
- OKR creation form
- Visual tactical board
- Basic progress display
- Export view

**Commands**:
```bash
bun run dev        # Fast dev server
bunx instant-cli push   # Deploy schema changes
```

### Phase 2: Living System (Weeks 2-4)
**Goal**: Daily driver for team operations

**Features**:
- Real-time collaboration
- Weekly check-in workflow
- Individual OKR detail views
- Activity feed
- Mobile optimization

### Phase 3: Polish & Enhance (Weeks 5-8)
**Goal**: Production-ready, shareable tool

**Features**:
- Performance optimization
- Advanced visualizations
- GitHub/tool integrations
- Historical tracking
- Search and filter

## InstantDB Patterns

**CRITICAL**: Always read `instant-rules.md` before writing InstantDB code.

### Schema
Defined in `instant.schema.ts`:
- `okrs` - Main objectives
- `keyResults` - Measurable outcomes
- `reflections` - Planning phase inputs
- `comments` - Team discussion
- `actions` - Tasks/backlog items
- `risks` - Obstacles and blockers
- `members` - Team roster
- `activities` - Activity feed

### Common Queries
```tsx
// Get active OKRs for current quarter
const { data } = db.useQuery({
  okrs: {
    keyResults: {},
    comments: {},
    $: {
      where: { quarter: getCurrentQuarter(), status: "active" },
    },
  },
});
```

### Mutations
```tsx
// Always use transactions for related changes
db.transact([
  db.tx.okrs[okrId].update({ status: "active" }),
  db.tx.activities[db.id()].update({
    type: "updated",
    description: "OKR activated",
    author: currentUser,
    timestamp: Date.now(),
  }),
]);
```

## Coding Standards

### TypeScript
- Use strict mode (enabled in tsconfig.json)
- No `any` types - use proper types from `@/lib/instant`
- Use status constants from `lib/instant.ts` (don't use magic strings)

### React
- Prefer server components where possible
- Use "use client" only when needed (hooks, interactivity)
- Always handle loading/error states in queries

### Styling
- Use Tailwind utility classes
- Follow spaceship theme (see globals.css)
- Use design tokens (colors, spacing)
- Responsive by default (mobile-first)

### File Naming
- Components: PascalCase (e.g., `TacticalBoard.tsx`)
- Utilities: camelCase (e.g., `formatDate.ts`)
- Pages: lowercase (e.g., `app/okr/[id]/page.tsx`)

## Testing Strategy

### Manual Testing Checklist
- [ ] Real-time updates (open in 2 browsers)
- [ ] Offline behavior (disable network)
- [ ] Mobile responsiveness
- [ ] Loading states
- [ ] Error handling
- [ ] Optimistic updates feel instant

### Performance
- Monitor with Next.js DevTools
- Test with slow network (DevTools throttling)
- Check bundle size (`bun run build`)

## Deployment

### Cloudflare Pages (Recommended)
```bash
# Auto-deploy on push to main branch
git add .
git commit -m "..."
git push
```

**Configuration**:
- Build command: `bun run build`
- Output directory: `.next`
- Environment variables: Add `NEXT_PUBLIC_INSTANT_APP_ID`

### Vercel (Alternative)
```bash
# Install Vercel CLI
bun add -g vercel

# Deploy
vercel --prod
```

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_INSTANT_APP_ID=your_app_id_here
```

Get your InstantDB app ID:
1. Go to https://instantdb.com/dash
2. Create a new app or use existing
3. Copy the app ID
4. Add to `.env.local`

## Common Tasks

### Adding a New Page
```bash
# Create new route
mkdir -p app/new-page
touch app/new-page/page.tsx
```

### Adding a Component
```bash
# Create in appropriate folder
touch components/tactical/NewComponent.tsx
```

### Updating Schema
```bash
# 1. Edit instant.schema.ts
# 2. Push to InstantDB
bunx instant-cli push
# 3. Update types in lib/instant.ts if needed
```

### Adding Dependencies
```bash
# Use bun (not npm/pnpm)
bun add package-name
bun add -d dev-package-name
```

## User Roles

### Team Member (8 people)
- View all OKRs
- Add notes/comments
- Update their key results
- Participate in creation/voting

### Facilitator/Admin (1-2 people)
- Create/delete OKRs
- Manage team access
- Archive old OKRs
- Export data

## Data Model

### OKR Lifecycle
1. **Draft** - Being created/edited
2. **Active** - Current quarter objectives
3. **Completed** - Successfully achieved
4. **Archived** - Historical record

### Health Status
- **On-track** - Progressing well (green)
- **At-risk** - Needs attention (yellow)
- **Blocked** - Critical issues (red)
- **Unknown** - Not enough data (gray)

## Important Notes

- **ALWAYS use Bun** - Not npm, yarn, or pnpm
- **ALWAYS read instant-rules.md** - Before writing InstantDB code
- **ALWAYS handle loading states** - Never assume data is loaded
- **ALWAYS use status constants** - No magic strings
- **Mobile-first** - Design for small screens, enhance for large
- **Spaceship aesthetic** - Keep it professional but engaging
- **Real-time first** - Optimistic updates, instant feedback

## Resources

- **InstantDB Docs**: https://instantdb.com/docs
- **Next.js 16 Docs**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Lucide Icons**: https://lucide.dev
- **Bun Docs**: https://bun.sh/docs

## Troubleshooting

### "Could not find InstantDB app"
- Check `.env.local` has correct `NEXT_PUBLIC_INSTANT_APP_ID`
- Verify app exists in https://instantdb.com/dash
- Restart dev server after env changes

### Schema changes not reflecting
- Run `bunx instant-cli push`
- Clear browser cache/localStorage
- Check InstantDB dashboard for errors

### Styles not applying
- Verify Tailwind config includes all content paths
- Check for typos in class names
- Ensure globals.css is imported in layout.tsx

### Slow performance
- Check for over-fetching in queries
- Use React DevTools Profiler
- Enable Turbopack in dev (`--turbopack` flag)

## Contact

Part of the **Quarterly Systems** ecosystem - https://quarterly.systems

"a K5M company"
