'use client';

import { useEffect, useState } from 'react';
import { isToday, isYesterday, format } from 'date-fns';

type Transaction = {
  id: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  createdAt: string;
};

interface RecentTransactionsProps {
  userId: string;
  refreshSignal?: boolean | number;
}

export default function RecentTransactions({ userId, refreshSignal }: RecentTransactionsProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'empty' | 'loaded'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!userId) {
      setStatus('empty');
      setTransactions([]);
      return;
    }

    const fetchTransactions = async () => {
      setStatus('loading');
      try {
        const res = await fetch(`/api/transactions?userId=${encodeURIComponent(userId)}`);
        if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);

        const data: unknown = await res.json();
        const valid = (data as unknown[]).filter(isValidTransaction);

        const sorted = valid
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);

        setTransactions(sorted);
        setStatus(sorted.length ? 'loaded' : 'empty');
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
        setStatus('error');
        setTransactions([]);
      }
    };

    fetchTransactions();
  }, [userId, refreshSignal]);

  // Type guard
  const isValidTransaction = (tx: unknown): tx is Transaction => {
    if (typeof tx !== 'object' || tx === null) return false;
    const t = tx as Record<string, unknown>;
    return (
      typeof t.id === 'string' &&
      typeof t.amount === 'number' &&
      typeof t.category === 'string' &&
      (t.type === 'income' || t.type === 'expense') &&
      typeof t.createdAt === 'string'
    );
  };

  // Group by date
  const grouped = transactions.reduce<Record<string, Transaction[]>>((acc, tx) => {
    const date = new Date(tx.createdAt);
    const label = isToday(date)
      ? 'Today'
      : isYesterday(date)
        ? 'Yesterday'
        : format(date, 'dd MMM yyyy');

    acc[label] = acc[label] || [];
    acc[label].push(tx);
    return acc;
  }, {});

  const formatTime = (dateStr: string) => format(new Date(dateStr), 'hh:mm a');
  const formatAmount = (amount: number) => `Rs. ${amount.toLocaleString()}`;

  const LoadingSkeleton = () => (
    <div className="space-y-2">
      {[...Array(3)].map((_, idx) => (
        <div key={idx} className="h-14 rounded-md animate-pulse bg-muted" />
      ))}
    </div>
  );

  if (status === 'loading') return <LoadingSkeleton />;
  if (status === 'error') return <p className="text-red-600 text-sm">Error: {errorMsg}</p>;
  if (status === 'empty') return <p className="text-gray-500 text-sm">No recent transactions found.</p>;

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([label, txs]) => (
        <div key={label}>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</h3>
          <div className="space-y-2">
            {txs.map((tx) => (
              <div
                key={tx.id}
                className="flex justify-between items-center rounded-lg p-2 shadow-sm bg-background dark:bg-muted"
              >
                <div>
                  <p className="text-sm font-medium dark:text-gray-200">{tx.category}</p>
                  <p className="text-xs text-gray-500">{formatTime(tx.createdAt)}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-sm font-light ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {tx.type === 'income' ? '+' : '-'} {formatAmount(tx.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
