import jsPDF from 'jspdf';
import type { AggregatedAuditData, CatalogSummary } from '@/hooks/useMultiCatalogAudit';

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export async function generateMultiCatalogAuditPdf(data: AggregatedAuditData): Promise<void> {
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
  const primaryColor: [number, number, number] = [139, 92, 246];
  const textDark: [number, number, number] = [31, 41, 55];
  const textMuted: [number, number, number] = [107, 114, 128];
  const warningColor: [number, number, number] = [245, 158, 11];
  const dangerColor: [number, number, number] = [239, 68, 68];
  const successColor: [number, number, number] = [34, 197, 94];

  const drawLine = (y: number) => {
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
  };

  const checkPageBreak = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - 25) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // ===== HEADER =====
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text('ENCORE', margin, 15);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('RIGHTS MANAGEMENT SYSTEM', margin, 23);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('MULTI-CATALOG AUDIT REPORT', pageWidth - margin, 15, { align: 'right' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const reportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(reportDate, pageWidth - margin, 22, { align: 'right' });

  yPos = 50;

  // ===== PORTFOLIO OVERVIEW =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...primaryColor);
  doc.text('PORTFOLIO OVERVIEW', margin, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...textMuted);
  doc.text(`${data.catalogs.length} Catalogs • ${data.totals.totalWorks} Total Works`, margin, yPos);
  yPos += 12;

  // Stats row
  const boxWidth = (contentWidth - 15) / 4;
  const boxHeight = 20;
  const stats = [
    { label: 'Catalogs', value: data.totals.catalogCount.toString() },
    { label: 'Total Works', value: data.totals.totalWorks.toString() },
    { label: 'Total Gaps', value: data.totals.totalGaps.toString(), color: dangerColor },
    { label: 'Pipeline', value: formatCurrency(data.totals.pipelineTotal), color: primaryColor },
  ];

  stats.forEach((stat, index) => {
    const x = margin + index * (boxWidth + 5);
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(x, yPos, boxWidth, boxHeight, 2, 2, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...(stat.color || textDark));
    doc.text(stat.value, x + boxWidth / 2, yPos + 10, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...textMuted);
    doc.text(stat.label, x + boxWidth / 2, yPos + 16, { align: 'center' });
  });

  yPos += boxHeight + 15;
  drawLine(yPos);
  yPos += 10;

  // ===== REGISTRATION GAPS =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...textDark);
  doc.text('REGISTRATION GAPS SUMMARY', margin, yPos);
  yPos += 10;

  const gaps = [
    { label: 'Missing ISWC', value: data.totals.missingISWC, color: warningColor },
    { label: 'Missing PRO', value: data.totals.missingPRO, color: dangerColor },
    { label: 'Incomplete Metadata', value: data.totals.incompleteMetadata, color: [249, 115, 22] as [number, number, number] },
  ];

  gaps.forEach((gap) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...gap.color);
    doc.text(gap.value.toString(), margin, yPos);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...textDark);
    doc.text(gap.label, margin + 12, yPos);
    yPos += 6;
  });

  yPos += 8;
  drawLine(yPos);
  yPos += 10;

  // ===== FINANCIAL BREAKDOWN =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...textDark);
  doc.text('FINANCIAL IMPACT', margin, yPos);
  yPos += 10;

  doc.setFillColor(...primaryColor);
  doc.roundedRect(margin, yPos, contentWidth, 24, 3, 3, 'F');
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('Combined Pipeline Estimate', margin + 8, yPos + 9);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(formatCurrency(data.totals.pipelineTotal), margin + 8, yPos + 18);
  yPos += 30;

  const breakdown = [
    { label: 'Performance Royalties', value: data.totals.performance },
    { label: 'Mechanical Royalties', value: data.totals.mechanical },
    { label: 'Sync Licensing', value: data.totals.sync },
  ];

  breakdown.forEach((item) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...textMuted);
    doc.text(item.label, margin, yPos);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textDark);
    doc.text(formatCurrency(item.value), pageWidth - margin, yPos, { align: 'right' });
    yPos += 5;
  });

  yPos += 10;
  drawLine(yPos);
  yPos += 10;

  // ===== CATALOG BREAKDOWN =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...textDark);
  doc.text('CATALOG BREAKDOWN', margin, yPos);
  yPos += 10;

  // Table header
  doc.setFillColor(249, 250, 251);
  doc.rect(margin, yPos, contentWidth, 6, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...textMuted);
  doc.text('ARTIST', margin + 2, yPos + 4);
  doc.text('SONGS', margin + 60, yPos + 4);
  doc.text('GAPS', margin + 80, yPos + 4);
  doc.text('PIPELINE', margin + 100, yPos + 4);
  yPos += 8;

  data.catalogs.forEach((catalog, index) => {
    checkPageBreak(7);

    if (index % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, yPos - 1, contentWidth, 6, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...textDark);
    
    let artistName = catalog.artistName;
    while (doc.getTextWidth(artistName) > 55 && artistName.length > 3) {
      artistName = artistName.slice(0, -1);
    }
    if (artistName !== catalog.artistName) artistName += '...';
    
    doc.text(artistName, margin + 2, yPos + 3);
    doc.text(catalog.catalogSize.toString(), margin + 60, yPos + 3);
    doc.setTextColor(...dangerColor);
    doc.text(catalog.totalGaps.toString(), margin + 80, yPos + 3);
    doc.setTextColor(...successColor);
    doc.text(formatCurrency(catalog.pipelineTotal), margin + 100, yPos + 3);
    
    yPos += 6;
  });

  // ===== PER-CATALOG DETAILS =====
  for (const catalog of data.catalogs) {
    doc.addPage();
    yPos = margin;

    // Catalog header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...primaryColor);
    doc.text(catalog.artistName.toUpperCase(), margin, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...textMuted);
    doc.text(`${catalog.catalogSize} Works in Catalog`, margin, yPos);
    yPos += 12;

    drawLine(yPos);
    yPos += 10;

    // Stats
    const catStats = [
      { label: 'Missing ISWC', value: catalog.missingISWC, color: warningColor },
      { label: 'Missing PRO', value: catalog.missingPRO, color: dangerColor },
      { label: 'Incomplete', value: catalog.incompleteMetadata, color: textMuted },
      { label: 'Pipeline', value: formatCurrency(catalog.pipelineTotal), color: primaryColor },
    ];

    catStats.forEach((stat, i) => {
      const x = margin + i * (boxWidth + 5);
      doc.setFillColor(249, 250, 251);
      doc.roundedRect(x, yPos, boxWidth, boxHeight, 2, 2, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...stat.color);
      doc.text(stat.value.toString(), x + boxWidth / 2, yPos + 10, { align: 'center' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...textMuted);
      doc.text(stat.label, x + boxWidth / 2, yPos + 16, { align: 'center' });
    });

    yPos += boxHeight + 15;

    // Top 5 Missing Songs
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...textDark);
    doc.text('TOP 5 SONGS NEEDING ATTENTION', margin, yPos);
    yPos += 8;

    if (catalog.topMissingSongs.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(...textMuted);
      doc.text('All songs have complete registrations', margin, yPos);
      yPos += 6;
    } else {
      catalog.topMissingSongs.forEach((song, idx) => {
        doc.setFillColor(249, 250, 251);
        doc.roundedRect(margin, yPos, contentWidth, 10, 1, 1, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...textMuted);
        doc.text(`${idx + 1}`, margin + 3, yPos + 7);

        doc.setTextColor(...textDark);
        let title = song.song_title;
        while (doc.getTextWidth(title) > 70 && title.length > 3) {
          title = title.slice(0, -1);
        }
        if (title !== song.song_title) title += '...';
        doc.text(title, margin + 12, yPos + 7);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...warningColor);
        doc.text(song.issues.join(' • '), margin + 90, yPos + 7);

        yPos += 12;
      });
    }
  }

  // ===== FOOTER (last page) =====
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
  doc.text(`${data.catalogs.length} Catalogs • ${data.totals.totalWorks} Works`, pageWidth - margin, yPos, { align: 'right' });
  doc.text(new Date().toLocaleString(), pageWidth - margin, yPos + 5, { align: 'right' });

  // Save
  const filename = `ENCORE_MultiCatalog_Audit_${data.catalogs.length}_catalogs_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
