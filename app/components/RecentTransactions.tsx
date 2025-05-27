'use client';

import { useEffect, useState } from 'react';

type Transaction = {
  id: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  createdAt: string;
};

export default function RecentTransactions({
  userId,
  refreshSignal,
}: {
  userId: string;
  refreshSignal?: any;
}) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/transactions?userId=${userId}`);
        const data = await res.json();
        setTransactions(data.slice(0, 5));
      } catch (err) {
        console.error("Error fetching transactions:", err);
      } finally {
        setLoading(false);
      }

    };

    fetchTransactions();
  }, [userId, refreshSignal]);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="h-14    rounded-md animate-pulse" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return <p className="text-gray-500 text-sm">No recent transactions found.</p>;
  }

  return (
    <div className="space-y-">
      {transactions.map(tx => (
        <div
          key={tx.id}
          className="flex justify-between items-center rounded-lg p-2 shadow-sm"
        >
          <div>
            <p className="text-sm font-medium dark:text-gray-200">{tx.category}</p>
            <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleDateString()}</p>
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
