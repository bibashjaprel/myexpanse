import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';
import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
} from 'date-fns';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const filter = searchParams.get('filter') || 'all-time';

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const now = new Date();
    let fromDate: Date | undefined;

    switch (filter) {
      case 'today':
        fromDate = startOfDay(now);
        break;
      case 'this-week':
        fromDate = startOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'this-month':
        fromDate = startOfMonth(now);
        break;
      case 'this-year':
        fromDate = startOfYear(now);
        break;
      case 'all-time':
        fromDate = undefined;
        break;
      default:
        return NextResponse.json({ error: 'Invalid filter' }, { status: 400 });
    }

    const cacheKey = `monthly:${userId}:${filter}`;
    const cached = await redis.get(cacheKey);

    if (typeof cached === 'string') {
      try {
        const parsed = JSON.parse(cached);
        return NextResponse.json(parsed);
      } catch (parseError) {
        console.warn('Failed to parse cached monthly data:', parseError);
        await redis.del(cacheKey); // clear invalid cache
      }
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        ...(fromDate && {
          date: {
            gte: fromDate,
          },
        }),
      },
      orderBy: { date: 'asc' },
    });

    const monthlyData = transactions.reduce((acc, txn) => {
      const key = txn.date.toLocaleString('default', { month: 'short', year: 'numeric' });
      if (!acc[key]) {
        acc[key] = { month: key, income: 0, expense: 0 };
      }
      if (txn.type === 'income') {
        acc[key].income += txn.amount;
      } else if (txn.type === 'expense') {
        acc[key].expense += txn.amount;
      }
      return acc;
    }, {} as Record<string, { month: string; income: number; expense: number }>);

    const result = Object.values(monthlyData);

    // Cache the stringified result for 1 hour (3600 seconds)
    await redis.set(cacheKey, JSON.stringify(result), { ex: 3600 });

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/transactions/monthly error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
