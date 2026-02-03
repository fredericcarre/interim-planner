import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { WorkEntry, UserSettings } from '@/types';
import { formatDateDisplay, formatMonthDisplay } from './dates';
import { calculateGross, calculateNet, coefficientToPercent } from './calculations';
import { formatCurrency, formatHours, formatNumber } from './format';

interface GeneratePDFOptions {
  entries: WorkEntry[];
  settings: UserSettings;
  month: string; // YYYY-MM
}

export function generateMonthlyPDF({
  entries,
  settings,
  month,
}: GeneratePDFOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Interim Planner', margin, 20);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  const monthDisplay = formatMonthDisplay(month);
  doc.text(`Relevé de ${monthDisplay}`, margin, 28);

  // Date of export
  doc.setFontSize(9);
  doc.setTextColor(128);
  const now = new Date();
  const exportDate = now.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Généré le ${exportDate}`, pageWidth - margin, 20, { align: 'right' });
  doc.setTextColor(0);

  // Sort entries by date
  const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  // Calculate totals
  let totalHours = 0;
  let totalGross = 0;
  let totalNet = 0;

  const tableData = sortedEntries.map((entry) => {
    const gross = calculateGross(entry.hours, entry.hourlyRate);
    const net = calculateNet(gross, settings.netCoefficient);
    totalHours += entry.hours;
    totalGross += gross;
    totalNet += net;

    return [
      formatDateDisplay(entry.date, { weekday: 'short', day: 'numeric', month: 'short' }),
      entry.establishmentNameSnapshot,
      formatHours(entry.hours),
      formatCurrency(entry.hourlyRate),
      formatCurrency(gross),
      formatCurrency(net),
      entry.note || '',
    ];
  });

  // Add table
  autoTable(doc, {
    startY: 35,
    head: [['Date', 'Établissement', 'Heures', 'Taux', 'Brut', 'Net est.', 'Note']],
    body: tableData,
    foot: [[
      'Total',
      `${entries.length} entrées`,
      formatHours(totalHours),
      '',
      formatCurrency(totalGross),
      formatCurrency(totalNet),
      '',
    ]],
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 40 },
      2: { cellWidth: 18, halign: 'right' },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 25, halign: 'right' },
      6: { cellWidth: 'auto' },
    },
    margin: { left: margin, right: margin },
  });

  // Get the final Y position after table
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  // Add coefficient info
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(
    `Coefficient net utilisé: ${formatNumber(settings.netCoefficient, 4)} (${coefficientToPercent(settings.netCoefficient)})`,
    margin,
    finalY + 10
  );
  doc.text(
    'Note: Le net estimé est une approximation et peut différer du montant réel.',
    margin,
    finalY + 15
  );

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(
    'Document généré par Interim Planner',
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center' }
  );

  // Open PDF for download/print
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
}
