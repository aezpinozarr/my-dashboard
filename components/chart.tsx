"use client"

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts"

type Point = { name: string; value: number }

const data: Point[] = [
  { name: "Lun", value: 120 },
  { name: "Mar", value: 210 },
  { name: "Mié", value: 180 },
  { name: "Jue", value: 260 },
  { name: "Vie", value: 200 },
  { name: "Sáb", value: 170 },
  { name: "Dom", value: 230 },
]

export default function Chart() {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="currentColor" stopOpacity={0.35}/>
              <stop offset="95%" stopColor="currentColor" stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Area type="monotone" dataKey="value" stroke="currentColor" fill="url(#colorValue)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
