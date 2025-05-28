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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTransactions() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/transactions?userId=${encodeURIComponent(userId)}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch transactions: ${res.statusText}`);
        }
        const data = await res.json();

        if (Array.isArray(data)) {
          // Sort descending by createdAt (newest first)
          const sorted = data.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setTransactions(sorted.slice(0, 5));
        } else {
          setTransactions([]);
          setError('Unexpected data format from server.');
        }
      } catch (err: any) {
        setTransactions([]);
        setError(err.message || 'Error fetching transactions.');
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchTransactions();
    } else {
      setTransactions([]);
      setLoading(false);
    }
  }, [userId, refreshSignal]);

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'dd MMM yyyy');
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((idx) => (
          <div key={idx} className="h-14 rounded-md animate-pulse bg-muted" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-red-600 text-sm">Error: {error}</p>;
  }

  if (transactions.length === 0) {
    return <p className="text-gray-500 text-sm">No recent transactions found.</p>;
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="flex justify-between items-center rounded-lg p-2 shadow-sm bg-background dark:bg-muted"
        >
          <div>
            <p className="text-sm font-medium dark:text-gray-200">{tx.category}</p>
            <p className="text-xs text-gray-500">{formatDate(tx.createdAt)}</p>
          </div>
          <div className="text-right">
            <span
              className={`text-sm font-light ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}
            >
              {tx.type === 'income' ? '+' : '-'} ₹{tx.amount}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
