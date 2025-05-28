'use client'

import { useState, useEffect, useRef, ChangeEvent, FormEvent } from 'react'
import { useUser } from '@clerk/nextjs'
import { motion } from 'framer-motion'

const categories = {
  expense: [
    'Food & Dining', 'Transportation', 'Housing', 'Utilities', 'Entertainment',
    'Healthcare', 'Shopping', 'Personal Care', 'Education', 'Travel', 'Other',
  ],
  income: [
    'Salary', 'Freelance', 'Investment', 'Gift', 'Refund', 'Rental Income', 'Business', 'Other',
  ],
} as const

type TransactionType = keyof typeof categories

type FieldProps = {
  id: string
  label: string
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  required?: boolean
  type?: string
  placeholder?: string
  step?: string
  min?: string | number
}

const InputField = ({
  id, label, value, onChange, required, type = 'text',
  placeholder, step, min,
}: FieldProps) => (
  <div className="flex flex-col gap-1">
    <label htmlFor={id} className="text-sm font-medium text-gray-800 dark:text-gray-200">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      {...{ id, type, value, onChange, required, placeholder, step, min }}
      className="rounded-lg border border-gray-300 px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600"
    />
  </div>
)

type SelectProps = Omit<FieldProps, 'type' | 'step' | 'min' | 'placeholder'> & { options: readonly string[] }

const SelectField = ({ id, label, value, onChange, options, required }: SelectProps) => (
  <div className="flex flex-col gap-1">
    <label htmlFor={id} className="text-sm font-medium text-gray-800 dark:text-gray-200">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      {...{ id, value, onChange, required }}
      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600"
    >
      <option value="" disabled>Select {label.toLowerCase()}</option>
      {options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
)

export default function NewTransactionForm() {
  const { user, isSignedIn } = useUser()
  const messageRef = useRef<HTMLParagraphElement>(null)

  const [formData, setFormData] = useState({
    amount: '', description: '', category: '', date: '', time: '',
    type: 'expense' as TransactionType,
  })

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  // On mount, initialize date, time, and default category/description
  useEffect(() => {
    const now = new Date()
    setFormData(f => ({
      ...f,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5),
      category: 'Utilities',        // default category
      description: 'Utilities',     // default description same as category
    }))
  }, [])

  // Scroll into view message on status change (success/error)
  useEffect(() => {
    if (status !== 'idle') {
      messageRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [status])

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target

    setFormData(f => {
      if (id === 'category') {
        // If description empty or equals previous category, update it to new category
        const newDescription = (!f.description || f.description === f.category) ? value : f.description
        return { ...f, category: value, description: newDescription }
      }
      return { ...f, [id]: value }
    })
  }

  const toggleType = (type: TransactionType) => {
    setFormData(f => ({
      ...f,
      type,
      category: type === 'expense' ? 'Utilities' : '',   // reset category on type change, default Utilities for expense
      description: type === 'expense' ? 'Utilities' : '', // same for description
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return setError('User not found.'), setStatus('error')

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Amount must be greater than 0.')
      setStatus('error')
      return
    }

    setStatus('loading')
    setError('')

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userId: user.id,
          description: formData.description.trim(),
        }),
      })

      if (!res.ok) {
        const errRes = await res.json()
        throw new Error(errRes.error || 'Submission failed')
      }

      setStatus('success')
      setFormData(f => ({
        ...f,
        amount: '',
        description: f.category,  // reset description to current category after submit
        time: new Date().toTimeString().slice(0, 5),
      }))
      setTimeout(() => setStatus('idle'), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setStatus('error')
    }
  }

  if (!isSignedIn) {
    return (
      <p className="mt-16 text-center text-lg text-gray-600 dark:text-gray-300">
        Please sign in to add transactions.
      </p>
    )
  }

  return (
    <div className="mx-auto mt-12 max-w-lg rounded-2xl border border-gray-200 bg-white p-8 shadow-lg dark:bg-zinc-900 dark:border-gray-700">
      <h1 className="mb-6 text-center text-3xl  text-gray-900 dark:text-white font-sans font-semibold">Add Transaction</h1>

      <div className="mb-6 grid grid-cols-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        {(['income', 'expense'] as const).map(type => (
          <button
            key={type}
            type="button"
            onClick={() => toggleType(type)}
            aria-pressed={formData.type === type}
            className={`py-2 text-sm font-medium transition-colors ${formData.type === type
              ? type === 'income'
                ? 'bg-green-600 text-white'
                : 'bg-red-600 text-white'
              : 'text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
          >
            {type[0].toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <InputField
          id="amount"
          label="Amount"
          type="number"
          value={formData.amount}
          onChange={handleChange}
          required
          step="0.01"
          min="0"
          placeholder="0.00"
        />
        <InputField
          id="description"
          label="Description"
          value={formData.description}
          onChange={handleChange}
          required
          placeholder="e.g. Grocery Shopping"
        />
        <SelectField
          id="category"
          label="Category"
          value={formData.category}
          onChange={handleChange}
          options={categories[formData.type]}
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <InputField id="date" label="Date" type="date" value={formData.date} onChange={handleChange} required />
          <InputField id="time" label="Time" type="time" value={formData.time} onChange={handleChange} />
        </div>

        {(status === 'error' || status === 'success') && (
          <motion.p
            ref={messageRef}
            className={`text-center text-sm font-medium ${status === 'error' ? 'text-red-600' : 'text-green-600'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {status === 'error' ? error : 'Transaction added successfully!'}
          </motion.p>
        )}

        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full rounded-lg bg-blue-600 px-6 py-3 text-center text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {status === 'loading' ? 'Submitting...' : 'Add Transaction'}
        </button>
      </form>
    </div>
  )
}
