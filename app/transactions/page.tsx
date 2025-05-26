'use client';

import React from 'react';
import NewTransactionForm from '../components/NewTransactionForm';
import RecentTransactions from '../components/RecentTransactions';
import { useUser } from '@clerk/nextjs';

const Page = () => {
  const { user } = useUser();
  const userId = user?.id || '';

  return (
    <main className=" flex justify-center ">
      <section className=" shadow-lg rounded-xl p-6">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-100 mb-4">
          Recent Transactions
        </h2>
        <RecentTransactions userId={userId} />
      </section>

      <section className=" shadow-lg rounded-xl p-6">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-100 mb-4">
          Add New Transaction
        </h2>
        <NewTransactionForm />
      </section>
    </main>
  );
};

export default Page;
