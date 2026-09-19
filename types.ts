
export type AnalysisMode = 'deep' | 'market' | 'quick' | 'visual';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  metadata?: {
    creationTime?: string;
    lastSignInTime?: string;
  };
  providerData?: Array<{
    providerId: string;
    uid?: string;
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
  }>;
}

export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'enterprise' | null;

export interface UserSubscription {
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'pending' | 'halted' | 'cancelled' | 'completed' | 'inactive';
  razorpaySubscriptionId?: string;
  razorpayPlanId?: string;
  razorpayPaymentId?: string;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  updatedAt?: any;
}

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

export interface BusinessScoreBreakdown {
  overallScore: number;
  marketPotential: number;
  competitionScore: number;
  feasibility: number;
  revenuePotential: number;
  growthPotential: number;
  justification: string;
}

export interface TargetAudienceDetails {
  idealCustomer: string;
  customerPainPoints: string[];
  customerNeeds: string[];
  buyingBehavior: string;
}

export interface RiskChallenge {
  risk: string;
  impact: 'Low' | 'Medium' | 'High';
  mitigation: string;
}

export interface ActionPlan {
  day30: string[];
  day60: string[];
  day90: string[];
}

export interface StrategyResponse {
  // Enhanced Executive & Strategic Fields
  executiveSummary?: string;
  businessOpportunityScore?: BusinessScoreBreakdown;
  targetAudienceDetails?: TargetAudienceDetails;
  uniqueValueProposition?: string;
  businessModelOverview?: string;
  revenueStreamsOverview?: string[];
  pricingStrategyOverview?: string;
  goToMarketStrategy?: string;
  marketingStrategy?: string;
  customerAcquisitionStrategy?: string;
  growthStrategy?: string;
  risksAndChallenges?: RiskChallenge[];
  actionPlan?: ActionPlan;
  keyRecommendations?: string[];
  nextSteps?: string[];

  // Core Structured Fields
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

export interface ConceptHistoryItem {
  id: string;
  conceptTitle: string;
  subtitle?: string;
  timestamp: number;
  analysisMode: AnalysisMode;
  userInput: string;
  analysisResult: AnalysisResult;
  logoImageUrl: string | null;
  score?: number;
}

export interface WizardData {
  businessName: string;
  businessIdea: string;
  industry: string;
  targetCustomer: string;
  location: string;
  businessModel: string;
  primaryGoal: string;
  targetRevenue: string;
  timeline: string;
  stage: string;
  budget: string;
}

export interface SavedStrategy {
  id: string;
  userId: string;
  businessName: string;
  industry: string;
  stage: string;
  targetMarket?: string;
  createdAt: number;
  updatedAt: number;
  score: number;
  status: 'draft' | 'validated' | 'in_review' | 'launched';
  analysisMode: AnalysisMode;
  inputs: Partial<WizardData> & { userInput?: string };
  result: AnalysisResult;
  logoUrl?: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export type BusinessIdeaStatus = 'new' | 'exploring' | 'validated' | 'archived';

export interface BusinessIdeaItem {
  id: string;
  userId?: string;
  title: string;
  description: string;
  industry: string;
  tags: string[];
  createdAt: number;
  updatedAt?: number;
  status?: BusinessIdeaStatus;
}

// ==========================================
// BUILD MY BUSINESS (10-STAGE EXECUTION ENGINE)
// ==========================================

export type BuildStageId = 
  | 'validation'
  | 'customer'
  | 'business_model'
  | 'pricing'
  | 'brand'
  | 'marketing'
  | 'operations'
  | 'launch'
  | 'customers'
  | 'growth';

export type BuildStageStatus = 'not_started' | 'in_progress' | 'completed';

export interface ValidationStageData {
  problemHypothesis: string;
  solutionHypothesis: string;
  targetMarketSize: string;
  riskiestAssumptions: { assumption: string; riskLevel: 'High' | 'Medium' | 'Low'; validationMethod: string }[];
  experiments: { name: string; type: string; metric: string; target: string; status: 'planned' | 'running' | 'validated' | 'invalidated' }[];
  customerInterviewQuestions: string[];
  validationScore: number;
  killCriteria: string;
}

export interface CustomerStageData {
  idealCustomerProfile: {
    segment: string;
    demographics: string;
    role: string;
    dayInTheLife: string;
    currentWorkaround: string;
  };
  topPainPoints: { pain: string; severity: number; frequency: string; willingnessToPay: string }[];
  buyingTriggers: string[];
  decisionCriteria: string[];
  antiPersona: { whoNotToSellTo: string; reason: string };
}

export interface BusinessModelStageData {
  valueProposition: string;
  unfairAdvantage: string;
  keyActivities: string[];
  keyPartners: string[];
  costStructure: { category: string; estimatedMonthly: number }[];
  revenueStreams: { stream: string; model: string; projectedShare: number }[];
  unitEconomics: {
    arpuMonthly: number;
    cacEstimated: number;
    ltvMonths: number;
    grossMarginPercent: number;
  };
}

export interface PricingStageData {
  valueMetric: string;
  strategyType: 'value-based' | 'competitive' | 'cost-plus' | 'freemium';
  tiers: {
    name: string;
    priceMonthly: number;
    priceAnnual: number;
    targetBuyer: string;
    coreFeatures: string[];
    isPopular?: boolean;
  }[];
  discountStrategy: string;
  breakEvenMonthlyUnits: number;
  marginSafetyBuffer: string;
}

export interface BrandStageData {
  brandName: string;
  tagline: string;
  positioningStatement: string;
  brandVoiceTone: string[];
  coreValues: string[];
  visualIdentity: {
    primaryColor: string;
    secondaryColor: string;
    fontPairing: string;
    aestheticVibe: string;
  };
  elevatorPitch30s: string;
}

export interface MarketingStageData {
  primaryChannels: { channel: string; priority: 'Primary' | 'Secondary' | 'Testing'; expectedCAC: string; tactic: string }[];
  contentPillars: { pillar: string; cadence: string; exampleTopic: string }[];
  acquisitionFunnel: {
    topOfFunnelLeadMagnet: string;
    middleOfFunnelNurture: string;
    bottomOfFunnelConversionCTA: string;
  };
  thirtyDayContentSchedule: { week: number; focus: string; contentHooks: string[] }[];
}

export interface OperationsStageData {
  techStack: { category: string; toolName: string; purpose: string; monthlyCost: number }[];
  legalReadiness: { item: string; completed: boolean; notes: string }[];
  founderWeeklyCadence: { day: string; coreFocus: string }[];
  keySOPs: { title: string; trigger: string; steps: string[] }[];
}

export interface LaunchStageData {
  targetLaunchDate: string;
  preLaunchWaitlistGoal: number;
  countdownChecklist: { timing: 'T-14' | 'T-7' | 'T-1' | 'Launch Day' | 'T+3'; task: string; completed: boolean }[];
  distributionKit: {
    productHuntTagline: string;
    productHuntMakerComment: string;
    twitterAnnouncementThread: string;
    linkedInPostDraft: string;
  };
}

export interface CustomersStageData {
  first10CustomersTarget: string;
  first100CustomersStrategy: string;
  coldOutreachTemplates: {
    channel: 'Cold Email' | 'LinkedIn DM' | 'Community Forum';
    subject?: string;
    body: string;
  }[];
  objectionPlaybook: { objection: string; counterArgument: string }[];
}

export interface GrowthStageData {
  northStarMetric: string;
  pirateMetricsTargets: {
    acquisitionGoal: string;
    activationBenchmark: string;
    retentionMonth1Percent: number;
    referralKFactor: number;
    revenueMRRTarget: number;
  };
  viralReferralEngine: { incentive: string; loopMechanism: string };
  retentionCadence: { milestone: string; engagementAction: string }[];
}

export interface BuildStageDefinition {
  id: BuildStageId;
  stageNumber: string;
  title: string;
  subtitle: string;
  category: 'Strategic' | 'Tactical' | 'Execution';
  outputName: string;
}

export interface BuildMyBusinessRoadmap {
  id: string;
  userId: string;
  ventureName: string;
  industry: string;
  stageSummary: string;
  createdAt: number;
  updatedAt: number;
  completedStages: BuildStageId[];
  activeStageId: BuildStageId;
  stages: {
    validation: { status: BuildStageStatus; data: ValidationStageData; generatedOutput?: string };
    customer: { status: BuildStageStatus; data: CustomerStageData; generatedOutput?: string };
    business_model: { status: BuildStageStatus; data: BusinessModelStageData; generatedOutput?: string };
    pricing: { status: BuildStageStatus; data: PricingStageData; generatedOutput?: string };
    brand: { status: BuildStageStatus; data: BrandStageData; generatedOutput?: string };
    marketing: { status: BuildStageStatus; data: MarketingStageData; generatedOutput?: string };
    operations: { status: BuildStageStatus; data: OperationsStageData; generatedOutput?: string };
    launch: { status: BuildStageStatus; data: LaunchStageData; generatedOutput?: string };
    customers: { status: BuildStageStatus; data: CustomersStageData; generatedOutput?: string };
    growth: { status: BuildStageStatus; data: GrowthStageData; generatedOutput?: string };
  };
}
