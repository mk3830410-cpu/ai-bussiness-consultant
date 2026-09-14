import {
  AnalysisResult,
  AnalysisMode,
  StrategyResponse,
  MarketPulseResponse,
  QuickResponse,
  VisualAnalysisResponse,
  SWOT,
  FinancialProjection,
  Competitor,
  PricingModel,
  CustomerPersona,
  PitchDeckSlide,
  RiskChallenge,
} from '../types';

export interface MarkdownExportOptions {
  conceptTitle?: string;
  date?: string;
  logoImageUrl?: string | null;
}

/**
 * Sanitizes text to avoid breaking markdown formatting.
 */
function clean(val: any): string {
  if (val === undefined || val === null) return '';
  return String(val).trim();
}

/**
 * Converts SWOT into a clean markdown table and bullet points.
 */
function formatSWOTMarkdown(swot?: SWOT): string {
  if (!swot) return '_No SWOT analysis data recorded._\n';

  const strengths = swot.strengths || [];
  const weaknesses = swot.weaknesses || [];
  const opportunities = swot.opportunities || [];
  const threats = swot.threats || [];

  return `### SWOT Analysis

| Quadrant | Key Strategic Factors |
| :--- | :--- |
| **Strengths (Internal)** | ${strengths.map((s) => `• ${s}`).join('<br>') || 'None listed'} |
| **Weaknesses (Internal)** | ${weaknesses.map((w) => `• ${w}`).join('<br>') || 'None listed'} |
| **Opportunities (External)** | ${opportunities.map((o) => `• ${o}`).join('<br>') || 'None listed'} |
| **Threats (External)** | ${threats.map((t) => `• ${t}`).join('<br>') || 'None listed'} |

#### Detailed SWOT Breakdown

**Strengths**
${strengths.map((s) => `- ${s}`).join('\n') || '- None listed'}

**Weaknesses**
${weaknesses.map((w) => `- ${w}`).join('\n') || '- None listed'}

**Opportunities**
${opportunities.map((o) => `- ${o}`).join('\n') || '- None listed'}

**Threats**
${threats.map((t) => `- ${t}`).join('\n') || '- None listed'}
`;
}

/**
 * Converts Financial Projections into a GitHub/Notion compatible Markdown table.
 */
function formatFinancialsMarkdown(projections?: FinancialProjection[]): string {
  if (!projections || projections.length === 0) {
    return '_No financial projections recorded._\n';
  }

  let table = `### Financial Projections (1-3 Years)\n\n`;
  table += `| Timeline | Projected Revenue | Projected Costs | Underlying Assumptions |\n`;
  table += `| :--- | :--- | :--- | :--- |\n`;

  projections.forEach((p) => {
    const yearLabel = `Year ${p.year}`;
    const rev = clean(p.revenue).replace(/\|/g, '\\|');
    const costs = clean(p.costs).replace(/\|/g, '\\|');
    const assumptions = clean(p.assumptions).replace(/\|/g, '\\|');
    table += `| **${yearLabel}** | ${rev} | ${costs} | ${assumptions} |\n`;
  });

  return table + '\n';
}

/**
 * Converts Competitors list into a markdown table.
 */
function formatCompetitorsMarkdown(competitors?: Competitor[]): string {
  if (!competitors || competitors.length === 0) {
    return '_No competitor data recorded._\n';
  }

  let md = `### Competitor Landscape\n\n`;
  md += `| Competitor | Strategic Analysis | Market Positioning |\n`;
  md += `| :--- | :--- | :--- |\n`;

  competitors.forEach((c) => {
    const name = clean(c.name).replace(/\|/g, '\\|');
    const analysis = clean(c.analysis).replace(/\|/g, '\\|');
    const pos = clean(c.positioning || 'Direct Competitor').replace(/\|/g, '\\|');
    md += `| **${name}** | ${analysis} | ${pos} |\n`;
  });

  return md + '\n';
}

/**
 * Converts 90-Day Action Plan into actionable Task Lists ([ ] check boxes).
 */
function formatActionPlanMarkdown(actionPlan?: { day30?: string[]; day60?: string[]; day90?: string[] }): string {
  if (!actionPlan) return '';

  let md = `### 90-Day Execution Roadmap\n\n`;

  if (actionPlan.day30 && actionPlan.day30.length > 0) {
    md += `#### Phase 1: Foundation & Validation (Days 1–30)\n`;
    actionPlan.day30.forEach((task) => {
      md += `- [ ] ${task}\n`;
    });
    md += '\n';
  }

  if (actionPlan.day60 && actionPlan.day60.length > 0) {
    md += `#### Phase 2: Build & Traction (Days 31–60)\n`;
    actionPlan.day60.forEach((task) => {
      md += `- [ ] ${task}\n`;
    });
    md += '\n';
  }

  if (actionPlan.day90 && actionPlan.day90.length > 0) {
    md += `#### Phase 3: Launch & Scale (Days 61–90)\n`;
    actionPlan.day90.forEach((task) => {
      md += `- [ ] ${task}\n`;
    });
    md += '\n';
  }

  return md;
}

/**
 * Converts Risks & Mitigations into a table.
 */
function formatRisksMarkdown(risks?: RiskChallenge[]): string {
  if (!risks || risks.length === 0) return '';

  let md = `### Risk Assessment & Mitigation\n\n`;
  md += `| Risk / Vulnerability | Impact Level | Mitigation Strategy |\n`;
  md += `| :--- | :--- | :--- |\n`;

  risks.forEach((r) => {
    md += `| ${clean(r.risk)} | **${clean(r.impact)}** | ${clean(r.mitigation)} |\n`;
  });

  return md + '\n';
}

/**
 * Generates structured, production-grade Markdown for any StratIQ analysis result.
 */
export function generateStrategyMarkdown(
  result: AnalysisResult,
  mode: AnalysisMode = 'deep',
  options?: MarkdownExportOptions
): string {
  const dateStr = options?.date || new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const deep = result as Partial<StrategyResponse>;
  const companyName =
    options?.conceptTitle ||
    deep?.brandIdentity?.companyNameSuggestions?.[0] ||
    'StratIQ Business Strategy';

  let md = `# ${companyName}\n\n`;
  md += `> **StratIQ AI Co-Founder Strategy Blueprint**  \n`;
  md += `> *Exported on ${dateStr}*  \n`;
  md += `> *Analysis Mode: ${mode.toUpperCase()}*\n\n`;
  md += `---\n\n`;

  // DEEP DIVE MODE
  if (mode === 'deep') {
    const strat = result as StrategyResponse;

    // Executive Summary
    if (strat.executiveSummary || strat.ideaValidation?.justification) {
      md += `## Executive Summary\n\n`;
      md += `${strat.executiveSummary || strat.ideaValidation.justification}\n\n`;
    }

    // Opportunity Score & Idea Validation
    if (strat.ideaValidation) {
      md += `## Idea Validation & Opportunity Score\n\n`;
      md += `- **Validation Score:** ${strat.ideaValidation.score} / 10\n`;
      if (strat.businessOpportunityScore) {
        const b = strat.businessOpportunityScore;
        md += `- **Overall Opportunity Score:** ${b.overallScore} / 100\n`;
        md += `- **Market Potential:** ${b.marketPotential} / 100\n`;
        md += `- **Competition Score:** ${b.competitionScore} / 100\n`;
        md += `- **Feasibility:** ${b.feasibility} / 100\n`;
        md += `- **Revenue Potential:** ${b.revenuePotential} / 100\n`;
        md += `- **Growth Potential:** ${b.growthPotential} / 100\n`;
      }
      md += `\n**Strategic Justification:**\n${strat.ideaValidation.justification}\n\n`;

      if (strat.ideaValidation.suggestions && strat.ideaValidation.suggestions.length > 0) {
        md += `### High-Priority Improvement Suggestions\n`;
        strat.ideaValidation.suggestions.forEach((s, idx) => {
          md += `${idx + 1}. ${s}\n`;
        });
        md += '\n';
      }
    }

    // Market Analysis & USP
    if (strat.marketAnalysis) {
      md += `## Market Analysis\n\n`;
      md += `### Target Audience\n${strat.marketAnalysis.targetAudience}\n\n`;
      md += `### Unique Selling Proposition (USP)\n${strat.marketAnalysis.uniqueSellingProposition}\n\n`;

      if (strat.uniqueValueProposition) {
        md += `### Unique Value Proposition (UVP)\n${strat.uniqueValueProposition}\n\n`;
      }

      // SWOT
      md += formatSWOTMarkdown(strat.marketAnalysis.swot);

      // Competitors
      md += formatCompetitorsMarkdown(strat.marketAnalysis.competitors);
    }

    // Financial Projections
    if (strat.financialProjections && strat.financialProjections.length > 0) {
      md += `## Financial Plan\n\n`;
      md += formatFinancialsMarkdown(strat.financialProjections);
    }

    // Monetization & Pricing
    if (strat.monetizationPlan || strat.pricingModels) {
      md += `## Monetization & Pricing Models\n\n`;

      if (strat.monetizationPlan && strat.monetizationPlan.length > 0) {
        md += `### Revenue Models\n\n`;
        strat.monetizationPlan.forEach((m) => {
          md += `#### ${m.name}\n`;
          md += `${m.description}\n\n`;
          if (m.revenueStreams && m.revenueStreams.length > 0) {
            md += `**Revenue Streams:**\n`;
            m.revenueStreams.forEach((stream) => {
              md += `- ${stream}\n`;
            });
            md += '\n';
          }
          if (m.justification) {
            md += `*Justification:* ${m.justification}\n\n`;
          }
        });
      }

      if (strat.pricingModels && strat.pricingModels.length > 0) {
        md += `### Pricing Tiers\n\n`;
        md += `| Tier / Model | Target Customer | Pros | Cons |\n`;
        md += `| :--- | :--- | :--- | :--- |\n`;
        strat.pricingModels.forEach((p) => {
          const pros = (p.pros || []).map((item) => `+ ${item}`).join('<br>');
          const cons = (p.cons || []).map((item) => `- ${item}`).join('<br>');
          md += `| **${clean(p.name)}** | ${clean(p.targetCustomer)} | ${pros} | ${cons} |\n`;
        });
        md += '\n';
      }
    }

    // Customer Personas & Journey
    if (strat.customerPersonas && strat.customerPersonas.length > 0) {
      md += `## Customer Personas\n\n`;
      strat.customerPersonas.forEach((cp) => {
        md += `### ${cp.name}\n`;
        md += `- **Demographics:** ${cp.demographics}\n`;
        if (cp.goals && cp.goals.length > 0) {
          md += `- **Goals:**\n`;
          cp.goals.forEach((g) => (md += `  - ${g}\n`));
        }
        if (cp.painPoints && cp.painPoints.length > 0) {
          md += `- **Pain Points:**\n`;
          cp.painPoints.forEach((pp) => (md += `  - ${pp}\n`));
        }
        md += '\n';
      });
    }

    if (strat.customerJourneyMap && strat.customerJourneyMap.length > 0) {
      md += `### Customer Journey Map\n\n`;
      md += `| Stage | Description | Key Touchpoints | Strategic Focus |\n`;
      md += `| :--- | :--- | :--- | :--- |\n`;
      strat.customerJourneyMap.forEach((cjm) => {
        const tp = (cjm.touchpoints || []).join('<br>');
        const st = (cjm.strategies || []).join('<br>');
        md += `| **${clean(cjm.stageName)}** | ${clean(cjm.description)} | ${tp} | ${st} |\n`;
      });
      md += '\n';
    }

    // Go-To-Market & Growth Hacking
    if (strat.growthHackingTips && strat.growthHackingTips.length > 0) {
      md += `## Growth Hacking & Go-To-Market\n\n`;
      strat.growthHackingTips.forEach((tip, i) => {
        md += `${i + 1}. ${tip}\n`;
      });
      md += '\n';
    }

    // 90-Day Action Plan
    if (strat.actionPlan) {
      md += formatActionPlanMarkdown(strat.actionPlan);
    }

    // Risks & Mitigations
    if (strat.risksAndChallenges && strat.risksAndChallenges.length > 0) {
      md += formatRisksMarkdown(strat.risksAndChallenges);
    }

    // Brand Identity
    if (strat.brandIdentity) {
      const b = strat.brandIdentity;
      md += `## Brand Identity\n\n`;

      if (b.companyNameSuggestions && b.companyNameSuggestions.length > 0) {
        md += `**Name Ideas:** ${b.companyNameSuggestions.join(', ')}  \n`;
      }
      if (b.sloganSuggestions && b.sloganSuggestions.length > 0) {
        md += `**Tagline Ideas:**\n`;
        b.sloganSuggestions.forEach((s) => (md += `- "${s}"\n`));
        md += '\n';
      }
      if (b.logoConcept) {
        md += `**Logo Concept:** ${b.logoConcept}\n\n`;
      }
      if (b.brandVoice) {
        md += `**Brand Voice:** ${b.brandVoice.tone} (Style: ${b.brandVoice.style})\n\n`;
      }
      if (b.colorPalette && b.colorPalette.length > 0) {
        md += `### Color Palette\n\n`;
        md += `| Color Name | Hex Code | Purpose / Emotion |\n`;
        md += `| :--- | :--- | :--- |\n`;
        b.colorPalette.forEach((c) => {
          md += `| **${clean(c.name)}** | \`${clean(c.hex)}\` | ${clean(c.description)} |\n`;
        });
        md += '\n';
      }
    }

    // Pitch Deck Outline
    if (strat.pitchDeck && strat.pitchDeck.length > 0) {
      md += `## Pitch Deck Structure\n\n`;
      strat.pitchDeck.forEach((slide, idx) => {
        md += `### Slide ${idx + 1}: ${slide.title}\n`;
        if (slide.content && slide.content.length > 0) {
          slide.content.forEach((point) => {
            md += `- ${point}\n`;
          });
        }
        if (slide.speakerNotes) {
          md += `\n*Speaker Notes:* ${slide.speakerNotes}\n`;
        }
        md += '\n';
      });
    }

    // Legal Insights
    if (strat.legalInsights && strat.legalInsights.length > 0) {
      md += `## Legal & Regulatory Insights\n\n`;
      strat.legalInsights.forEach((item) => {
        md += `### ${item.title}\n`;
        md += `${item.content}\n\n`;
      });
    }
  }

  // MARKET PULSE MODE
  else if (mode === 'market') {
    const market = result as MarketPulseResponse;
    md += `## Market Overview\n\n`;
    md += `${market.marketSummary}\n\n`;

    if (market.emergingTrends && market.emergingTrends.length > 0) {
      md += `### Emerging Trends\n\n`;
      market.emergingTrends.forEach((t) => (md += `- ${t}\n`));
      md += '\n';
    }

    if (market.competitors && market.competitors.length > 0) {
      md += formatCompetitorsMarkdown(market.competitors);
    }

    if (market.sources && market.sources.length > 0) {
      md += `### Research Sources & Grounding\n\n`;
      market.sources.forEach((s) => {
        md += `- [${s.title || s.uri}](${s.uri})\n`;
      });
      md += '\n';
    }
  }

  // QUICK BRAINSTORM MODE
  else if (mode === 'quick') {
    const quick = result as QuickResponse;
    if (quick.ideaValidation) {
      md += `## Rapid Validation\n\n`;
      md += `- **Feasibility Score:** ${quick.ideaValidation.score} / 10\n`;
      md += `- **Verdict:** ${quick.ideaValidation.justification}\n\n`;
    }

    if (quick.branding) {
      md += `## Brand Brainstorm\n\n`;
      if (quick.branding.companyNameSuggestions) {
        md += `**Names:** ${quick.branding.companyNameSuggestions.join(', ')}\n\n`;
      }
      if (quick.branding.sloganSuggestions) {
        md += `**Slogans:**\n`;
        quick.branding.sloganSuggestions.forEach((s) => (md += `- "${s}"\n`));
        md += '\n';
      }
    }

    if (quick.keyStrategies && quick.keyStrategies.length > 0) {
      md += `## Strategic Priorities\n\n`;
      quick.keyStrategies.forEach((s, idx) => (md += `${idx + 1}. ${s}\n`));
      md += '\n';
    }
  }

  // VISUAL ANALYSIS MODE
  else if (mode === 'visual') {
    const visual = result as VisualAnalysisResponse;
    md += `## Visual Asset & UI Analysis\n\n`;
    md += `${visual.analysis}\n\n`;

    if (visual.suggestions && visual.suggestions.length > 0) {
      md += `### Actionable Improvements\n\n`;
      visual.suggestions.forEach((s, idx) => (md += `${idx + 1}. ${s}\n`));
      md += '\n';
    }
  }

  // Footer attribution
  md += `---\n\n`;
  md += `*Generated automatically with StratIQ — The AI Business Co-Founder. Ready to import into Notion, Obsidian, GitHub Issues, Linear, Jira, or Google Docs.*\n`;

  return md;
}

/**
 * Initiates a direct browser download of the strategy as a `.md` file.
 */
export function downloadStrategyMarkdown(
  result: AnalysisResult,
  mode: AnalysisMode = 'deep',
  options?: MarkdownExportOptions
): void {
  const markdownText = generateStrategyMarkdown(result, mode, options);

  const deep = result as Partial<StrategyResponse>;
  const rawTitle =
    options?.conceptTitle ||
    deep?.brandIdentity?.companyNameSuggestions?.[0] ||
    'StratIQ_Strategy';

  const sanitizedTitle = rawTitle
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase();

  const blob = new Blob([markdownText], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizedTitle}_strategy.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copies the complete generated Markdown to clipboard.
 */
export async function copyStrategyMarkdownToClipboard(
  result: AnalysisResult,
  mode: AnalysisMode = 'deep',
  options?: MarkdownExportOptions
): Promise<boolean> {
  try {
    const md = generateStrategyMarkdown(result, mode, options);
    await navigator.clipboard.writeText(md);
    return true;
  } catch (err) {
    console.error('Failed to copy markdown to clipboard:', err);
    return false;
  }
}
