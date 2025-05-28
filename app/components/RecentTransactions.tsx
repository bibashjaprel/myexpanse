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
        const data: unknown = await res.json();
        if (Array.isArray(data) && data.every(isValidTransaction)) {
          const sorted = data.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setTransactions(sorted.slice(0, 5));
        } else {
          throw new Error('Unexpected data format from server.');
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error fetching transactions.';
        setTransactions([]);
        setError(message);
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

  function isValidTransaction(tx: any): tx is Transaction {
    return (
      typeof tx === 'object' &&
      tx !== null &&
      typeof tx.id === 'string' &&
      typeof tx.amount === 'number' &&
      typeof tx.category === 'string' &&
      (tx.type === 'income' || tx.type === 'expense') &&
      typeof tx.createdAt === 'string'
    );
  }

  // Group transactions by date labels
  function groupTransactionsByDate(transactions: Transaction[]) {
    const groups: { [key: string]: Transaction[] } = {};

    transactions.forEach(tx => {
      const date = new Date(tx.createdAt);
      let label: string;

      if (isToday(date)) {
        label = 'Today';
      } else if (isYesterday(date)) {
        label = 'Yesterday';
      } else {
        label = format(date, 'dd MMM yyyy');
      }

      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(tx);
    });

    return groups;
  }

  // Format time for display
  function formatTime(dateString: string): string {
    return format(new Date(dateString), 'hh:mm a');
  }

  // Simple Rs. formatting
  function formatAmount(amount: number): string {
    return `Rs. ${amount.toLocaleString()}`;
  }

  const LoadingSkeleton = () => (
    <div className="space-y-2">
      {[1, 2, 3].map((idx) => (
        <div key={idx} className="h-14 rounded-md animate-pulse bg-muted" />
      ))}
    </div>
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <p className="text-red-600 text-sm">Error: {error}</p>;
  }

  if (transactions.length === 0) {
    return <p className="text-gray-500 text-sm">No recent transactions found.</p>;
  }

  const groupedTransactions = groupTransactionsByDate(transactions);

  return (
    <div className="space-y-4">
      {Object.entries(groupedTransactions).map(([dateLabel, txs]) => (
        <div key={dateLabel}>
          {/* Date Label Header */}
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {dateLabel}
          </h3>

          {/* Transactions for this date */}
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
                    className={`text-sm font-light ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}
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
