
export type AnalysisMode = 'deep' | 'market' | 'quick' | 'visual';

export type SubscriptionTier = 'free' | 'pro' | 'enterprise' | null;

export interface TeamMember {
  id: string;
  email: string;
  role: 'editor' | 'viewer';
  status: 'pending' | 'active';
}

export interface Comment {
  id: string;
  sectionId: string;
  author: string;
  text: string;
  timestamp: Date;
}

export interface PricingModel {
  name: string;
  description: string;
  pros: string[];
  cons:string[];
  targetCustomer: string;
  keyFeatures: string[];
}

export interface MonetizationStrategy {
    name: string;
    description: string;
    revenueStreams: string[];
    justification: string;
}

// Deep Dive Response
export interface SWOT {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
}
export interface Competitor {
    name: string;
    analysis: string;
    positioning: string;
}
export interface FinancialProjection {
    year: number;
    revenue: string;
    costs: string;
    assumptions: string;
}
export interface PitchDeckSlide {
    title: string;
    content: string[];
    speakerNotes: string;
}
export interface BrandIdentity {
    companyNameSuggestions: string[];
    sloganSuggestions: string[];
    logoConcept: string;
    colorPalette: { name: string; hex: string; description: string; }[];
    typography: { primaryFont: string; secondaryFont: string; justification: string; };
    brandVoice: { tone: string; style: string; keyMessaging: string[]; };
}
export interface CustomerPersona {
    name: string;
    demographics: string;
    goals: string[];
    painPoints: string[];
}
export interface LegalInsight {
    title: string;
    content: string;
}

export interface CustomerJourneyStage {
    stageName: string;
    description: string;
    touchpoints: string[];
    strategies: string[];
}

export interface StrategyResponse {
  ideaValidation: {
    score: number;
    justification: string;
    suggestions: string[];
  };
  marketAnalysis: {
    targetAudience: string;
    uniqueSellingProposition: string;

    swot: SWOT;
    competitors: Competitor[];
  };
  financialProjections: FinancialProjection[];
  brandIdentity: BrandIdentity;
  customerPersonas: CustomerPersona[];
  customerJourneyMap: CustomerJourneyStage[];
  growthHackingTips: string[];
  pricingModels: PricingModel[];
  monetizationPlan: MonetizationStrategy[];
  pitchDeck: PitchDeckSlide[];
  legalInsights: LegalInsight[];
}

// Quick Brainstorm Response
export interface QuickResponse {
    ideaValidation: {
        score: number;
        justification: string;
    };
    branding: {
        companyNameSuggestions: string[];
        sloganSuggestions: string[];
    };
    keyStrategies: string[];
}

// Market Pulse Response
export interface MarketPulseResponse {
    marketSummary: string;
    emergingTrends: string[];
    competitors: Competitor[];
    sources: { title: string; uri: string; }[];
}

// Visual Analysis Response
export interface VisualAnalysisResponse {
    analysis: string;
    suggestions: string[];
}

export type AnalysisResult = StrategyResponse | MarketPulseResponse | QuickResponse | VisualAnalysisResponse;
