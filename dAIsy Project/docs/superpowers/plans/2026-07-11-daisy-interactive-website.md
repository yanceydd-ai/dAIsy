# dAIsy Interactive Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 7-page, highly interactive Next.js reference website presenting the dAIsy Student Program to school leadership.

**Architecture:** Next.js 15 App Router with all interactive components as client components (`'use client'`). All content lives in `lib/content.ts` as typed constants — no strings hardcoded in components. Framer Motion drives all animations; shadcn/ui provides base UI primitives.

**Tech Stack:** Next.js 15, Framer Motion, Tailwind CSS v3, shadcn/ui, Lucide React, Vitest + React Testing Library

## Global Constraints

- All work lives under `website/` within the repo root (`dAIsy Project/website/`)
- Node ≥ 20 required (currently 26.4.0 — fine)
- All interactive components must include `'use client'` directive
- No strings hardcoded in components — all content from `lib/content.ts`
- No backend, no auth, no database — fully static
- Color tokens: background `#FAFAF7`, primary `#1B4332`, accent `#F5C842`, ambassadors `#E8A598`, orchestrator `#A89BC2`, challenge `#7BB8D4`
- Fonts: Playfair Display (headings) + Inter (body) via `next/font/google`
- Commit after every task

---

## File Map

```
website/
  app/
    layout.tsx                  # Root layout: fonts, NavBar, Framer Motion provider
    page.tsx                    # Home: hero flower + pipeline + pillar cards
    globals.css                 # Tailwind directives + CSS custom properties
    ambassadors/page.tsx        # Ambassadors pillar
    orchestrator/page.tsx       # Junior AI Orchestrator pillar
    challenge/page.tsx          # Innovation Challenge pillar
    use-scale/page.tsx          # AI Use Scale interactive tool
    research/page.tsx           # Research & Evidence
    governance/page.tsx         # Governance & Risk Tier Map
  components/
    nav/
      NavBar.tsx                # Sticky nav with logo + 7 links
    flower/
      DaisyLogo.tsx             # Small SVG logo for nav
      DaisyFlower.tsx           # Large animated hero SVG
    pipeline/
      PipelineDiagram.tsx       # Animated circular pipeline on home
    use-scale/
      LevelSelector.tsx         # Horizontal 0–4 selector tabs
      LevelDetail.tsx           # Expanded content for selected level
      DecisionAid.tsx           # 10pm decision-aid panel
    ladder/
      LadderRung.tsx            # Single expandable Bronze/Silver/Gold rung
      CertLadder.tsx            # Three-rung vertical ladder
    timeline/
      BuildDayTimeline.tsx      # Horizontal animated Build Day schedule
    stats/
      StatCounter.tsx           # Single animated counter (0 → value)
      StatsGrid.tsx             # Grid of six stat counters
    rubric/
      RubricChart.tsx           # Bar chart of judging criterion weights
    sessions/
      SessionCards.tsx          # Four onboarding session expandable cards
    risk-tier/
      TierColumn.tsx            # Single expandable risk tier column
      RiskTierMap.tsx           # Four-column interactive risk tier grid
  lib/
    content.ts                  # All content as typed TypeScript constants
    motion.ts                   # Shared Framer Motion variants
  __tests__/
    NavBar.test.tsx
    LevelSelector.test.tsx
    CertLadder.test.tsx
    StatCounter.test.tsx
    RiskTierMap.test.tsx
    SessionCards.test.tsx
  public/
    daisy-logo.svg              # (generated inline by DaisyLogo.tsx — not needed)
  tailwind.config.ts
  vitest.config.ts
  vitest.setup.ts
  package.json
  tsconfig.json
  next.config.ts
```

---

## Task 1: Project Scaffolding & Foundation

**Files:**
- Create: `website/` (scaffolded by create-next-app)
- Modify: `website/app/globals.css`
- Create: `website/lib/motion.ts`
- Create: `website/vitest.config.ts`
- Create: `website/vitest.setup.ts`
- Create: `website/tailwind.config.ts`

**Interfaces:**
- Produces: `MOTION_VARIANTS` export from `lib/motion.ts` — used by all animated components

- [ ] **Step 1: Scaffold the Next.js project**

```bash
cd "/Users/david/claude/dAIsy Project"
npx create-next-app@latest website \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --yes
```

Expected: `website/` directory created with `app/`, `components/`, `public/`, `package.json`.

- [ ] **Step 2: Install additional dependencies**

```bash
cd "/Users/david/claude/dAIsy Project/website"
npm install framer-motion lucide-react
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
npx shadcn@latest init --yes --base-color neutral --css-variables
npx shadcn@latest add button card tabs accordion badge
```

Expected: `node_modules/framer-motion`, `node_modules/lucide-react` present. shadcn components installed in `components/ui/`.

- [ ] **Step 3: Set up Tailwind config with dAIsy color tokens**

Replace `website/tailwind.config.ts` with:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FAFAF7",
        primary: "#1B4332",
        accent: "#F5C842",
        ambassadors: "#E8A598",
        orchestrator: "#A89BC2",
        challenge: "#7BB8D4",
        prohibited: "#D9534F",
        caution: "#F0A500",
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 4: Update globals.css**

Replace `website/app/globals.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --font-playfair: '';
    --font-inter: '';
  }

  body {
    @apply bg-background text-primary font-sans;
  }

  h1, h2, h3 {
    @apply font-serif;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}

@media print {
  nav, footer { display: none; }
  .no-print { display: none; }
}
```

- [ ] **Step 5: Create shared motion variants**

Create `website/lib/motion.ts`:

```ts
import type { Variants } from "framer-motion";

export const MOTION_VARIANTS = {
  fadeUp: {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  } satisfies Variants,

  staggerContainer: {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
  } satisfies Variants,

  expandHeight: {
    collapsed: { height: 0, opacity: 0 },
    expanded: { height: "auto", opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
  } satisfies Variants,

  pageTransition: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
  } satisfies Variants,

  nodePulse: {
    idle: { scale: 1, opacity: 0.85 },
    active: { scale: 1.08, opacity: 1, transition: { duration: 0.2 } },
  } satisfies Variants,

  petalBreath: {
    dim: { opacity: 0.8 },
    bright: { opacity: 1, transition: { duration: 1.5, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" } },
  } satisfies Variants,
} as const;
```

- [ ] **Step 6: Set up Vitest**

Create `website/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

Create `website/vitest.setup.ts`:

```ts
import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock framer-motion — prevents animation side-effects in tests
vi.mock("framer-motion", async () => {
  const actual = await vi.importActual<typeof import("framer-motion")>("framer-motion");
  return {
    ...actual,
    motion: {
      div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
        <div {...props}>{children}</div>,
      section: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) =>
        <section {...props}>{children}</section>,
      button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) =>
        <button {...props}>{children}</button>,
      svg: ({ children, ...props }: React.SVGAttributes<SVGElement>) =>
        <svg {...props}>{children}</svg>,
      circle: (props: React.SVGAttributes<SVGCircleElement>) => <circle {...props} />,
      path: (props: React.SVGAttributes<SVGPathElement>) => <path {...props} />,
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useInView: () => true,
  };
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
```

Add test script to `website/package.json` (merge into existing scripts):

```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 7: Verify scaffold builds**

```bash
cd "/Users/david/claude/dAIsy Project/website"
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 8: Commit**

```bash
cd "/Users/david/claude/dAIsy Project"
git add website/
git commit -m "feat: scaffold Next.js 15 website with Tailwind, shadcn, Framer Motion, Vitest"
```

---

## Task 2: Content Library

**Files:**
- Create: `website/lib/content.ts`

**Interfaces:**
- Produces: Named exports `NAV_LINKS`, `HOME_CONTENT`, `AMBASSADORS_CONTENT`, `ORCHESTRATOR_CONTENT`, `CHALLENGE_CONTENT`, `USE_SCALE_CONTENT`, `RESEARCH_CONTENT`, `GOVERNANCE_CONTENT` — all components import from here, never hardcode strings.

- [ ] **Step 1: Write the failing test for content shape**

Create `website/__tests__/content.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  NAV_LINKS,
  USE_SCALE_CONTENT,
  ORCHESTRATOR_CONTENT,
  RESEARCH_CONTENT,
  GOVERNANCE_CONTENT,
  AMBASSADORS_CONTENT,
  CHALLENGE_CONTENT,
} from "@/lib/content";

describe("content library", () => {
  it("NAV_LINKS has 7 entries each with href and label", () => {
    expect(NAV_LINKS).toHaveLength(7);
    NAV_LINKS.forEach((link) => {
      expect(link).toHaveProperty("href");
      expect(link).toHaveProperty("label");
    });
  });

  it("USE_SCALE_CONTENT has 5 levels (0-4)", () => {
    expect(USE_SCALE_CONTENT.levels).toHaveLength(5);
    USE_SCALE_CONTENT.levels.forEach((level, i) => {
      expect(level.number).toBe(i);
      expect(level.name).toBeTruthy();
      expect(level.definition).toBeTruthy();
      expect(level.scenario).toBeTruthy();
    });
  });

  it("ORCHESTRATOR_CONTENT has 3 tiers", () => {
    expect(ORCHESTRATOR_CONTENT.tiers).toHaveLength(3);
  });

  it("RESEARCH_CONTENT has 6 stats", () => {
    expect(RESEARCH_CONTENT.stats).toHaveLength(6);
    RESEARCH_CONTENT.stats.forEach((stat) => {
      expect(typeof stat.value).toBe("number");
      expect(stat.label).toBeTruthy();
      expect(stat.source).toBeTruthy();
    });
  });

  it("GOVERNANCE_CONTENT has 4 risk tiers", () => {
    expect(GOVERNANCE_CONTENT.riskTiers).toHaveLength(4);
  });

  it("AMBASSADORS_CONTENT has 4 sessions", () => {
    expect(AMBASSADORS_CONTENT.sessions).toHaveLength(4);
  });

  it("CHALLENGE_CONTENT judging rubric weights sum to 100", () => {
    const total = CHALLENGE_CONTENT.rubric.reduce((sum, r) => sum + r.weight, 0);
    expect(total).toBe(100);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "/Users/david/claude/dAIsy Project/website"
npm test -- content
```

Expected: FAIL — `Cannot find module '@/lib/content'`

- [ ] **Step 3: Create lib/content.ts**

Create `website/lib/content.ts`:

```ts
// ─── Types ────────────────────────────────────────────────────────────────────

export interface NavLink {
  href: string;
  label: string;
  pillarColor?: string;
}

export interface UseScaleLevel {
  number: number;
  name: string;
  definition: string;
  scenario: string;
  disclosure: string;
  pillarNote: string;
}

export interface OrchestratorTier {
  name: "Bronze" | "Silver" | "Gold";
  color: string;
  subtitle: string;
  demonstrates: string[];
  evidence: string[];
  toolAccess: string;
  cornerstone: string;
}

export interface ResearchStat {
  value: number;
  suffix: string;
  label: string;
  source: string;
  daisyResponse: string;
}

export interface ResearchFinding {
  title: string;
  detail: string;
  source: string;
  daisyResponse: string;
}

export interface RiskTier {
  name: string;
  posture: string;
  variant: "prohibited" | "governed" | "approved" | "caution";
  categories: string[];
  hockaday: string;
}

export interface AmbassadorSession {
  title: string;
  coreExperience: string;
  leaves: string;
}

export interface ChallengeRubricItem {
  criterion: string;
  weight: number;
  domain: string;
}

export interface TimelineSlot {
  time: string;
  title: string;
  description: string;
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

export const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Overview" },
  { href: "/ambassadors", label: "AI Ambassadors", pillarColor: "#E8A598" },
  { href: "/orchestrator", label: "AI Orchestrator", pillarColor: "#A89BC2" },
  { href: "/challenge", label: "Innovation Challenge", pillarColor: "#7BB8D4" },
  { href: "/use-scale", label: "AI Use Scale" },
  { href: "/research", label: "Research" },
  { href: "/governance", label: "Governance" },
];

// ─── Home ─────────────────────────────────────────────────────────────────────

export const HOME_CONTENT = {
  tagline: "The future will not belong to the students who use AI most often, but to the students who are most fluent in it.",
  subtagline: "dAIsy is Hockaday making that decision deliberately.",
  programSummary: "dAIsy is Hockaday's artificial-intelligence program. The program rests on one conviction: the future belongs to the students who can direct AI, doubt it, and judge what it gives them.",
  pipelineCaption: "Many petals, one bloom — the program renews itself from within.",
  pillars: [
    {
      number: 1,
      name: "AI Ambassadors",
      href: "/ambassadors",
      color: "#E8A598",
      summary: "Peer-led onboarding of every new Middle and Upper School student into Hockaday's AI culture.",
      serves: "Incoming students; led by Silver/Gold-certified upper-school mentors.",
    },
    {
      number: 2,
      name: "Junior AI Orchestrator",
      href: "/orchestrator",
      color: "#A89BC2",
      summary: "A tiered Bronze–Silver–Gold certification that makes AI fluency visible, earnable, and worth aspiring to.",
      serves: "Upper School students; feeds the Ambassador corps at its top rung.",
    },
    {
      number: 3,
      name: "Innovation Challenge",
      href: "/challenge",
      color: "#7BB8D4",
      summary: "dAIsy Build Day — a full-day student AI hackathon framed as an interdisciplinary innovation challenge.",
      serves: "Upper School teams (9–12); strongest teams continue into the dAIsy Studio.",
    },
  ],
  pipelineNodes: [
    { id: "welcome", label: "Ambassadors welcome her", href: "/ambassadors", color: "#E8A598" },
    { id: "certify", label: "Orchestrator ladder certifies her", href: "/orchestrator", color: "#A89BC2" },
    { id: "build", label: "Innovation Challenge lets her build", href: "/challenge", color: "#7BB8D4" },
    { id: "lead", label: "Gold makes her an Ambassador", href: "/ambassadors", color: "#F5C842" },
  ],
  scaleCallout: {
    heading: "One instrument threads all three pillars.",
    body: "The AI Use Scale — five levels, one default — gives every student and teacher a shared vocabulary from day one to Build Day.",
    href: "/use-scale",
  },
};

// ─── AI Use Scale ─────────────────────────────────────────────────────────────

export const USE_SCALE_CONTENT = {
  intro: "Five levels. One default. The dAIsy AI Use Scale gives every student and teacher a shared vocabulary for every assignment.",
  defaultNote: "Where no level is declared, Level 0 is the standing default — so no student is ever guessing.",
  levels: [
    {
      number: 0,
      name: "No AI",
      definition: "Unassisted work. Used where the point is to produce the thinking itself — timed writing, assessments, foundational skill-building.",
      scenario: "It's 10pm. You're stuck on an essay. Your teacher wrote nothing about AI on the assignment sheet. Level 0 is the answer — do the work yourself, and if you're unsure, write one sentence in your disclosure naming what you weren't certain about.",
      disclosure: "No disclosure required — the work is entirely your own.",
      pillarNote: "The default for every unspecified assignment. Ambassadors teach it in week one.",
    },
    {
      number: 1,
      name: "AI to Plan",
      definition: "Brainstorming, outlining, clarifying a concept. No AI-generated text or solutions enter the submitted work.",
      scenario: "You ask an AI to help you brainstorm essay angles, then write the essay yourself. The outline comes from the conversation; the words are yours.",
      disclosure: "One sentence naming what you used AI for in the planning stage.",
      pillarNote: "Bronze certification requires competent, disclosed work at Levels 1–2.",
    },
    {
      number: 2,
      name: "AI to Polish",
      definition: "Feedback on drafts, grammar and clarity edits on the student's own work. The ideas and structure remain hers.",
      scenario: "You write a full draft, then ask AI for feedback on clarity and grammar. You revise based on that feedback. Your argument and structure are untouched.",
      disclosure: "One sentence noting what AI reviewed and what changes you accepted or rejected.",
      pillarNote: "Bronze certification requires competent, disclosed work at Levels 1–2.",
    },
    {
      number: 3,
      name: "AI as Collaborator",
      definition: "AI contributes content the student directs, evaluates, verifies, and revises — with prompt logs and a disclosure note. This is orchestration, and it is where certification evidence comes from.",
      scenario: "You direct an AI through three rounds of drafting, reject a section that doesn't match your argument, rewrite it yourself, and log every prompt. Your disclosure note explains what the AI produced and what you changed.",
      disclosure: "A prompt log and a disclosure note explaining what AI contributed and how your judgment shaped the result.",
      pillarNote: "Silver certification requires evidenced work at Level 3 with process documentation.",
    },
    {
      number: 4,
      name: "AI Throughout",
      definition: "Full AI partnership, judged on direction and judgment rather than production — Build Day, Studio projects, capstones.",
      scenario: "Your Build Day team uses AI to prototype three features before lunch, abandons one when it produces biased outputs, and documents that failure as the centerpiece of your demo. Judges assess your direction, not the AI's output.",
      disclosure: "Full process documentation: what AI did, what you directed, where it failed, and how human judgment rescued the outcome.",
      pillarNote: "Build Day operates entirely at Level 4 by design.",
    },
  ] satisfies UseScaleLevel[],
  designRules: [
    "Silence is never grey: where no level is declared, the default is Level 0.",
    "Disclosure at the operative level is never penalized; working above it is the integrity line.",
    "The scale threads the pillars: Ambassadors teach it in week one, certification evidence comes from it, and Build Day runs at Level 4.",
  ],
  level0Gift: {
    heading: "Why Level 0 is a gift, not a restriction",
    body: "The cognitive research is unambiguous: skills developed independently first, then augmented with AI later, stay strong. Skills never developed independently erode or never form at all. An assignment at Level 0 is not the school withholding a tool. It is the school building the very capability the higher levels depend on.",
    analogy: "Aviation saw this first — young pilots whose manual skills atrophied under automation found themselves without fallback when systems failed. 'When the glass goes dark, you better have skills to fall back on.'",
  },
  decisionAid: {
    heading: "For the student who is unsure at ten o'clock at night",
    body: "Confusion does not keep office hours. If you are unsure whether something is allowed at the declared level: do the work at that level as you understand it, and write one sentence in your disclosure naming what you were unsure of. Honest disclosure at the point of doubt is always the protected move — the conversation that follows is a clarification, never an accusation.",
  },
};

// ─── Ambassadors ──────────────────────────────────────────────────────────────

export const AMBASSADORS_CONTENT = {
  purpose: "New students do not learn the culture of responsible AI from a policy handed across a desk. They learn it from an older girl who has already lived it. Administrative guidance sets the floor; peers set the ceiling.",
  hockadayWay: "Within her first weeks, every new student learns one consistent standard from a peer who lives it: disclosed use, respect for the operative level, judgment over dependence. That is the Hockaday Way.",
  whoServes: "Ambassadors are Silver- and Gold-tier Orchestrators. Gold cannot be earned without peer teaching, so the Ambassador corps is continuously replenished by the credential itself.",
  sessions: [
    {
      title: "What AI Can and Can't Do",
      coreExperience: "Students prompt an AI to actively hunt for its own factual errors and fabricated sources.",
      leaves: "AI tools are prediction engines, not knowledge engines.",
    },
    {
      title: "Our School's Expectations",
      coreExperience: "The dAIsy AI Use Scale taught through scenarios — brainstorming at Level 1 versus copying a generated answer above the declared level.",
      leaves: "Abstract rules become a number on every assignment and a concrete, defensible judgment call.",
    },
    {
      title: "AI Is Not a Friend (and Why That Matters)",
      coreExperience: "Age-appropriate, non-alarmist: what companion chatbots are designed to do (maximize engagement), why they feel understanding, and what they cannot do — know you, keep you safe, tell your parents when it matters.",
      leaves: "The session ends by naming the humans on campus a girl can actually go to.",
    },
    {
      title: "Family Segment",
      coreExperience: "A focused parent segment in family programming on what the tools do and don't do — including ten minutes on companion AI at home and three dinner-table questions.",
      leaves: "Parents become allies who reinforce the same habits, in the same vocabulary.",
    },
  ] satisfies AmbassadorSession[],
  divisions: {
    middle: "Simplified diagnostic and onboarding; AI as a study and organization partner; early ethical reasoning under guidance; disclosed, guided use.",
    upper: "A more advanced diagnostic; the full AI Use Scale; the on-ramp to the Orchestrator ladder and frontier-tool access earned through demonstrated judgment.",
  },
  companionAI: {
    finding: "Roughly half of daily AI users report feeling lonely at least some of the time, versus a third of non-users. Lonelier students disproportionately turn to AI to discuss feelings.",
    line: "Students are educated; adults are responsible. Ambassadors teach the 'AI Is Not a Friend' session because peer-delivered education reaches girls a wellness assembly never will — but no student is asked to watch, assess, or refer a classmate.",
    protocols: [
      "Adult awareness briefing: advisors, faculty, and counselors receive a short annual briefing on companion AI patterns.",
      "Counseling-office partnership protocol: a one-page agreement on how concerns raised by advisors or families are received and how families are looped in.",
      "Community education evening: a fall event open to parents across all divisions and the broader community.",
    ],
  },
  familyStrand: [
    { name: "dAIsy Family Guide", description: "A two-page home companion to the AI Use Scale: what each level means, what disclosure looks like at home, and the companion-AI talking points." },
    { name: "Fall Ambassador Demonstrations", description: "Parents watch a student make an AI hunt its own errors — the same exercise their daughters do." },
    { name: "Spring Pulse Sharing", description: "Anonymized dAIsy Pulse results shared with families so they see the same data leadership sees." },
  ],
  cornerstone: "Courtesy",
};

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export const ORCHESTRATOR_CONTENT = {
  purpose: "A student who masters responsible AI use earns a credential that proves it — to her school, her family, and later her colleges. Recognition is a teaching instrument.",
  orchestratorDefinition: "The music producer who samples: she does not play every instrument, but she decides what enters the track, what gets cut, and what the whole thing is trying to say.",
  threeQuestions: [
    "Do I agree?",
    "Did I check?",
    "Could I have gotten here on my own?",
  ],
  tiers: [
    {
      name: "Bronze",
      color: "#CD7F32",
      subtitle: "Foundational fluency",
      demonstrates: [
        "How generative AI works",
        "What it does well and where it hallucinates",
        "Basics of responsible, disclosed use at Levels 1–2",
      ],
      evidence: [
        "Demonstrated competence at Use Scale Levels 1–2",
        "A reflective audit of an AI output she caught being wrong",
      ],
      toolAccess: "Universal baseline: Copilot Chat (Microsoft A5 license, already deployed)",
      cornerstone: "Scholarship",
    },
    {
      name: "Silver",
      color: "#A8A9AD",
      subtitle: "Applied orchestration",
      demonstrates: [
        "Directing tools across real academic and personal tasks",
        "Evaluating output critically",
        "Documenting how she divided work between herself and the tools",
        "Beginning to teach peers",
      ],
      evidence: [
        "A portfolio of process evidence",
        "A defended project showing where human judgment improved the result",
        "Use Scale Level 3 work, evidenced",
      ],
      toolAccess: "Selective access: governed frontier models (Claude, Copilot) for deeper academic work",
      cornerstone: "Scholarship & Character",
    },
    {
      name: "Gold",
      color: "#F5C842",
      subtitle: "Mastery & leadership",
      demonstrates: [
        "Portfolio-evidenced projects",
        "Deliberate workflow design: deciding what AI does, what the human does, and why",
        "Ethical analysis",
        "Ability to hold others to the standard",
        "Peer teaching that anchors the Ambassador pipeline",
      ],
      evidence: [
        "Coaching of younger students (required for Ambassador eligibility)",
        "Ethical analysis of an AI-produced outcome",
        "Workflow documentation at Level 4",
      ],
      toolAccess: "Full governed access to frontier models; eligible for Ambassador corps",
      cornerstone: "Scholarship, Character & Leadership",
    },
  ] satisfies OrchestratorTier[],
  evidenceTypes: [
    { name: "Process Evidence", description: "Drafts, prompt logs, and the moment the student disagreed with the machine and why." },
    { name: "Oral Defense", description: "She defends her choices aloud; the visible thinking is the work." },
    { name: "Disclosure Over Detection", description: "Disclosure is ordinary, not confessional — honesty is the norm the credential certifies." },
    { name: "Peer Teaching", description: "At Silver and Gold, she demonstrably lifts classmates, not just herself." },
  ],
  verificationFirst: {
    heading: "Verification-First Integrity: The Formal Stance",
    policy: "The Hockaday School does not use AI-detection software as the basis for an academic-integrity finding. Integrity is established the way mastery is established: through the student's process evidence, her disclosed use at the assignment's operative level on the dAIsy AI Use Scale (Level 0 wherever none is declared), and her ability to explain and defend her work. Where questions arise, the response is a conversation and a verification of understanding — not a percentage score from a tool with documented bias.",
    jobs: [
      "Protects students from documented false-positive harm (AI detectors falsely flag multilingual and neurodivergent students at higher rates).",
      "Protects the school from equity and due-process exposure.",
      "Makes the certification ladder load-bearing: the oral defense and prompt log are the school's integrity system.",
    ],
  },
  toolAccess: [
    { tier: "Universal baseline", tool: "Copilot Chat (via Microsoft A5)", rationale: "Already licensed; no new recurring cost; a safe, enterprise-grade entry point for everyone." },
    { tier: "Middle School", tool: "MagicSchool / Flint", rationale: "Built for K–8 with age-appropriate guardrails; designed for teacher workflows, not open-ended chat." },
    { tier: "Selective / certified", tool: "Governed frontier models (Claude, Copilot)", rationale: "Stronger reasoning for certified Upper School students and deeper academic work — granted intentionally, not universally." },
  ],
  cornerstone: "Scholarship & Character",
};

// ─── Innovation Challenge ──────────────────────────────────────────────────────

export const CHALLENGE_CONTENT = {
  purpose: "Once a year, dAIsy Build Day turns the program into an event the whole Upper School can feel. It moves students from passive AI consumption toward becoming thoughtful designers of AI-powered systems.",
  failureRequirement: "Every team must document a failure — not as a formality, but as the centerpiece: one genuine limitation they hit, one iteration that broke, one place the AI was confidently wrong, and how human judgment rescued the outcome.",
  structure: {
    audience: "Upper School students, Grades 9–12",
    format: "Intra-school pilot event; full-day experience of 8–10 hours, scheduled outside academic class time",
    teams: "3–4 students, each filling a role: Lead Architect, UX/UI Lead, Ethics Officer, Project Manager",
    scope: "Demo-able in under 3 minutes; one core feature executed well; working prototypes over polished products",
    useScale: "Level 4 — AI throughout — with teams judged on direction and judgment, not production",
  },
  roles: [
    { name: "Lead Architect", description: "Owns the technical direction and system design." },
    { name: "UX/UI Lead", description: "Owns the user experience and what the solution looks and feels like." },
    { name: "Ethics Officer", description: "Evaluates the solution for fairness, bias, and harm — the girl who sees clearly what is missing is essential." },
    { name: "Project Manager", description: "Owns the timeline, the team's communication, and the demo narrative." },
  ],
  challengeAreas: [
    { name: "Student wellness and mental health", icon: "Heart" },
    { name: "Sustainability and environmental stewardship", icon: "Leaf" },
    { name: "Accessibility and inclusive learning", icon: "Eye" },
    { name: "School operations and communication", icon: "School" },
    { name: "Community impact and service", icon: "Users" },
  ],
  timeline: [
    { time: "09:00–09:45", title: "Opening Ceremony", description: "Registration, opening ceremony, and rules of engagement." },
    { time: "09:45–10:30", title: "Skill-Up Session", description: "AI prompting and multimodal tools — hands-on warm-up before the sprint begins." },
    { time: "10:30–12:30", title: "Discovery Sprint", description: "Interview a real user, define the problem, sketch on paper. No building yet — the morning belongs to understanding." },
    { time: "12:30–13:15", title: "Lunch", description: "Lunch and brain-break activities. Step away from the problem." },
    { time: "13:15–16:00", title: "Build Sprint", description: "Prototyping begins, grounded in the morning's problem definition." },
    { time: "16:00–17:00", title: "Presentation Prep", description: "Technical check and presentation prep — tighten the demo, name the failure." },
    { time: "17:00–18:00", title: "STEMmy Awards", description: "Demo showcase and awards ceremony." },
  ] satisfies TimelineSlot[],
  rubric: [
    { criterion: "Problem clarity (a named user + evidence of at least one user conversation)", weight: 20, domain: "Engage" },
    { criterion: "Meaningful AI integration", weight: 20, domain: "Create" },
    { criterion: "Functionality", weight: 20, domain: "Create" },
    { criterion: "Explainability", weight: 15, domain: "Manage" },
    { criterion: "Depth of understanding (AI limitations, ethics, oversight, reflection on failure)", weight: 15, domain: "Manage / Shape" },
    { criterion: "Impact potential", weight: 10, domain: "Shape" },
  ] satisfies ChallengeRubricItem[],
  stemmyAwards: [
    "All-Around STEM Superstar",
    "Most Curious Coder",
    "Grit and Growth",
    "Ethical Guardian",
    "Best Community Impact Solution",
  ],
  studio: "Selected teams continue into the dAIsy Innovation Fellows pathway — the dAIsy Studio — an ongoing cohort that refines prototypes, takes on real campus pilots, and is paired with alumnae mentors working in technology and innovation.",
  safeAI: [
    { principle: "Safety", description: "Students implement basic guardrails and avoid harmful use cases." },
    { principle: "Accountability", description: "Human oversight is required in every workflow; teams explain their human decision points." },
    { principle: "Fairness", description: "Teams evaluate their systems for possible bias or exclusion." },
    { principle: "Evidence-based design", description: "Solutions are judged on real usefulness and thoughtful implementation, not superficial complexity." },
  ],
};

// ─── Research & Evidence ──────────────────────────────────────────────────────

export const RESEARCH_CONTENT = {
  intro: "The research base sharpened considerably in June 2026. Five findings now anchor why dAIsy is built around process, judgment, and human connection rather than output and access.",
  stats: [
    {
      value: 54,
      suffix: "%",
      label: "of middle and high school students already use AI for schoolwork",
      source: "RAND 2025 nationally representative survey",
      daisyResponse: "The question is not whether to engage — it already has an answer.",
    },
    {
      value: 15,
      suffix: "%",
      label: "of teenagers feel they have been given enough guidance on appropriate AI use",
      source: "Oxford University Press, June 2026 (nearly 4,000 teenagers)",
      daisyResponse: "The dAIsy AI Use Scale removes the confusion — every assignment carries a level.",
    },
    {
      value: 44,
      suffix: "%",
      label: "of students are sure that using AI to complete all homework counts as cheating",
      source: "Oxford University Press, June 2026",
      daisyResponse: "The Use Scale standardizes language and defaults. Ambiguity is the enemy of integrity.",
    },
    {
      value: 51,
      suffix: "%",
      label: "of students have been told how to evaluate whether AI information is accurate",
      source: "Common Sense Media 2026 census",
      daisyResponse: "dAIsy's center of gravity targets the half schools are missing.",
    },
    {
      value: 50,
      suffix: "%",
      label: "of daily AI users report feeling lonely at least some of the time",
      source: "Common Sense Media 2026 census",
      daisyResponse: "dAIsy draws a deliberate line: students are educated, adults are responsible.",
    },
    {
      value: 20,
      suffix: "%",
      label: "average decline in entry-level hiring across consulting, legal, and finance",
      source: "Harvard Kennedy School working paper, June 2026",
      daisyResponse: "dAIsy is the pathway for building orchestration judgment that the economy needs.",
    },
  ] satisfies ResearchStat[],
  findings: [
    {
      title: "Usage is no longer in question",
      detail: "A nationally representative 2025 RAND survey found 54% of middle and high school students already use AI for schoolwork. The question in front of Hockaday is not whether to engage.",
      source: "RAND 2025",
      daisyResponse: "dAIsy teaches deliberate, disclosed use rather than pretending the tools aren't there.",
    },
    {
      title: "Assisted performance can mask unassisted weakness",
      detail: "A 2026 Stanford SCALE review found that students who complete tasks with AI assistance often perform worse on unassisted follow-up assessments. Tools that prompt reasoning and revision support durable learning.",
      source: "Stanford SCALE 2026",
      daisyResponse: "This is the empirical case for dAIsy's process-over-product design and Level 0 as a gift.",
    },
    {
      title: "Students are asking for exactly what dAIsy provides",
      detail: "Oxford University Press's June 2026 study of nearly 4,000 teenagers found only 15% feel adequately guided on AI use, and barely 44% are sure copying a generated answer counts as cheating.",
      source: "Oxford University Press, June 2026",
      daisyResponse: "The Use Scale removes the ambiguity that is the real barrier to student integrity.",
    },
    {
      title: "Schools teach permission more than discernment",
      detail: "The Common Sense Media 2026 census finds 73% of kids have heard from school what they may use AI for — but only 51% have heard how to tell whether AI information is accurate.",
      source: "Common Sense Media 2026",
      daisyResponse: "dAIsy's center of gravity targets the discernment half schools are missing.",
    },
    {
      title: "The wellbeing dimension is now measurable",
      detail: "About half of daily AI users report loneliness at least some of the time, versus a third of non-users. Lonelier kids disproportionately turn to AI for emotional support.",
      source: "Common Sense Media 2026",
      daisyResponse: "dAIsy's Companion AI education and adult briefing protocols address this directly.",
    },
    {
      title: "Entry-level career pathways are collapsing",
      detail: "A Harvard Kennedy School working paper synthesizes labor data: employment for workers aged 22–25 down 6–13% in AI-exposed occupations, entry-level hiring in consulting, legal, and finance down 15–25%.",
      source: "Harvard Kennedy School, June 2026",
      daisyResponse: "dAIsy is the pathway for building the orchestration judgment that the economy will pay a premium for.",
    },
  ],
  pulse: [
    {
      item: "My school has taught me how to tell if AI information is accurate or trustworthy.",
      benchmark: "51% (Common Sense)",
      target: "Approaching universal within two cycles",
    },
    {
      item: "I have been given enough guidance on appropriate AI use.",
      benchmark: "15% (OUP)",
      target: "Strong majority in year one — the Use Scale is the lever",
    },
    {
      item: "I can say clearly what counts as acceptable AI use on my assignments.",
      benchmark: "44% clear on the extreme case (OUP)",
      target: "Near-universal — every assignment carries a level",
    },
    {
      item: "A parent or guardian has talked with me about using AI safely.",
      benchmark: "56% (Common Sense)",
      target: "Raised through the family strand; tracked, not assumed",
    },
  ],
  successMeasure: "It is not how much AI our students use. It is whether a Hockaday graduate can be handed a confident, plausible, well-formatted answer — and know how to ask whether it is true.",
};

// ─── Governance ───────────────────────────────────────────────────────────────

export const GOVERNANCE_CONTENT = {
  intro: "Mature programs govern by category, not by app name, because tools appear faster than any approval list can track.",
  riskTiers: [
    {
      name: "Prohibited",
      posture: "Blocked on network and managed devices; named in the AUP; covered in Ambassador onboarding so students understand why, not merely that.",
      variant: "prohibited",
      categories: [
        "Companion / roleplay chatbots",
        "Detection-evasion 'humanizer' tools",
        "Deepfake, face-swap, and nudify apps",
        "Social-media-embedded AI",
      ],
      hockaday: "Blocked",
    },
    {
      name: "Governed",
      posture: "Access through the certification ladder and tiered-access map; disclosure per the AI Use Scale; wellness tools deploy only after counseling and legal review.",
      variant: "governed",
      categories: [
        "General-purpose frontier chatbots",
        "Homework-help and answer tools",
        "AI wellness apps (clinical review required)",
      ],
      hockaday: "Governed",
    },
    {
      name: "Approved",
      posture: "The universal baseline every girl starts on — enterprise data terms, age-appropriate guardrails, no new recurring cost.",
      variant: "approved",
      categories: [
        "Copilot Chat (A5 baseline)",
        "MagicSchool (Middle School)",
        "Vetted education-purpose-built tools",
      ],
      hockaday: "Approved",
    },
    {
      name: "Educator Caution",
      posture: "Not used as sole evidence or without human review. Any adoption requires equity and legal analysis first.",
      variant: "caution",
      categories: [
        "AI detection tools",
        "AI grading without human review",
        "AI proctoring",
      ],
      hockaday: "Caution",
    },
  ] satisfies RiskTier[],
  safeAI: [
    { principle: "Safety", description: "Students implement basic guardrails and avoid harmful use cases in every project." },
    { principle: "Accountability", description: "Human oversight is required in every AI workflow; a human is always accountable for every outcome." },
    { principle: "Fairness", description: "Every AI-powered solution is evaluated for possible bias or exclusion before deployment." },
    { principle: "Evidence-based design", description: "Solutions are judged on real usefulness and thoughtful implementation — not superficial complexity." },
  ],
  iterationLoops: [
    { loop: "Onboarding exit tickets (3 questions after each session)", cadence: "Weekly, during onboarding", owner: "Ambassador corps, with Technology Office", canChange: "Session content and pacing — before the next group sits down" },
    { loop: "Teacher two-question check on the Use Scale", cadence: "End of first grading period", owner: "Technology Office with academic leadership", canChange: "Scale wording and level definitions — the named v1 revision checkpoint" },
    { loop: "Build Day retrospective (teams, mentors, judges)", cadence: "Within a week of the event", owner: "Challenge organizers", canChange: "Format, schedule, rubric weights, and challenge areas for next year" },
    { loop: "dAIsy Pulse (benchmarked annual survey)", cadence: "Each spring", owner: "Technology Office with Counseling", canChange: "Program direction, expansion gating, and the report to Leadership and the Board" },
  ],
  closingStatement: "The second student in this document's first paragraph deserves a school that decided on purpose. Ours did.",
};
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd "/Users/david/claude/dAIsy Project/website"
npm test -- content
```

Expected: PASS — all 7 assertions green.

- [ ] **Step 5: Commit**

```bash
cd "/Users/david/claude/dAIsy Project"
git add website/lib/content.ts website/__tests__/content.test.ts
git commit -m "feat: add full typed content library for all 7 pages"
```

---

## Task 3: Navigation

**Files:**
- Create: `website/components/nav/NavBar.tsx`
- Create: `website/components/flower/DaisyLogo.tsx`
- Modify: `website/app/layout.tsx`
- Test: `website/__tests__/NavBar.test.tsx`

**Interfaces:**
- Consumes: `NAV_LINKS` from `lib/content`
- Produces: `<NavBar />` — rendered in root layout, sticky top

- [ ] **Step 1: Write the failing test**

Create `website/__tests__/NavBar.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import NavBar from "@/components/nav/NavBar";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("NavBar", () => {
  it("renders all 7 navigation links", () => {
    render(<NavBar />);
    expect(screen.getByRole("link", { name: /Overview/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /AI Ambassadors/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /AI Orchestrator/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Innovation Challenge/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /AI Use Scale/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Research/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Governance/i })).toBeInTheDocument();
  });

  it("renders the dAIsy logo link pointing to /", () => {
    render(<NavBar />);
    const logoLink = screen.getByRole("link", { name: /dAIsy/i });
    expect(logoLink).toHaveAttribute("href", "/");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "/Users/david/claude/dAIsy Project/website"
npm test -- NavBar
```

Expected: FAIL — `Cannot find module '@/components/nav/NavBar'`

- [ ] **Step 3: Create DaisyLogo component**

Create `website/components/flower/DaisyLogo.tsx`:

```tsx
export default function DaisyLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-label="dAIsy logo"
    >
      {/* Petals */}
      <ellipse cx="20" cy="9" rx="4" ry="8" fill="#E8A598" transform="rotate(0 20 20)" />
      <ellipse cx="20" cy="9" rx="4" ry="8" fill="#A89BC2" transform="rotate(120 20 20)" />
      <ellipse cx="20" cy="9" rx="4" ry="8" fill="#7BB8D4" transform="rotate(240 20 20)" />
      {/* Center */}
      <circle cx="20" cy="20" r="7" fill="#F5C842" />
      <circle cx="20" cy="20" r="4" fill="#1B4332" />
    </svg>
  );
}
```

- [ ] **Step 4: Create NavBar component**

Create `website/components/nav/NavBar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import DaisyLogo from "@/components/flower/DaisyLogo";
import { NAV_LINKS } from "@/lib/content";

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-primary/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2 font-serif font-bold text-primary shrink-0" aria-label="dAIsy home">
          <DaisyLogo size={28} />
          <span className="text-lg">dAIsy</span>
        </Link>

        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-primary text-background"
                    : "text-primary/70 hover:text-primary hover:bg-primary/8",
                ].join(" ")}
                style={
                  isActive && link.pillarColor
                    ? { backgroundColor: link.pillarColor, color: "#1B4332" }
                    : {}
                }
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 5: Update root layout**

Replace `website/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/nav/NavBar";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "dAIsy | Hockaday AI Student Program",
  description: "Hockaday's AI student program: AI Ambassadors, Junior AI Orchestrator certification, and the dAIsy Innovation Challenge.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-background text-primary antialiased">
        <NavBar />
        <main>{children}</main>
        <footer className="border-t border-primary/10 mt-24 py-12">
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-sm text-primary/50">
            <span className="font-serif font-semibold text-primary">dAIsy</span>
            <span>Hockaday School · AI Student Program</span>
            <span>Literacy is the floor. Fluency is the standard.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Run test to verify it passes**

```bash
cd "/Users/david/claude/dAIsy Project/website"
npm test -- NavBar
```

Expected: PASS — 2 tests green.

- [ ] **Step 7: Commit**

```bash
cd "/Users/david/claude/dAIsy Project"
git add website/components/ website/app/layout.tsx
git commit -m "feat: add NavBar, DaisyLogo, and root layout with fonts"
```

---

## Task 4: Home Page

**Files:**
- Create: `website/components/flower/DaisyFlower.tsx`
- Create: `website/components/pipeline/PipelineDiagram.tsx`
- Modify: `website/app/page.tsx`

**Interfaces:**
- Consumes: `HOME_CONTENT` from `lib/content`, `MOTION_VARIANTS` from `lib/motion`
- Produces: Home page at `/`

- [ ] **Step 1: Create the animated DaisyFlower hero**

Create `website/components/flower/DaisyFlower.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { HOME_CONTENT } from "@/lib/content";

const PETAL_CONFIGS = [
  { angle: -30,  color: "#E8A598", href: "/ambassadors",  label: "AI Ambassadors" },
  { angle: 90,   color: "#A89BC2", href: "/orchestrator", label: "AI Orchestrator" },
  { angle: 210,  color: "#7BB8D4", href: "/challenge",    label: "Innovation Challenge" },
];

function Petal({ angle, color, href, label }: typeof PETAL_CONFIGS[0]) {
  const rad = (angle * Math.PI) / 180;
  const cx = 100 + Math.sin(rad) * 48;
  const cy = 100 - Math.cos(rad) * 48;

  return (
    <Link href={href} aria-label={label}>
      <motion.ellipse
        cx={cx}
        cy={cy}
        rx={18}
        ry={32}
        fill={color}
        transform={`rotate(${angle} ${cx} ${cy})`}
        initial={{ opacity: 0.75 }}
        animate={{ opacity: [0.75, 1, 0.75] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: Math.random() * 1.5 }}
        whileHover={{ opacity: 1, scale: 1.08 }}
        className="cursor-pointer"
      />
    </Link>
  );
}

export default function DaisyFlower({ size = 200 }: { size?: number }) {
  const scale = size / 200;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      aria-label="dAIsy program flower — click a petal to explore a pillar"
    >
      {/* Background petals (decorative, white) */}
      {[0, 60, 120, 180, 240, 300].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const cx = 100 + Math.sin(rad) * 48;
        const cy = 100 - Math.cos(rad) * 48;
        return (
          <ellipse
            key={angle}
            cx={cx}
            cy={cy}
            rx={16}
            ry={30}
            fill="#E8E8E0"
            transform={`rotate(${angle} ${cx} ${cy})`}
          />
        );
      })}

      {/* Three pillar petals */}
      {PETAL_CONFIGS.map((p) => (
        <Petal key={p.href} {...p} />
      ))}

      {/* Golden center */}
      <motion.circle
        cx={100}
        cy={100}
        r={26}
        fill="#F5C842"
        animate={{ scale: [1, 1.03, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Dark center dot — the AI */}
      <circle cx={100} cy={100} r={13} fill="#1B4332" />
      <text
        x={100}
        y={105}
        textAnchor="middle"
        fontSize={9}
        fontWeight="bold"
        fill="#F5C842"
        fontFamily="var(--font-inter)"
      >
        AI
      </text>
    </svg>
  );
}
```

- [ ] **Step 2: Create PipelineDiagram**

Create `website/components/pipeline/PipelineDiagram.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { HOME_CONTENT } from "@/lib/content";

const NODE_POSITIONS = [
  { x: 50,  y: 10  },  // top
  { x: 90,  y: 60  },  // right
  { x: 65,  y: 90  },  // bottom-right
  { x: 10,  y: 60  },  // left
];

export default function PipelineDiagram() {
  const nodes = HOME_CONTENT.pipelineNodes;

  return (
    <div className="relative w-full max-w-lg mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-auto" aria-hidden>
        {/* Curved arrows between nodes */}
        {nodes.map((_, i) => {
          const from = NODE_POSITIONS[i];
          const to = NODE_POSITIONS[(i + 1) % nodes.length];
          const mx = (from.x + to.x) / 2 + (i % 2 === 0 ? 12 : -12);
          const my = (from.y + to.y) / 2 + (i % 2 === 0 ? -8 : 8);
          return (
            <motion.path
              key={i}
              d={`M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`}
              stroke="#1B4332"
              strokeWidth={0.8}
              strokeOpacity={0.3}
              fill="none"
              strokeDasharray="2 2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: i * 0.5, ease: "easeOut" }}
            />
          );
        })}
      </svg>

      {/* Absolute-positioned node buttons */}
      {nodes.map((node, i) => {
        const pos = NODE_POSITIONS[i];
        return (
          <motion.div
            key={node.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: i * 0.5 + 0.2 }}
          >
            <Link href={node.href}>
              <motion.div
                className="rounded-xl px-3 py-2 text-xs font-medium text-center max-w-28 cursor-pointer shadow-sm border border-white/50"
                style={{ backgroundColor: node.color }}
                whileHover={{ scale: 1.06, y: -2 }}
                title={node.label}
              >
                {node.label}
              </motion.div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Build the Home page**

Replace `website/app/page.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import DaisyFlower from "@/components/flower/DaisyFlower";
import PipelineDiagram from "@/components/pipeline/PipelineDiagram";
import { HOME_CONTENT } from "@/lib/content";
import { MOTION_VARIANTS } from "@/lib/motion";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-16 space-y-32">

      {/* Hero */}
      <motion.section
        className="flex flex-col lg:flex-row items-center gap-16"
        initial="initial"
        animate="animate"
        variants={MOTION_VARIANTS.pageTransition}
      >
        <div className="flex-1 space-y-6">
          <p className="text-sm font-medium text-accent uppercase tracking-widest">Hockaday School</p>
          <h1 className="text-5xl font-serif font-bold leading-tight text-balance">
            dAIsy
          </h1>
          <p className="text-xl text-primary/80 leading-relaxed max-w-xl text-balance">
            "{HOME_CONTENT.tagline}"
          </p>
          <p className="text-base text-primary/60">{HOME_CONTENT.subtagline}</p>
          <p className="text-base text-primary/70 max-w-lg">{HOME_CONTENT.programSummary}</p>
        </div>
        <div className="shrink-0">
          <DaisyFlower size={280} />
          <p className="text-center text-xs text-primary/40 mt-3">Click a petal to explore a pillar</p>
        </div>
      </motion.section>

      {/* Pipeline */}
      <section className="space-y-8">
        <motion.div
          className="text-center space-y-2"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={MOTION_VARIANTS.fadeUp}
        >
          <h2 className="text-3xl font-serif font-bold">One renewing pipeline</h2>
          <p className="text-primary/60">{HOME_CONTENT.pipelineCaption}</p>
        </motion.div>
        <PipelineDiagram />
      </section>

      {/* Three Pillars */}
      <section className="space-y-8">
        <motion.h2
          className="text-3xl font-serif font-bold"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={MOTION_VARIANTS.fadeUp}
        >
          Three pillars, one program
        </motion.h2>
        <motion.div
          className="grid md:grid-cols-3 gap-6"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={MOTION_VARIANTS.staggerContainer}
        >
          {HOME_CONTENT.pillars.map((pillar) => (
            <motion.div key={pillar.number} variants={MOTION_VARIANTS.fadeUp}>
              <Link href={pillar.href} className="block h-full">
                <div
                  className="rounded-2xl p-6 h-full space-y-4 border border-transparent hover:shadow-md transition-shadow"
                  style={{ backgroundColor: `${pillar.color}22`, borderColor: `${pillar.color}44` }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-primary"
                      style={{ backgroundColor: pillar.color }}
                    >
                      {pillar.number}
                    </span>
                    <h3 className="font-serif font-bold text-lg">{pillar.name}</h3>
                  </div>
                  <p className="text-primary/70 text-sm leading-relaxed">{pillar.summary}</p>
                  <p className="text-xs text-primary/50 italic">{pillar.serves}</p>
                  <div className="flex items-center gap-1 text-sm font-medium text-primary/60 group-hover:text-primary">
                    Learn more <ArrowRight size={14} />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* AI Use Scale callout */}
      <motion.section
        className="rounded-2xl bg-primary text-background p-10 flex flex-col md:flex-row items-center gap-8"
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={MOTION_VARIANTS.fadeUp}
      >
        <div className="flex-1 space-y-3">
          <h2 className="text-2xl font-serif font-bold">{HOME_CONTENT.scaleCallout.heading}</h2>
          <p className="text-background/80 leading-relaxed">{HOME_CONTENT.scaleCallout.body}</p>
        </div>
        <Link
          href={HOME_CONTENT.scaleCallout.href}
          className="shrink-0 px-6 py-3 rounded-full font-medium text-primary bg-accent hover:bg-accent/90 transition-colors"
        >
          Explore the AI Use Scale
        </Link>
      </motion.section>

    </div>
  );
}
```

- [ ] **Step 4: Verify home page renders**

```bash
cd "/Users/david/claude/dAIsy Project/website"
npm run dev &
sleep 5
curl -s http://localhost:3000 | grep -q "dAIsy" && echo "OK" || echo "FAIL"
kill %1
```

Expected: `OK`

- [ ] **Step 5: Commit**

```bash
cd "/Users/david/claude/dAIsy Project"
git add website/app/page.tsx website/components/flower/DaisyFlower.tsx website/components/pipeline/
git commit -m "feat: home page with animated flower hero and pipeline diagram"
```

---

## Task 5: AI Use Scale Page (Centerpiece)

**Files:**
- Create: `website/components/use-scale/LevelSelector.tsx`
- Create: `website/components/use-scale/LevelDetail.tsx`
- Create: `website/components/use-scale/DecisionAid.tsx`
- Create: `website/app/use-scale/page.tsx`
- Test: `website/__tests__/LevelSelector.test.tsx`

**Interfaces:**
- Consumes: `USE_SCALE_CONTENT` from `lib/content`, `MOTION_VARIANTS` from `lib/motion`
- Produces: `<LevelSelector selectedLevel: number, onSelect: (n: number) => void />`, `<LevelDetail level: UseScaleLevel />`, `<DecisionAid />`

- [ ] **Step 1: Write the failing test**

Create `website/__tests__/LevelSelector.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LevelSelector from "@/components/use-scale/LevelSelector";

describe("LevelSelector", () => {
  it("renders buttons for levels 0 through 4", () => {
    render(<LevelSelector selectedLevel={0} onSelect={vi.fn()} />);
    for (let i = 0; i <= 4; i++) {
      expect(screen.getByRole("button", { name: new RegExp(`Level ${i}`, "i") })).toBeInTheDocument();
    }
  });

  it("calls onSelect with the correct level number when a level is clicked", () => {
    const onSelect = vi.fn();
    render(<LevelSelector selectedLevel={0} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: /Level 3/i }));
    expect(onSelect).toHaveBeenCalledWith(3);
  });

  it("marks the selected level as aria-pressed=true", () => {
    render(<LevelSelector selectedLevel={2} onSelect={vi.fn()} />);
    const btn = screen.getByRole("button", { name: /Level 2/i });
    expect(btn).toHaveAttribute("aria-pressed", "true");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "/Users/david/claude/dAIsy Project/website"
npm test -- LevelSelector
```

Expected: FAIL — `Cannot find module '@/components/use-scale/LevelSelector'`

- [ ] **Step 3: Create LevelSelector**

Create `website/components/use-scale/LevelSelector.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";
import { USE_SCALE_CONTENT } from "@/lib/content";

const LEVEL_COLORS = ["#6B7280", "#10B981", "#3B82F6", "#8B5CF6", "#F59E0B"];

interface Props {
  selectedLevel: number;
  onSelect: (level: number) => void;
}

export default function LevelSelector({ selectedLevel, onSelect }: Props) {
  return (
    <div className="flex gap-2 flex-wrap" role="group" aria-label="AI Use Scale level selector">
      {USE_SCALE_CONTENT.levels.map((level) => {
        const isSelected = selectedLevel === level.number;
        return (
          <button
            key={level.number}
            onClick={() => onSelect(level.number)}
            aria-pressed={isSelected}
            aria-label={`Level ${level.number}: ${level.name}`}
            className={[
              "relative px-5 py-3 rounded-xl font-medium text-sm transition-all",
              isSelected ? "text-white shadow-md" : "text-primary/70 bg-primary/6 hover:bg-primary/12",
            ].join(" ")}
            style={isSelected ? { backgroundColor: LEVEL_COLORS[level.number] } : {}}
          >
            {isSelected && (
              <motion.div
                className="absolute inset-0 rounded-xl"
                layoutId="level-indicator"
                style={{ backgroundColor: LEVEL_COLORS[level.number] }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">
              <span className="block text-xs opacity-70">Level {level.number}</span>
              <span className="block font-semibold">{level.name}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Create LevelDetail**

Create `website/components/use-scale/LevelDetail.tsx`:

```tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { UseScaleLevel } from "@/lib/content";
import { MOTION_VARIANTS } from "@/lib/motion";
import { BookOpen, MessageSquare, FileCheck, Layers } from "lucide-react";

interface Props {
  level: UseScaleLevel;
}

export default function LevelDetail({ level }: Props) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={level.number}
        initial="hidden"
        animate="visible"
        exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
        variants={MOTION_VARIANTS.fadeUp}
        className="space-y-6"
      >
        <div className="space-y-2">
          <h3 className="text-2xl font-serif font-bold">Level {level.number}: {level.name}</h3>
          <p className="text-primary/70 text-base leading-relaxed">{level.definition}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl bg-primary/4 p-5 space-y-2">
            <div className="flex items-center gap-2 font-medium text-sm text-primary/60">
              <BookOpen size={14} /> Scenario
            </div>
            <p className="text-sm leading-relaxed text-primary/80 italic">"{level.scenario}"</p>
          </div>

          <div className="rounded-xl bg-primary/4 p-5 space-y-2">
            <div className="flex items-center gap-2 font-medium text-sm text-primary/60">
              <FileCheck size={14} /> Disclosure
            </div>
            <p className="text-sm leading-relaxed text-primary/80">{level.disclosure}</p>
          </div>
        </div>

        <div className="rounded-xl border border-accent/40 bg-accent/8 p-5 space-y-2">
          <div className="flex items-center gap-2 font-medium text-sm text-primary/60">
            <Layers size={14} /> In the dAIsy program
          </div>
          <p className="text-sm text-primary/80">{level.pillarNote}</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
```

- [ ] **Step 5: Create DecisionAid**

Create `website/components/use-scale/DecisionAid.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";
import { USE_SCALE_CONTENT } from "@/lib/content";
import { MOTION_VARIANTS } from "@/lib/motion";
import { Moon, Shield } from "lucide-react";

export default function DecisionAid() {
  const { decisionAid, designRules, level0Gift } = USE_SCALE_CONTENT;
  return (
    <div className="space-y-8">
      {/* 10pm decision aid */}
      <motion.div
        className="rounded-2xl bg-primary text-background p-8 space-y-4"
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={MOTION_VARIANTS.fadeUp}
      >
        <div className="flex items-center gap-2 text-accent font-medium">
          <Moon size={16} /> {decisionAid.heading}
        </div>
        <p className="text-background/85 leading-relaxed">{decisionAid.body}</p>
      </motion.div>

      {/* Design rules */}
      <motion.div
        className="space-y-3"
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={MOTION_VARIANTS.staggerContainer}
      >
        <h3 className="font-serif font-bold text-xl">Three design rules</h3>
        {designRules.map((rule, i) => (
          <motion.div
            key={i}
            variants={MOTION_VARIANTS.fadeUp}
            className="flex gap-3 items-start rounded-xl bg-primary/4 p-4"
          >
            <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-background text-xs font-bold flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <p className="text-sm text-primary/80 leading-relaxed">{rule}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Level 0 is a gift */}
      <motion.div
        className="rounded-2xl border border-primary/20 p-8 space-y-4"
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={MOTION_VARIANTS.fadeUp}
      >
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-primary" />
          <h3 className="font-serif font-bold text-xl">{level0Gift.heading}</h3>
        </div>
        <p className="text-primary/70 leading-relaxed">{level0Gift.body}</p>
        <blockquote className="border-l-4 border-accent pl-4 italic text-primary/60 text-sm">
          {level0Gift.analogy}
        </blockquote>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 6: Build the Use Scale page**

Create `website/app/use-scale/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import LevelSelector from "@/components/use-scale/LevelSelector";
import LevelDetail from "@/components/use-scale/LevelDetail";
import DecisionAid from "@/components/use-scale/DecisionAid";
import { USE_SCALE_CONTENT } from "@/lib/content";
import { MOTION_VARIANTS } from "@/lib/motion";
import { Printer } from "lucide-react";

export default function UseScalePage() {
  const [selectedLevel, setSelectedLevel] = useState(0);
  const level = USE_SCALE_CONTENT.levels[selectedLevel];

  return (
    <div className="max-w-4xl mx-auto px-6 py-16 space-y-16">
      <motion.div
        className="space-y-4"
        initial="initial" animate="animate"
        variants={MOTION_VARIANTS.pageTransition}
      >
        <p className="text-sm font-medium text-accent uppercase tracking-widest">One instrument, all three pillars</p>
        <h1 className="text-4xl font-serif font-bold">The dAIsy AI Use Scale</h1>
        <p className="text-primary/70 text-lg max-w-2xl leading-relaxed">{USE_SCALE_CONTENT.intro}</p>
        <div className="rounded-xl border border-accent/40 bg-accent/8 px-5 py-3 inline-block">
          <p className="text-sm font-medium text-primary">{USE_SCALE_CONTENT.defaultNote}</p>
        </div>
      </motion.div>

      {/* Interactive level selector */}
      <div className="space-y-8">
        <LevelSelector selectedLevel={selectedLevel} onSelect={setSelectedLevel} />
        <LevelDetail level={level} />
      </div>

      {/* Print button */}
      <div className="flex justify-end no-print">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/20 text-sm text-primary/60 hover:text-primary hover:border-primary/40 transition-colors"
        >
          <Printer size={14} /> Print decision-aid one-pager
        </button>
      </div>

      {/* Decision aid + design rules */}
      <DecisionAid />
    </div>
  );
}
```

- [ ] **Step 7: Run tests**

```bash
cd "/Users/david/claude/dAIsy Project/website"
npm test -- LevelSelector
```

Expected: PASS — 3 tests green.

- [ ] **Step 8: Commit**

```bash
cd "/Users/david/claude/dAIsy Project"
git add website/components/use-scale/ website/app/use-scale/
git commit -m "feat: AI Use Scale interactive page with level selector, detail, and decision aid"
```

---

## Task 6: Ambassadors Page

**Files:**
- Create: `website/components/sessions/SessionCards.tsx`
- Create: `website/app/ambassadors/page.tsx`
- Test: `website/__tests__/SessionCards.test.tsx`

**Interfaces:**
- Consumes: `AMBASSADORS_CONTENT` from `lib/content`, `MOTION_VARIANTS` from `lib/motion`
- Produces: `<SessionCards />` — expandable cards for 4 onboarding sessions

- [ ] **Step 1: Write the failing test**

Create `website/__tests__/SessionCards.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SessionCards from "@/components/sessions/SessionCards";

describe("SessionCards", () => {
  it("renders all 4 session titles", () => {
    render(<SessionCards />);
    expect(screen.getByText(/What AI Can and Can't Do/i)).toBeInTheDocument();
    expect(screen.getByText(/Our School's Expectations/i)).toBeInTheDocument();
    expect(screen.getByText(/AI Is Not a Friend/i)).toBeInTheDocument();
    expect(screen.getByText(/Family Segment/i)).toBeInTheDocument();
  });

  it("clicking a session reveals its core experience text", () => {
    render(<SessionCards />);
    fireEvent.click(screen.getByText(/What AI Can and Can't Do/i));
    expect(screen.getByText(/prompt an AI to actively hunt/i)).toBeInTheDocument();
  });

  it("clicking the same session again collapses it", () => {
    render(<SessionCards />);
    fireEvent.click(screen.getByText(/What AI Can and Can't Do/i));
    fireEvent.click(screen.getByText(/What AI Can and Can't Do/i));
    expect(screen.queryByText(/prompt an AI to actively hunt/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "/Users/david/claude/dAIsy Project/website"
npm test -- SessionCards
```

Expected: FAIL — `Cannot find module '@/components/sessions/SessionCards'`

- [ ] **Step 3: Create SessionCards**

Create `website/components/sessions/SessionCards.tsx`:

```tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AMBASSADORS_CONTENT } from "@/lib/content";
import { ChevronDown } from "lucide-react";

export default function SessionCards() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {AMBASSADORS_CONTENT.sessions.map((session, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={i} className="rounded-xl border border-primary/12 overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-primary/4 transition-colors"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-ambassadors/30 text-primary text-sm font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="font-medium text-primary">{session.title}</span>
              </div>
              <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={16} className="text-primary/40" />
              </motion.div>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-5 pt-1 space-y-3 border-t border-primary/8">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-primary/40 uppercase tracking-wide">Core experience</p>
                      <p className="text-sm text-primary/80 leading-relaxed">{session.coreExperience}</p>
                    </div>
                    <div className="rounded-lg bg-ambassadors/15 px-4 py-3 space-y-1">
                      <p className="text-xs font-medium text-primary/40 uppercase tracking-wide">She leaves knowing</p>
                      <p className="text-sm text-primary/80 leading-relaxed">{session.leaves}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Build the Ambassadors page**

Create `website/app/ambassadors/page.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";
import SessionCards from "@/components/sessions/SessionCards";
import { AMBASSADORS_CONTENT } from "@/lib/content";
import { MOTION_VARIANTS } from "@/lib/motion";
import { Users, Heart, BookOpen } from "lucide-react";

export default function AmbassadorsPage() {
  const c = AMBASSADORS_CONTENT;
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 space-y-20">
      <motion.div
        className="space-y-4"
        initial="initial" animate="animate"
        variants={MOTION_VARIANTS.pageTransition}
      >
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-ambassadors" />
          <p className="text-sm font-medium text-primary/50 uppercase tracking-widest">Pillar 1</p>
        </div>
        <h1 className="text-4xl font-serif font-bold">Student AI Ambassadors</h1>
        <p className="text-lg text-primary/70 max-w-2xl leading-relaxed">{c.purpose}</p>
      </motion.div>

      {/* The Hockaday Way */}
      <motion.div
        className="rounded-2xl bg-ambassadors/15 border border-ambassadors/30 p-8 space-y-3"
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={MOTION_VARIANTS.fadeUp}
      >
        <h2 className="text-xl font-serif font-bold">The Hockaday Way</h2>
        <p className="text-primary/80 leading-relaxed">{c.hockadayWay}</p>
      </motion.div>

      {/* Who serves */}
      <motion.div
        className="space-y-4"
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={MOTION_VARIANTS.fadeUp}
      >
        <h2 className="text-2xl font-serif font-bold">Who serves, and how they earn it</h2>
        <p className="text-primary/70 leading-relaxed">{c.whoServes}</p>
      </motion.div>

      {/* Onboarding sessions */}
      <motion.div
        className="space-y-6"
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={MOTION_VARIANTS.fadeUp}
      >
        <h2 className="text-2xl font-serif font-bold">The four onboarding sessions</h2>
        <p className="text-primary/60 text-sm">Click a session to expand it.</p>
        <SessionCards />
      </motion.div>

      {/* Division callout */}
      <motion.div
        className="grid md:grid-cols-2 gap-6"
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={MOTION_VARIANTS.staggerContainer}
      >
        {[
          { label: "Middle School (5–8)", text: c.divisions.middle },
          { label: "Upper School (9–12)", text: c.divisions.upper },
        ].map((d) => (
          <motion.div key={d.label} variants={MOTION_VARIANTS.fadeUp} className="rounded-xl bg-primary/4 p-6 space-y-2">
            <h3 className="font-semibold text-primary">{d.label}</h3>
            <p className="text-sm text-primary/70 leading-relaxed">{d.text}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Companion AI */}
      <motion.div
        className="rounded-2xl border border-primary/20 p-8 space-y-6"
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={MOTION_VARIANTS.fadeUp}
      >
        <div className="flex items-center gap-2">
          <Heart size={18} className="text-prohibited" />
          <h2 className="text-2xl font-serif font-bold">Companion AI: Educated Students, Adult Responsibility</h2>
        </div>
        <p className="text-primary/70 leading-relaxed">{c.companionAI.finding}</p>
        <p className="text-primary/70 leading-relaxed font-medium">{c.companionAI.line}</p>
        <div className="space-y-3">
          {c.companionAI.protocols.map((protocol, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="w-2 h-2 rounded-full bg-primary/40 mt-2 shrink-0" />
              <p className="text-sm text-primary/70 leading-relaxed">{protocol}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Family strand */}
      <motion.div
        className="space-y-6"
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={MOTION_VARIANTS.fadeUp}
      >
        <h2 className="text-2xl font-serif font-bold">The Family Strand</h2>
        <div className="space-y-4">
          {c.familyStrand.map((touchpoint, i) => (
            <div key={i} className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-ambassadors/30 flex items-center justify-center shrink-0 font-bold text-sm text-primary">
                {i + 1}
              </div>
              <div className="space-y-1">
                <p className="font-medium text-primary">{touchpoint.name}</p>
                <p className="text-sm text-primary/65 leading-relaxed">{touchpoint.description}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Cornerstone */}
      <div className="flex items-center gap-2 text-sm text-primary/50">
        <BookOpen size={14} />
        <span>Cornerstone alignment: <strong className="text-primary">{c.cornerstone}</strong></span>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run tests**

```bash
cd "/Users/david/claude/dAIsy Project/website"
npm test -- SessionCards
```

Expected: PASS — 3 tests green.

- [ ] **Step 6: Commit**

```bash
cd "/Users/david/claude/dAIsy Project"
git add website/components/sessions/ website/app/ambassadors/
git commit -m "feat: Ambassadors page with expandable onboarding sessions"
```

---

## Task 7: Orchestrator Page

**Files:**
- Create: `website/components/ladder/LadderRung.tsx`
- Create: `website/components/ladder/CertLadder.tsx`
- Create: `website/app/orchestrator/page.tsx`
- Test: `website/__tests__/CertLadder.test.tsx`

**Interfaces:**
- Consumes: `ORCHESTRATOR_CONTENT` from `lib/content`
- Produces: `<LadderRung tier: OrchestratorTier, isOpen: boolean, onToggle: () => void />`, `<CertLadder />`

- [ ] **Step 1: Write the failing test**

Create `website/__tests__/CertLadder.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CertLadder from "@/components/ladder/CertLadder";

describe("CertLadder", () => {
  it("renders Bronze, Silver, and Gold rungs", () => {
    render(<CertLadder />);
    expect(screen.getByText("Bronze")).toBeInTheDocument();
    expect(screen.getByText("Silver")).toBeInTheDocument();
    expect(screen.getByText("Gold")).toBeInTheDocument();
  });

  it("clicking a rung reveals its demonstration requirements", () => {
    render(<CertLadder />);
    fireEvent.click(screen.getByText("Silver"));
    expect(screen.getByText(/Directing tools across real academic/i)).toBeInTheDocument();
  });

  it("clicking a rung again collapses it", () => {
    render(<CertLadder />);
    fireEvent.click(screen.getByText("Silver"));
    fireEvent.click(screen.getByText("Silver"));
    expect(screen.queryByText(/Directing tools across real academic/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "/Users/david/claude/dAIsy Project/website"
npm test -- CertLadder
```

Expected: FAIL — `Cannot find module '@/components/ladder/CertLadder'`

- [ ] **Step 3: Create LadderRung**

Create `website/components/ladder/LadderRung.tsx`:

```tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { OrchestratorTier } from "@/lib/content";
import { ChevronDown } from "lucide-react";

interface Props {
  tier: OrchestratorTier;
  isOpen: boolean;
  onToggle: () => void;
  rungIndex: number;
}

export default function LadderRung({ tier, isOpen, onToggle, rungIndex }: Props) {
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: `${tier.color}44` }}>
      <button
        className="w-full flex items-center justify-between px-6 py-5 text-left transition-colors hover:bg-primary/3"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-primary shrink-0"
            style={{ backgroundColor: tier.color }}
          >
            {rungIndex + 1}
          </div>
          <div>
            <p className="font-serif font-bold text-xl text-primary">{tier.name}</p>
            <p className="text-sm text-primary/60">{tier.subtitle}</p>
          </div>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={18} className="text-primary/40" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-2 border-t border-primary/8 space-y-5">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary/40">She demonstrates</p>
                <ul className="space-y-1">
                  {tier.demonstrates.map((item, i) => (
                    <li key={i} className="flex gap-2 items-start text-sm text-primary/75">
                      <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: tier.color }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary/40">Evidence required to advance</p>
                <ul className="space-y-1">
                  {tier.evidence.map((item, i) => (
                    <li key={i} className="flex gap-2 items-start text-sm text-primary/75">
                      <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-primary/30" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl p-4 space-y-1" style={{ backgroundColor: `${tier.color}18` }}>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary/40">Tool access earned</p>
                <p className="text-sm text-primary/80">{tier.toolAccess}</p>
              </div>

              <div className="text-xs text-primary/40">
                Cornerstone alignment: <span className="text-primary/60 font-medium">{tier.cornerstone}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 4: Create CertLadder**

Create `website/components/ladder/CertLadder.tsx`:

```tsx
"use client";

import { useState } from "react";
import LadderRung from "./LadderRung";
import { ORCHESTRATOR_CONTENT } from "@/lib/content";

export default function CertLadder() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {ORCHESTRATOR_CONTENT.tiers.map((tier, i) => (
        <LadderRung
          key={tier.name}
          tier={tier}
          rungIndex={i}
          isOpen={openIndex === i}
          onToggle={() => setOpenIndex(openIndex === i ? null : i)}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Build the Orchestrator page**

Create `website/app/orchestrator/page.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";
import CertLadder from "@/components/ladder/CertLadder";
import { ORCHESTRATOR_CONTENT } from "@/lib/content";
import { MOTION_VARIANTS } from "@/lib/motion";
import { Award, BookOpen } from "lucide-react";

export default function OrchestratorPage() {
  const c = ORCHESTRATOR_CONTENT;
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 space-y-20">
      <motion.div className="space-y-4" initial="initial" animate="animate" variants={MOTION_VARIANTS.pageTransition}>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-orchestrator" />
          <p className="text-sm font-medium text-primary/50 uppercase tracking-widest">Pillar 2</p>
        </div>
        <h1 className="text-4xl font-serif font-bold">Junior AI Orchestrator Award</h1>
        <p className="text-lg text-primary/70 max-w-2xl leading-relaxed">{c.purpose}</p>
      </motion.div>

      {/* The orchestrator metaphor */}
      <motion.div
        className="rounded-2xl bg-orchestrator/15 border border-orchestrator/30 p-8 space-y-4"
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={MOTION_VARIANTS.fadeUp}
      >
        <h2 className="text-xl font-serif font-bold">The orchestrator, not the consumer</h2>
        <p className="text-primary/80 leading-relaxed italic">"{c.orchestratorDefinition}"</p>
        <div className="flex flex-wrap gap-3 pt-2">
          {c.threeQuestions.map((q, i) => (
            <span key={i} className="px-4 py-2 rounded-full bg-orchestrator/20 text-sm font-medium text-primary">
              {q}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Certification ladder */}
      <motion.div className="space-y-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={MOTION_VARIANTS.fadeUp}>
        <h2 className="text-2xl font-serif font-bold">The certification ladder</h2>
        <p className="text-primary/60 text-sm">Click a tier to expand its requirements.</p>
        <CertLadder />
      </motion.div>

      {/* Evidence types */}
      <motion.div className="space-y-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={MOTION_VARIANTS.fadeUp}>
        <h2 className="text-2xl font-serif font-bold">How mastery is evidenced</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {c.evidenceTypes.map((e, i) => (
            <div key={i} className="rounded-xl bg-primary/4 p-5 space-y-2">
              <p className="font-semibold text-primary">{e.name}</p>
              <p className="text-sm text-primary/70 leading-relaxed">{e.description}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Verification-first policy */}
      <motion.div
        className="rounded-2xl border border-primary/20 p-8 space-y-5"
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={MOTION_VARIANTS.fadeUp}
      >
        <h2 className="text-2xl font-serif font-bold">{c.verificationFirst.heading}</h2>
        <blockquote className="border-l-4 border-primary pl-5 text-primary/75 leading-relaxed italic">
          {c.verificationFirst.policy}
        </blockquote>
        <div className="space-y-2">
          {c.verificationFirst.jobs.map((job, i) => (
            <div key={i} className="flex gap-3 items-start text-sm text-primary/70">
              <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs shrink-0 mt-0.5">{i + 1}</span>
              {job}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Tool access */}
      <motion.div className="space-y-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={MOTION_VARIANTS.fadeUp}>
        <h2 className="text-2xl font-serif font-bold">Tiered tool access</h2>
        <div className="overflow-x-auto rounded-xl border border-primary/12">
          <table className="w-full text-sm">
            <thead className="bg-primary/6">
              <tr>
                <th className="px-5 py-3 text-left font-semibold text-primary/60">Access tier</th>
                <th className="px-5 py-3 text-left font-semibold text-primary/60">Tool</th>
                <th className="px-5 py-3 text-left font-semibold text-primary/60">Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/8">
              {c.toolAccess.map((row, i) => (
                <tr key={i} className="hover:bg-primary/3">
                  <td className="px-5 py-4 font-medium text-primary">{row.tier}</td>
                  <td className="px-5 py-4 text-primary/80">{row.tool}</td>
                  <td className="px-5 py-4 text-primary/60">{row.rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <div className="flex items-center gap-2 text-sm text-primary/50">
        <BookOpen size={14} />
        <span>Cornerstone alignment: <strong className="text-primary">{c.cornerstone}</strong></span>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Run tests**

```bash
cd "/Users/david/claude/dAIsy Project/website"
npm test -- CertLadder
```

Expected: PASS — 3 tests green.

- [ ] **Step 7: Commit**

```bash
cd "/Users/david/claude/dAIsy Project"
git add website/components/ladder/ website/app/orchestrator/
git commit -m "feat: Orchestrator page with interactive Bronze/Silver/Gold certification ladder"
```

---

## Task 8: Innovation Challenge Page

**Files:**
- Create: `website/components/timeline/BuildDayTimeline.tsx`
- Create: `website/components/rubric/RubricChart.tsx`
- Create: `website/app/challenge/page.tsx`

**Interfaces:**
- Consumes: `CHALLENGE_CONTENT` from `lib/content`, `MOTION_VARIANTS` from `lib/motion`
- Produces: `<BuildDayTimeline />`, `<RubricChart />`

- [ ] **Step 1: Create BuildDayTimeline**

Create `website/components/timeline/BuildDayTimeline.tsx`:

```tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CHALLENGE_CONTENT } from "@/lib/content";

export default function BuildDayTimeline() {
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  return (
    <div className="relative">
      {/* Connecting line */}
      <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-challenge/30" />

      <div className="space-y-2">
        {CHALLENGE_CONTENT.timeline.map((slot, i) => {
          const isActive = activeSlot === i;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.3 }}
            >
              <button
                className="w-full flex items-start gap-4 text-left group"
                onClick={() => setActiveSlot(isActive ? null : i)}
                aria-expanded={isActive}
              >
                <div
                  className={[
                    "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10 transition-colors",
                    isActive ? "bg-challenge text-white" : "bg-challenge/20 text-primary group-hover:bg-challenge/40",
                  ].join(" ")}
                >
                  {i + 1}
                </div>
                <div className="flex-1 py-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-primary">{slot.title}</p>
                    <p className="text-xs text-primary/40 shrink-0 ml-4">{slot.time}</p>
                  </div>
                  <AnimatePresence>
                    {isActive && (
                      <motion.p
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-sm text-primary/65 leading-relaxed mt-1 overflow-hidden"
                      >
                        {slot.description}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create RubricChart**

Create `website/components/rubric/RubricChart.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";
import { CHALLENGE_CONTENT } from "@/lib/content";

const DOMAIN_COLORS: Record<string, string> = {
  "Engage": "#E8A598",
  "Create": "#A89BC2",
  "Manage": "#7BB8D4",
  "Manage / Shape": "#7BB8D4",
  "Shape": "#F5C842",
};

export default function RubricChart() {
  return (
    <div className="space-y-3">
      {CHALLENGE_CONTENT.rubric.map((item, i) => (
        <div key={i} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-primary/80 flex-1 pr-4 leading-snug">{item.criterion}</span>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/8 text-primary/60">{item.domain}</span>
              <span className="font-bold text-primary w-8 text-right">{item.weight}%</span>
            </div>
          </div>
          <div className="h-2 rounded-full bg-primary/8 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: DOMAIN_COLORS[item.domain] ?? "#E8A598" }}
              initial={{ width: 0 }}
              whileInView={{ width: `${item.weight * 4}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Build the Challenge page**

Create `website/app/challenge/page.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";
import BuildDayTimeline from "@/components/timeline/BuildDayTimeline";
import RubricChart from "@/components/rubric/RubricChart";
import { CHALLENGE_CONTENT } from "@/lib/content";
import { MOTION_VARIANTS } from "@/lib/motion";
import { Zap, Trophy, Star } from "lucide-react";

export default function ChallengePage() {
  const c = CHALLENGE_CONTENT;
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 space-y-20">
      <motion.div className="space-y-4" initial="initial" animate="animate" variants={MOTION_VARIANTS.pageTransition}>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-challenge" />
          <p className="text-sm font-medium text-primary/50 uppercase tracking-widest">Pillar 3</p>
        </div>
        <h1 className="text-4xl font-serif font-bold">dAIsy Innovation Challenge</h1>
        <p className="text-lg text-primary/70 max-w-2xl leading-relaxed">{c.purpose}</p>
      </motion.div>

      {/* Failure requirement */}
      <motion.div
        className="rounded-2xl bg-primary text-background p-8 space-y-3"
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={MOTION_VARIANTS.fadeUp}
      >
        <div className="flex items-center gap-2 text-accent font-semibold">
          <Zap size={16} /> The requirement that makes it real: failure
        </div>
        <p className="text-background/85 leading-relaxed">{c.failureRequirement}</p>
      </motion.div>

      {/* Structure grid */}
      <motion.div className="space-y-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={MOTION_VARIANTS.fadeUp}>
        <h2 className="text-2xl font-serif font-bold">Structure</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {Object.entries(c.structure).map(([key, val]) => (
            <div key={key} className="rounded-xl bg-primary/4 p-5 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary/40">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
              <p className="text-sm text-primary/80 leading-relaxed">{val}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Team roles */}
      <motion.div className="space-y-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={MOTION_VARIANTS.fadeUp}>
        <h2 className="text-2xl font-serif font-bold">Team roles</h2>
        <p className="text-primary/60 text-sm">The role structure is the inclusion strategy — the girl who cannot write a line of code but can see clearly what is fair, what is useful, and what is missing is essential to the team.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {c.roles.map((role) => (
            <div key={role.name} className="rounded-xl border border-challenge/30 bg-challenge/8 p-5 space-y-2">
              <p className="font-semibold text-primary">{role.name}</p>
              <p className="text-sm text-primary/70 leading-relaxed">{role.description}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Challenge areas */}
      <motion.div className="space-y-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={MOTION_VARIANTS.fadeUp}>
        <h2 className="text-2xl font-serif font-bold">Challenge areas</h2>
        <div className="flex flex-wrap gap-3">
          {c.challengeAreas.map((area) => (
            <span key={area.name} className="px-4 py-2 rounded-full bg-primary/8 text-sm font-medium text-primary/80">
              {area.name}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Build Day Timeline */}
      <motion.div className="space-y-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={MOTION_VARIANTS.fadeUp}>
        <h2 className="text-2xl font-serif font-bold">Sample day</h2>
        <p className="text-primary/60 text-sm">Click a session block to expand it.</p>
        <BuildDayTimeline />
      </motion.div>

      {/* Judging rubric */}
      <motion.div className="space-y-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={MOTION_VARIANTS.fadeUp}>
        <h2 className="text-2xl font-serif font-bold">Judging rubric</h2>
        <RubricChart />
      </motion.div>

      {/* STEMmy Awards */}
      <motion.div className="space-y-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={MOTION_VARIANTS.fadeUp}>
        <div className="flex items-center gap-2">
          <Trophy size={20} className="text-accent" />
          <h2 className="text-2xl font-serif font-bold">The STEMmy Awards</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {c.stemmyAwards.map((award) => (
            <div key={award} className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent/15 border border-accent/30">
              <Star size={12} className="text-accent" />
              <span className="text-sm font-medium text-primary">{award}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* dAIsy Studio */}
      <motion.div
        className="rounded-2xl border border-primary/20 p-8 space-y-3"
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={MOTION_VARIANTS.fadeUp}
      >
        <h2 className="text-2xl font-serif font-bold">From one day to an ecosystem: the dAIsy Studio</h2>
        <p className="text-primary/70 leading-relaxed">{c.studio}</p>
      </motion.div>

      {/* SAFE AI */}
      <motion.div className="space-y-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={MOTION_VARIANTS.fadeUp}>
        <h2 className="text-2xl font-serif font-bold">SAFE AI governance</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {c.safeAI.map((item) => (
            <div key={item.principle} className="rounded-xl bg-primary/4 p-5 space-y-2">
              <p className="font-semibold text-primary">{item.principle}</p>
              <p className="text-sm text-primary/70 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
cd "/Users/david/claude/dAIsy Project"
git add website/components/timeline/ website/components/rubric/ website/app/challenge/
git commit -m "feat: Innovation Challenge page with Build Day timeline and rubric chart"
```

---

## Task 9: Research & Evidence Page

**Files:**
- Create: `website/components/stats/StatCounter.tsx`
- Create: `website/components/stats/StatsGrid.tsx`
- Create: `website/app/research/page.tsx`
- Test: `website/__tests__/StatCounter.test.tsx`

**Interfaces:**
- Consumes: `RESEARCH_CONTENT` from `lib/content`, `MOTION_VARIANTS` from `lib/motion`
- Produces: `<StatCounter value: number, suffix: string, label: string />`, `<StatsGrid />`

- [ ] **Step 1: Write the failing test**

Create `website/__tests__/StatCounter.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatCounter from "@/components/stats/StatCounter";

describe("StatCounter", () => {
  it("renders the label", () => {
    render(<StatCounter value={54} suffix="%" label="of students use AI" source="RAND 2025" />);
    expect(screen.getByText(/of students use AI/i)).toBeInTheDocument();
  });

  it("renders the source", () => {
    render(<StatCounter value={54} suffix="%" label="of students use AI" source="RAND 2025" />);
    expect(screen.getByText(/RAND 2025/i)).toBeInTheDocument();
  });

  it("renders the suffix", () => {
    render(<StatCounter value={54} suffix="%" label="of students use AI" source="RAND 2025" />);
    expect(screen.getByText(/%/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "/Users/david/claude/dAIsy Project/website"
npm test -- StatCounter
```

Expected: FAIL — `Cannot find module '@/components/stats/StatCounter'`

- [ ] **Step 3: Create StatCounter**

Create `website/components/stats/StatCounter.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

interface Props {
  value: number;
  suffix: string;
  label: string;
  source: string;
}

export default function StatCounter({ value, suffix, label, source }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const duration = 1500;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <div ref={ref} className="rounded-2xl bg-primary/4 p-6 space-y-3">
      <div className="text-4xl font-serif font-bold text-primary tabular-nums">
        {count}{suffix}
      </div>
      <p className="text-sm text-primary/75 leading-snug">{label}</p>
      <p className="text-xs text-primary/40">{source}</p>
    </div>
  );
}
```

- [ ] **Step 4: Create StatsGrid**

Create `website/components/stats/StatsGrid.tsx`:

```tsx
import StatCounter from "./StatCounter";
import { RESEARCH_CONTENT } from "@/lib/content";

export default function StatsGrid() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {RESEARCH_CONTENT.stats.map((stat, i) => (
        <StatCounter
          key={i}
          value={stat.value}
          suffix={stat.suffix}
          label={stat.label}
          source={stat.source}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Build the Research page**

Create `website/app/research/page.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";
import StatsGrid from "@/components/stats/StatsGrid";
import { RESEARCH_CONTENT } from "@/lib/content";
import { MOTION_VARIANTS } from "@/lib/motion";
import { ExternalLink } from "lucide-react";

export default function ResearchPage() {
  const c = RESEARCH_CONTENT;
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 space-y-20">
      <motion.div className="space-y-4" initial="initial" animate="animate" variants={MOTION_VARIANTS.pageTransition}>
        <p className="text-sm font-medium text-accent uppercase tracking-widest">Evidence base</p>
        <h1 className="text-4xl font-serif font-bold">Research & Evidence</h1>
        <p className="text-lg text-primary/70 max-w-2xl leading-relaxed">{c.intro}</p>
      </motion.div>

      {/* Stat counters */}
      <motion.div className="space-y-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={MOTION_VARIANTS.fadeUp}>
        <h2 className="text-2xl font-serif font-bold">The numbers</h2>
        <StatsGrid />
      </motion.div>

      {/* Six findings */}
      <div className="space-y-8">
        <motion.h2 className="text-2xl font-serif font-bold" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={MOTION_VARIANTS.fadeUp}>
          Six findings, six design choices
        </motion.h2>
        <motion.div
          className="space-y-6"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={MOTION_VARIANTS.staggerContainer}
        >
          {c.findings.map((finding, i) => (
            <motion.div key={i} variants={MOTION_VARIANTS.fadeUp} className="rounded-2xl border border-primary/12 p-6 space-y-4">
              <div className="flex items-start gap-4">
                <span className="w-7 h-7 rounded-full bg-accent flex items-center justify-center font-bold text-sm text-primary shrink-0">
                  {i + 1}
                </span>
                <div className="space-y-2">
                  <h3 className="font-serif font-bold text-lg text-primary">{finding.title}</h3>
                  <p className="text-sm text-primary/65 leading-relaxed">{finding.detail}</p>
                </div>
              </div>
              <div className="ml-11 rounded-xl bg-accent/12 border border-accent/25 px-4 py-3 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary/40">dAIsy's response</p>
                <p className="text-sm text-primary/80 leading-relaxed">{finding.daisyResponse}</p>
              </div>
              <p className="ml-11 text-xs text-primary/35">Source: {finding.source}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* dAIsy Pulse */}
      <motion.div className="space-y-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={MOTION_VARIANTS.fadeUp}>
        <h2 className="text-2xl font-serif font-bold">The dAIsy Pulse</h2>
        <p className="text-primary/60 text-sm">Benchmarked annual survey — Hockaday numbers sit next to national ones.</p>
        <div className="overflow-x-auto rounded-xl border border-primary/12">
          <table className="w-full text-sm">
            <thead className="bg-primary/6">
              <tr>
                <th className="px-5 py-3 text-left font-semibold text-primary/60">Survey item</th>
                <th className="px-5 py-3 text-left font-semibold text-primary/60 whitespace-nowrap">National benchmark</th>
                <th className="px-5 py-3 text-left font-semibold text-primary/60 whitespace-nowrap">dAIsy target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/8">
              {c.pulse.map((row, i) => (
                <tr key={i} className="hover:bg-primary/3">
                  <td className="px-5 py-4 text-primary/80 leading-snug">{row.item}</td>
                  <td className="px-5 py-4 font-medium text-primary whitespace-nowrap">{row.benchmark}</td>
                  <td className="px-5 py-4 text-primary/65">{row.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Measure of success */}
      <motion.div
        className="rounded-2xl bg-primary text-background p-10 space-y-4 text-center"
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={MOTION_VARIANTS.fadeUp}
      >
        <p className="text-sm text-background/50 uppercase tracking-widest">The measure of success</p>
        <p className="text-xl font-serif leading-relaxed text-background/90 max-w-2xl mx-auto">"{c.successMeasure}"</p>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 6: Run tests**

```bash
cd "/Users/david/claude/dAIsy Project/website"
npm test -- StatCounter
```

Expected: PASS — 3 tests green.

- [ ] **Step 7: Commit**

```bash
cd "/Users/david/claude/dAIsy Project"
git add website/components/stats/ website/app/research/
git commit -m "feat: Research page with animated stat counters and dAIsy Pulse table"
```

---

## Task 10: Governance Page

**Files:**
- Create: `website/components/risk-tier/TierColumn.tsx`
- Create: `website/components/risk-tier/RiskTierMap.tsx`
- Create: `website/app/governance/page.tsx`
- Test: `website/__tests__/RiskTierMap.test.tsx`

**Interfaces:**
- Consumes: `GOVERNANCE_CONTENT` from `lib/content`, `MOTION_VARIANTS` from `lib/motion`
- Produces: `<TierColumn tier: RiskTier, isOpen: boolean, onToggle: () => void />`, `<RiskTierMap />`

- [ ] **Step 1: Write the failing test**

Create `website/__tests__/RiskTierMap.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import RiskTierMap from "@/components/risk-tier/RiskTierMap";

describe("RiskTierMap", () => {
  it("renders all four tier names", () => {
    render(<RiskTierMap />);
    expect(screen.getByText("Prohibited")).toBeInTheDocument();
    expect(screen.getByText("Governed")).toBeInTheDocument();
    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(screen.getByText("Educator Caution")).toBeInTheDocument();
  });

  it("clicking Prohibited tier reveals its categories", () => {
    render(<RiskTierMap />);
    fireEvent.click(screen.getByText("Prohibited"));
    expect(screen.getByText(/Companion \/ roleplay chatbots/i)).toBeInTheDocument();
  });

  it("clicking Prohibited again collapses it", () => {
    render(<RiskTierMap />);
    fireEvent.click(screen.getByText("Prohibited"));
    fireEvent.click(screen.getByText("Prohibited"));
    expect(screen.queryByText(/Companion \/ roleplay chatbots/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "/Users/david/claude/dAIsy Project/website"
npm test -- RiskTierMap
```

Expected: FAIL — `Cannot find module '@/components/risk-tier/RiskTierMap'`

- [ ] **Step 3: Create TierColumn**

Create `website/components/risk-tier/TierColumn.tsx`:

```tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { RiskTier } from "@/lib/content";
import { ChevronDown, ShieldOff, Shield, CheckCircle, AlertTriangle } from "lucide-react";

const TIER_CONFIG = {
  prohibited: { color: "#D9534F", bg: "#D9534F18", icon: ShieldOff, badge: "Blocked" },
  governed:   { color: "#F0A500", bg: "#F0A50018", icon: Shield,    badge: "Governed" },
  approved:   { color: "#1B4332", bg: "#1B433218", icon: CheckCircle, badge: "Approved" },
  caution:    { color: "#6B7280", bg: "#6B728018", icon: AlertTriangle, badge: "Caution" },
};

interface Props {
  tier: RiskTier;
  isOpen: boolean;
  onToggle: () => void;
}

export default function TierColumn({ tier, isOpen, onToggle }: Props) {
  const config = TIER_CONFIG[tier.variant];
  const Icon = config.icon;

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: `${config.color}40`, backgroundColor: isOpen ? config.bg : "transparent" }}
    >
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:opacity-80"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <Icon size={18} style={{ color: config.color }} />
          <div>
            <p className="font-semibold text-primary">{tier.name}</p>
            <span
              className="inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-0.5"
              style={{ backgroundColor: `${config.color}22`, color: config.color }}
            >
              {config.badge}
            </span>
          </div>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} className="text-primary/40" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1 space-y-4 border-t" style={{ borderColor: `${config.color}20` }}>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary/40">Categories</p>
                <ul className="space-y-1">
                  {tier.categories.map((cat, i) => (
                    <li
                      key={i}
                      className={[
                        "text-sm px-3 py-1.5 rounded-lg",
                        tier.variant === "prohibited" ? "line-through text-primary/40 bg-prohibited/8" : "text-primary/75 bg-primary/4",
                      ].join(" ")}
                    >
                      {cat}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary/40">Hockaday posture</p>
                <p className="text-sm text-primary/70 leading-relaxed">{tier.posture}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 4: Create RiskTierMap**

Create `website/components/risk-tier/RiskTierMap.tsx`:

```tsx
"use client";

import { useState } from "react";
import TierColumn from "./TierColumn";
import { GOVERNANCE_CONTENT } from "@/lib/content";

export default function RiskTierMap() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {GOVERNANCE_CONTENT.riskTiers.map((tier, i) => (
        <TierColumn
          key={tier.name}
          tier={tier}
          isOpen={openIndex === i}
          onToggle={() => setOpenIndex(openIndex === i ? null : i)}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Build the Governance page**

Create `website/app/governance/page.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";
import RiskTierMap from "@/components/risk-tier/RiskTierMap";
import { GOVERNANCE_CONTENT } from "@/lib/content";
import { MOTION_VARIANTS } from "@/lib/motion";
import { RefreshCw } from "lucide-react";

export default function GovernancePage() {
  const c = GOVERNANCE_CONTENT;
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 space-y-20">
      <motion.div className="space-y-4" initial="initial" animate="animate" variants={MOTION_VARIANTS.pageTransition}>
        <p className="text-sm font-medium text-accent uppercase tracking-widest">Program governance</p>
        <h1 className="text-4xl font-serif font-bold">Governance</h1>
        <p className="text-lg text-primary/70 max-w-2xl leading-relaxed">{c.intro}</p>
      </motion.div>

      {/* Tool Risk Tier Map */}
      <motion.div className="space-y-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={MOTION_VARIANTS.fadeUp}>
        <h2 className="text-2xl font-serif font-bold">The Hockaday Tool Risk Tier Map</h2>
        <p className="text-primary/60 text-sm">Click a tier to expand tool categories and Hockaday's posture.</p>
        <RiskTierMap />
      </motion.div>

      {/* SAFE AI */}
      <motion.div className="space-y-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={MOTION_VARIANTS.fadeUp}>
        <h2 className="text-2xl font-serif font-bold">SAFE AI framework</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {c.safeAI.map((item) => (
            <div key={item.principle} className="rounded-xl bg-primary/4 p-5 space-y-2">
              <p className="font-semibold text-primary">{item.principle}</p>
              <p className="text-sm text-primary/70 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Iteration loops */}
      <motion.div className="space-y-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={MOTION_VARIANTS.fadeUp}>
        <div className="flex items-center gap-2">
          <RefreshCw size={18} className="text-primary" />
          <h2 className="text-2xl font-serif font-bold">Built to iterate: four feedback loops</h2>
        </div>
        <div className="overflow-x-auto rounded-xl border border-primary/12">
          <table className="w-full text-sm">
            <thead className="bg-primary/6">
              <tr>
                <th className="px-5 py-3 text-left font-semibold text-primary/60">Loop</th>
                <th className="px-5 py-3 text-left font-semibold text-primary/60">Cadence</th>
                <th className="px-5 py-3 text-left font-semibold text-primary/60">Owner</th>
                <th className="px-5 py-3 text-left font-semibold text-primary/60">Can change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/8">
              {c.iterationLoops.map((loop, i) => (
                <tr key={i} className="hover:bg-primary/3">
                  <td className="px-5 py-4 text-primary/80 leading-snug">{loop.loop}</td>
                  <td className="px-5 py-4 text-primary/65 whitespace-nowrap">{loop.cadence}</td>
                  <td className="px-5 py-4 text-primary/65">{loop.owner}</td>
                  <td className="px-5 py-4 text-primary/65">{loop.canChange}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Closing statement */}
      <motion.div
        className="rounded-2xl bg-primary text-background p-10 text-center space-y-4"
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={MOTION_VARIANTS.fadeUp}
      >
        <p className="text-xl font-serif leading-relaxed text-background/90 max-w-2xl mx-auto">
          "{c.closingStatement}"
        </p>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 6: Run tests**

```bash
cd "/Users/david/claude/dAIsy Project/website"
npm test -- RiskTierMap
```

Expected: PASS — 3 tests green.

- [ ] **Step 7: Run all tests**

```bash
cd "/Users/david/claude/dAIsy Project/website"
npm test
```

Expected: All tests pass — NavBar (2), content (7), LevelSelector (3), CertLadder (3), SessionCards (3), StatCounter (3), RiskTierMap (3) = 24 tests total.

- [ ] **Step 8: Final build check**

```bash
cd "/Users/david/claude/dAIsy Project/website"
npm run build
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 9: Commit**

```bash
cd "/Users/david/claude/dAIsy Project"
git add website/components/risk-tier/ website/app/governance/
git commit -m "feat: Governance page with interactive Tool Risk Tier Map and iteration loops table"
```

---

## Spec Coverage Check

| Spec requirement | Implemented in |
|-----------------|----------------|
| 7 pages | Tasks 4–10 |
| Animated dAIsy flower hero with clickable petals | Task 4 — DaisyFlower.tsx |
| Animated pipeline diagram | Task 4 — PipelineDiagram.tsx |
| 3 pillar cards on home | Task 4 — page.tsx |
| AI Use Scale interactive 0–4 selector | Task 5 — LevelSelector.tsx |
| Level detail with scenario + disclosure | Task 5 — LevelDetail.tsx |
| Decision-aid panel + design rules | Task 5 — DecisionAid.tsx |
| Print one-pager button | Task 5 — use-scale/page.tsx |
| Ambassadors 4-session expandable cards | Task 6 — SessionCards.tsx |
| Companion AI section | Task 6 — ambassadors/page.tsx |
| Family strand touchpoints | Task 6 — ambassadors/page.tsx |
| Bronze/Silver/Gold expandable ladder | Task 7 — CertLadder.tsx + LadderRung.tsx |
| Verification-first policy blockquote | Task 7 — orchestrator/page.tsx |
| Tiered tool access table | Task 7 — orchestrator/page.tsx |
| Build Day timeline | Task 8 — BuildDayTimeline.tsx |
| Rubric bar chart | Task 8 — RubricChart.tsx |
| STEMmy Awards | Task 8 — challenge/page.tsx |
| dAIsy Studio pathway | Task 8 — challenge/page.tsx |
| 6 animated stat counters | Task 9 — StatCounter.tsx + StatsGrid.tsx |
| Research findings with dAIsy response | Task 9 — research/page.tsx |
| dAIsy Pulse table | Task 9 — research/page.tsx |
| Tool Risk Tier Map (4 tiers, expandable) | Task 10 — RiskTierMap.tsx |
| SAFE AI framework | Task 10 — governance/page.tsx |
| Iteration loops table | Task 10 — governance/page.tsx |
| All content from lib/content.ts | Task 2 — content.ts |
| Shared motion variants | Task 1 — motion.ts |
| NavBar with 7 links + dAIsy logo | Task 3 — NavBar.tsx |
| Sticky nav + footer | Task 3 — layout.tsx |
| Playfair Display + Inter fonts | Task 3 — layout.tsx |
| Color token system | Task 1 — tailwind.config.ts |
| Print stylesheet | Task 1 — globals.css |
