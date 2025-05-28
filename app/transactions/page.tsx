'use client';

import React from 'react';
import NewTransactionForm from '../components/NewTransactionForm';
import RecentTransactions from '../components/RecentTransactions';
import NetWorthChart from '../components/NetWorthChart';
import { useUser } from '@clerk/nextjs';

const Page = () => {
  const { user } = useUser();
  const userId = user?.id || '';

  return (
    <main className="mx-auto min-h-screen dark:bg-black bg-gray-50 p-4 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left column: Net Worth (top) + Recent Transactions (below) */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Net Worth - smaller height and padding */}
          <section className="shadow-lg rounded-xl p-4 lg:p-6 bg-white dark:bg-black max-h-64 lg:max-h-72 overflow-hidden">
            <h1 className="text-xl lg:text-2xl font-bold text-gray-800 dark:text-gray-200 mb-3">
              Your Net Worth
            </h1>
            <NetWorthChart userId={userId} />
          </section>

          {/* Recent Transactions */}
          <section className="shadow-lg rounded-xl p-6 bg-white dark:bg-black flex-grow overflow-auto">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-100 mb-4">
              Recent Transactions
            </h2>
            <RecentTransactions userId={userId} />
          </section>
        </div>

        {/* Right column: Add New Transaction Form centered vertically */}
        <section className="shadow-lg rounded-xl p-6 bg-white dark:bg-black flex flex-col justify-center">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-100 mb-4 text-center">
            Add New Transaction
          </h2>
          <NewTransactionForm />
        </section>
      </div>
    </main>
  );
};

export default Page;
