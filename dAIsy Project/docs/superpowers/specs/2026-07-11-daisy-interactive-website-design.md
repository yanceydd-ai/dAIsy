# dAIsy Interactive Website — Design Spec

**Date:** 2026-07-11  
**Source document:** `dAIsy_Student_Program_DesignThinking_v11_Jul11.docx`  
**Status:** Approved for implementation

---

## Overview

A multi-page, highly interactive reference website presenting the dAIsy Student Program to school leadership (board members, administrators, division heads). The site's job is to inform and serve as a returnable reference — not to pitch or present live. Leadership should be able to explore at their own pace, bookmark specific sections, and share individual pages.

Built with **Next.js (App Router) + Framer Motion + Tailwind CSS + shadcn/ui**. Deployable to Vercel.

---

## Pages

### 1. Home (`/`)
- **Hero:** Large animated dAIsy flower; each petal represents one pillar and pulses gently on load. Clicking a petal navigates to that pillar's page. Tagline: *"The future belongs to the students who are most fluent in AI — who can direct it, doubt it, and judge what it gives them."*
- **Pipeline diagram:** Animated circular flow — Ambassadors welcome her → Orchestrator ladder certifies her → Innovation Challenge lets her build → Gold makes her an Ambassador → cycle renews. Nodes light up in sequence on load; hover for one-sentence summary; click to navigate.
- **Three pillar cards:** Each card uses its pillar color, carries a one-paragraph summary, and links to the full pillar page.
- **AI Use Scale callout:** Brief introduction to the Scale as the instrument threading all three pillars; links to the dedicated Scale page.

### 2. AI Ambassadors (`/ambassadors`)
- **Purpose section:** Opening narrative (the "one school, many starting lines" framing).
- **Who serves:** Card showing Silver/Gold Orchestrators as the source; how they're recruited through student council and tech clubs.
- **Onboarding model:** Four-session sequence rendered as interactive cards — click each session to expand its core experience, what she leaves knowing. Sessions: "What AI Can and Can't Do," "Our School's Expectations," "AI Is Not a Friend," "Family Segment."
- **Division callout:** Middle School (5–8) vs. Upper School (9–12) differences displayed side by side.
- **Companion AI section:** Expandable panel covering the adult responsibility protocol, counseling-office partnership, and community education evening.
- **Family strand:** Three touchpoints (Family Guide, fall Ambassador demos, spring Pulse session) as a visual timeline.
- **Cornerstone alignment badge:** Courtesy.

### 3. Junior AI Orchestrator (`/orchestrator`)
- **Purpose section:** Why a credential and not a course; the orchestrator role in the future economy.
- **Certification ladder:** Three-rung vertical visual ladder (Bronze / Silver / Gold). Each rung expands on click:
  - What she demonstrates
  - What evidence is required to advance
  - What tool access she earns
  - Cornerstone alignment
- **How mastery is evidenced:** Four evidence types (process evidence, oral defense, disclosure over detection, peer teaching) as icon + description cards.
- **Verification-first integrity policy:** The formal policy language displayed in a styled blockquote; the three jobs it does listed beneath.
- **Tiered tool access table:** Universal baseline → Middle School → Selective/certified, with tool names and rationale.
- **Cornerstone alignment badge:** Scholarship & Character.

### 4. Innovation Challenge (`/challenge`)
- **Purpose section:** Why a Build Day and not a test; the failure requirement and its pedagogical rationale.
- **Structure grid:** Audience, Format, Teams, Scope, Use Scale — displayed as a clean stat/definition grid.
- **Role structure callout:** Lead Architect / UX-UI Lead / Ethics Officer / Project Manager — with the inclusion framing ("the girl who cannot write a line of code…").
- **Challenge areas:** Five challenge areas as a visual card grid (student wellness, sustainability, accessibility, school operations, community impact).
- **Build Day timeline:** Animated horizontal timeline of the sample day (09:00–18:00). Each block reveals its description on hover/tap.
- **Judging rubric:** Visual bar or donut chart showing criterion weights (Problem Clarity 20%, Meaningful AI Integration 20%, Functionality 20%, Explainability 15%, Depth of Understanding 15%, Impact Potential 10%). Each criterion links to its AILit domain.
- **STEMmy Awards:** Five award names displayed as celebratory cards.
- **dAIsy Studio pathway:** Brief callout on the Fellows pathway for selected teams.
- **SAFE AI governance:** Four principles (Safety, Accountability, Fairness, Evidence-based) as icon cards.

### 5. AI Use Scale (`/use-scale`)
- **The centerpiece interactive tool.** A horizontal level selector (0–4).
- Clicking a level reveals:
  - The level name and definition
  - A real scenario narrative ("It's 10pm, she's stuck on an essay…")
  - What disclosure looks like at that level
  - Which pillar activities operate at that level (Ambassadors teach it, Bronze requires 1–2, Silver requires 3, Build Day is 4)
- **"What does silence mean?" callout:** Always resolves to Level 0; styled prominently.
- **Three design rules:** Displayed as a numbered list below the selector (silence is never grey; disclosure is never penalized; the scale threads the pillars).
- **Why Level 0 is a gift:** Cognitive research section with the aviation analogy.
- **Decision-aid panel:** The "unsure at 10pm" guidance — do the work as you understand it, write one disclosure sentence.
- **Printable one-pager button:** Triggers a print-optimized stylesheet view.

### 6. Research & Evidence (`/research`)
- **Six animated stat counters** (animate 0 → value on scroll-into-view):
  - 54% of middle/high school students use AI for schoolwork (RAND 2025)
  - 15% feel adequately guided on appropriate AI use (OUP 2026)
  - 44% are sure copying a generated answer counts as cheating (OUP 2026)
  - 73% have heard what they may use AI / only 51% how to evaluate accuracy (Common Sense 2026)
  - ~50% of daily AI users report loneliness vs. ~33% non-users (Common Sense 2026)
  - Entry-level hiring down 15–25% in consulting, legal, finance (Harvard Kennedy School 2026)
- **Six research findings:** Each expanded into a card — finding, source, and "what dAIsy does in response."
- **dAIsy Pulse benchmarks table:** Four pulse items with national benchmark and dAIsy target side by side.
- **Full research base citation list** at page bottom.

### 7. Governance (`/governance`)
- **Tool Risk Tier Map:** Four-column interactive grid (Prohibited / Governed / Approved / Educator Caution). Each column expands to show tool categories and Hockaday posture. Prohibited column has muted/struck visual treatment.
- **SAFE AI framework:** Safety / Accountability / Fairness / Evidence-based — four quadrant cards.
- **Verification-first stance:** Formal policy language; links back to /orchestrator for full context.
- **Iteration loops table:** Four feedback loops (onboarding exit tickets, teacher check, Build Day retrospective, dAIsy Pulse) with cadence, owner, and what they can change.
- **The measure of success:** The closing statement from the document displayed as a full-width typographic pullquote.

---

## Visual Identity

### Color system
| Token | Value | Use |
|-------|-------|-----|
| Background | `#FAFAF7` | Page background — warm off-white |
| Primary | `#1B4332` | Headings, nav, primary text |
| Accent / AI spark | `#F5C842` | CTA buttons, highlight, flower center |
| Ambassadors petal | `#E8A598` | Pillar 1 accent color |
| Orchestrator petal | `#A89BC2` | Pillar 2 accent color |
| Challenge petal | `#7BB8D4` | Pillar 3 accent color |
| Prohibited | `#D9534F` | Risk tier prohibited state |
| Caution | `#F0A500` | Risk tier caution state |

### Typography
- **Display/headings:** Playfair Display (Google Fonts) — geometric serif; human warmth + institutional credibility
- **Body:** Inter — clean, readable, modern
- **Data/stats:** Inter with tabular figures; oversized for emphasis

### Motion principles (Framer Motion)
- Page transitions: fade + slight upward slide (200ms ease-out)
- Scroll-triggered reveals: each section animates in as it enters the viewport (staggered children)
- Stat counters: count from 0 to target value over 1.5s on first viewport entry
- Pipeline diagram: sequential node light-up on load (500ms stagger per node)
- Ladder rungs: smooth height expand on click (spring physics)

### The flower motif
- dAIsy SVG logo in top-left nav on every page — three petals in pillar colors, golden center
- Homepage hero: large animated SVG flower (petals pulse at 0.8 opacity → 1.0 on a 3s loop); petals are clickable
- Section dividers: subtle petal-curve SVG between major content blocks

---

## Technical Architecture

### Stack
- **Framework:** Next.js 15 (App Router)
- **Animations:** Framer Motion
- **Styling:** Tailwind CSS v4 + CSS custom properties for the color tokens
- **Components:** shadcn/ui for base UI (buttons, cards, tabs, accordion)
- **Icons:** Lucide React
- **Fonts:** Google Fonts (Playfair Display + Inter) via `next/font`
- **Deployment:** Vercel (zero-config)

### File structure
```
app/
  layout.tsx              # Global nav, fonts, metadata
  page.tsx                # Home
  ambassadors/page.tsx
  orchestrator/page.tsx
  challenge/page.tsx
  use-scale/page.tsx
  research/page.tsx
  governance/page.tsx
components/
  nav/                    # Sticky navigation
  flower/                 # Animated SVG flower components
  pipeline/               # Homepage pipeline diagram
  use-scale/              # Interactive level selector
  ladder/                 # Bronze/Silver/Gold ladder
  timeline/               # Build Day timeline
  stats/                  # Animated stat counters
  risk-tier/              # Tool Risk Tier Map
  ui/                     # shadcn base components
lib/
  content.ts              # All content as typed constants (no hardcoded strings in components)
  motion.ts               # Shared Framer Motion variants
public/
  daisy-logo.svg
  daisy-flower.svg
```

### Content approach
All content lives in `lib/content.ts` as typed TypeScript constants. Components receive content as props. This keeps components reusable and makes content updates a single-file change.

### Print support
The `/use-scale` page includes a `@media print` stylesheet that renders the AI Use Scale decision-aid as a clean one-pager (matching the physical artifact described in the document).

---

## Out of Scope (v1)

- Authentication / student login
- Backend / database (all content is static)
- CMS integration
- Mobile-native app
- Actual dAIsy Pulse survey collection
- Certification tracking / student progress state

---

## Success Criteria

A leadership visitor can:
1. Land on the homepage and immediately understand the program's structure and logic
2. Navigate to any pillar and understand what it is, who it serves, and how it works — without reading the source document
3. Use the AI Use Scale tool to understand what any level means and what it requires
4. Find the research evidence and understand what problem each finding addresses
5. Leave with the governance posture (Tool Risk Tier Map, verification-first policy) clear in mind
