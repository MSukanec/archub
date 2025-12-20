import { Wallet } from 'lucide-react';
import type { DataHealthContext } from '../../types';
import type { MicroRule, MicroRuleConfig, MicroRuleResult } from './types';

export interface WalletEntity {
  id: string | number;
  walletId?: string | null;
  walletName?: string | null;
}

const config: MicroRuleConfig = {
  id: 'missing-wallet',
  severity: 'warning',
  icon: Wallet,
  category: 'classification',
};

function check<T extends WalletEntity>(
  items: T[],
  _ctx: DataHealthContext
): MicroRuleResult<T> {
  const affected = items.filter(item => !item.walletId && !item.walletName);

  return {
    affected,
    isEmpty: affected.length === 0,
  };
}

export function createMissingWalletRule<T extends WalletEntity>(): MicroRule<T> {
  return {
    config,
    check,
  };
}

export const missingWalletConfig = config;
