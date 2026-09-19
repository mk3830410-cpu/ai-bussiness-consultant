import { 
  BuildMyBusinessRoadmap, 
  BuildStageId, 
  BuildStageDefinition, 
  StrategyResponse, 
  WizardData,
  ValidationStageData,
  CustomerStageData,
  BusinessModelStageData,
  PricingStageData,
  BrandStageData,
  MarketingStageData,
  OperationsStageData,
  LaunchStageData,
  CustomersStageData,
  GrowthStageData
} from '../types';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export const BUILD_STAGES: BuildStageDefinition[] = [
  {
    id: 'validation',
    stageNumber: '01',
    title: 'Validation',
    subtitle: 'Market Demand & Assumption Testing',
    category: 'Strategic',
    outputName: 'Validation Experiment Brief & Interview Script'
  },
  {
    id: 'customer',
    stageNumber: '02',
    title: 'Customer',
    subtitle: 'Ideal Customer Profile (ICP) & Pain Hierarchy',
    category: 'Strategic',
    outputName: 'Ideal Customer Dossier & Anti-Persona Guide'
  },
  {
    id: 'business_model',
    stageNumber: '03',
    title: 'Business Model',
    subtitle: 'Lean Canvas, Revenue Engine & Moats',
    category: 'Strategic',
    outputName: 'Lean Canvas & Unit Economics Blueprint'
  },
  {
    id: 'pricing',
    stageNumber: '04',
    title: 'Pricing',
    subtitle: 'Value Metric, 3-Tier Packaging & Margins',
    category: 'Tactical',
    outputName: 'Tiered Pricing Table & Margin Calculator'
  },
  {
    id: 'brand',
    stageNumber: '05',
    title: 'Brand',
    subtitle: 'Positioning Statement, Tone & Identity',
    category: 'Tactical',
    outputName: 'Brand Positioning Guide & Elevator Pitch'
  },
  {
    id: 'marketing',
    stageNumber: '06',
    title: 'Marketing',
    subtitle: 'GTM Channels, Funnels & 30-Day Content Matrix',
    category: 'Tactical',
    outputName: 'Go-To-Market Playbook & Content Schedule'
  },
  {
    id: 'operations',
    stageNumber: '07',
    title: 'Operations',
    subtitle: 'Tech Stack, Legal Readiness & Founder SOPs',
    category: 'Execution',
    outputName: 'Tech Stack Blueprint & Operational SOPs'
  },
  {
    id: 'launch',
    stageNumber: '08',
    title: 'Launch',
    subtitle: '14-Day Countdown & Launch Day Playbook',
    category: 'Execution',
    outputName: 'Launch Day War Room & Distribution Kit'
  },
  {
    id: 'customers',
    stageNumber: '09',
    title: 'Customers',
    subtitle: 'First 10 & 100 Paying Customer Acquisition',
    category: 'Execution',
    outputName: 'Cold Outreach Sequences & Objection Playbook'
  },
  {
    id: 'growth',
    stageNumber: '10',
    title: 'Growth',
    subtitle: 'Viral Loops, Retention & Pirate Metrics',
    category: 'Execution',
    outputName: 'Growth Flywheel & Retention Protocol'
  }
];

const LOCAL_STORAGE_PREFIX = 'stratiq_build_roadmap_';

/**
 * Generates rich, actionable output for each of the 10 stages
 */
export function generateStageOutput(
  stageId: BuildStageId,
  roadmap: BuildMyBusinessRoadmap
): string {
  const vName = roadmap.ventureName || 'Venture';
  const ind = roadmap.industry || 'Technology';

  switch (stageId) {
    case 'validation': {
      const d = roadmap.stages.validation.data;
      return `# Stage 01: Market Validation Brief for ${vName}
**Industry:** ${ind} | **Target Feasibility Score:** ${d.validationScore}/100

### 1. Problem & Solution Hypothesis
- **Core Problem Hypothesis:** ${d.problemHypothesis}
- **Solution Value Hypothesis:** ${d.solutionHypothesis}
- **Target Market Opportunity:** ${d.targetMarketSize}

### 2. Riskiest Assumptions to Test (The RAT Test)
${d.riskiestAssumptions.map((a, i) => `${i + 1}. **[${a.riskLevel} Risk]** ${a.assumption}\n   - *Verification Protocol:* ${a.validationMethod}`).join('\n')}

### 3. Customer Discovery "Mom Test" Interview Script
*Rules: Never ask if they like the idea. Ask about past behavior and current expenditures.*
${d.customerInterviewQuestions.map((q, i) => `Q${i + 1}: ${q}`).join('\n')}

### 4. Active Experiments & Kill Criteria
${d.experiments.map(e => `- **${e.name}** (${e.type.toUpperCase()}): Target: \`${e.target}\` on metric \`${e.metric}\` | Status: *${e.status}*`).join('\n')}

> **Executive Kill / Pivot Criteria:** ${d.killCriteria}`;
    }

    case 'customer': {
      const d = roadmap.stages.customer.data;
      const icp = d.idealCustomerProfile;
      return `# Stage 02: Ideal Customer Dossier (ICP) for ${vName}

### 1. Primary Buyer Profile
- **Target Segment:** ${icp.segment}
- **Demographics & Role:** ${icp.role} (${icp.demographics})
- **Day in the Life Friction:** ${icp.dayInTheLife}
- **Current Sub-optimal Workaround:** ${icp.currentWorkaround}

### 2. Prioritized Pain Point Hierarchy
${d.topPainPoints.map((p, i) => `${i + 1}. **${p.pain}**\n   - Severity: ${p.severity}/10 | Frequency: ${p.frequency} | Willingness to Pay: ${p.willingnessToPay}`).join('\n')}

### 3. Critical Buying Triggers
${d.buyingTriggers.map((t, i) => `- [Trigger ${i + 1}] ${t}`).join('\n')}

### 4. Decision Criteria Matrix
${d.decisionCriteria.map((c, i) => `- Priority ${i + 1}: ${c}`).join('\n')}

### 5. Anti-Persona (Who NOT to Sell To)
- **Avoid:** ${d.antiPersona.whoNotToSellTo}
- **Reason:** ${d.antiPersona.reason}`;
    }

    case 'business_model': {
      const d = roadmap.stages.business_model.data;
      const ue = d.unitEconomics;
      return `# Stage 03: Lean Canvas & Unit Economics for ${vName}

### 1. Value Architecture & Moat
- **Core Value Proposition:** ${d.valueProposition}
- **Defensible Unfair Advantage (Moat):** ${d.unfairAdvantage}

### 2. Operational Activities & Strategic Partners
- **Key Activities:** ${d.keyActivities.join(', ')}
- **Key Partners / Integrations:** ${d.keyPartners.join(', ')}

### 3. Unit Economics Engine
- **Projected Monthly ARPU:** $${ue.arpuMonthly}
- **Target Customer Acquisition Cost (CAC):** $${ue.cacEstimated}
- **Expected Customer Lifetime (Months):** ${ue.ltvMonths} months
- **Projected Lifetime Value (LTV):** $${(ue.arpuMonthly * ue.ltvMonths).toFixed(0)}
- **LTV to CAC Ratio:** ${ue.cacEstimated > 0 ? ((ue.arpuMonthly * ue.ltvMonths) / ue.cacEstimated).toFixed(1) : '3.5'}x (Healthy > 3.0x)
- **Gross Margin Target:** ${ue.grossMarginPercent}%

### 4. Revenue Streams
${d.revenueStreams.map(r => `- **${r.stream}** (${r.model}): ~${r.projectedShare}% of top-line`).join('\n')}`;
    }

    case 'pricing': {
      const d = roadmap.stages.pricing.data;
      return `# Stage 04: Tiered Pricing Specification for ${vName}

### 1. Pricing Engine Strategy
- **Core Value Metric:** ${d.valueMetric} (Scales as customer gets more value)
- **Pricing Model Archetype:** ${d.strategyType.toUpperCase()}
- **Monthly Break-Even Volume:** ~${d.breakEvenMonthlyUnits} active accounts
- **Margin Safety Buffer:** ${d.marginSafetyBuffer}

### 2. The 3-Tier Packaging Matrix
${d.tiers.map(t => `#### Tier: ${t.name} ${t.isPopular ? '⭐ [MOST POPULAR]' : ''}
- **Price:** $${t.priceMonthly}/mo (or $${t.priceAnnual}/yr billed annually)
- **Target Buyer:** ${t.targetBuyer}
- **Core Features Included:**
${t.coreFeatures.map(f => `  - ${f}`).join('\n')}`).join('\n\n')}

### 3. Discounting & Annual Incentives
${d.discountStrategy}`;
    }

    case 'brand': {
      const d = roadmap.stages.brand.data;
      const v = d.visualIdentity;
      return `# Stage 05: Brand Identity & Positioning System for ${vName}

### 1. Geoffrey Moore Positioning Statement
"${d.positioningStatement}"

### 2. Core Brand Messaging
- **Official Brand Name:** ${d.brandName}
- **Tagline:** "${d.tagline}"
- **30-Second Elevator Pitch:** ${d.elevatorPitch30s}

### 3. Voice & Personality
- **Tone of Voice:** ${d.brandVoiceTone.join(' • ')}
- **Core Cultural Values:** ${d.coreValues.join(' • ')}

### 4. Visual Identity Specs
- **Primary Color:** ${v.primaryColor}
- **Secondary Accent:** ${v.secondaryColor}
- **Typography Pairing:** ${v.fontPairing}
- **Aesthetic Vibe:** ${v.aestheticVibe}`;
    }

    case 'marketing': {
      const d = roadmap.stages.marketing.data;
      const fun = d.acquisitionFunnel;
      return `# Stage 06: Go-To-Market Playbook for ${vName}

### 1. Bullseye Acquisition Channels
${d.primaryChannels.map(c => `- **[${c.priority.toUpperCase()}] ${c.channel}** (Est. CAC: ${c.expectedCAC})\n  *Tactical Play:* ${c.tactic}`).join('\n')}

### 2. 3-Stage Acquisition Funnel
- **Top of Funnel (Attract / Lead Magnet):** ${fun.topOfFunnelLeadMagnet}
- **Middle of Funnel (Nurture / Education):** ${fun.middleOfFunnelNurture}
- **Bottom of Funnel (Conversion CTA):** ${fun.bottomOfFunnelConversionCTA}

### 3. 30-Day Launch Content Calendar
${d.thirtyDayContentSchedule.map(w => `#### Week ${w.week}: ${w.focus}
${w.contentHooks.map(h => `- "${h}"`).join('\n')}`).join('\n\n')}`;
    }

    case 'operations': {
      const d = roadmap.stages.operations.data;
      return `# Stage 07: Operational Architecture & SOPs for ${vName}

### 1. Production Tech Stack & Tooling
${d.techStack.map(t => `- **${t.category}:** ${t.toolName} — ${t.purpose} ($${t.monthlyCost}/mo)`).join('\n')}

### 2. Legal & Corporate Readiness Checklist
${d.legalReadiness.map(l => `- [${l.completed ? 'x' : ' '}] **${l.item}:** ${l.notes}`).join('\n')}

### 3. Founder Weekly Operating Cadence
${d.founderWeeklyCadence.map(c => `- **${c.day}:** ${c.coreFocus}`).join('\n')}

### 4. Core Standard Operating Procedures (SOPs)
${d.keySOPs.map(s => `#### SOP: ${s.title}
*Trigger:* ${s.trigger}
${s.steps.map((st, i) => `${i + 1}. ${st}`).join('\n')}`).join('\n\n')}`;
    }

    case 'launch': {
      const d = roadmap.stages.launch.data;
      const k = d.distributionKit;
      return `# Stage 08: Launch Day War Room Playbook for ${vName}
**Target Launch Date:** ${d.targetLaunchDate} | **Waitlist Goal:** ${d.preLaunchWaitlistGoal} founders

### 1. Countdown Launch Checklist
${d.countdownChecklist.map(c => `- [${c.completed ? 'x' : ' '}] **[${c.timing}]** ${c.task}`).join('\n')}

### 2. Multi-Platform Distribution Kit

#### Product Hunt Submission
- **Tagline (60 chars max):** ${k.productHuntTagline}
- **Maker's First Comment:**
> "${k.productHuntMakerComment}"

#### Twitter / X Launch Thread (Opening Hook)
"${k.twitterAnnouncementThread}"

#### LinkedIn Announcement Post
"${k.linkedInPostDraft}"`;
    }

    case 'customers': {
      const d = roadmap.stages.customers.data;
      return `# Stage 09: First 10 & 100 Customers Playbook for ${vName}

### 1. Tactical Direct Acquisition
- **First 10 Paying Customers:** ${d.first10CustomersTarget}
- **Scaling to 100 Customers:** ${d.first100CustomersStrategy}

### 2. Battle-Tested Cold Outreach Templates
${d.coldOutreachTemplates.map(t => `#### Channel: ${t.channel}
${t.subject ? `*Subject:* ${t.subject}\n` : ''}
\`\`\`
${t.body}
\`\`\``).join('\n\n')}

### 3. Objection Handling Playbook
${d.objectionPlaybook.map((o, i) => `${i + 1}. **Objection:** "${o.objection}"\n   - *Reframe & Counter:* ${o.counterArgument}`).join('\n')}`;
    }

    case 'growth': {
      const d = roadmap.stages.growth.data;
      const p = d.pirateMetricsTargets;
      return `# Stage 10: Growth Engine & Retention Protocol for ${vName}

### 1. The North Star Metric (NSM)
⭐ **North Star Metric:** ${d.northStarMetric}

### 2. Pirate Metrics (AARRR) Targets
- **Acquisition Target:** ${p.acquisitionGoal}
- **Activation Benchmark:** ${p.activationBenchmark}
- **Month-1 Retention Rate:** ${p.retentionMonth1Percent}% (Industry benchmark > 40%)
- **Viral Coefficient (k-factor):** ${p.referralKFactor}
- **Year 1 Target MRR:** $${p.revenueMRRTarget.toLocaleString()}

### 3. Viral Referral Engine
- **Incentive:** ${d.viralReferralEngine.incentive}
- **Mechanism:** ${d.viralReferralEngine.loopMechanism}

### 4. Retention & Anti-Churn Protocol
${d.retentionCadence.map(r => `- **${r.milestone}:** ${r.engagementAction}`).join('\n')}`;
    }

    default:
      return `# Stage Output`;
  }
}

/**
 * Creates an initial 10-stage roadmap pre-populated from Strategy / Wizard data
 */
export function createInitialRoadmap(params: {
  userId: string;
  ventureName?: string;
  industry?: string;
  strategy?: StrategyResponse | null;
  wizardData?: Partial<WizardData> | null;
}): BuildMyBusinessRoadmap {
  const { userId, strategy, wizardData } = params;

  const ventureName = 
    strategy?.brandIdentity?.companyNameSuggestions?.[0] ||
    wizardData?.businessName ||
    params.ventureName ||
    'StratIQ Venture';

  const industry = 
    wizardData?.industry ||
    params.industry ||
    'AI & SaaS Software';

  const targetCustomer = 
    wizardData?.targetCustomer ||
    strategy?.marketAnalysis?.targetAudience ||
    'Early-stage founders and small team operators';

  const usp = 
    strategy?.uniqueValueProposition ||
    strategy?.marketAnalysis?.uniqueSellingProposition ||
    `Empowering ${targetCustomer} with automated, high-velocity intelligence.`;

  const swotStrengths = strategy?.marketAnalysis?.swot?.strengths || [];
  const competitors = strategy?.marketAnalysis?.competitors || [];

  const initialValidation: ValidationStageData = {
    problemHypothesis: `Founders in ${industry} waste 20+ hours per week manually executing workflows that lack strategic precision.`,
    solutionHypothesis: `${ventureName} delivers structured, automated execution blueprints that reduce time-to-launch by 80%.`,
    targetMarketSize: '$4.2B global TAM with 24% CAGR across modern digital operators.',
    riskiestAssumptions: [
      { assumption: 'Customers will pay a recurring subscription for guided execution over static templates.', riskLevel: 'High', validationMethod: '15 structured customer discovery calls & pre-order pledge' },
      { assumption: 'Users can achieve first measurable value in under 10 minutes.', riskLevel: 'Medium', validationMethod: 'Time-to-value usability recording test' },
      { assumption: 'Organic founder referral loops can achieve a k-factor > 0.35.', riskLevel: 'Medium', validationMethod: 'Waitlist share-to-unlock incentive tracking' },
    ],
    experiments: [
      { name: 'Smoke Test Landing Page', type: 'web', metric: 'Email conversion rate', target: '> 15% conversion', status: 'running' },
      { name: 'Mom Test Founder Interviews', type: 'qualitative', metric: 'Problem severity score', target: '8/10 on 12 calls', status: 'running' },
      { name: 'Pre-Order Founding Member Pass', type: 'sales', metric: 'Paid commitments', target: '10 paid pre-orders', status: 'planned' },
    ],
    customerInterviewQuestions: [
      `What is the most frustrating, time-consuming bottleneck you faced in ${industry} over the last 30 days?`,
      `How much time or money have you spent trying to solve this bottleneck so far?`,
      `What specific tools or spreadsheets do you currently use, and where do they fail?`,
      `If a magical solution existed today, how would you measure its success in week 1?`,
      `Who on your team has the final authority to purchase software for this problem?`
    ],
    validationScore: strategy?.ideaValidation?.score || 85,
    killCriteria: 'If fewer than 3 of 15 discovery interviewees confirm this is a top-3 monthly budget priority, pivot the core value proposition.'
  };

  const initialCustomer: CustomerStageData = {
    idealCustomerProfile: {
      segment: 'High-Intent Digital Operators & Technical Founders',
      demographics: 'Ages 25–45, Seed/Bootstrap Stage, Teams of 1–15',
      role: 'Founder, CEO, or Head of Growth',
      dayInTheLife: 'Constantly context-switching between product building, customer discovery, and administrative tasks.',
      currentWorkaround: 'Cobbling together fragmented Notion docs, messy Google Sheets, and ad-hoc ChatGPT prompts.'
    },
    topPainPoints: [
      { pain: 'Lack of structured, cohesive go-to-market plan', severity: 9, frequency: 'Weekly', willingnessToPay: '$99+/mo' },
      { pain: 'Inaccurate unit economics & pricing guesswork', severity: 8, frequency: 'Monthly', willingnessToPay: '$49/mo' },
      { pain: 'High customer churn due to weak onboarding cadence', severity: 8, frequency: 'Ongoing', willingnessToPay: '$149/mo' }
    ],
    buyingTriggers: [
      'Just committed to building full-time or received initial capital.',
      'Frustrated by low conversion rates on their current landing page.',
      'Preparing to pitch angel investors or launch on Product Hunt.'
    ],
    decisionCriteria: [
      'Speed to implement (must show value within 1 session)',
      'Actionability (no fluff, clear executable steps)',
      'Affordable monthly tier with transparent pricing'
    ],
    antiPersona: {
      whoNotToSellTo: 'Passive hobbyists seeking free ideas with zero budget or execution intent.',
      reason: 'They generate 80% of support tickets with 0% retention or conversion to paid tiers.'
    }
  };

  const initialBusinessModel: BusinessModelStageData = {
    valueProposition: usp,
    unfairAdvantage: swotStrengths[0] || 'Proprietary domain workflows and integrated end-to-end execution system.',
    keyActivities: ['Algorithmic roadmap generation', 'Feature updates based on user retention data', 'Customer success & onboarding'],
    keyPartners: ['Cloud infrastructure providers', 'Razorpay & Stripe billing', 'Specialized community partners'],
    costStructure: [
      { category: 'AI Model & Cloud Server Compute', estimatedMonthly: 180 },
      { category: 'Payment Gateway Processing (2.5%)', estimatedMonthly: 120 },
      { category: 'Support & Domain Tooling', estimatedMonthly: 85 }
    ],
    revenueStreams: [
      { stream: 'Pro Monthly Subscriptions', model: 'SaaS Recurring', projectedShare: 70 },
      { stream: 'Annual Founder Passes', model: 'Annual Prepaid', projectedShare: 25 },
      { stream: 'Strategic Add-on Blueprints', model: 'One-time transactional', projectedShare: 5 }
    ],
    unitEconomics: {
      arpuMonthly: 49,
      cacEstimated: 45,
      ltvMonths: 14,
      grossMarginPercent: 82
    }
  };

  const initialPricing: PricingStageData = {
    valueMetric: 'Active Venture Roadmaps & Exported Intelligence',
    strategyType: 'value-based',
    tiers: [
      {
        name: 'Starter',
        priceMonthly: 19,
        priceAnnual: 190,
        targetBuyer: 'Solo founders in ideation',
        coreFeatures: ['1 Active Venture Roadmap', 'Standard Strategy AI generation', 'Core Canvas export'],
        isPopular: false
      },
      {
        name: 'Founder Pro',
        priceMonthly: 49,
        priceAnnual: 470,
        targetBuyer: 'Full-time builders & growing startups',
        coreFeatures: ['Unlimited Roadmaps & Stages', 'Full 10-Stage Execution Engine', 'Financial Models & CSV/PDF Export', 'Priority AI Co-Founder Chat'],
        isPopular: true
      },
      {
        name: 'Team Scale',
        priceMonthly: 149,
        priceAnnual: 1400,
        targetBuyer: 'Accelerators & Multi-venture studios',
        coreFeatures: ['5 Team Collaborator Seats', 'White-label Pitch Decks', 'Dedicated Account Manager', 'Custom API Integrations'],
        isPopular: false
      }
    ],
    discountStrategy: 'Offer 2 months free (approx 20% discount) on all annual commitments.',
    breakEvenMonthlyUnits: 15,
    marginSafetyBuffer: '82% gross margin leaves ample room for paid acquisition experimentation.'
  };

  const initialBrand: BrandStageData = {
    brandName: ventureName,
    tagline: strategy?.brandIdentity?.sloganSuggestions?.[0] || 'From Vision to Market Dominance.',
    positioningStatement: `For ${targetCustomer} who need rapid, reliable execution, ${ventureName} is the intelligent venture operating system that turns abstract ideas into high-margin businesses, unlike disconnected generic tools.`,
    brandVoiceTone: ['Authoritative', 'Direct & Action-Oriented', 'Empathetic to Founder Struggles', 'Clear & Jargon-Free'],
    coreValues: ['Execution Over Theory', 'Radical Transparency', 'Relentless Velocity', 'Founder Autonomy'],
    visualIdentity: {
      primaryColor: '#4f46e5',
      secondaryColor: '#10b981',
      fontPairing: 'Plus Jakarta Sans (Display) + Inter (Body)',
      aestheticVibe: 'Modern High-Contrast Dark Canvas with Crisp Accent Borders'
    },
    elevatorPitch30s: `${ventureName} eliminates the chaos of starting a company. We guide founders step-by-step through validation, unit economics, launch choreography, and customer acquisition in one unified platform.`
  };

  const initialMarketing: MarketingStageData = {
    primaryChannels: [
      { channel: 'Founder-Led Content (LinkedIn / X)', priority: 'Primary', expectedCAC: '$15–$25', tactic: 'Post daily build-in-public breakdowns and teardowns of real startup growth.' },
      { channel: 'Targeted Cold Outreach', priority: 'Primary', expectedCAC: '$20–$35', tactic: 'Send personalized Loom teardowns and customized execution snippets to 20 leads/day.' },
      { channel: 'Community Partnerships', priority: 'Secondary', expectedCAC: '$30–$45', tactic: 'Partner with startup incubators, university entrepreneurship clubs, and founder communities.' }
    ],
    contentPillars: [
      { pillar: 'Build-in-Public Metrics', cadence: '2x / week', exampleTopic: 'How we reached our first $5,000 MRR in 60 days.' },
      { pillar: 'Actionable Frameworks', cadence: '3x / week', exampleTopic: 'The 5-step checklist to price your SaaS product without guessing.' },
      { pillar: 'Case Studies & Teardowns', cadence: '1x / week', exampleTopic: 'Teardown of how [Competitor] scales its customer onboarding.' }
    ],
    acquisitionFunnel: {
      topOfFunnelLeadMagnet: 'Free "Startup Idea Stress-Test & 1-Page Lean Canvas" Generator',
      middleOfFunnelNurture: '5-Day Email Masterclass: "From Idea to First 10 Paying Customers"',
      bottomOfFunnelConversionCTA: 'Interactive 7-Day Founder Pro Trial with instant export access'
    },
    thirtyDayContentSchedule: [
      { week: 1, focus: 'Problem Awareness & Validation', contentHooks: ['Why 90% of SaaS startups fail at pricing before writing a line of code.', '3 customer interview mistakes that give you false hope.'] },
      { week: 2, focus: 'The Solution & Building in Public', contentHooks: ['Here is the exact tech stack we used to ship in 14 days.', 'Behind the scenes: calculating our real cost per user.'] },
      { week: 3, focus: 'Customer Teardowns & Social Proof', contentHooks: ['How [Founder Name] cut customer onboarding drop-off by 45%.', 'The cold email template that generated a 38% reply rate this week.'] },
      { week: 4, focus: 'The Launch & Exclusive Offer', contentHooks: ['We are opening 50 Founding Member spots today.', 'What we learned launching to 1,000 early access subscribers.'] }
    ]
  };

  const initialOperations: OperationsStageData = {
    techStack: [
      { category: 'Hosting & Frontend', toolName: 'Cloud Run / Vercel', purpose: 'Zero-downtime containerized web hosting', monthlyCost: 20 },
      { category: 'Database & Auth', toolName: 'Firebase Firestore & Auth', purpose: 'Serverless reactive database and secure Google login', monthlyCost: 0 },
      { category: 'Payments & Billing', toolName: 'Razorpay / Stripe', purpose: 'Subscription processing and recurring billing', monthlyCost: 0 },
      { category: 'Analytics & Product', toolName: 'PostHog / Mixpanel', purpose: 'Event tracking, funnel drop-off and session telemetry', monthlyCost: 0 },
      { category: 'Customer Support', toolName: 'Crisp / Support Inbox', purpose: 'Direct founder-to-customer chat and ticketing', monthlyCost: 25 }
    ],
    legalReadiness: [
      { item: 'Business Entity Registration / Incorporation', completed: true, notes: 'LLC or Delaware C-Corp for fundability' },
      { item: 'Founder Intellectual Property Assignment (IP Assignment)', completed: true, notes: 'Ensures venture owns all code and branding' },
      { item: 'Terms of Service & Privacy Policy', completed: true, notes: 'Published on app footer with compliance standards' },
      { item: 'Dedicated Business Bank Account', completed: false, notes: 'Separates company capital from personal funds' },
      { item: 'Commercial GST / Tax ID setup', completed: false, notes: 'Required for compliant payment invoicing' }
    ],
    founderWeeklyCadence: [
      { day: 'Monday', coreFocus: 'Weekly Sprint Kickoff, KPI review, and roadmap prioritization.' },
      { day: 'Tuesday–Thursday', coreFocus: 'Deep work on core product features and 20 targeted sales outreach touches/day.' },
      { day: 'Friday', coreFocus: 'Customer check-in calls, feedback synthesis, and weekly production deploy.' },
      { day: 'Weekend', coreFocus: 'Rest, strategic reflection, and long-form founder content writing.' }
    ],
    keySOPs: [
      {
        title: 'New Customer Onboarding & Welcome Sequence',
        trigger: 'User completes signup or upgrades to paid plan.',
        steps: [
          'Send automated personalized founder welcome email within 5 minutes.',
          'Verify that the first stage roadmap is generated without errors.',
          'Trigger Day-3 check-in prompt: "Did you finish your validation brief?"'
        ]
      },
      {
        title: 'Customer Bug / Support Ticket Escalation',
        trigger: 'Incoming message to support inbox.',
        steps: [
          'Acknowledge receipt within 1 hour during business hours.',
          'Replicate issue in staging environment and label severity.',
          'Deploy fix within 24 hours and reply directly to user with resolution.'
        ]
      }
    ]
  };

  const initialLaunch: LaunchStageData = {
    targetLaunchDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    preLaunchWaitlistGoal: 250,
    countdownChecklist: [
      { timing: 'T-14', task: 'Complete core end-to-end user flow testing and setup error logging.', completed: true },
      { timing: 'T-7', task: 'Draft Product Hunt assets, demo video, and email announcement copy.', completed: false },
      { timing: 'T-1', task: 'Warm up 30 key supporters, advisors, and early beta testers.', completed: false },
      { timing: 'Launch Day', task: 'Post Product Hunt at 12:01 AM PT, launch social threads, and reply to every comment.', completed: false },
      { timing: 'T+3', task: 'Send retrospective update to all upvoters and convert waitlist to trial users.', completed: false }
    ],
    distributionKit: {
      productHuntTagline: `${ventureName} — The AI Venture Operating System for Modern Founders`,
      productHuntMakerComment: `Hey Product Hunt! 👋 I built ${ventureName} because turning an idea into a real, profitable business shouldn't take 6 months of trial and error. We automated the hard parts: market validation, unit economics, pricing models, and launch playbooks. Would love your feedback!`,
      twitterAnnouncementThread: `We just launched ${ventureName} on Product Hunt! 🚀\n\nMost startups don't fail from bad ideas—they fail from broken execution.\n\nHere is how we built a system that takes you from idea to paying customers in 10 steps 🧵👇`,
      linkedInPostDraft: `Excited to announce the launch of ${ventureName}!\n\nAfter working with dozens of builders, we saw the same pattern: great ideas trapped in messy spreadsheets and guesswork.\n\n${ventureName} fixes this. Try it out and let me know what you think in the comments!`
    }
  };

  const initialCustomers: CustomersStageData = {
    first10CustomersTarget: 'Direct 1-on-1 founder outreach to 50 active professionals in your personal and digital network.',
    first100CustomersStrategy: 'High-leverage combination of founder-led content, community value contributions, and customer referral incentives.',
    coldOutreachTemplates: [
      {
        channel: 'Cold Email',
        subject: `Quick question about your ${industry} workflow, {{firstName}}`,
        body: `Hi {{firstName}},\n\nI saw your recent post about scaling operations at {{companyName}}.\n\nQuick question: How are you currently managing validation and customer acquisition planning? Most founders we speak with are juggling 5 different spreadsheets.\n\nWe built ${ventureName} to automate this entire 10-step process into one unified blueprint. Would you be open to a 3-minute video showing how it works for {{companyName}}?\n\nBest,\n[Your Name] | Founder, ${ventureName}`
      },
      {
        channel: 'LinkedIn DM',
        body: `Hey {{firstName}} - loved your insights on the recent startup trends in ${industry}! We just shipped a tool called ${ventureName} that helps founders map their unit economics and launch checklists in minutes. Would love to send you a complimentary founder pass to get your honest thoughts if you have 2 mins?`
      },
      {
        channel: 'Community Forum',
        body: `Hey everyone! We spent the last 3 months researching why early-stage ventures in ${industry} struggle to find initial traction. We compiled our findings into a 10-stage actionable execution roadmap. I'd love to share the blueprint with anyone currently validating an idea—drop a comment and I'll send the link!`
      }
    ],
    objectionPlaybook: [
      {
        objection: 'It is too expensive right now.',
        counterArgument: `I completely understand. At $49/mo, if ${ventureName} saves your team just 2 hours of consulting or spreadsheet time this month, it has already paid for itself 3x over. We also have a 14-day risk-free guarantee.`
      },
      {
        objection: 'We already use ChatGPT and spreadsheets.',
        counterArgument: `ChatGPT is great for raw text, but it has no memory of your unit economics, no built-in financial formulas, and cannot generate verified exportable pitch decks and launch checklists.`
      },
      {
        objection: 'Not a priority for us right now.',
        counterArgument: `Totally get it. When do you anticipate revisiting your go-to-market strategy? I can send over a 1-page summary to review whenever the timing makes sense.`
      }
    ]
  };

  const initialGrowth: GrowthStageData = {
    northStarMetric: 'Weekly Active Ventures with ≥1 Completed Execution Milestone',
    pirateMetricsTargets: {
      acquisitionGoal: '500 Qualified New Visitors / Week',
      activationBenchmark: '65% of signups complete Stage 01 (Validation)',
      retentionMonth1Percent: 48,
      referralKFactor: 0.42,
      revenueMRRTarget: 10000
    },
    viralReferralEngine: {
      incentive: 'Give a friend 1 Month of Founder Pro free, get $25 billing credit when they launch.',
      loopMechanism: 'Embed "Built with StratIQ" badge in shared strategies and exported PDF blueprints.'
    },
    retentionCadence: [
      { milestone: 'Day 1 Post-Signup', engagementAction: 'Congratulate on completing Stage 01 and prompt to define customer pain points.' },
      { milestone: 'Day 7 Check-in', engagementAction: 'Send automated review of their pricing tiers and suggest margin optimizations.' },
      { milestone: 'Day 30 Review', engagementAction: 'Celebrate first month milestones and present the 90-day scaling roadmap.' }
    ]
  };

  const newRoadmap: BuildMyBusinessRoadmap = {
    id: `bmb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    ventureName,
    industry,
    stageSummary: `Comprehensive 10-stage execution plan for ${ventureName} in ${industry}.`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    completedStages: ['validation'],
    activeStageId: 'validation',
    stages: {
      validation: { status: 'completed', data: initialValidation },
      customer: { status: 'in_progress', data: initialCustomer },
      business_model: { status: 'not_started', data: initialBusinessModel },
      pricing: { status: 'not_started', data: initialPricing },
      brand: { status: 'not_started', data: initialBrand },
      marketing: { status: 'not_started', data: initialMarketing },
      operations: { status: 'not_started', data: initialOperations },
      launch: { status: 'not_started', data: initialLaunch },
      customers: { status: 'not_started', data: initialCustomers },
      growth: { status: 'not_started', data: initialGrowth }
    }
  };

  // Generate outputs for all stages initially
  BUILD_STAGES.forEach(s => {
    newRoadmap.stages[s.id].generatedOutput = generateStageOutput(s.id, newRoadmap);
  });

  return newRoadmap;
}

/**
 * Save roadmap to localStorage & Firestore
 */
export async function saveRoadmap(
  roadmap: BuildMyBusinessRoadmap,
  userId: string
): Promise<void> {
  const updatedRoadmap: BuildMyBusinessRoadmap = {
    ...roadmap,
    updatedAt: Date.now()
  };

  // 1. Local storage instant cache
  try {
    const storageKey = `${LOCAL_STORAGE_PREFIX}${userId}_${roadmap.id}`;
    localStorage.setItem(storageKey, JSON.stringify(updatedRoadmap));
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${userId}_latest`, roadmap.id);
  } catch (e) {
    console.warn('Failed to save roadmap to localStorage:', e);
  }

  // 2. Firestore persistence
  if (userId && userId !== 'anonymous') {
    try {
      const docRef = doc(db, 'users', userId, 'buildRoadmaps', roadmap.id);
      await setDoc(docRef, {
        ...updatedRoadmap,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.warn('Firestore buildRoadmaps save failed, retained in local storage:', err);
    }
  }
}

/**
 * Load roadmap from Firestore with localStorage fallback
 */
export async function loadRoadmap(
  userId: string,
  roadmapId?: string
): Promise<BuildMyBusinessRoadmap | null> {
  const targetId = roadmapId || localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${userId}_latest`);

  // 1. Try Firestore if user authenticated
  if (userId && userId !== 'anonymous' && targetId) {
    try {
      const docRef = doc(db, 'users', userId, 'buildRoadmaps', targetId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return snapshot.data() as BuildMyBusinessRoadmap;
      }
    } catch (err) {
      console.warn('Firestore loadRoadmap failed, attempting local cache:', err);
    }
  }

  // 2. Fallback to LocalStorage
  if (targetId) {
    try {
      const raw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${userId}_${targetId}`);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to parse cached roadmap:', e);
    }
  }

  return null;
}

/**
 * Export entire 10-Stage Roadmap to Markdown
 */
export function exportEntireRoadmapMarkdown(roadmap: BuildMyBusinessRoadmap): string {
  const header = `# StratIQ — BUILD MY BUSINESS: Master Execution Blueprint
**Venture:** ${roadmap.ventureName}
**Industry:** ${roadmap.industry}
**Completed Stages:** ${roadmap.completedStages.length} of ${BUILD_STAGES.length}
**Generated:** ${new Date().toLocaleDateString()} via StratIQ AI Co-Founder

---
`;

  const stageDocs = BUILD_STAGES.map(s => {
    const stage = roadmap.stages[s.id];
    return stage.generatedOutput || generateStageOutput(s.id, roadmap);
  }).join('\n\n---\n\n');

  return header + stageDocs;
}
