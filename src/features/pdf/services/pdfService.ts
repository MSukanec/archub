import { PdfHeader } from '../components/blocks/PdfHeader';
import { PdfFooter } from '../components/blocks/PdfFooter';
import { PdfBudgetTable } from '../components/blocks/PdfBudgetTable';

export const pdfBlocks = {
  header: PdfHeader,
  footer: PdfFooter,
  budgetTable: PdfBudgetTable,
  tableHeader: PdfBudgetTable,
  tableContent: PdfBudgetTable,
  totals: PdfBudgetTable,
};