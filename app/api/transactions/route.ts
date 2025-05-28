import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';

interface TransactionData {
  userId?: string;
  amount?: string | number;
  description?: string;
  category?: string;
  type?: string;
  date?: string;
  time?: string;
}

export async function POST(request: Request) {
  try {
    const data = (await request.json()) as TransactionData;
    const { userId, amount, description, category, type, date, time } = data;

    // Validate required fields
    if (!userId || !amount || !description || !category || !type || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Parse and validate amount
    const parsedAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Validate transaction type
    if (type !== 'income' && type !== 'expense') {
      return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 });
    }

    // Create transaction
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

    // Invalidate related caches
    const transactionsCacheKey = `transactions:${userId}`;
    const monthlyCacheKey = `monthly_transactions_${userId}`;

    try {
      await Promise.all([
        redis.del(transactionsCacheKey),
        redis.del(monthlyCacheKey),
      ]);
    } catch (cacheError) {
      console.warn('Failed to invalidate cache:', cacheError);
      // Don't fail the request if cache invalidation fails
    }

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

    // Try to get from cache first
    try {
      const cached = await redis.get(cacheKey);
      if (cached && typeof cached === 'string') {
        const parsed = JSON.parse(cached);
        return NextResponse.json(parsed);
      }
    } catch (cacheError) {
      console.warn('Cache retrieval failed:', cacheError);
      // Continue to database fetch
    }

    // Fetch from database
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }, // Changed to createdAt for better sorting
      take: 10, // Increased to show more recent transactions
      select: {
        id: true,
        amount: true,
        category: true,
        type: true,
        createdAt: true,
        description: true,
      },
    });

    // Cache the results with 5 minutes expiration
    try {
      await redis.set(cacheKey, JSON.stringify(transactions), { ex: 3600 });
    } catch (cacheError) {
      console.warn('Failed to cache transactions:', cacheError);
      // Don't fail the request if caching fails
    }

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('GET /api/transactions error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
