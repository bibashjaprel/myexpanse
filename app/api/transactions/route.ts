import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Basic validation
    if (!data.userId || !data.amount || !data.description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Convert amount to number (float)
    const amount = parseFloat(data.amount)
    if (isNaN(amount)) {
      return NextResponse.json({ error: 'Invalid amount value' }, { status: 400 })
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: data.userId,
        amount, // use the parsed float here
        description: data.description,
        category: data.category,
        type: data.type,
        date: new Date(data.date),
        time: data.time,
      },
    })

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Error creating transaction:', error)
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
    console.error('Error fetching transactions:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
