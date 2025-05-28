'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { TooltipItem } from 'chart.js';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

interface NetWorthChartProps {
  userId: string;
}

export default function NetWorthChart({ userId }: NetWorthChartProps) {
  const [data, setData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/transactions/monthly?userId=${encodeURIComponent(userId)}`);
        if (!res.ok) throw new Error(`Failed to fetch data: ${res.statusText}`);

        const json = await res.json();

        if (json && typeof json === 'object' && 'error' in json) {
          throw new Error(json.error);
        }

        if (!Array.isArray(json)) {
          throw new Error('Invalid data format received');
        }

        setData(json);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
        setError(errorMessage);
        setData([]);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchData();
    } else {
      setData([]);
      setLoading(false);
    }
  }, [userId]);

  const chartData = useMemo(() => ({
    labels: data.map((d) => d.month),
    datasets: [
      {
        label: 'Income',
        data: data.map((d) => d.income),
        borderColor: '#00ff7f',
        backgroundColor: 'rgba(0,255,127,0.2)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Expense',
        data: data.map((d) => d.expense),
        borderColor: '#ff4d4d',
        backgroundColor: 'rgba(255,77,77,0.2)',
        fill: true,
        tension: 0.4,
      },
    ],
  }), [data]);

  const options = useMemo(() => ({
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'line'>) => {
            const value = context.parsed.y ?? 0;
            return `${context.dataset.label}: $${value.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (tickValue: string | number) => {
            const num = typeof tickValue === 'number' ? tickValue : Number(tickValue);
            return `$${num.toLocaleString()}`;
          },
        },
      },
    },
  }), []);

  if (loading) {
    return <div className="text-center p-6 text-gray-300">Loading chart...</div>;
  }

  if (error) {
    return <div className="text-center p-6 text-red-500">Error: {error}</div>;
  }

  if (data.length === 0) {
    return <div className="text-center p-6 text-gray-400">No data available.</div>;
  }

  return (
    <div className="bg-zinc-900 p-6 rounded-xl">
      <Line data={chartData} options={options} />
    </div>
  );
}
