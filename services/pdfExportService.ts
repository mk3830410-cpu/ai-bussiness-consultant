import jsPDF from 'jspdf';
import {
  AnalysisResult,
  AnalysisMode,
  StrategyResponse,
  MarketPulseResponse,
  QuickResponse,
  VisualAnalysisResponse,
} from '../types';

interface PdfExportOptions {
  result: AnalysisResult;
  mode: AnalysisMode;
  logoImageUrl?: string | null;
  conceptTitle?: string;
}

export const exportStrategyToPdf = async ({
  result,
  mode,
  logoImageUrl,
  conceptTitle = 'StratIQ Business Strategy Report',
}: PdfExportOptions): Promise<void> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  // Helper to add a new page with header & footer
  const checkPageBreak = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - 20) {
      addFooter();
      doc.addPage();
      cursorY = margin + 8;
      addRunningHeader();
    }
  };

  const addRunningHeader = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 130, 145);
    doc.text('StratIQ — AI Business Co-Founder Strategy Report', margin, margin);
    doc.text(new Date().toLocaleDateString(), pageWidth - margin, margin, { align: 'right' });
    doc.setDrawColor(220, 225, 235);
    doc.setLineWidth(0.3);
    doc.line(margin, margin + 2, pageWidth - margin, margin + 2);
  };

  const addFooter = () => {
    const pageCount = doc.getNumberOfPages();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 150, 165);
    doc.setDrawColor(220, 225, 235);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    doc.text('Confidential — Prepared for Founder by StratIQ', margin, pageHeight - 7);
    doc.text(`Page ${pageCount}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  };

  const drawSectionHeader = (title: string, badge?: string) => {
    checkPageBreak(16);
    doc.setFillColor(238, 242, 255); // Indigo 50
    doc.roundedRect(margin, cursorY, contentWidth, 8.5, 1.5, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(67, 56, 202); // Indigo 700
    doc.text(title, margin + 3.5, cursorY + 5.8);

    if (badge) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(99, 102, 241);
      doc.text(badge, pageWidth - margin - 3.5, cursorY + 5.8, { align: 'right' });
    }

    cursorY += 12;
  };

  // --- COVER / TITLE BANNER ---
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(0, 0, pageWidth, 50, 'F');

  // Decorative accent line
  doc.setFillColor(99, 102, 241); // Indigo 500
  doc.rect(0, 48.5, pageWidth, 1.5, 'F');

  // StratIQ Logo Text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('StratIQ', margin, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(199, 210, 254); // Indigo 200
  doc.text('AI Co-Founder & Business Strategy Suite', margin, 26);

  // Concept Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(conceptTitle, margin, 38, { maxWidth: contentWidth - 40 });

  // Mode badge
  const modeBadge =
    mode === 'deep'
      ? 'DEEP DIVE REPORT'
      : mode === 'market'
      ? 'MARKET PULSE'
      : mode === 'quick'
      ? 'QUICK BRAINSTORM'
      : 'VISUAL SPARK';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(129, 140, 248);
  doc.text(modeBadge, pageWidth - margin, 20, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(156, 163, 175);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin, 26, { align: 'right' });

  // Embed logo image if present
  if (logoImageUrl && logoImageUrl.startsWith('data:image')) {
    try {
      doc.addImage(logoImageUrl, 'JPEG', pageWidth - margin - 22, 28, 20, 18);
    } catch {
      // Graceful fallback if image format unsupported
    }
  }

  cursorY = 58;

  // --- RENDER CONTENT BY MODE ---
  if (mode === 'deep' && 'ideaValidation' in result) {
    const deep = result as StrategyResponse;

    // 1. Idea Validation
    drawSectionHeader('1. Idea Validation & Executive Summary');
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, cursorY, contentWidth, 18, 1.5, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(79, 70, 229);
    doc.text(`${deep.ideaValidation.score}/10`, margin + 4, cursorY + 11);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('Validation Score', margin + 25, cursorY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const justificationLines = doc.splitTextToSize(deep.ideaValidation.justification, contentWidth - 30);
    doc.text(justificationLines, margin + 25, cursorY + 11);

    cursorY += 22;

    // Suggestions
    if (deep.ideaValidation.suggestions?.length) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text('Strategic Recommendations:', margin, cursorY);
      cursorY += 5;

      deep.ideaValidation.suggestions.forEach((item) => {
        checkPageBreak(8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        const bulletLines = doc.splitTextToSize(`•  ${item}`, contentWidth - 4);
        doc.text(bulletLines, margin + 2, cursorY);
        cursorY += bulletLines.length * 4.2 + 1;
      });
      cursorY += 3;
    }

    // 2. Market Analysis
    drawSectionHeader('2. Market & Competitive Analysis');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text('Target Audience:', margin, cursorY);
    cursorY += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const audLines = doc.splitTextToSize(deep.marketAnalysis.targetAudience, contentWidth);
    doc.text(audLines, margin, cursorY);
    cursorY += audLines.length * 4.2 + 3;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text('Unique Selling Proposition (USP):', margin, cursorY);
    cursorY += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const uspLines = doc.splitTextToSize(deep.marketAnalysis.uniqueSellingProposition, contentWidth);
    doc.text(uspLines, margin, cursorY);
    cursorY += uspLines.length * 4.2 + 5;

    // SWOT Analysis Grid
    if (deep.marketAnalysis.swot) {
      checkPageBreak(30);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      doc.text('SWOT Assessment:', margin, cursorY);
      cursorY += 5;

      const swot = deep.marketAnalysis.swot;
      const swotCategories = [
        { label: 'STRENGTHS', items: swot.strengths, color: [16, 185, 129] },
        { label: 'WEAKNESSES', items: swot.weaknesses, color: [244, 63, 94] },
        { label: 'OPPORTUNITIES', items: swot.opportunities, color: [59, 130, 246] },
        { label: 'THREATS', items: swot.threats, color: [245, 158, 11] },
      ];

      const colWidth = (contentWidth - 6) / 2;
      for (let i = 0; i < swotCategories.length; i += 2) {
        checkPageBreak(25);
        const rowItems = [swotCategories[i], swotCategories[i + 1]];
        let maxColHeight = 0;

        rowItems.forEach((cat, colIndex) => {
          if (!cat) return;
          const startX = margin + colIndex * (colWidth + 6);
          let localY = cursorY;

          doc.setFillColor(248, 250, 252);
          doc.rect(startX, localY, colWidth, 4.5, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(cat.color[0], cat.color[1], cat.color[2]);
          doc.text(cat.label, startX + 2, localY + 3.2);
          localY += 6;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(71, 85, 105);

          cat.items?.slice(0, 3).forEach((item) => {
            const lines = doc.splitTextToSize(`- ${item}`, colWidth - 4);
            doc.text(lines, startX + 2, localY);
            localY += lines.length * 3.8 + 1;
          });

          const colHeight = localY - cursorY;
          if (colHeight > maxColHeight) maxColHeight = colHeight;
        });

        cursorY += maxColHeight + 4;
      }
    }

    // 3. Financial Projections Table
    if (deep.financialProjections?.length) {
      drawSectionHeader('3. Financial Projections (1-3 Years)');

      // Table Header
      checkPageBreak(30);
      const colW = contentWidth / 4;
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, cursorY, contentWidth, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text('Timeline', margin + 3, cursorY + 4.8);
      doc.text('Projected Revenue', margin + colW + 3, cursorY + 4.8);
      doc.text('Estimated Costs', margin + colW * 2 + 3, cursorY + 4.8);
      doc.text('Key Assumptions', margin + colW * 3 + 3, cursorY + 4.8);
      cursorY += 8;

      deep.financialProjections.forEach((proj, idx) => {
        checkPageBreak(12);
        if (idx % 2 === 1) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, cursorY - 1, contentWidth, 9, 'F');
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text(`Year ${proj.year}`, margin + 3, cursorY + 4);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(16, 185, 129); // Green
        doc.text(proj.revenue || 'TBD', margin + colW + 3, cursorY + 4);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(225, 29, 72); // Rose
        doc.text(proj.costs || 'TBD', margin + colW * 2 + 3, cursorY + 4);

        doc.setTextColor(71, 85, 105);
        const asmLines = doc.splitTextToSize(proj.assumptions || '-', colW - 4);
        doc.text(asmLines, margin + colW * 3 + 3, cursorY + 4);
        cursorY += Math.max(asmLines.length * 4, 8) + 2;
      });
      cursorY += 5;
    }

    // 4. Pricing Models
    if (deep.pricingModels?.length) {
      drawSectionHeader('4. Pricing & Monetization Strategy');
      deep.pricingModels.forEach((model) => {
        checkPageBreak(22);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(30, 41, 59);
        doc.text(model.name, margin, cursorY);
        cursorY += 4.5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`Target Customer: ${model.targetCustomer}`, margin, cursorY);
        cursorY += 4;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        const descLines = doc.splitTextToSize(model.description, contentWidth);
        doc.text(descLines, margin, cursorY);
        cursorY += descLines.length * 4 + 3;
      });
    }

    // 5. Pitch Deck Outline
    if (deep.pitchDeck?.length) {
      drawSectionHeader('5. Investor Pitch Deck Outline');
      deep.pitchDeck.slice(0, 8).forEach((slide, sIdx) => {
        checkPageBreak(18);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(79, 70, 229);
        doc.text(`Slide ${sIdx + 1}: ${slide.title}`, margin, cursorY);
        cursorY += 4.5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        slide.content?.forEach((point) => {
          const ptLines = doc.splitTextToSize(`• ${point}`, contentWidth - 4);
          doc.text(ptLines, margin + 3, cursorY);
          cursorY += ptLines.length * 3.8;
        });

        if (slide.speakerNotes) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(7.5);
          doc.setTextColor(100, 116, 139);
          const notesLines = doc.splitTextToSize(`Notes: ${slide.speakerNotes}`, contentWidth - 4);
          doc.text(notesLines, margin + 3, cursorY);
          cursorY += notesLines.length * 3.5;
        }
        cursorY += 3;
      });
    }

    // 6. Growth & Legal Insights
    if (deep.growthHackingTips?.length || deep.legalInsights?.length) {
      drawSectionHeader('6. Growth Hacks & Governance');
      if (deep.growthHackingTips?.length) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);
        doc.text('Growth Hacking Tactics:', margin, cursorY);
        cursorY += 4.5;

        deep.growthHackingTips.slice(0, 5).forEach((tip, tIdx) => {
          checkPageBreak(8);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(71, 85, 105);
          const lines = doc.splitTextToSize(`${tIdx + 1}. ${tip}`, contentWidth - 4);
          doc.text(lines, margin + 2, cursorY);
          cursorY += lines.length * 4;
        });
        cursorY += 3;
      }
    }
  } else if (mode === 'market' && 'marketSummary' in result) {
    const market = result as MarketPulseResponse;
    drawSectionHeader('Market Summary & Trends');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const sumLines = doc.splitTextToSize(market.marketSummary, contentWidth);
    doc.text(sumLines, margin, cursorY);
    cursorY += sumLines.length * 4.5 + 6;

    if (market.emergingTrends?.length) {
      drawSectionHeader('Emerging Market Trends');
      market.emergingTrends.forEach((trend) => {
        checkPageBreak(8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        const lines = doc.splitTextToSize(`• ${trend}`, contentWidth - 4);
        doc.text(lines, margin + 2, cursorY);
        cursorY += lines.length * 4.2 + 1;
      });
      cursorY += 4;
    }

    if (market.competitors?.length) {
      drawSectionHeader('Competitor Landscape');
      market.competitors.forEach((c) => {
        checkPageBreak(15);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);
        doc.text(c.name, margin, cursorY);
        cursorY += 4;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        const lines = doc.splitTextToSize(c.analysis, contentWidth);
        doc.text(lines, margin, cursorY);
        cursorY += lines.length * 4 + 3;
      });
    }
  } else if (mode === 'quick' && 'ideaValidation' in result) {
    const quick = result as QuickResponse;
    drawSectionHeader('Quick Brainstorm Summary');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(79, 70, 229);
    doc.text(`Score: ${quick.ideaValidation.score}/10`, margin, cursorY + 4);
    cursorY += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const justLines = doc.splitTextToSize(quick.ideaValidation.justification, contentWidth);
    doc.text(justLines, margin, cursorY);
    cursorY += justLines.length * 4.5 + 6;

    if (quick.keyStrategies?.length) {
      drawSectionHeader('Key Action Items');
      quick.keyStrategies.forEach((strat, idx) => {
        checkPageBreak(8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        const lines = doc.splitTextToSize(`${idx + 1}. ${strat}`, contentWidth);
        doc.text(lines, margin, cursorY);
        cursorY += lines.length * 4.2 + 2;
      });
    }
  } else if (mode === 'visual' && 'analysis' in result) {
    const visual = result as VisualAnalysisResponse;
    drawSectionHeader('Visual Spark Analysis');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const lines = doc.splitTextToSize(visual.analysis, contentWidth);
    doc.text(lines, margin, cursorY);
    cursorY += lines.length * 4.5 + 6;

    if (visual.suggestions?.length) {
      drawSectionHeader('Actionable Design & Strategy Suggestions');
      visual.suggestions.forEach((sug, idx) => {
        checkPageBreak(8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        const sLines = doc.splitTextToSize(`${idx + 1}. ${sug}`, contentWidth);
        doc.text(sLines, margin, cursorY);
        cursorY += sLines.length * 4.2 + 2;
      });
    }
  }

  // Add footer to last page
  addFooter();

  // Save the PDF
  const sanitizedTitle = conceptTitle.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 35);
  doc.save(`StratIQ_${sanitizedTitle}_${mode}.pdf`);
};
