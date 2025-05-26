'use client'

import { useState, useEffect, ChangeEvent, FormEvent } from 'react'
import { useUser } from '@clerk/nextjs'

const categories = {
  expense: ['Food & Dining', 'Transportation', 'Housing', 'Utilities', 'Entertainment', 'Healthcare', 'Shopping', 'Personal Care', 'Education', 'Travel', 'Other'],
  income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Refund', 'Rental Income', 'Business', 'Other'],
}

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

const InputField = ({ id, label, value, onChange, required, type = 'text', placeholder, step, min }: FieldProps) => (
  <div className="flex flex-col">
    <label htmlFor={id} className="mb-1 text-sm font-semibold text-gray-900">
      {label} {required && <span className="text-red-600">*</span>}
    </label>
    <input
      {...{ id, type, value, onChange, required, placeholder, step, min }}
      className="rounded-md border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400 transition"
    />
  </div>
)

type SelectProps = Omit<FieldProps, 'type' | 'step' | 'min' | 'placeholder'> & { options: string[] }

const SelectField = ({ id, label, value, onChange, options, required }: SelectProps) => (
  <div className="flex flex-col">
    <label htmlFor={id} className="mb-1 text-sm font-semibold text-gray-900">
      {label} {required && <span className="text-red-600">*</span>}
    </label>
    <select
      {...{ id, value, onChange, required }}
      className="rounded-md border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400 transition"
    >
      <option value="" disabled>Select {label.toLowerCase()}</option>
      {options.map(opt => <option key={opt}>{opt}</option>)}
    </select>
  </div>
)

export default function NewTransactionForm() {
  const { user, isSignedIn } = useUser()
  const [formData, setFormData] = useState({ amount: '', description: '', category: '', date: '', time: '', type: 'expense' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    const now = new Date()
    setFormData(f => ({
      ...f,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5),
    }))
  }, [])

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target
    setFormData(f => ({ ...f, [id]: value }))
  }

  const toggleType = (type: 'expense' | 'income') => setFormData(f => ({ ...f, type, category: '' }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError('User not found.')
      setStatus('error')
      return
    }

    setStatus('loading')
    setError('')
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user.id }),
      })

      if (!res.ok) throw new Error((await res.json()).error || 'Submission failed')
      setStatus('success')
      setFormData(f => ({ ...f, amount: '', description: '', category: '' }))
      setTimeout(() => setStatus('idle'), 3000)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError(String(err))
      }
      setStatus('error')
    }
  }

  if (!isSignedIn) return <p className="mt-16 text-center text-lg text-gray-600 font-medium">Please sign in to add transactions.</p>

  return (
    <div className="mx-auto mt-12 max-w-md rounded-xl bg-white p-8 shadow-lg ring-1 ring-gray-200">
      <h1 className="mb-8 text-center text-4xl font-extrabold text-gray-900">Add New Transaction</h1>

      <div className="mb-8 flex overflow-hidden rounded-full bg-gray-100 shadow-inner">
        {(['income', 'expense'] as const).map(type => (
          <button
            key={type}
            type="button"
            onClick={() => toggleType(type)}
            className={`flex-1 rounded-full px-6 py-3 text-lg font-semibold transition-colors ${formData.type === type
              ? type === 'income'
                ? 'bg-green-600 text-white shadow-md hover:bg-green-700'
                : 'bg-red-600 text-white shadow-md hover:bg-red-700'
              : 'text-gray-700 hover:bg-gray-200'
              }`}
          >
            {type[0].toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <InputField id="amount" label="Amount" type="number" value={formData.amount} onChange={handleChange} required step="0.01" min="0" placeholder="0.00" />
        <InputField id="description" label="Description" value={formData.description} onChange={handleChange} required placeholder="e.g. Groceries" />
        <SelectField id="category" label="Category" value={formData.category} onChange={handleChange} options={categories[formData.type]} required />
        <div className="grid grid-cols-2 gap-6">
          <InputField id="date" label="Date" type="date" value={formData.date} onChange={handleChange} required />
          <InputField id="time" label="Time" type="time" value={formData.time} onChange={handleChange} />
        </div>
        {status === 'error' && <p className="text-center text-sm font-medium text-red-600">{error}</p>}
        {status === 'success' && <p className="text-center text-sm font-medium text-green-600">Transaction added!</p>}
        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full rounded-lg bg-blue-600 py-3 text-lg font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {status === 'loading' ? 'Saving...' : 'Add Transaction'}
        </button>
      </form>
    </div>
  )
}
