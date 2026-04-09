import type { Account, Card, Transaction } from '../types';

const BASE = '/api';

/** Thrown for any non-2xx response (except 402, which is handled specially). */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  const data = await res.json();
  if (!res.ok) throw new ApiError((data as { error: string }).error ?? 'Request failed', res.status, data);
  return data as T;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new ApiError((data as { error: string }).error ?? 'Request failed', res.status, data);
  return data as T;
}

/** Result shape for purchase calls — includes the transaction regardless of approval. */
export interface PurchaseResult {
  transaction: Transaction;
  approved: boolean;
}

export const api = {
  accounts: {
    list: () => get<Account[]>('/accounts'),
    get: (id: string) => get<Account>(`/accounts/${id}`),
    create: (body: { owner_name: string; owner_email: string }) =>
      post<Account>('/accounts', body),
    /** amount is in dollars; the backend converts to cents */
    deposit: (id: string, amount: number) =>
      post<Transaction>(`/accounts/${id}/deposit`, { amount }),
  },

  cards: {
    /** Returns the active card for an account. Throws ApiError(404) if none. */
    getForAccount: (accountId: string) => get<Card>(`/cards/${accountId}`),
    issue: (accountId: string) => post<Card>('/cards', { account_id: accountId }),
  },

  transactions: {
    list: (accountId: string) => get<Transaction[]>(`/transactions/${accountId}`),

    /**
     * Process a purchase. Returns the transaction and whether it was approved.
     * 402 responses (declined) are NOT thrown — they return { approved: false }.
     * amount is in dollars; the backend converts to cents.
     */
    purchase: async (body: {
      account_id: string;
      card_id: string;
      amount: number;
      merchant_name: string;
      mcc_code: string;
    }): Promise<PurchaseResult> => {
      const res = await fetch(`${BASE}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.status === 201) return { transaction: data as Transaction, approved: true };
      if (res.status === 402) {
        return {
          transaction: (data as { transaction: Transaction }).transaction,
          approved: false,
        };
      }
      throw new ApiError((data as { error: string }).error ?? 'Request failed', res.status, data);
    },
  },
};
