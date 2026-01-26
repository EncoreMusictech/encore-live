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

  // Colors (RGB values)
  const primaryColor: [number, number, number] = [139, 92, 246];
  const textDark: [number, number, number] = [31, 41, 55];
  const textMuted: [number, number, number] = [107, 114, 128];
  const warningColor: [number, number, number] = [245, 158, 11];
  const dangerColor: [number, number, number] = [239, 68, 68];
  const successColor: [number, number, number] = [34, 197, 94];

  const drawLine = (y: number, color: [number, number, number] = [229, 231, 235]) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
  };

  const reportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // ===== COVER PAGE =====
  // Background gradient effect - top section
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, pageHeight * 0.45, 'F');
  
  // Decorative elements - subtle circles (using lower opacity via lighter color)
  doc.setFillColor(200, 180, 255); // Light purple for subtle effect
  doc.circle(pageWidth * 0.85, pageHeight * 0.15, 60, 'F');
  doc.circle(pageWidth * 0.1, pageHeight * 0.35, 40, 'F');
  
  // Cover the circles partially with the main color to create depth
  doc.setFillColor(...primaryColor);

  // ENCORE Logo area (centered)
  const logoY = pageHeight * 0.18;
  
  // Music note icon (stylized)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(2);
  // Draw a simple music note shape
  doc.circle(pageWidth / 2 - 8, logoY + 8, 5, 'F');
  doc.rect(pageWidth / 2 - 4, logoY - 12, 2.5, 20, 'F');
  doc.circle(pageWidth / 2 + 8, logoY + 4, 5, 'F');
  doc.rect(pageWidth / 2 + 12, logoY - 16, 2.5, 20, 'F');
  // Connect the notes
  doc.setLineWidth(2.5);
  doc.line(pageWidth / 2 - 4, logoY - 12, pageWidth / 2 + 14.5, logoY - 16);

  // ENCORE text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(48);
  doc.setTextColor(255, 255, 255);
  doc.text('ENCORE', pageWidth / 2, logoY + 35, { align: 'center' });
  
  // Tagline
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('RIGHTS MANAGEMENT SYSTEM', pageWidth / 2, logoY + 45, { align: 'center' });

  // Divider line
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 40, logoY + 55, pageWidth / 2 + 40, logoY + 55);

  // Report type label
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('CATALOG AUDIT REPORT', pageWidth / 2, logoY + 68, { align: 'center' });

  // Artist name section (in the white area)
  const artistSectionY = pageHeight * 0.52;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(...textMuted);
  doc.text('PREPARED FOR', pageWidth / 2, artistSectionY, { align: 'center' });
  
  // Artist name - large and bold
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(36);
  doc.setTextColor(...primaryColor);
  doc.text(presentationData.artistName.toUpperCase(), pageWidth / 2, artistSectionY + 18, { align: 'center' });

  // Decorative line under artist name
  const artistNameWidth = Math.min(doc.getTextWidth(presentationData.artistName.toUpperCase()), contentWidth);
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(2);
  doc.line(pageWidth / 2 - artistNameWidth / 2, artistSectionY + 25, pageWidth / 2 + artistNameWidth / 2, artistSectionY + 25);

  // Report date
  const dateY = pageHeight * 0.72;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(...textMuted);
  doc.text('Report Generated', pageWidth / 2, dateY, { align: 'center' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...textDark);
  doc.text(reportDate, pageWidth / 2, dateY + 10, { align: 'center' });

  // Footer on cover page
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...textMuted);
  doc.text('Confidential • For Internal Use Only', pageWidth / 2, pageHeight - 30, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setTextColor(...primaryColor);
  doc.text('www.encoremusic.tech', pageWidth / 2, pageHeight - 22, { align: 'center' });

  // ===== PAGE 2: REPORT CONTENT =====
  doc.addPage();
  yPos = margin;

  // ===== HEADER BAR =====
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 35, 'F');

  // Left side: ENCORE branding
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text('ENCORE', margin, 15);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('RIGHTS MANAGEMENT SYSTEM', margin, 23);

  // Right side: Report title and date
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('CATALOG AUDIT REPORT', pageWidth - margin, 15, { align: 'right' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(reportDate, pageWidth - margin, 22, { align: 'right' });

  yPos = 50;

  // ===== ARTIST NAME =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(...primaryColor);
  doc.text(presentationData.artistName.toUpperCase(), margin, yPos);
  yPos += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(...textMuted);
  doc.text('Catalog Health Analysis', margin, yPos);
  yPos += 12;

  drawLine(yPos);
  yPos += 12;

  // ===== CATALOG OVERVIEW =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...textDark);
  doc.text('CATALOG OVERVIEW', margin, yPos);
  yPos += 10;

  // Stats in a row
  const boxWidth = (contentWidth - 20) / 3;
  const boxHeight = 22;
  const stats = [
    { label: 'Total Works', value: presentationData.catalogSize.toString() },
    { label: 'Albums (est.)', value: `~${presentationData.albumCount}` },
    { label: 'Singles (est.)', value: `~${presentationData.singleCount}` },
  ];

  stats.forEach((stat, index) => {
    const x = margin + index * (boxWidth + 10);
    
    // Box background
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(x, yPos, boxWidth, boxHeight, 2, 2, 'F');
    
    // Value (centered)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...primaryColor);
    doc.text(stat.value, x + boxWidth / 2, yPos + 11, { align: 'center' });
    
    // Label (centered)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...textMuted);
    doc.text(stat.label, x + boxWidth / 2, yPos + 18, { align: 'center' });
  });

  yPos += boxHeight + 15;

  // ===== REGISTRATION GAPS =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...textDark);
  doc.text('REGISTRATION GAPS IDENTIFIED', margin, yPos);
  yPos += 6;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...textMuted);
  doc.text('Issues that may be causing royalty leakage', margin, yPos);
  yPos += 12;

  // Total issues callout box
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(margin, yPos, contentWidth, 18, 2, 2, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...dangerColor);
  doc.text(`${presentationData.registrationGaps.total} TOTAL ISSUES FOUND`, pageWidth / 2, yPos + 11, { align: 'center' });
  yPos += 25;

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
    
    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...gap.color);
    doc.text(gap.value.toString(), margin, yPos);
    
    // Label and percentage on same line
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...textDark);
    doc.text(gap.label, margin + 15, yPos);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...textMuted);
    doc.text(`(${percentage} of catalog)`, margin + 15 + doc.getTextWidth(gap.label) + 3, yPos);
    
    yPos += 5;
    
    // Description
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...textMuted);
    doc.text(gap.desc, margin + 15, yPos);
    yPos += 9;
  });

  yPos += 5;
  drawLine(yPos);
  yPos += 12;

  // ===== FINANCIAL IMPACT =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...textDark);
  doc.text('ESTIMATED FINANCIAL IMPACT', margin, yPos);
  yPos += 10;

  // Main pipeline value box
  doc.setFillColor(...primaryColor);
  doc.roundedRect(margin, yPos, contentWidth, 28, 3, 3, 'F');
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('Estimated Pipeline Value', margin + 8, yPos + 10);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(formatCurrency(presentationData.pipelineEstimate.total), margin + 8, yPos + 22);
  
  // Confidence badge
  const confidenceText = `${presentationData.pipelineEstimate.confidenceLevel.toUpperCase()} CONFIDENCE`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(confidenceText, pageWidth - margin - 8, yPos + 16, { align: 'right' });
  yPos += 35;

  // Breakdown rows
  const breakdown = [
    { label: 'Performance Royalties', value: presentationData.pipelineEstimate.performance },
    { label: 'Mechanical Royalties', value: presentationData.pipelineEstimate.mechanical },
    { label: 'Sync Licensing', value: presentationData.pipelineEstimate.sync },
  ];

  breakdown.forEach((item) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...textMuted);
    doc.text(item.label, margin, yPos);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textDark);
    doc.text(formatCurrency(item.value), pageWidth - margin, yPos, { align: 'right' });
    yPos += 6;
  });

  // Missing impact callout
  if (presentationData.pipelineEstimate.missingImpact > 0) {
    yPos += 5;
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(margin, yPos, contentWidth, 16, 2, 2, 'F');
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...textDark);
    doc.text('Estimated Uncollected Royalties:', margin + 5, yPos + 10);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...dangerColor);
    doc.text(formatCurrency(presentationData.pipelineEstimate.missingImpact), pageWidth - margin - 5, yPos + 10, { align: 'right' });
    yPos += 22;
  }

  // ===== TOP 10 SONGS =====
  // Check if we need a new page
  if (yPos > pageHeight - 90) {
    doc.addPage();
    yPos = margin;
  }

  drawLine(yPos);
  yPos += 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...textDark);
  doc.text('TOP CATALOG WORKS', margin, yPos);
  yPos += 10;

  if (topSongs.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(...textMuted);
    doc.text('No song data available', margin, yPos);
    yPos += 10;
  } else {
    // Table header
    doc.setFillColor(249, 250, 251);
    doc.rect(margin, yPos, contentWidth, 7, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...textMuted);
    doc.text('#', margin + 3, yPos + 5);
    doc.text('SONG TITLE', margin + 12, yPos + 5);
    doc.text('ISWC', margin + 95, yPos + 5);
    doc.text('STATUS', pageWidth - margin - 20, yPos + 5);
    yPos += 9;

    // Song rows
    topSongs.slice(0, 10).forEach((song, index) => {
      if (yPos > pageHeight - 25) {
        doc.addPage();
        yPos = margin;
      }

      const completeness = song.metadata_completeness_score ?? 0;
      const statusColor: [number, number, number] = completeness >= 0.7 
        ? successColor 
        : completeness >= 0.5 
        ? warningColor 
        : dangerColor;
      const statusText = completeness >= 0.7 ? 'Complete' : completeness >= 0.5 ? 'Partial' : 'Incomplete';

      // Alternate row background
      if (index % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(margin, yPos - 2, contentWidth, 7, 'F');
      }

      // Row number
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...textMuted);
      doc.text(`${index + 1}`, margin + 3, yPos + 3);
      
      // Song title (truncate if too long)
      let title = song.song_title;
      doc.setFontSize(9);
      doc.setTextColor(...textDark);
      const maxTitleWidth = 78;
      while (doc.getTextWidth(title) > maxTitleWidth && title.length > 3) {
        title = title.slice(0, -1);
      }
      if (title !== song.song_title) {
        title += '...';
      }
      doc.text(title, margin + 12, yPos + 3);
      
      // ISWC
      const hasIswc = !!song.iswc;
      doc.setFontSize(8);
      doc.setTextColor(hasIswc ? textDark[0] : textMuted[0], hasIswc ? textDark[1] : textMuted[1], hasIswc ? textDark[2] : textMuted[2]);
      doc.text(hasIswc ? song.iswc! : '—', margin + 95, yPos + 3);
      
      // Status
      doc.setFontSize(8);
      doc.setTextColor(...statusColor);
      doc.text(statusText, pageWidth - margin - 20, yPos + 3);
      
      yPos += 7;
    });
  }

  // ===== FOOTER =====
  yPos = pageHeight - 22;
  drawLine(yPos);
  yPos += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text('Generated by ENCORE Rights Management System', margin, yPos);
  
  doc.setTextColor(...primaryColor);
  doc.text('www.encore.live', margin, yPos + 5);
  
  doc.setTextColor(...textMuted);
  doc.text(`Report ID: ${presentationData.searchId.slice(0, 8)}`, pageWidth - margin, yPos, { align: 'right' });
  doc.text(new Date(presentationData.generatedAt).toLocaleString(), pageWidth - margin, yPos + 5, { align: 'right' });

  // Save the PDF
  const filename = `ENCORE_Catalog_Audit_${presentationData.artistName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
