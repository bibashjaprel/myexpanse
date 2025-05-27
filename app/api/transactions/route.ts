import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Validate required fields
    const { userId, amount, description, category, type, date, time } = data

    if (!userId || !amount || !description || !category || !type || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount: parsedAmount,
        description: description.trim(),
        category,
        type,
        date: new Date(date),
        time: time || new Date().toTimeString().slice(0, 5),
      },
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error('POST /api/transactions error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 5,
    })

    return NextResponse.json(transactions)
  } catch (error) {
    console.error('GET /api/transactions error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
