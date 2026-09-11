"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type TypeBreakdownRow = { name: string; qty: number };

export default function TypeBreakdownChart({ data }: { data: TypeBreakdownRow[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
          <XAxis type="number" stroke="#a3a3a3" allowDecimals={false} />
          <YAxis type="category" dataKey="name" stroke="#a3a3a3" width={100} />
          <Tooltip contentStyle={{ background: "#171717", border: "1px solid #404040" }} />
          <Bar dataKey="qty" fill="#84cc16" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
