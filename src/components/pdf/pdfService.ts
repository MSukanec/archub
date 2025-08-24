import { PdfHeader } from './blocks/PdfHeader';
import { PdfFooter } from './blocks/PdfFooter';
import { PdfBudgetTable } from './blocks/PdfBudgetTable';
import { PdfPaymentPlan } from './blocks/PdfPaymentPlan';

export const pdfBlocks = {
  header: PdfHeader,
  footer: PdfFooter,
  budgetTable: PdfBudgetTable,
  tableHeader: PdfBudgetTable,
  tableContent: PdfBudgetTable,
  totals: PdfBudgetTable,
  paymentPlan: PdfPaymentPlan,
};