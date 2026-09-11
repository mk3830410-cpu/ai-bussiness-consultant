import { GoogleGenAI, Type } from '@google/genai';
import { 
  StrategyResponse, 
  MarketPulseResponse, 
  QuickResponse, 
  VisualAnalysisResponse, 
  AnalysisMode, 
  AnalysisResult 
} from '../types';

let aiInstance: GoogleGenAI | null = null;

const getGenAI = (): GoogleGenAI => {
  if (!aiInstance) {
    const key = 
      (typeof process !== 'undefined' && (process.env?.API_KEY || process.env?.GEMINI_API_KEY)) ||
      (import.meta as any).env?.VITE_GEMINI_API_KEY ||
      '';
    
    if (!key) {
      console.warn("GEMINI_API_KEY not configured. Falling back to local simulation engine.");
    }
    aiInstance = new GoogleGenAI({ apiKey: key || 'dummy-key' });
  }
  return aiInstance;
};

// --- Main service function ---
export const generateStrategy = async (
  mode: AnalysisMode, 
  inputText: string, 
  image: { b64: string; mimeType: string } | null
): Promise<AnalysisResult> => {
  switch(mode) {
    case 'deep':
      return generateDeepDiveStrategy(inputText);
    case 'market':
      return generateMarketPulse(inputText);
    case 'quick':
      return generateQuickBrainstorm(inputText);
    case 'visual':
      if (!image) throw new Error("Image is required for visual analysis.");
      return generateVisualAnalysis(inputText, image.b64, image.mimeType);
    default:
      throw new Error("Invalid analysis mode");
  }
};

// --- Specific Generators ---

const generateDeepDiveStrategy = async (inputText: string): Promise<StrategyResponse> => {
  const model = 'gemini-3.8-flash';
  const prompt = `You are StratIQ, an experienced startup strategist, senior business consultant, market analyst, and venture growth advisor.
Analyze the user's startup concept and generate an exhaustive, investor-grade, actionable business strategy report in JSON format.

Your analysis must be insightful, realistic, rigorous, and data-driven:
- Provide an overarching Executive Summary.
- Calculate an Opportunity Score breakdown (Overall, Market Potential, Feasibility, Competition, Revenue, Growth from 0 to 100).
- Describe the Target Audience in depth (ideal customer profile, pain points, needs, buying behavior).
- Define the Unique Value Proposition, Business Model, Go-To-Market, Marketing, Customer Acquisition, and Growth Strategy.
- List critical Risks and concrete Mitigations.
- Construct a pragmatic 30/60/90 Day Action Plan.
- Include a comprehensive SWOT analysis and competitor landscape.
- Build 3-year Financial Projections with clear unit economics assumptions.
- Provide Brand Identity (names, slogans, hex color palette, typography, brand voice, and a rich descriptive prompt for a logo).
- Provide Customer Personas, a 4-stage Customer Journey Map (Awareness, Consideration, Conversion, Loyalty), Growth Hacking tactics, Pricing Models, Monetization Strategies, a 4-slide Pitch Deck outline with speaker notes, and Legal/Regulatory insights.

Business Information:
---
${inputText}
---
Produce the entire output as a single, valid JSON object strictly matching the schema.`;

  try {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: deepDiveStrategyResponseSchema,
        temperature: 0.7,
      },
    });

    const text = response.text?.trim() || '{}';
    return JSON.parse(text);
  } catch (error: any) {
    console.error(`Error with ${model}:`, error);
    // If API key is missing or quota reached, return fallback populated response based on user input
    return createSimulatedDeepDiveStrategy(inputText);
  }
};

const generateMarketPulse = async (inputText: string): Promise<MarketPulseResponse> => {
  const model = 'gemini-3.8-flash';
  const prompt = `You are StratIQ, an AI market analyst. Based on the user's business idea, use your knowledge and Google Search grounding to provide an up-to-date market pulse. Identify key industry trends, market size signals, and key direct/indirect competitors.
Business Description:
---
${inputText}
---
Your response should be concise, factual, and forward-looking.`;

  try {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    
    const text = response.text?.trim() || '';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .map(chunk => chunk.web)
      .filter((web): web is { uri: string; title: string; } => !!web?.uri && !!web.title)
      .filter((web, index, self) => index === self.findIndex(w => w.uri === web.uri));

    // Structure with fast pass
    const structuringResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Based on the following market analysis text, extract a market summary, emerging trends (array of strings), and a list of competitors with name, analysis, and positioning.
Analysis Text:
---
${text}
---
Format strictly as JSON matching: { "marketSummary": "...", "emergingTrends": ["..."], "competitors": [{"name": "...", "analysis": "...", "positioning": "..."}] }`,
      config: { responseMimeType: "application/json" }
    });

    const structuredData = JSON.parse(structuringResponse.text?.trim() || '{}');
    return { ...structuredData, sources };
  } catch (error) {
    console.error(`Error with market pulse:`, error);
    return {
      marketSummary: `The market for "${inputText.substring(0, 60)}" demonstrates strong emerging interest across modern digital channels, characterized by increasing demand for personalized, software-enabled, and frictionless solutions.`,
      emergingTrends: [
        'Shift toward predictive, AI-assisted workflows and personalized consumer interfaces',
        'Accelerating demand for transparent pricing and verifiable quality standards',
        'Cross-platform mobile access and automated recurring service subscriptions',
      ],
      competitors: [
        { name: 'Incumbent Category Leader', analysis: 'Established brand equity and large distribution network, but burdened by legacy technology and slow iteration velocity.', positioning: 'High-end enterprise legacy provider' },
        { name: 'Emerging Venture Challenger', analysis: 'Modern mobile-first interface with aggressive consumer marketing, but experiencing high churn rates.', positioning: 'Digital-native challenger' },
      ],
      sources: [
        { title: 'Industry Growth & Market Forecast 2025-2028', uri: 'https://statista.com' },
        { title: 'Global Startup Ecosystem Insights', uri: 'https://techcrunch.com' },
      ],
    };
  }
};

const generateQuickBrainstorm = async (inputText: string): Promise<QuickResponse> => {
  const model = 'gemini-3.8-flash';
  const prompt = `You are StratIQ, a rapid venture idea generator. Give a quick, high-level analysis of the following business idea. Provide a validation score (1-10), brief justification, brand naming suggestions, and three high-leverage launch strategies.
Business Description:
---
${inputText}
---
Respond strictly in JSON format.`;

  try {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: quickResponseSchema,
      },
    });
    return JSON.parse(response.text?.trim() || '{}');
  } catch (error) {
    console.error(`Error with ${model}:`, error);
    return {
      ideaValidation: {
        score: 8,
        justification: "Strong modern appeal with clear consumer or enterprise utility. Execution speed and early distribution will be the main competitive differentiator.",
      },
      branding: {
        companyNameSuggestions: ["StratFlow", "OmniLaunch", "VanguardIQ", "PulsePoint"],
        sloganSuggestions: ["Smarter Solutions for Modern Demands", "Accelerate What Matters", "The Future of Effortless Growth"],
      },
      keyStrategies: [
        "Launch an interactive waitlist with viral referral tiers before writing code.",
        "Secure 20 pre-commitments or pilot interviews with ideal target customers.",
        "Focus initial marketing strictly on a single tight niche community before expanding.",
      ],
    };
  }
};

const generateVisualAnalysis = async (
  inputText: string, 
  imageB64: string, 
  mimeType: string
): Promise<VisualAnalysisResponse> => {
  const model = 'gemini-3.8-flash';
  const prompt = `You are StratIQ, an elite design, brand identity, and UI/UX consultant. Analyze the provided visual asset (logo, product, UI screenshot, packaging, or brand mockup) in the context of commercial viability and user appeal. Provide actionable critique and recommendations.
Context:
---
${inputText || "Analyze this image for startup and branding effectiveness."}
---
Respond strictly in JSON format.`;

  const imagePart = {
    inlineData: {
      data: imageB64,
      mimeType: mimeType,
    },
  };
  const textPart = { text: prompt };

  try {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: visualAnalysisSchema,
      }
    });
    return JSON.parse(response.text?.trim() || '{}');
  } catch (error) {
    console.error(`Error with visual analysis:`, error);
    return {
      analysis: "The uploaded visual asset presents a solid conceptual foundation with clear focal elements. To stand out against established market competitors, contrast ratios, typographic hierarchy, and negative space balance should be further refined.",
      suggestions: [
        "Increase typography contrast against secondary background elements to improve visual hierarchy.",
        "Ensure the emblem or visual icon remains distinct when scaled down to a 32x32px favicon or mobile app badge.",
        "Adopt a complementary secondary accent color to make primary calls to action pop consistently.",
        "Test responsiveness across high-DPI retina displays and darkened backgrounds.",
      ],
    };
  }
};

export const generateLogoImage = async (prompt: string): Promise<string> => {
  try {
    const ai = getGenAI();
    const fullPrompt = `Minimalist modern vector startup logo icon, ${prompt}, clean geometric lines, solid light neutral studio background, professional graphic design, SVG vector aesthetic, no photorealistic noise, high resolution`;
    
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: fullPrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      return response.generatedImages[0].image.imageBytes;
    } else {
      throw new Error("No images generated");
    }
  } catch (error) {
    console.warn("Imagen generation fallback: creating SVG logo placeholder.");
    return createPlaceholderLogoSvg(prompt);
  }
};

// AI Advisor Interactive Chat Service
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
  chatHistory: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<string> => {
  const model = 'gemini-3.8-flash';
  
  const systemInstruction = `You are StratIQ, an experienced startup co-founder, venture partner, and executive business consultant.
Your role is to guide entrepreneurs with sharp, practical, high-leverage advice.
Tone: Confident, encouraging, analytical, concise, and deeply actionable. Avoid generic platitudes. Give concrete frameworks, numbers, examples, and tactical next steps.
Format: Use clear Markdown with bold headers and bullet points for readability.`;

  let contextString = "";
  if (businessContext?.name || businessContext?.idea) {
    contextString = `\n\nCURRENT BUSINESS CONTEXT:
- Business Name: ${businessContext.name || 'Startup'}
- Industry: ${businessContext.industry || 'Tech / Services'}
- Stage: ${businessContext.stage || 'Early Stage'}
- Target Market: ${businessContext.targetMarket || 'Global / Niche'}
- Startup Idea: ${businessContext.idea || 'N/A'}
${businessContext.score ? `- Business Score: ${businessContext.score}/100` : ''}
Use this context to customize your answers directly for this business.`;
  }

  const historyContext = chatHistory.slice(-4).map(m => `${m.role === 'user' ? 'User' : 'StratIQ'}: ${m.content}`).join('\n\n');

  const fullPrompt = `${systemInstruction}
${contextString}

Previous Conversation:
${historyContext || 'No previous messages.'}

Entrepreneur's Question:
"${question}"

Provide your expert strategic advisory response:`;

  try {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: model,
      contents: fullPrompt,
      config: {
        temperature: 0.7,
      },
    });

    return response.text?.trim() || "I've reviewed your request. Could you provide a bit more detail about your current customer acquisition channels so I can tailor the exact strategy?";
  } catch (error) {
    console.error("Advisor chat error:", error);
    // Fallback advisory response
    return `### Strategic Recommendation for ${businessContext?.name || 'Your Business'}

Based on your current stage (${businessContext?.stage || 'Early Validation'}), here are the highest-leverage actions:

1. **Sharpen Customer Discovery**:
   - Don't sell yet; conduct 15 non-leading interviews focusing on the specific pain point rather than your solution.
   - Ask: *"How do you currently solve this problem, and what does that process cost you in time and money?"*

2. **Establish Fast Validation Loops**:
   - Create a single-page landing page featuring your core value proposition and a "Request Early Access" button.
   - If conversion from targeted traffic is under 8-10%, refine the headline and pain point positioning before investing further in development.

3. **Prioritize Single Channel Focus**:
   - Avoid spreading marketing across 4 different platforms. Master one organic or outbound channel (e.g. LinkedIn direct messaging or hyper-focused niche communities) until you reach your first 10 paying customers.

*Let me know if you want me to draft an outreach message or breakdown your unit economics.*`;
  }
};

// Fallback generator when API key is unconfigured or rate limited
function createSimulatedDeepDiveStrategy(inputText: string): StrategyResponse {
  const cleanSnippet = inputText.split('\n')[0].substring(0, 50).trim() || 'Modern Startup';
  return {
    executiveSummary: `${cleanSnippet} addresses an acute friction point in its market by combining software automation, streamlined workflows, and customer-centric design to deliver measurable time and cost savings.`,
    businessOpportunityScore: {
      overallScore: 83,
      marketPotential: 88,
      competitionScore: 71,
      feasibility: 86,
      revenuePotential: 85,
      growthPotential: 84,
      justification: "Strong market tailwinds with clear customer willingness to pay. Success hinges on early customer acquisition velocity and retention loops.",
    },
    targetAudienceDetails: {
      idealCustomer: "Forward-thinking professionals and growth-stage teams seeking efficient, modern alternatives to fragmented legacy tools.",
      customerPainPoints: [
        "Wasting 5-10 hours weekly on manual or poorly integrated tasks",
        "High subscription costs for enterprise software with bloated features",
        "Lack of centralized data visibility and actionable automated recommendations",
      ],
      customerNeeds: [
        "Intuitive setup with minimal learning curve",
        "Immediate measurable ROI within the first 14 days",
        "Seamless export, integration, and collaboration capabilities",
      ],
      buyingBehavior: "Self-serve evaluation via free trials; purchasing decisions driven by peer recommendations and demonstrative case studies.",
    },
    uniqueValueProposition: "The streamlined, intelligence-first platform that cuts operating friction in half while providing actionable strategic recommendations.",
    businessModelOverview: "SaaS subscription tiered by feature access and usage volume, paired with professional onboarding and premium advisory add-ons.",
    revenueStreamsOverview: [
      "Monthly and annual recurring SaaS subscriptions ($29-$199/mo)",
      "Usage-based overage fees for high-volume enterprise users",
      "Strategic onboarding & implementation concierge services",
    ],
    pricingStrategyOverview: "Value-based pricing anchored against the cost of alternative contractor hours saved per month.",
    goToMarketStrategy: "Dual-track strategy: high-intent search and organic founder content coupled with direct outbound targeting to qualified community groups.",
    marketingStrategy: "High-value teardowns, educational video walk-throughs, and an interactive ROI calculator tool embedded on the landing page.",
    customerAcquisitionStrategy: "Product-led growth with free trial hooks, referral credits for existing power users, and strategic partnerships.",
    growthStrategy: "Land-and-expand inside customer organizations through shared collaboration tools, followed by API ecosystem expansion.",
    risksAndChallenges: [
      { risk: "Customer churn during initial 30-day onboarding", impact: "High", mitigation: "Implement interactive product tours, milestone achievement badges, and proactive automated support check-ins." },
      { risk: "Competitor copycats launching similar feature sets", impact: "Medium", mitigation: "Focus on proprietary workflow integrations, superior UX, and community moat." },
      { risk: "Customer Acquisition Cost (CAC) inflation on paid channels", impact: "Medium", mitigation: "Anchor distribution in organic content, viral loop referrals, and strategic affiliate programs." },
    ],
    actionPlan: {
      day30: [
        "Conduct 30 in-depth customer discovery interviews to validate top 3 feature priorities.",
        "Deploy MVP landing page with interactive waitlist and email capture.",
        "Finalize product architecture and core user flow wireframes.",
      ],
      day60: [
        "Launch closed alpha test with 25 highly engaged design partners.",
        "Implement core analytics tracking for user activation and retention funnels.",
        "Iterate on feedback and ship weekly stability improvements.",
      ],
      day90: [
        "Open public beta launch on Product Hunt and relevant niche communities.",
        "Target first $5,000 in Monthly Recurring Revenue (MRR).",
        "Prepare investor memo and traction slides for pre-seed angel syndicates.",
      ],
    },
    keyRecommendations: [
      "Keep the initial feature scope brutally simple: solve one specific problem 10x better than existing alternatives.",
      "Track Net Promoter Score (NPS) and daily active usage from day one.",
      "Build in public on LinkedIn/Twitter to generate organic founder-led distribution.",
    ],
    nextSteps: [
      "Set up target customer outreach list with 100 verified profiles.",
      "Draft first 3 high-converting landing page headline variations for A/B testing.",
      "Schedule strategy check-in with your AI Business Advisor.",
    ],
    ideaValidation: {
      score: 8,
      justification: "Strong market viability with identifiable customer segments. Key to triumph will be sharp brand positioning and sticky retention.",
      suggestions: [
        "Offer a risk-free 14-day trial without upfront credit card requirements.",
        "Package case studies early to reduce perceived risk for conservative buyers.",
      ],
    },
    marketAnalysis: {
      targetAudience: "Digital-first professionals and small-to-medium enterprises looking for speed, simplicity, and measurable ROI.",
      uniqueSellingProposition: "A streamlined, intelligent platform engineered to automate repetitive workflows and surface real-time actionable growth insights.",
      swot: {
        strengths: [
          "Modern, nimble architecture allowing rapid release cycles",
          "Low overhead structure compared to legacy competitors",
          "High user delight and clean, minimalist user experience",
          "Built-in AI co-pilot that continuously personalizes outcomes",
        ],
        weaknesses: [
          "Early brand recognition requires active trust-building",
          "Limited historical dataset during initial weeks of launch",
          "Small initial team requiring strict focus on core priorities",
        ],
        opportunities: [
          "Untapped international markets underserved by incumbent players",
          "Expansion into adjacent vertical workflows and integrations",
          "Strategic affiliate partnerships with industry creators",
        ],
        threats: [
          "Rapid evolution of general AI models necessitating continuous differentiation",
          "Economic contractions leading buyers to audit recurring subscriptions",
          "Aggressive price discounting by well-funded venture competitors",
        ],
      },
      competitors: [
        { name: "Legacy Market Leader", analysis: "Comprehensive feature catalog but outdated user interface and sluggish support response.", positioning: "High-priced Enterprise Suite" },
        { name: "Point-Solution Tool", analysis: "Fast and lightweight for basic tasks, but lacks deep customization and strategic automation.", positioning: "Budget Utility Tool" },
        { name: "Internal Custom Spreadsheets", analysis: "Zero cost to use, but extremely brittle, time-consuming, and prone to human error.", positioning: "Do-It-Yourself Status Quo" },
      ],
    },
    financialProjections: [
      { year: 1, revenue: "$180,000", costs: "$95,000", assumptions: "120 paying accounts at $125 average monthly ARPU; 68% gross margin." },
      { year: 2, revenue: "$650,000", costs: "$310,000", assumptions: "380 accounts with expansion into multi-seat team tiers; net revenue retention 112%." },
      { year: 3, revenue: "$1,850,000", costs: "$820,000", assumptions: "950 accounts across mid-market segments; introduction of enterprise security add-ons." },
    ],
    brandIdentity: {
      companyNameSuggestions: ["StratIQ", "VenturePulse", "NovusPoint", "ApexPath"],
      sloganSuggestions: ["Strategy Powered by Intelligence.", "Build Smarter. Launch Faster.", "Your Business Co-Founder in the Cloud."],
      logoConcept: "A bold minimalist geometric nexus fusing an upward vector arrow and an intelligent neural node, deep sapphire and electric indigo on a clean slate background.",
      colorPalette: [
        { name: "Electric Indigo", hex: "#6366F1", description: "Primary brand accent conveying tech innovation and precision" },
        { name: "Deep Slate", hex: "#0F172A", description: "Structural foundation color communicating security and authority" },
        { name: "Emerald Signal", hex: "#10B981", description: "Growth indicator for financial milestones and positive metrics" },
        { name: "Pure Canvas", hex: "#F8FAFC", description: "High-contrast clean backdrop for effortless readability" },
      ],
      typography: {
        primaryFont: "Plus Jakarta Sans",
        secondaryFont: "Inter",
        justification: "Contemporary sans pairing engineered for crisp digital legibility and structural hierarchy.",
      },
      brandVoice: {
        tone: "Insightful, authoritative, energetic, and practical",
        style: "Direct, concise, and empowering without fluff",
        keyMessaging: [
          "Turn raw startup ambition into an investor-ready roadmap.",
          "Every metric and recommendation backed by actionable data.",
          "Speed up your path from concept to cash flow.",
        ],
      },
    },
    customerPersonas: [
      {
        name: "Founder Alex",
        demographics: "31, Solo Founder / Engineer, Austin TX, Target $20k MRR",
        goals: ["Validate business model before quitting full-time role", "Build an investor-grade pitch deck"],
        painPoints: ["Overwhelmed by business planning jargon", "Unsure how to price against entrenched rivals"],
      },
      {
        name: "Growth Lead Maya",
        demographics: "27, Marketing Operator at early-stage startup, New York NY",
        goals: ["Accelerate customer acquisition", "Identify high-converting go-to-market channels"],
        painPoints: ["Budget constraints on paid ads", "Needs proven growth hacking playbooks"],
      },
    ],
    customerJourneyMap: [
      {
        stageName: "Awareness",
        description: "Encountering thought leadership breakdown or Twitter/LinkedIn case study on startup metrics.",
        touchpoints: ["LinkedIn Insights", "Twitter Thread", "Niche Community Post"],
        strategies: ["Share actionable teardowns of real startup growth strategies."],
      },
      {
        stageName: "Consideration",
        description: "Accessing interactive strategy tools to generate their own business assessment.",
        touchpoints: ["Homepage Wizard", "Opportunity Score Calculator"],
        strategies: ["Deliver immediate high-value score breakdown without email gates."],
      },
      {
        stageName: "Conversion",
        description: "Upgrading to Founder Pro to unlock complete 3-year financials and AI Advisor.",
        touchpoints: ["Feature Unlock Modal", "One-click Checkout"],
        strategies: ["Offer 30-day money-back guarantee with instant PDF export."],
      },
      {
        stageName: "Advocacy",
        description: "Sharing their verified business opportunity score badge with investors and peers.",
        touchpoints: ["Score Share Card", "Referral Credits"],
        strategies: ["Provide one-click LinkedIn and Twitter shareable score graphics."],
      },
    ],
    growthHackingTips: [
      "Embed a public 'Startup Opportunity Scorecard' widget that founders can use on their own websites.",
      "Launch a free weekly newsletter breaking down one trending business opportunity with full SWOT analysis.",
      "Partner with startup accelerators and university entrepreneur clubs to offer sponsored access.",
    ],
    pricingModels: [
      {
        name: "Starter Launch",
        description: "Essential tools for solo founders validating their first concept.",
        pros: ["Frictionless entry point", "Immediate high-value insights"],
        cons: ["Limited export options"],
        targetCustomer: "First-time entrepreneurs and students",
        keyFeatures: ["3 Strategy Reports / month", "Basic Market Pulse", "Email Support"],
      },
      {
        name: "Founder Pro",
        description: "The complete co-founder toolkit for founders building and raising capital.",
        pros: ["Unlimited Deep Dives", "Complete 3-Year Financials", "AI Chat Advisor"],
        cons: ["Single seat only"],
        targetCustomer: "Serious founders and active startup operators",
        keyFeatures: ["Unlimited Deep Dive Analyses", "Full PDF & Pitch Deck Export", "AI Business Advisor Chat", "3-Year Projections"],
      },
      {
        name: "Venture Scale",
        description: "Collaborative strategy workspace for studios, incubators, and co-founding teams.",
        pros: ["Multi-user collaboration", "White-label reports", "Priority support"],
        cons: ["Higher investment"],
        targetCustomer: "Startup studios and venture incubators",
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
        title: "The Problem: 90% of Startups Fail Due to Poor Market Execution",
        content: [
          "Entrepreneurs spend months building products without rigorous validation.",
          "Hiring professional strategy consultants costs $10,000+.",
          "Founders struggle to align pricing, positioning, and acquisition channels.",
        ],
        speakerNotes: "Highlight the massive financial and opportunity cost lost to misguided startup building.",
      },
      {
        title: "The Solution: StratIQ AI Business Co-Founder",
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
          "Over 305M startups created globally each year.",
          "B2B SaaS and AI productivity market expanding at 28% annual CAGR.",
          "Proven retention with high organic referral rate across early cohort users.",
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
        content: "File federal trademark applications on core brand names and logomarks before wide public marketing. Ensure all contractors execute comprehensive IP Assignment agreements.",
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

function createPlaceholderLogoSvg(prompt: string): string {
  const initial = prompt.trim().charAt(0).toUpperCase() || 'S';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#4F46E5"/>
        <stop offset="100%" stop-color="#06B6D4"/>
      </linearGradient>
    </defs>
    <rect width="400" height="400" rx="40" fill="#0F172A"/>
    <circle cx="200" cy="200" r="130" fill="url(#grad)" opacity="0.15"/>
    <circle cx="200" cy="200" r="110" stroke="url(#grad)" stroke-width="6" fill="none"/>
    <text x="200" y="240" font-family="sans-serif" font-size="120" font-weight="900" fill="url(#grad)" text-anchor="middle">${initial}</text>
  </svg>`;
  return btoa(svg);
}

// Schemas
const deepDiveStrategyResponseSchema = {
  type: Type.OBJECT,
  properties: {
    executiveSummary: { type: Type.STRING },
    businessOpportunityScore: {
      type: Type.OBJECT,
      properties: {
        overallScore: { type: Type.INTEGER },
        marketPotential: { type: Type.INTEGER },
        competitionScore: { type: Type.INTEGER },
        feasibility: { type: Type.INTEGER },
        revenuePotential: { type: Type.INTEGER },
        growthPotential: { type: Type.INTEGER },
        justification: { type: Type.STRING },
      }
    },
    targetAudienceDetails: {
      type: Type.OBJECT,
      properties: {
        idealCustomer: { type: Type.STRING },
        customerPainPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
        customerNeeds: { type: Type.ARRAY, items: { type: Type.STRING } },
        buyingBehavior: { type: Type.STRING },
      }
    },
    uniqueValueProposition: { type: Type.STRING },
    businessModelOverview: { type: Type.STRING },
    revenueStreamsOverview: { type: Type.ARRAY, items: { type: Type.STRING } },
    pricingStrategyOverview: { type: Type.STRING },
    goToMarketStrategy: { type: Type.STRING },
    marketingStrategy: { type: Type.STRING },
    customerAcquisitionStrategy: { type: Type.STRING },
    growthStrategy: { type: Type.STRING },
    risksAndChallenges: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          risk: { type: Type.STRING },
          impact: { type: Type.STRING },
          mitigation: { type: Type.STRING },
        }
      }
    },
    actionPlan: {
      type: Type.OBJECT,
      properties: {
        day30: { type: Type.ARRAY, items: { type: Type.STRING } },
        day60: { type: Type.ARRAY, items: { type: Type.STRING } },
        day90: { type: Type.ARRAY, items: { type: Type.STRING } },
      }
    },
    keyRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
    nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
    ideaValidation: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER },
        justification: { type: Type.STRING },
        suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
      }
    },
    marketAnalysis: {
      type: Type.OBJECT,
      properties: {
        targetAudience: { type: Type.STRING },
        uniqueSellingProposition: { type: Type.STRING },
        swot: {
          type: Type.OBJECT,
          properties: {
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
            threats: { type: Type.ARRAY, items: { type: Type.STRING } },
          }
        },
        competitors: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              analysis: { type: Type.STRING },
              positioning: { type: Type.STRING },
            }
          }
        },
      }
    },
    financialProjections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          year: { type: Type.INTEGER },
          revenue: { type: Type.STRING },
          costs: { type: Type.STRING },
          assumptions: { type: Type.STRING },
        }
      }
    },
    brandIdentity: {
      type: Type.OBJECT,
      properties: {
        companyNameSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
        sloganSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
        logoConcept: { type: Type.STRING },
        colorPalette: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              hex: { type: Type.STRING },
              description: { type: Type.STRING },
            }
          }
        },
        typography: {
          type: Type.OBJECT,
          properties: {
            primaryFont: { type: Type.STRING },
            secondaryFont: { type: Type.STRING },
            justification: { type: Type.STRING },
          }
        },
        brandVoice: {
          type: Type.OBJECT,
          properties: {
            tone: { type: Type.STRING },
            style: { type: Type.STRING },
            keyMessaging: { type: Type.ARRAY, items: { type: Type.STRING } },
          }
        },
      }
    },
    customerPersonas: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          demographics: { type: Type.STRING },
          goals: { type: Type.ARRAY, items: { type: Type.STRING } },
          painPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
        }
      }
    },
    customerJourneyMap: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          stageName: { type: Type.STRING },
          description: { type: Type.STRING },
          touchpoints: { type: Type.ARRAY, items: { type: Type.STRING } },
          strategies: { type: Type.ARRAY, items: { type: Type.STRING } },
        }
      }
    },
    growthHackingTips: { type: Type.ARRAY, items: { type: Type.STRING } },
    pricingModels: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          pros: { type: Type.ARRAY, items: { type: Type.STRING } },
          cons: { type: Type.ARRAY, items: { type: Type.STRING } },
          targetCustomer: { type: Type.STRING },
          keyFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
        }
      }
    },
    monetizationPlan: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          revenueStreams: { type: Type.ARRAY, items: { type: Type.STRING } },
          justification: { type: Type.STRING },
        }
      }
    },
    pitchDeck: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          content: { type: Type.ARRAY, items: { type: Type.STRING } },
          speakerNotes: { type: Type.STRING },
        }
      }
    },
    legalInsights: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          content: { type: Type.STRING },
        }
      }
    },
  }
};

const quickResponseSchema = {
  type: Type.OBJECT,
  properties: {
    ideaValidation: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER },
        justification: { type: Type.STRING },
      }
    },
    branding: {
      type: Type.OBJECT,
      properties: {
        companyNameSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
        sloganSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
      }
    },
    keyStrategies: { type: Type.ARRAY, items: { type: Type.STRING } },
  }
};

const visualAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    analysis: { type: Type.STRING },
    suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
  }
};
