import ExcelJS from 'exceljs';
import { TransactionItem } from '../types';
import { formatDate } from '../utils';

export async function generateExcelReport(transactions: TransactionItem[], title = 'Laporan Transaksi Keuangan'): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Simple Finance (Duitku)';
  workbook.lastModifiedBy = 'Admin';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Riwayat Transaksi');

  // Add Header Title
  worksheet.mergeCells('A1:F1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = title.toUpperCase();
  titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.getRow(1).height = 40;

  // Add Subheader info
  worksheet.mergeCells('A2:F2');
  const subCell = worksheet.getCell('A2');
  subCell.value = `Tanggal Cetak: ${formatDate(new Date())} | Total Record: ${transactions.length}`;
  subCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF475569' } };
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Define Table Columns
  worksheet.getRow(4).values = ['Tanggal', 'Jenis', 'Kategori', 'Nominal (Rp)', 'Keterangan', 'Dibuat Oleh'];
  
  const headerRow = worksheet.getRow(4);
  headerRow.height = 26;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'medium' },
      right: { style: 'thin' },
    };
  });

  // Populate Data Rows
  let rowIndex = 5;
  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach((t) => {
    const row = worksheet.getRow(rowIndex);
    const amountVal = Number(t.amount);
    
    if (t.type === 'INCOME') totalIncome += amountVal;
    else totalExpense += amountVal;

    row.values = [
      formatDate(t.transactionDate),
      t.type === 'INCOME' ? 'PEMASUKAN' : 'PENGELUARAN',
      t.category?.name || '-',
      amountVal,
      t.description || '-',
      t.user?.name || '-',
    ];

    row.height = 22;

    // Formatting cells
    const typeCell = row.getCell(2);
    if (t.type === 'INCOME') {
      typeCell.font = { color: { argb: 'FF166534' }, bold: true };
    } else {
      typeCell.font = { color: { argb: 'FF991B1B' }, bold: true };
    }

    const amountCell = row.getCell(4);
    amountCell.numFmt = '"Rp"#,##0';
    amountCell.alignment = { horizontal: 'right' };

    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    });

    rowIndex++;
  });

  // Summary Rows
  const totalIncRow = worksheet.getRow(rowIndex + 1);
  totalIncRow.values = ['', '', 'Total Pemasukan:', totalIncome];
  totalIncRow.getCell(3).font = { bold: true };
  totalIncRow.getCell(4).numFmt = '"Rp"#,##0';
  totalIncRow.getCell(4).font = { bold: true, color: { argb: 'FF166534' } };

  const totalExpRow = worksheet.getRow(rowIndex + 2);
  totalExpRow.values = ['', '', 'Total Pengeluaran:', totalExpense];
  totalExpRow.getCell(3).font = { bold: true };
  totalExpRow.getCell(4).numFmt = '"Rp"#,##0';
  totalExpRow.getCell(4).font = { bold: true, color: { argb: 'FF991B1B' } };

  const netRow = worksheet.getRow(rowIndex + 3);
  netRow.values = ['', '', 'Saldo Akhir:', totalIncome - totalExpense];
  netRow.getCell(3).font = { bold: true, size: 12 };
  netRow.getCell(4).numFmt = '"Rp"#,##0';
  netRow.getCell(4).font = { bold: true, size: 12, color: { argb: 'FF0F766E' } };

  // Adjust column widths
  worksheet.columns = [
    { width: 15 },
    { width: 16 },
    { width: 20 },
    { width: 22 },
    { width: 35 },
    { width: 25 },
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
