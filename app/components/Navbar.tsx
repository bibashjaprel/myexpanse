'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-zinc-900 border-b border-gray-200 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between p-4 md:p-6">
        <h1 className="text-2xl font-semibold text-green-800 select-none">MyExpense</h1>

        {/* Mobile Menu Button */}
        <button
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            {menuOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M3 12h18M3 6h18M3 18h18" />
            )}
          </svg>
        </button>

        {/* Navigation Links */}
        <nav
          className={`
            fixed inset-x-0 top-16 bg-white border-b border-gray-200 md:static md:border-0 md:bg-transparent md:flex md:items-center
            ${menuOpen ? 'block' : 'hidden'} md:block
          `}
        >
          <ul className="flex flex-col md:flex-row md:gap-6 font-semibold text-white">
            {['/', '/transactions', '/dashboard'].map((href) => {
              const label = href === '/' ? 'Home' : href.slice(1).charAt(0).toUpperCase() + href.slice(2)
              return (
                <li key={href} className="border-b border-gray-200 md:border-none">
                  <Link
                    href={href}
                    className="block px-4 py-3 hover:text-green-600 transition md:px-0 md:py-0"
                    onClick={() => setMenuOpen(false)}
                  >
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Auth Buttons */}
        {hasMounted && (
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
                    userButtonTrigger:
                      'focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md',
                  },
                }}
              />
            </SignedIn>
          </div>
        )}
      </div>
    </header>
  )
}
