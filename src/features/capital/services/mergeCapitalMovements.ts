import type { CapitalContribution, CapitalWithdrawal, CapitalAdjustment, LedgerEntry } from '../types';
/**
 * Merge contributions, withdrawals, and adjustments into a unified ledger
 * Each entry has a `signedAmount` property:
 * - Contributions: +amount (entrada)
 * - Withdrawals: -amount (salida)
 * - Adjustments: amount (already signed, can be + or -)
 */
export function mergeCapitalMovements(
  contributions: CapitalContribution[] = [],
  withdrawals: CapitalWithdrawal[] = [],
  adjustments: CapitalAdjustment[] = []
): LedgerEntry[] {
  const ledger: LedgerEntry[] = [];
  // Add contributions (positive entries)
  contributions.forEach((c) => {
    ledger.push({
      ...c,
      type: 'contribution',
      signedAmount: c.amount, // Always positive
    } as LedgerEntry);
  });
  // Add withdrawals (negative entries - invert the sign)
  withdrawals.forEach((w) => {
    ledger.push({
      ...w,
      type: 'withdrawal',
      signedAmount: -w.amount, // Always negative
    } as LedgerEntry);
  });
  // Add adjustments (already signed)
  adjustments.forEach((a) => {
    ledger.push({
      ...a,
      type: 'adjustment',
      signedAmount: a.amount, // Already signed (can be + or -)
    } as LedgerEntry);
  });
  // Sort by date descending (newest first)
  ledger.sort((a, b) => {
    const dateA =
      a.type === 'contribution'
        ? new Date(a.contribution_date).getTime()
        : a.type === 'withdrawal'
          ? new Date(a.withdrawal_date).getTime()
          : new Date(a.adjustment_date).getTime();
    const dateB =
      b.type === 'contribution'
        ? new Date(b.contribution_date).getTime()
        : b.type === 'withdrawal'
          ? new Date(b.withdrawal_date).getTime()
          : new Date(b.adjustment_date).getTime();
    return dateB - dateA;
  });
  return ledger;
}
