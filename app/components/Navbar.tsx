'use client'
import Link from 'next/link'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'

export default function Navbar() {
  return (
    <header className="flex justify-between items-center p-4 gap-4 h-16 border-b border-gray-200 bg-white sticky top-0 z-50 shadow-md">
      <h1 className="text-2xl font-semibold text-green-800 select-none">
        MyExpense
      </h1>
      <ul className='font-semibold text-gray-700 flex items-center gap-4'>
        <Link href="/" className="text-gray-700 hover:text-green-600 transition">
          <li className="inline-block px-4 py-2">Home</li>
        </Link>
        <Link href="/transactions" className="text-gray-700 hover:text-green-600 transition">
          <li className="inline-block px-4 py-2">Transactions</li>
        </Link>
        <Link href="/dashboard" className="text-gray-700 hover:text-green-600 transition">
          <li className="inline-block px-4 py-2">Dashboard</li>
        </Link>

      </ul>
      <div className="flex items-center gap-4">
        <SignedOut>
          <SignInButton mode="modal">
            <button
              type="button"
              className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Login
            </button>
          </SignInButton>
        </SignedOut>

        <SignedIn>
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: 'w-9 h-9',
                userButtonTrigger: 'focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md',
              },
            }}
          />
        </SignedIn>
      </div>
    </header>
  )
}
