import { FinancialProjection } from '../types';

/**
 * Escapes a cell value for standard CSV format (RFC 4180)
 */
function escapeCsvCell(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '""';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Cleans and parses financial number from string like "$120,000" or "$1.2M"
 */
function parseNumeric(val: string | number | undefined | null): number | null {
  if (val === undefined || val === null) return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  
  const cleaned = String(val).replace(/[\$,\s]/g, '').toLowerCase();
  if (!cleaned) return null;

  if (cleaned.endsWith('b')) {
    const num = parseFloat(cleaned.slice(0, -1));
    return isNaN(num) ? null : num * 1_000_000_000;
  }
  if (cleaned.endsWith('m')) {
    const num = parseFloat(cleaned.slice(0, -1));
    return isNaN(num) ? null : num * 1_000_000;
  }
  if (cleaned.endsWith('k')) {
    const num = parseFloat(cleaned.slice(0, -1));
    return isNaN(num) ? null : num * 1_000;
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

function formatCurrencyCsv(val: number | null): string {
  if (val === null) return '';
  return `$${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Sanitizes business name for valid filename
 */
export function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'venture';
}

/**
 * Exports financial projections directly to a real CSV file
 */
export function exportFinancialProjectionsCsv(
  projections: FinancialProjection[] | undefined | null,
  businessName: string = 'Venture'
): boolean {
  if (!projections || projections.length === 0) {
    throw new Error('No financial projections data available to export');
  }

  const headers = [
    'Year',
    'Revenue',
    'COGS',
    'Gross Profit',
    'Operating Expenses',
    'EBITDA',
    'Net Profit',
    'Cash Flow',
    'Customers',
    'Growth Rate',
    'Key Assumptions'
  ];

  const rows = projections.map((proj, idx) => {
    const pAny = proj as any;
    const yearLabel = proj.year ? `Year ${proj.year}` : `Year ${idx + 1}`;
    
    // Revenue & Costs
    const revenueNum = parseNumeric(proj.revenue);
    const costsNum = parseNumeric(proj.costs);
    
    // COGS & Gross Profit
    const cogsNum = parseNumeric(pAny.cogs) ?? (costsNum !== null ? Math.round(costsNum * 0.4) : null);
    const grossProfitNum = parseNumeric(pAny.grossProfit) ?? 
      (revenueNum !== null && cogsNum !== null ? revenueNum - cogsNum : null);

    // Operating Expenses
    const opexNum = parseNumeric(pAny.operatingExpenses || pAny.opex) ?? 
      (costsNum !== null && cogsNum !== null ? Math.max(0, costsNum - cogsNum) : costsNum);

    // EBITDA & Net Profit
    const netProfitNum = parseNumeric(pAny.netProfit) ?? 
      (revenueNum !== null && costsNum !== null ? revenueNum - costsNum : null);
    const ebitdaNum = parseNumeric(pAny.ebitda) ?? 
      (netProfitNum !== null ? Math.round(netProfitNum * 1.15) : null);

    // Cash Flow & Customers
    const cashFlowNum = parseNumeric(pAny.cashFlow) ?? 
      (netProfitNum !== null ? Math.round(netProfitNum * 0.85) : null);
    const customers = pAny.customers ? String(pAny.customers) : '';

    // Growth Rate calculation
    let growthRateStr = pAny.growthRate ? String(pAny.growthRate) : '';
    if (!growthRateStr && idx > 0 && revenueNum !== null) {
      const prevRev = parseNumeric(projections[idx - 1].revenue);
      if (prevRev !== null && prevRev > 0) {
        const rate = Math.round(((revenueNum - prevRev) / prevRev) * 100);
        growthRateStr = `${rate}%`;
      }
    } else if (idx === 0 && !growthRateStr) {
      growthRateStr = 'Baseline';
    }

    const assumptions = proj.assumptions || pAny.notes || '';

    return [
      escapeCsvCell(yearLabel),
      escapeCsvCell(proj.revenue || formatCurrencyCsv(revenueNum)),
      escapeCsvCell(pAny.cogs ? String(pAny.cogs) : formatCurrencyCsv(cogsNum)),
      escapeCsvCell(pAny.grossProfit ? String(pAny.grossProfit) : formatCurrencyCsv(grossProfitNum)),
      escapeCsvCell(pAny.operatingExpenses ? String(pAny.operatingExpenses) : (proj.costs || formatCurrencyCsv(opexNum))),
      escapeCsvCell(pAny.ebitda ? String(pAny.ebitda) : formatCurrencyCsv(ebitdaNum)),
      escapeCsvCell(pAny.netProfit ? String(pAny.netProfit) : formatCurrencyCsv(netProfitNum)),
      escapeCsvCell(pAny.cashFlow ? String(pAny.cashFlow) : formatCurrencyCsv(cashFlowNum)),
      escapeCsvCell(customers),
      escapeCsvCell(growthRateStr),
      escapeCsvCell(assumptions)
    ].join(',');
  });

  const csvContent = [headers.map(h => `"${h}"`).join(','), ...rows].join('\r\n');

  // Trigger browser download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const sanitizedName = sanitizeFilename(businessName);
  const fileName = `stratiq-financial-projections-${sanitizedName}.csv`;

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return true;
}
