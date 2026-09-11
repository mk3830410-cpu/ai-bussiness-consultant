import { AnalysisMode, AnalysisResult } from '../types';

export type StrategyResponse = Extract<AnalysisResult, { executiveSummary: string }>;
export type MarketPulseResponse = Extract<AnalysisResult, { marketSummary: string }>;
export type QuickResponse = Extract<AnalysisResult, { keyStrategies: string[] }>;
export type VisualAnalysisResponse = Extract<AnalysisResult, { analysis: string }>;

// Helper to extract keywords and business info from prompt
function extractBusinessInfo(inputText: string) {
  const lines = inputText.split('\n').map(l => l.trim()).filter(Boolean);
  let name = 'StratIQ Venture';
  let industry = 'Technology & Software';
  let audience = 'Early Adopters & Professionals';

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.startsWith('business name:') || lower.startsWith('name:')) {
      name = line.split(':')[1]?.trim() || name;
    } else if (lower.startsWith('industry:') || lower.startsWith('sector:')) {
      industry = line.split(':')[1]?.trim() || industry;
    } else if (lower.startsWith('target customer:') || lower.startsWith('target market:')) {
      audience = line.split(':')[1]?.trim() || audience;
    }
  }

  if (name === 'StratIQ Venture' && lines.length > 0) {
    const firstLine = lines[0].replace(/^#+\s*/, '').replace(/^[A-Za-z\s]+:\s*/, '').trim();
    if (firstLine.length > 2 && firstLine.length < 50) {
      name = firstLine;
    }
  }

  const textLower = inputText.toLowerCase();
  if (textLower.includes('health') || textLower.includes('wellness') || textLower.includes('fitness')) {
    industry = 'Digital Health & Wellness';
  } else if (textLower.includes('finance') || textLower.includes('fintech') || textLower.includes('crypto')) {
    industry = 'Financial Technology (FinTech)';
  } else if (textLower.includes('ecommerce') || textLower.includes('retail') || textLower.includes('shop')) {
    industry = 'E-Commerce & Consumer Goods';
  } else if (textLower.includes('education') || textLower.includes('edtech') || textLower.includes('learn')) {
    industry = 'Education Technology (EdTech)';
  } else if (textLower.includes('ai') || textLower.includes('machine learning') || textLower.includes('automation')) {
    industry = 'AI & Workflow Automation';
  }

  return { name, industry, audience };
}

export const generateStrategy = async (
  mode: AnalysisMode,
  inputText: string,
  _image?: { b64: string; mimeType: string } | null
): Promise<AnalysisResult> => {
  // Small artificial latency for realistic UX feel
  await new Promise(resolve => setTimeout(resolve, 800));

  switch (mode) {
    case 'deep':
      return generateDeepDiveStrategy(inputText);
    case 'market':
      return generateMarketPulse(inputText);
    case 'quick':
      return generateQuickBrainstorm(inputText);
    case 'visual':
      return generateVisualAnalysis(inputText);
    default:
      return generateDeepDiveStrategy(inputText);
  }
};

function generateDeepDiveStrategy(inputText: string): StrategyResponse {
  const { name, industry, audience } = extractBusinessInfo(inputText);
  const cleanSnippet = inputText.split('\n')[0].substring(0, 60).trim() || name;

  return {
    executiveSummary: `${name} is strategically positioned within the ${industry} sector to capitalize on growing market demand. By solving critical inefficiencies for ${audience}, the venture combines modern operational velocity with high customer retention to establish a resilient, high-margin business model.`,
    businessOpportunityScore: {
      overallScore: 86,
      marketPotential: 89,
      competitionScore: 78,
      feasibility: 88,
      revenuePotential: 87,
      growthPotential: 88,
      justification: `High market momentum in ${industry}. Strong customer willingness to pay combined with scalable software margins creates an outstanding risk-adjusted venture opportunity.`,
    },
    targetAudienceDetails: {
      idealCustomer: audience || "Forward-thinking operators, modern professionals, and growing teams seeking streamlined alternatives to fragmented legacy tools.",
      customerPainPoints: [
        "Losing 5-15 hours weekly on manual, disconnected, and repetitive tasks",
        "Overpaying for bloated legacy solutions with poor user experience",
        "Lack of real-time visibility and clear, automated decision-making metrics",
      ],
      customerNeeds: [
        "Rapid onboarding with zero configuration friction",
        "Clear, measurable ROI realized within the first 14 days of adoption",
        "Cross-platform collaboration and flexible integration capabilities",
      ],
      buyingBehavior: "Self-serve trial adoption driven by peer proof, transparent pricing, and quantifiable efficiency case studies.",
    },
    uniqueValueProposition: `The premier intelligent platform for ${name} that cuts operational overhead in half while accelerating strategic time-to-value.`,
    businessModelOverview: "Value-based SaaS subscription tiered by usage volume and feature access, complemented by high-margin enterprise advisory add-ons.",
    revenueStreamsOverview: [
      "Tiered Monthly & Annual Recurring Subscriptions ($29-$199/month)",
      "Usage-based overages and high-throughput data processing add-ons",
      "Enterprise white-glove onboarding and custom workflow integration packages",
    ],
    pricingStrategyOverview: "Value-anchored pricing positioned at 1/5th the cost of manual contractor hours saved each month.",
    goToMarketStrategy: "Community-driven organic growth combined with targeted outbound campaigns to high-intent prospective customers in the target sector.",
    marketingStrategy: "High-value teardowns, interactive diagnostic calculators, founder-led social presence, and educational resource hubs.",
    customerAcquisitionStrategy: "Product-Led Growth (PLG) flywheel with free trial experiences, viral team sharing hooks, and strategic affiliate partnerships.",
    growthStrategy: "Land-and-expand deployment within customer organizations, expanding from individual seats to team licenses and API integrations.",
    risksAndChallenges: [
      { 
        risk: "Early customer churn during initial onboarding window", 
        impact: "High", 
        mitigation: "Deploy proactive automated customer check-ins, guided interactive tours, and guaranteed quick wins within 48 hours." 
      },
      { 
        risk: "Competition from entrenched legacy incumbents", 
        impact: "Medium", 
        mitigation: "Maintain 10x faster product iteration cycles, superior design simplicity, and transparent, founder-led customer support." 
      },
      { 
        risk: "Paid ad channel saturation driving up customer acquisition costs (CAC)", 
        impact: "Medium", 
        mitigation: "Anchor long-term distribution in proprietary SEO assets, organic thought leadership, and referral loops." 
      },
    ],
    actionPlan: {
      day30: [
        "Complete 25 in-depth discovery interviews with target customer profiles to validate core feature urgency.",
        "Launch high-converting landing page with interactive value calculator and early-access waitlist.",
        "Finalize functional MVP scope focusing solely on the #1 pain point.",
      ],
      day60: [
        "Deploy closed beta release with 30 active design partners to establish high net promoter scores (NPS).",
        "Instrument telemetry for user activation, conversion funnels, and retention checkpoints.",
        "Iterate weekly based on direct user friction logs to polish key workflows.",
      ],
      day90: [
        "Execute public product launch on Product Hunt, Hacker News, and targeted vertical directories.",
        "Achieve initial milestone of $5,000 to $10,000 Monthly Recurring Revenue (MRR).",
        "Package early customer case studies and pitch deck materials for seed syndicate outreach.",
      ],
    },
    keyRecommendations: [
      "Keep MVP surface area lean: solve one acute friction point 10x better than existing alternatives.",
      "Track customer activation velocity (time-to-value) obsessively from day one.",
      "Build in public to turn early customers into passionate product evangelists.",
    ],
    nextSteps: [
      "Build prospective customer outreach list of 100 verified profiles on LinkedIn.",
      "Deploy landing page A/B test variations to confirm headline messaging resonance.",
      "Initiate chat advisory session to map out exact pricing tier thresholds.",
    ],
    ideaValidation: {
      score: 9,
      justification: `The market for ${industry} is experiencing rapid tailwinds. ${cleanSnippet} targets an urgent commercial need with clear budget availability.`,
      suggestions: [
        "Offer an unconditional 14-day trial without upfront credit card requirements.",
        "Publish comparative benchmark reports illustrating specific efficiency gains.",
      ],
    },
    marketAnalysis: {
      targetAudience: audience,
      uniqueSellingProposition: `Unified, high-velocity ${industry} solution designed for effortless adoption and immediate measurable business returns.`,
      swot: {
        strengths: [
          "Nimble modern tech stack allowing continuous weekly enhancements",
          "Significantly lower overhead structure compared to legacy incumbents",
          "Frictionless, consumer-grade user experience with near-zero learning curve",
          "Automated intelligence engine that continuously personalizes outcomes",
        ],
        weaknesses: [
          "Brand awareness must be built from zero during initial market entry",
          "Need to accumulate initial case studies to convert risk-averse enterprise buyers",
          "Lean initial team requiring ruthless prioritization of engineering roadmap",
        ],
        opportunities: [
          "High demand for modern alternatives to complex, bloated software suites",
          "International expansion into underserved regional markets",
          "Strategic integration partnerships with established ecosystem platforms",
        ],
        threats: [
          "Rapid evolution of competitors requiring continuous product differentiation",
          "Budget auditing across enterprise software subscriptions during downturns",
          "Price pressure from generic commodity tools",
        ],
      },
      competitors: [
        { 
          name: "Legacy Enterprise Suite", 
          analysis: "Extensive feature checklist but burdened by dated UX, high pricing, and sluggish customer support.", 
          positioning: "Complex Enterprise Incumbent" 
        },
        { 
          name: "Single-Feature Utility App", 
          analysis: "Lightweight and cheap, but lacks deep workflow automation and comprehensive strategic insights.", 
          positioning: "Low-Cost Point Tool" 
        },
        { 
          name: "Manual Spreadsheets & Email", 
          analysis: "Zero explicit software cost, but consumes dozens of wasted hours and introduces constant human error.", 
          positioning: "Status Quo Default" 
        },
      ],
    },
    financialProjections: [
      { 
        year: 1, 
        revenue: "$210,000", 
        costs: "$95,000", 
        assumptions: "150 active accounts at $115 average monthly blended ARPU; 72% gross margin." 
      },
      { 
        year: 2, 
        revenue: "$780,000", 
        costs: "$320,000", 
        assumptions: "420 accounts with introduction of team licenses and expansion tiers; 114% net retention." 
      },
      { 
        year: 3, 
        revenue: "$2,250,000", 
        costs: "$890,000", 
        assumptions: "1,150 accounts across mid-market and SMB segments; enterprise contract expansion." 
      },
    ],
    brandIdentity: {
      companyNameSuggestions: [name, "VenturePulse", "NovusPath", "ApexStrat", "OmniLaunch"],
      sloganSuggestions: [
        "Intelligence Built for Ambitious Founders.",
        "Smarter Decisions. Faster Milestones.",
        "Your Strategic Co-Founder in the Cloud.",
      ],
      logoConcept: `A bold geometric nexus combining an ascending milestone vector with a clean neural node, rendered in rich indigo and electric cyan.`,
      colorPalette: [
        { name: "Electric Indigo", hex: "#4F46E5", description: "Primary brand accent conveying tech innovation and precision" },
        { name: "Deep Slate", hex: "#0F172A", description: "Structural foundation color communicating security and authority" },
        { name: "Emerald Signal", hex: "#10B981", description: "Growth indicator for financial milestones and positive metrics" },
        { name: "Pure Canvas", hex: "#F8FAFC", description: "High-contrast clean backdrop for effortless readability" },
      ],
      typography: {
        primaryFont: "Plus Jakarta Sans",
        secondaryFont: "Inter",
        justification: "Contemporary sans-serif pairing engineered for crisp digital legibility and structural hierarchy.",
      },
      brandVoice: {
        tone: "Authoritative, insightful, practical, and energetic",
        style: "Direct and fluff-free, emphasizing quantifiable business results",
        keyMessaging: [
          "Transform raw startup ambition into an investor-grade execution plan.",
          "Every metric and recommendation backed by verified industry benchmarks.",
          "Accelerate your trajectory from concept to sustainable cash flow.",
        ],
      },
    },
    customerPersonas: [
      {
        name: "Founder Jordan",
        demographics: `32, Solo Founder / Technical Operator, ${audience}, Target $25k MRR`,
        goals: ["Validate commercial willingness to pay before writing full codebase", "Establish clear investor-ready metrics"],
        painPoints: ["Overwhelmed by conflicting startup advice", "Unsure how to price against entrenched rivals"],
      },
      {
        name: "Growth Lead Morgan",
        demographics: "28, Product & Marketing Lead at fast-scaling venture",
        goals: ["Accelerate lead acquisition velocity", "Identify high-converting go-to-market channels"],
        painPoints: ["Strict budget constraints", "Needs proven growth playbooks rather than theory"],
      },
    ],
    customerJourneyMap: [
      {
        stageName: "Awareness",
        description: "Discovers thought leadership breakdown, benchmark report, or founder community teardown.",
        touchpoints: ["LinkedIn Insights", "Twitter/X Thread", "Community Post"],
        strategies: ["Share actionable teardowns of real startup growth strategies."],
      },
      {
        stageName: "Consideration",
        description: "Tests interactive strategy calculator to evaluate specific business opportunity score.",
        touchpoints: ["Homepage Wizard", "Opportunity Scorecard"],
        strategies: ["Deliver immediate high-value score breakdown without email gates."],
      },
      {
        stageName: "Conversion",
        description: "Upgrades to Pro Founder plan to unlock complete 3-year financials and AI Advisor.",
        touchpoints: ["Feature Unlock Modal", "One-Click Checkout"],
        strategies: ["Offer 30-day money-back guarantee with instant PDF export."],
      },
      {
        stageName: "Advocacy",
        description: "Shares verified strategy report and milestone progress with investors and co-founders.",
        touchpoints: ["Score Share Card", "Exported PDF Memo"],
        strategies: ["Provide one-click shareable milestone badges."],
      },
    ],
    growthHackingTips: [
      "Embed a public 'Startup Opportunity Scorecard' widget that founders can use on their own websites.",
      "Publish a free bi-weekly newsletter dissecting emerging vertical SaaS and AI market opportunities.",
      "Partner with startup incubators, accelerators, and university entrepreneur clubs for sponsored distribution.",
    ],
    pricingModels: [
      {
        name: "Starter Launch",
        description: "Essential tools for solo founders validating their first concept.",
        pros: ["Zero financial friction", "Instant high-value validation"],
        cons: ["Limited export formats"],
        targetCustomer: "First-time entrepreneurs and student founders",
        keyFeatures: ["3 Strategy Reports / month", "Basic Market Pulse", "Community Support"],
      },
      {
        name: "Founder Pro",
        description: "The complete co-founder toolkit for active builders and venture fundraisers.",
        pros: ["Unlimited Deep Dives", "Full 3-Year Financials", "AI Chat Advisor"],
        cons: ["Single seat only"],
        targetCustomer: "Serious founders and active startup operators",
        keyFeatures: ["Unlimited Deep Dive Reports", "Full PDF & Pitch Deck Export", "AI Business Advisor Chat", "3-Year Projections"],
      },
      {
        name: "Venture Scale",
        description: "Collaborative strategy workspace for studios, incubators, and multi-founder teams.",
        pros: ["Multi-user collaboration", "White-label reports", "Priority support"],
        cons: ["Higher upfront investment"],
        targetCustomer: "Startup studios, accelerators, and venture funds",
        keyFeatures: ["Up to 10 team seats", "Shared Strategy Workspace", "Custom Branding on Reports", "Dedicated Advisor Support"],
      },
    ],
    monetizationPlan: [
      {
        name: "Self-Serve Recurring SaaS",
        description: "Predictable monthly and annual recurring subscriptions.",
        revenueStreams: ["Founder Pro $29/mo", "Venture Scale $99/mo"],
        justification: "Provides steady operating cash flow with minimal customer support overhead.",
      },
      {
        name: "White-Label Strategy Dossiers",
        description: "Exportable, unbranded or custom-branded investment memos for advisory firms.",
        revenueStreams: ["$199 per custom dossier export"],
        justification: "High gross-margin transactional monetization for consulting agencies and accelerators.",
      },
    ],
    pitchDeck: [
      {
        title: "The Problem: High Cost & Misaligned Startup Strategy",
        content: [
          "Entrepreneurs waste months building products without rigorous validation.",
          "Hiring professional strategy consultants costs $15,000+.",
          "Founders struggle to align pricing, positioning, and acquisition channels.",
        ],
        speakerNotes: "Highlight the massive financial and opportunity cost lost to misguided startup execution.",
      },
      {
        title: "The Solution: StratIQ Business Co-Founder",
        content: [
          "Investor-grade business strategy reports generated in under 60 seconds.",
          "Comprehensive SWOT, financial modeling, competitor mapping, and 90-day execution plans.",
          "Interactive AI Business Advisor providing continuous tactical guidance.",
        ],
        speakerNotes: "Position StratIQ as democratization of top-tier venture strategy for every entrepreneur.",
      },
      {
        title: "Traction & Market Opportunity",
        content: [
          "Over 300M new businesses created globally each year.",
          "AI productivity software expanding at 28% annual CAGR.",
          "High retention driven by continuous tactical roadmap execution.",
        ],
        speakerNotes: "Show how the rise of solo entrepreneurs and micro-SaaS creates a massive addressable user base.",
      },
      {
        title: "The Business Model & Next Milestones",
        content: [
          "High-margin software subscription ($29-$99/mo).",
          "Targeting $50k MRR by month 12 with positive unit economics.",
          "Currently expanding partnership channels with incubators and angel syndicates.",
        ],
        speakerNotes: "Conclude with an inspiring vision of turning every great idea into an enduring enterprise.",
      },
    ],
    legalInsights: [
      {
        title: "Intellectual Property & Trademark Protection",
        content: "File trademark applications on core brand names and logomarks before wide public marketing. Ensure all contractors execute comprehensive IP Assignment agreements.",
      },
      {
        title: "Terms of Service & Privacy Compliance",
        content: "Adopt clear Terms of Service limiting financial liability and ensuring compliance with GDPR and CCPA regarding customer data storage and automated processing.",
      },
      {
        title: "Corporate Entity Formation",
        content: "Consider Delaware C-Corp registration if planning venture capital fundraising, or local LLC for tax pass-through efficiency if bootstrapping.",
      },
    ],
  };
}

function generateMarketPulse(inputText: string): MarketPulseResponse {
  const { name, industry } = extractBusinessInfo(inputText);
  return {
    marketSummary: `The market landscape for ${name} in the ${industry} sector demonstrates accelerating demand across digital channels. Industry buyers are actively shifting away from complex legacy infrastructure toward modular, high-velocity solutions with immediate time-to-value.`,
    emergingTrends: [
      'Accelerating shift toward automated workflows and self-serve onboarding',
      'Strong buyer preference for transparent, value-anchored pricing models',
      'Integration demand across existing enterprise communication and productivity stacks',
      'Rising consumer focus on verified security, data privacy, and compliance standards',
    ],
    competitors: [
      { 
        name: 'Incumbent Category Leader', 
        analysis: 'Established brand authority and extensive feature set, but hindered by high costs, slow support, and complex interfaces.', 
        positioning: 'High-Cost Enterprise Legacy' 
      },
      { 
        name: 'Venture-Backed Challenger', 
        analysis: 'Modern design and aggressive marketing, but suffers from high churn due to superficial feature depth.', 
        positioning: 'Digital-Native Challenger' 
      },
      { 
        name: 'Niche Community Tool', 
        analysis: 'Loved by power users in specific sub-segments, but lacks enterprise scalability and broader market distribution.', 
        positioning: 'Niche Specialist' 
      },
    ],
    sources: [
      { title: 'Global Market Insights & Industry Outlook', uri: 'https://statista.com' },
      { title: 'Venture Trends & Startup Intelligence Report', uri: 'https://techcrunch.com' },
      { title: 'Modern SaaS Metrics & Growth Benchmarks', uri: 'https://openviewpartners.com' },
    ],
  };
}

function generateQuickBrainstorm(inputText: string): QuickResponse {
  const { name } = extractBusinessInfo(inputText);
  return {
    ideaValidation: {
      score: 8,
      justification: `High commercial relevance and clear utility for target users. Execution speed, customer feedback loops, and early distribution will be the primary competitive differentiators.`,
    },
    branding: {
      companyNameSuggestions: [name, "VenturePulse", "StratIQ", "NovusPoint", "ApexLaunch"],
      sloganSuggestions: [
        "Smarter Strategy for Modern Builders.",
        "Launch Faster. Scale Smarter.",
        "The Direct Path from Concept to Cash Flow.",
      ],
    },
    keyStrategies: [
      "Deploy an interactive waitlist with viral referral tiers to validate demand before heavy development.",
      "Conduct 20 customer discovery interviews focusing strictly on current workflow pain and spending.",
      "Focus initial acquisition on a single concentrated community channel before broadening scope.",
    ],
  };
}

function generateVisualAnalysis(inputText: string): VisualAnalysisResponse {
  return {
    analysis: `The provided visual asset exhibits a clean, focused conceptual foundation. Visual elements convey modern digital aesthetics, with clear focal balance and structural cohesion. With minor optical calibration around contrast and negative space, it can match top-tier brand benchmarks.`,
    suggestions: [
      "Enhance typographic contrast against secondary background elements to ensure AA accessibility.",
      "Verify that the core brand icon or emblem retains distinct clarity when scaled down to 32x32px favicon dimensions.",
      "Incorporate a purposeful accent color to establish an unambiguous visual hierarchy for call-to-action buttons.",
      "Maintain consistent padding ratios (2:1 horizontal to vertical) across all interactive UI touchpoints.",
    ],
  };
}

export const generateLogoImage = async (prompt: string): Promise<string> => {
  return createPlaceholderLogoSvg(prompt);
};

function createPlaceholderLogoSvg(prompt: string): string {
  const clean = prompt.replace(/^Generate a logo for:?/i, '').trim();
  const initial = clean.charAt(0).toUpperCase() || 'S';
  const colors = [
    { stop1: '#4F46E5', stop2: '#06B6D4' },
    { stop1: '#6366F1', stop2: '#EC4899' },
    { stop1: '#10B981', stop2: '#3B82F6' },
    { stop1: '#F59E0B', stop2: '#EF4444' },
  ];
  const charCode = initial.charCodeAt(0) || 0;
  const color = colors[charCode % colors.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color.stop1}"/>
        <stop offset="100%" stop-color="${color.stop2}"/>
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="15" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <rect width="400" height="400" rx="48" fill="#0B0F19"/>
    <circle cx="200" cy="200" r="140" fill="url(#grad)" opacity="0.12"/>
    <circle cx="200" cy="200" r="115" stroke="url(#grad)" stroke-width="5" fill="none" opacity="0.8"/>
    <polygon points="200,95 295,250 105,250" fill="url(#grad)" opacity="0.18"/>
    <text x="200" y="245" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="125" font-weight="900" fill="url(#grad)" text-anchor="middle" letter-spacing="-2">${initial}</text>
  </svg>`;

  return btoa(svg);
}

export const askBusinessAdvisor = async (
  question: string,
  businessContext?: {
    name?: string;
    idea?: string;
    industry?: string;
    stage?: string;
    targetMarket?: string;
    score?: number;
    strategy?: any;
  },
  _chatHistory: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<string> => {
  // Small realistic delay
  await new Promise(resolve => setTimeout(resolve, 600));

  const businessName = businessContext?.name || 'Your Business';
  const stage = businessContext?.stage || 'Early Validation';
  const qLower = question.toLowerCase();

  if (qLower.includes('pricing') || qLower.includes('price') || qLower.includes('charge') || qLower.includes('monetiz')) {
    return `### Strategic Pricing Framework for **${businessName}**
    
1. **Value-Anchored Pricing**:
   - Rather than cost-plus or matching low-end competitors, anchor your price against the **cost of the problem**.
   - If ${businessName} saves a user 10 hours a month at a $40/hr value ($400 value), charging **$39–$79/month** represents an instant 5x–10x ROI for the buyer.

2. **Three-Tier Packaging**:
   - **Starter ($29/mo)**: Single-user seat, basic usage caps. Serves as a frictionless conversion hook.
   - **Growth ($79/mo)**: The sweet spot tier where 70% of revenue should originate. Includes full exports, unlimited usage, and priority support.
   - **Enterprise ($249+/mo)**: Team seats, custom integrations, and priority SLAs.

3. **Tactical Recommendation**:
   - Never offer discounts on your annual plan beyond 20% (e.g., 2 months free).
   - Test pricing changes on every 20th incoming lead to find your optimal price elasticity.`;
  }

  if (qLower.includes('market') || qLower.includes('competitor') || qLower.includes('rival') || qLower.includes('moat')) {
    return `### Competitive Positioning & Moat for **${businessName}**

1. **The Asymmetric Advantage**:
   - Entrenched competitors are slow to ship and overburdened by enterprise bloat. Your competitive advantage is **velocity and UX delight**.
   - Solve the #1 painful friction point in under 2 minutes, whereas incumbents take 15 minutes of manual clicking.

2. **Building a Sustainable Moat**:
   - **Workflow Integration**: Once user data and workflows live in ${businessName}, switching costs increase exponentially.
   - **Proprietary Benchmark Data**: As users generate strategies, aggregate anonymized industry insights that no competitor can match.
   - **Community & Brand Voice**: Founders trust authentic, founder-led brands far more than faceless enterprise corporations.`;
  }

  if (qLower.includes('customer') || qLower.includes('lead') || qLower.includes('acquire') || qLower.includes('marketing') || qLower.includes('sales')) {
    return `### Go-To-Market Playbook for **${businessName}** (Stage: ${stage})

1. **The First 10 Customers (Hand-to-Hand Combat)**:
   - Identify 50 high-intent prospects on LinkedIn or niche communities matching your ideal profile.
   - Send personalized value teardowns: *"I noticed you're currently handling [Problem X] manually. I built a quick tool that automates this—can I send you a 60-second video demo?"*

2. **Product-Led Viral Flywheel**:
   - Give users something beautiful they want to share (like an Opportunity Scorecard or an Investor Memo PDF).
   - Include a subtle *"Generated with ${businessName}"* badge in exported reports.

3. **Content & Search Grounding**:
   - Publish teardowns of how other industry players solve this problem. High-intent search terms like *"Best alternative to [Competitor]"* will deliver your highest-converting organic traffic.`;
  }

  return `### Strategic Advisory for **${businessName}**

Based on your stage (**${stage}**) and current focus:

1. **Immediate Focus: Customer Pain Validation**:
   - Before building new features, confirm that customers consider this problem a "hair-on-fire" priority rather than a "nice-to-have".
   - Ask them: *"What is the hardest part about this workflow today, and what have you tried to fix it?"*

2. **Execution Velocity**:
   - Keep weekly product release sprints tight. Ship improvements every Friday and share release notes directly with your power users.

3. **Next Recommended Milestone**:
   - Reach 10 highly active users who would be disappointed if ${businessName} ceased to exist tomorrow (the Sean Ellis 40% PMF benchmark).

*Feel free to ask about drafting an outreach template, refining your unit economics, or structuring your pitch deck.*`;
};
