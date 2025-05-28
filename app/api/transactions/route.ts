import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = (await request.json()) as {
      userId?: string;
      amount?: string | number;
      description?: string;
      category?: string;
      type?: string;
      date?: string;
      time?: string;
    };

    const { userId, amount, description, category, type, date, time } = data;

    if (!userId || !amount || !description || !category || !type || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const parsedAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount: parsedAmount,
        description: description.trim(),
        category,
        type,
        date: new Date(date),
        time: time ?? new Date().toTimeString().slice(0, 5),
      },
    });

    // Invalidate cache after creating new transaction
    const cacheKey = `transactions:${userId}`;
    await redis.del(cacheKey);

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('POST /api/transactions error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const cacheKey = `transactions:${userId}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return NextResponse.json(parsed);
      } catch (parseError) {
        console.warn('Failed to parse cached transactions:', parseError);
        // Continue to fetch fresh data from DB
      }
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 5,
    });

    // Cache the stringified transactions with 5 minutes expiration
    await redis.set(cacheKey, JSON.stringify(transactions), { ex: 300 });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('GET /api/transactions error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

