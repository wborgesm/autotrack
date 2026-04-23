"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface StatusPieChartProps {
  data: { name: string; value: number; color: string }[];
}

export function StatusPieChart({ data }: StatusPieChartProps) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ name, value }) => `${name}: ${value}`}
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => `${value} ordens`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
