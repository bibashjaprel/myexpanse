import React from 'react';

const Page = () => {
  return (
    <>
      <main className="flex flex-col items-center justify-center min-h-screen px-6 bg-zinc-100 dark:bg-zinc-900 text-center">
        <h1 className="text-5xl font-extrabold text-green-700 dark:text-green-400 mb-8">
          Welcome to MyExpense
        </h1>
        <p className="max-w-xl text-lg text-zinc-700 dark:text-zinc-300 mb-4 leading-relaxed">
          MyExpense is a personal finance app designed to help you manage your finances effectively and effortlessly.
        </p>
        <p className="max-w-md text-md text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
          Track your expenses, monitor your income, and take control of your financial health with ease.
        </p>


      </main>

      <footer className="absolute bottom-0 w-full text-center text-zinc-500 dark:text-zinc-400 py-4 border-t border-zinc-300 dark:border-zinc-700">
        <p>&copy; {new Date().getFullYear()} MyExpense. All rights reserved.</p>
      </footer>
    </>
  );
};

export default Page;
