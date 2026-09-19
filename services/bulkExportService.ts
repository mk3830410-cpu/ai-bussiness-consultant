import JSZip from 'jszip';
import { SavedStrategy, AnalysisMode } from '../types';
import { generateStrategyPdfBlob } from './pdfExportService';

export interface BulkExportProgress {
  current: number;
  total: number;
  currentName: string;
  status: 'idle' | 'generating' | 'zipping' | 'complete' | 'error';
  errorMessage?: string;
}

/**
 * Generates a ZIP archive containing individual PDFs for an array of saved strategies.
 * Also includes a clean portfolio manifest summary file.
 */
export async function exportSavedStrategiesToZip(
  strategies: SavedStrategy[],
  options?: {
    onProgress?: (progress: BulkExportProgress) => void;
    userEmail?: string | null;
  }
): Promise<void> {
  if (!strategies || strategies.length === 0) {
    throw new Error('No strategies provided for export.');
  }

  const zip = new JSZip();
  const folder = zip.folder('StratIQ_Strategies');
  const total = strategies.length;

  options?.onProgress?.({
    current: 0,
    total,
    currentName: 'Initializing archive...',
    status: 'generating',
  });

  const manifestEntries: string[] = [
    '==================================================================',
    '        STRATIQ — EXECUTIVE STRATEGY PORTFOLIO EXPORT            ',
    '==================================================================',
    `Export Date: ${new Date().toUTCString()}`,
    `Portfolio Owner: ${options?.userEmail || 'StratIQ Founder'}`,
    `Total Blueprints: ${total}`,
    '------------------------------------------------------------------',
    '',
    'PORTFOLIO MANIFEST:',
    '',
  ];

  const usedFilenames = new Map<string, number>();

  for (let i = 0; i < strategies.length; i++) {
    const strategy = strategies[i];
    const rawName = strategy.businessName || `Strategy_${i + 1}`;
    const sanitized = rawName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);

    // Ensure unique file names inside zip
    const count = usedFilenames.get(sanitized) || 0;
    usedFilenames.set(sanitized, count + 1);
    const filename = count === 0 ? `${sanitized}_Strategy_Report.pdf` : `${sanitized}_Strategy_Report_${count + 1}.pdf`;

    options?.onProgress?.({
      current: i + 1,
      total,
      currentName: rawName,
      status: 'generating',
    });

    try {
      // Determine analysis mode from result or fallback to 'deep'
      const mode: AnalysisMode = (strategy as any).mode || 'deep';
      const pdfBlob = await generateStrategyPdfBlob({
        result: strategy.analysisResult,
        mode,
        conceptTitle: strategy.businessName,
      });

      // Add to zip folder
      if (folder) {
        folder.file(filename, pdfBlob);
      } else {
        zip.file(filename, pdfBlob);
      }

      manifestEntries.push(
        `[${i + 1}] ${strategy.businessName} (${strategy.industry || 'Tech'})`,
        `    - Status: ${strategy.status || 'validated'} | Score: ${strategy.score || 'N/A'}/100`,
        `    - Created: ${strategy.createdAt || 'N/A'}`,
        `    - PDF Filename: ${filename}`,
        `    - Core Value: ${strategy.inputs?.businessIdea?.substring(0, 100) || 'N/A'}...`,
        ''
      );
    } catch (err) {
      console.error(`Failed to generate PDF for strategy "${rawName}":`, err);
      manifestEntries.push(
        `[${i + 1}] ${strategy.businessName}: Export Warning (PDF could not be formatted)`
      );
    }
  }

  manifestEntries.push(
    '------------------------------------------------------------------',
    'Generated with StratIQ — The AI Business Co-Founder',
    'https://stratiq.ai'
  );

  // Add manifest text file
  zip.file('PORTFOLIO_MANIFEST.txt', manifestEntries.join('\n'));

  // Switch status to zipping
  options?.onProgress?.({
    current: total,
    total,
    currentName: 'Compressing into ZIP archive...',
    status: 'zipping',
  });

  const zipBlob = await zip.generateAsync(
    { 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    },
    (metadata) => {
      // Optional compression percent tracking
    }
  );

  // Trigger download
  const dateStr = new Date().toISOString().slice(0, 10);
  const zipName = `StratIQ_Saved_Strategies_${dateStr}.zip`;
  const downloadUrl = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = zipName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);

  options?.onProgress?.({
    current: total,
    total,
    currentName: zipName,
    status: 'complete',
  });
}
