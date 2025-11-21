// Utility functions specific to subcontracts feature
export function calculateSubcontractBalance(
  totalAmount: number,
  paidAmount: number
): number {
  return totalAmount - paidAmount;
}

export function calculatePaymentProgress(
  totalAmount: number,
  paidAmount: number
): number {
  if (totalAmount === 0) return 0;
  return Math.min((paidAmount / totalAmount) * 100, 100);
}
