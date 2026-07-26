import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate, formatRupiah } from '../utils';

export function generatePdfReport(transactions: any[], title = 'Laporan Keuangan Kas'): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Header Banner
  doc.setFillColor(15, 118, 110); // Emerald 700
  doc.rect(0, 0, 210, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('SIMPLE FINANCE', 14, 16);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Aplikasi Pencatatan Kas & Keuangan', 14, 23);

  // Document Title & Meta
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 40);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Tanggal Cetak: ${formatDate(new Date())}`, 14, 46);

  // Summaries
  let totalIncome = 0;
  let totalExpense = 0;
  transactions.forEach((t) => {
    if (t.type === 'INCOME') totalIncome += Number(t.amount);
    else totalExpense += Number(t.amount);
  });
  const balance = totalIncome - totalExpense;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 52, 182, 22, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  
  doc.text('TOTAL PEMASUKAN', 20, 59);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74);
  doc.text(formatRupiah(totalIncome), 20, 67);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('TOTAL PENGELUARAN', 80, 59);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(225, 29, 72);
  doc.text(formatRupiah(totalExpense), 80, 67);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('SALDO AKHIR', 140, 59);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 118, 110);
  doc.text(formatRupiah(balance), 140, 67);

  // Table
  const tableRows = transactions.map((t, idx) => [
    (idx + 1).toString(),
    formatDate(t.transactionDate),
    t.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran',
    t.category?.name || '-',
    t.description || '-',
    formatRupiah(Number(t.amount)),
  ]);

  autoTable(doc, {
    startY: 80,
    head: [['No', 'Tanggal', 'Jenis', 'Kategori', 'Keterangan', 'Nominal']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 25 },
      2: { cellWidth: 25 },
      3: { cellWidth: 30 },
      4: { cellWidth: 55 },
      5: { halign: 'right', cellWidth: 37 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 2) {
        if (data.cell.raw === 'Pemasukan') {
          data.cell.styles.textColor = [22, 163, 74];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [225, 29, 72];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  // Footer page number
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(148, 163, 184);
    doc.text(`Halaman ${i} dari ${pageCount} - UangKasir`, 105, 290, { align: 'center' });
  }

  const pdfArrayBuffer = doc.output('arraybuffer');
  return Buffer.from(pdfArrayBuffer);
}
