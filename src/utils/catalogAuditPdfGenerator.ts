import jsPDF from 'jspdf';
import type { AuditPresentationData } from '@/hooks/useCatalogAuditPresentation';

interface SongForPdf {
  song_title: string;
  iswc?: string | null;
  metadata_completeness_score?: number | null;
  verification_status?: string | null;
}

interface CatalogAuditPdfData {
  presentationData: AuditPresentationData;
  topSongs: SongForPdf[];
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercentage = (value: number, total: number): string => {
  if (total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
};

export async function generateCatalogAuditPdf(data: CatalogAuditPdfData): Promise<void> {
  const { presentationData, topSongs } = data;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  // Colors
  const primaryColor: [number, number, number] = [139, 92, 246]; // Purple/lavender
  const textDark: [number, number, number] = [31, 41, 55];
  const textMuted: [number, number, number] = [107, 114, 128];
  const warningColor: [number, number, number] = [245, 158, 11];
  const dangerColor: [number, number, number] = [239, 68, 68];

  // Helper functions
  const addText = (text: string, x: number, y: number, options?: {
    fontSize?: number;
    color?: [number, number, number];
    fontStyle?: 'normal' | 'bold' | 'italic';
    maxWidth?: number;
  }) => {
    const { fontSize = 12, color = textDark, fontStyle = 'normal', maxWidth } = options || {};
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    doc.setFont('helvetica', fontStyle);
    
    if (maxWidth) {
      doc.text(text, x, y, { maxWidth });
    } else {
      doc.text(text, x, y);
    }
  };

  const drawLine = (y: number, color: [number, number, number] = [229, 231, 235]) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
  };

  // ===== HEADER =====
  // Brand bar
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 35, 'F');

  // Logo text
  addText('ENCORE', margin, 15, { fontSize: 24, color: [255, 255, 255], fontStyle: 'bold' });
  addText('RIGHTS MANAGEMENT SYSTEM', margin, 23, { fontSize: 8, color: [255, 255, 255] });

  // Report title
  addText('CATALOG AUDIT REPORT', pageWidth - margin, 15, { fontSize: 14, color: [255, 255, 255], fontStyle: 'bold' });
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), pageWidth - margin, 22, { align: 'right' });

  yPos = 50;

  // ===== ARTIST NAME =====
  addText(presentationData.artistName.toUpperCase(), margin, yPos, { fontSize: 28, color: primaryColor, fontStyle: 'bold' });
  yPos += 12;

  addText('Catalog Health Analysis', margin, yPos, { fontSize: 12, color: textMuted });
  yPos += 15;

  drawLine(yPos);
  yPos += 15;

  // ===== CATALOG OVERVIEW =====
  addText('CATALOG OVERVIEW', margin, yPos, { fontSize: 14, color: textDark, fontStyle: 'bold' });
  yPos += 10;

  // Stats boxes
  const boxWidth = (contentWidth - 10) / 3;
  const boxHeight = 25;
  const stats = [
    { label: 'Total Works', value: presentationData.catalogSize.toString() },
    { label: 'Albums', value: `~${presentationData.albumCount}` },
    { label: 'Singles', value: `~${presentationData.singleCount}` },
  ];

  stats.forEach((stat, index) => {
    const x = margin + index * (boxWidth + 5);
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(x, yPos, boxWidth, boxHeight, 3, 3, 'F');
    
    addText(stat.value, x + boxWidth / 2, yPos + 10, { fontSize: 16, fontStyle: 'bold', color: primaryColor });
    doc.text(stat.value, x + boxWidth / 2, yPos + 10, { align: 'center' });
    
    addText(stat.label, x + boxWidth / 2, yPos + 18, { fontSize: 9, color: textMuted });
    doc.text(stat.label, x + boxWidth / 2, yPos + 18, { align: 'center' });
  });

  yPos += boxHeight + 15;

  // ===== REGISTRATION GAPS =====
  addText('REGISTRATION GAPS IDENTIFIED', margin, yPos, { fontSize: 14, color: textDark, fontStyle: 'bold' });
  yPos += 3;
  addText('Issues that may be causing royalty leakage', margin, yPos + 5, { fontSize: 10, color: textMuted });
  yPos += 15;

  // Total issues callout
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(margin, yPos, contentWidth, 20, 3, 3, 'F');
  addText(`${presentationData.registrationGaps.total} TOTAL ISSUES FOUND`, margin + contentWidth / 2, yPos + 13, { 
    fontSize: 14, 
    fontStyle: 'bold', 
    color: dangerColor 
  });
  doc.text(`${presentationData.registrationGaps.total} TOTAL ISSUES FOUND`, margin + contentWidth / 2, yPos + 13, { align: 'center' });
  yPos += 28;

  // Gap breakdown
  const gaps = [
    { 
      label: 'Missing ISWC', 
      desc: 'Works without International Standard Work Code',
      value: presentationData.registrationGaps.missingISWC,
      color: warningColor 
    },
    { 
      label: 'Missing PRO Registration', 
      desc: 'Works not registered with a PRO',
      value: presentationData.registrationGaps.missingPRO,
      color: dangerColor 
    },
    { 
      label: 'Incomplete Metadata', 
      desc: 'Works with less than 70% data completeness',
      value: presentationData.registrationGaps.incompleteMetadata,
      color: [249, 115, 22] as [number, number, number]
    },
  ];

  gaps.forEach((gap) => {
    const percentage = formatPercentage(gap.value, presentationData.catalogSize);
    
    addText(`${gap.value}`, margin, yPos, { fontSize: 16, fontStyle: 'bold', color: gap.color });
    addText(gap.label, margin + 20, yPos, { fontSize: 11, fontStyle: 'bold', color: textDark });
    addText(`(${percentage} of catalog)`, margin + 20 + doc.getTextWidth(gap.label) + 3, yPos, { fontSize: 10, color: textMuted });
    yPos += 5;
    addText(gap.desc, margin + 20, yPos, { fontSize: 9, color: textMuted });
    yPos += 10;
  });

  yPos += 5;
  drawLine(yPos);
  yPos += 15;

  // ===== FINANCIAL IMPACT =====
  addText('ESTIMATED FINANCIAL IMPACT', margin, yPos, { fontSize: 14, color: textDark, fontStyle: 'bold' });
  yPos += 10;

  // Main pipeline value
  doc.setFillColor(...primaryColor);
  doc.roundedRect(margin, yPos, contentWidth, 30, 3, 3, 'F');
  addText('Estimated Pipeline Value', margin + 10, yPos + 10, { fontSize: 10, color: [255, 255, 255] });
  addText(formatCurrency(presentationData.pipelineEstimate.total), margin + 10, yPos + 23, { 
    fontSize: 18, 
    fontStyle: 'bold', 
    color: [255, 255, 255] 
  });
  
  // Confidence badge
  const confidenceText = `${presentationData.pipelineEstimate.confidenceLevel.toUpperCase()} CONFIDENCE`;
  addText(confidenceText, pageWidth - margin - 10, yPos + 16, { fontSize: 9, color: [255, 255, 255] });
  doc.text(confidenceText, pageWidth - margin - 10, yPos + 16, { align: 'right' });
  yPos += 38;

  // Breakdown
  const breakdown = [
    { label: 'Performance Royalties', value: presentationData.pipelineEstimate.performance },
    { label: 'Mechanical Royalties', value: presentationData.pipelineEstimate.mechanical },
    { label: 'Sync Licensing', value: presentationData.pipelineEstimate.sync },
  ];

  breakdown.forEach((item) => {
    addText(item.label, margin, yPos, { fontSize: 10, color: textMuted });
    addText(formatCurrency(item.value), pageWidth - margin, yPos, { fontSize: 10, fontStyle: 'bold', color: textDark });
    doc.text(formatCurrency(item.value), pageWidth - margin, yPos, { align: 'right' });
    yPos += 7;
  });

  // Missing impact
  if (presentationData.pipelineEstimate.missingImpact > 0) {
    yPos += 5;
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(margin, yPos, contentWidth, 18, 3, 3, 'F');
    addText('Estimated Uncollected Royalties:', margin + 5, yPos + 11, { fontSize: 10, color: textDark });
    addText(formatCurrency(presentationData.pipelineEstimate.missingImpact), pageWidth - margin - 5, yPos + 11, { 
      fontSize: 12, 
      fontStyle: 'bold', 
      color: dangerColor 
    });
    doc.text(formatCurrency(presentationData.pipelineEstimate.missingImpact), pageWidth - margin - 5, yPos + 11, { align: 'right' });
    yPos += 25;
  }

  // ===== TOP 10 SONGS =====
  // Check if we need a new page
  if (yPos > pageHeight - 100) {
    doc.addPage();
    yPos = margin;
  }

  drawLine(yPos);
  yPos += 10;

  addText('TOP CATALOG WORKS', margin, yPos, { fontSize: 14, color: textDark, fontStyle: 'bold' });
  yPos += 8;

  if (topSongs.length === 0) {
    addText('No song data available', margin, yPos, { fontSize: 10, color: textMuted, fontStyle: 'italic' });
    yPos += 10;
  } else {
    // Table header
    doc.setFillColor(249, 250, 251);
    doc.rect(margin, yPos, contentWidth, 8, 'F');
    addText('#', margin + 3, yPos + 5.5, { fontSize: 8, fontStyle: 'bold', color: textMuted });
    addText('SONG TITLE', margin + 12, yPos + 5.5, { fontSize: 8, fontStyle: 'bold', color: textMuted });
    addText('ISWC', margin + 100, yPos + 5.5, { fontSize: 8, fontStyle: 'bold', color: textMuted });
    addText('STATUS', pageWidth - margin - 25, yPos + 5.5, { fontSize: 8, fontStyle: 'bold', color: textMuted });
    yPos += 10;

    // Song rows
    topSongs.slice(0, 10).forEach((song, index) => {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = margin;
      }

      const hasIswc = !!song.iswc;
      const completeness = song.metadata_completeness_score ?? 0;
      const statusColor: [number, number, number] = completeness >= 0.7 
        ? [34, 197, 94] 
        : completeness >= 0.5 
        ? warningColor 
        : dangerColor;
      const statusText = completeness >= 0.7 ? 'Complete' : completeness >= 0.5 ? 'Partial' : 'Incomplete';

      // Alternate row background
      if (index % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(margin, yPos - 3, contentWidth, 8, 'F');
      }

      addText(`${index + 1}`, margin + 3, yPos + 2, { fontSize: 9, color: textMuted });
      
      // Truncate long titles
      const maxTitleWidth = 85;
      let title = song.song_title;
      doc.setFontSize(9);
      if (doc.getTextWidth(title) > maxTitleWidth) {
        while (doc.getTextWidth(title + '...') > maxTitleWidth && title.length > 0) {
          title = title.slice(0, -1);
        }
        title += '...';
      }
      addText(title, margin + 12, yPos + 2, { fontSize: 9, color: textDark });
      
      addText(hasIswc ? song.iswc! : '—', margin + 100, yPos + 2, { 
        fontSize: 8, 
        color: hasIswc ? textDark : textMuted 
      });
      addText(statusText, pageWidth - margin - 25, yPos + 2, { fontSize: 8, color: statusColor });
      
      yPos += 8;
    });
  }

  // ===== FOOTER =====
  yPos = pageHeight - 25;
  drawLine(yPos);
  yPos += 8;

  addText('Generated by ENCORE Rights Management System', margin, yPos, { fontSize: 8, color: textMuted });
  addText('www.encore.live', margin, yPos + 5, { fontSize: 8, color: primaryColor });
  
  addText(`Report ID: ${presentationData.searchId.slice(0, 8)}`, pageWidth - margin, yPos, { fontSize: 8, color: textMuted });
  doc.text(`Report ID: ${presentationData.searchId.slice(0, 8)}`, pageWidth - margin, yPos, { align: 'right' });
  addText(presentationData.generatedAt, pageWidth - margin, yPos + 5, { fontSize: 8, color: textMuted });
  doc.text(new Date(presentationData.generatedAt).toLocaleString(), pageWidth - margin, yPos + 5, { align: 'right' });

  // Save the PDF
  const filename = `ENCORE_Catalog_Audit_${presentationData.artistName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
