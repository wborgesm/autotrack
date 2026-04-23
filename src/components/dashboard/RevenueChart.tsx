"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface RevenueChartProps {
  data: {
    mes: string;
    receita: number;
    despesa: number;
    lucro: number;
  }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
        <p className="font-medium text-gray-900 dark:text-white mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function RevenueChart({ data }: RevenueChartProps) {
  // Calcular médias para traçar linha de referência (opcional)
  const avgReceita = data.reduce((acc, d) => acc + d.receita, 0) / data.length;
  const avgDespesa = data.reduce((acc, d) => acc + d.despesa, 0) / data.length;

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          barSize={24}
          barGap={4}
        >
          <defs>
            <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.6} />
            </linearGradient>
            <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.6} />
            </linearGradient>
            <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          
          <XAxis
            dataKey="mes"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            dy={10}
          />
          
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
          
          <Legend
            iconType="circle"
            wrapperStyle={{ paddingTop: 20 }}
          />
          
          <Bar
            dataKey="receita"
            name="Receita"
            fill="url(#colorReceita)"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="despesa"
            name="Despesa"
            fill="url(#colorDespesa)"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="lucro"
            name="Lucro"
            fill="url(#colorLucro)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
