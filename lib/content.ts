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
  verificationFirst: {
    quote: "Tool access is a privilege earned through demonstrated judgment, not a default granted at enrollment.",
    link: { label: "See full Junior AI Orchestrator certification →", href: "/orchestrator" },
  },
};
