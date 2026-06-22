'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const AXIS = { stroke: '#454E5E', fontSize: 11, tickLine: false, axisLine: false };

function ChartTip({ active, payload, label, fmt }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-ink-800/95 px-3 py-2 text-xs shadow-float backdrop-blur">
      {label != null && <p className="mb-1 font-semibold text-white">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="flex items-center gap-2 text-mist-200">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
          {p.name}: <span className="font-semibold text-white">{fmt ? fmt(p.value) : p.value}</span>
        </p>
      ))}
    </div>
  );
}

export function SpendArea({ data, fmt }: { data: any[]; fmt?: (v: number) => string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -18 }}>
        <defs>
          <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00E5FF" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#00E5FF" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="m" {...AXIS} />
        <YAxis {...AXIS} width={42} />
        <Tooltip content={<ChartTip fmt={fmt} />} cursor={{ stroke: '#ffffff20' }} />
        <Area
          type="monotone"
          dataKey="spend"
          name="Spend"
          stroke="#00E5FF"
          strokeWidth={2.5}
          fill="url(#spendFill)"
          animationDuration={1400}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function GrowthArea({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -8 }}>
        <defs>
          <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7B61FF" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#7B61FF" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gTxns" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00FFA3" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#00FFA3" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="m" {...AXIS} />
        <YAxis {...AXIS} width={48} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
        <Tooltip content={<ChartTip />} cursor={{ stroke: '#ffffff20' }} />
        <Area type="monotone" dataKey="users" name="Users" stroke="#7B61FF" strokeWidth={2.5} fill="url(#gUsers)" animationDuration={1600} />
        <Area type="monotone" dataKey="txns" name="Txns" stroke="#00FFA3" strokeWidth={2.5} fill="url(#gTxns)" animationDuration={1600} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CategoryBars({ data, fmt }: { data: any[]; fmt?: (v: number) => string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -18 }}>
        <XAxis dataKey="m" {...AXIS} />
        <YAxis {...AXIS} width={42} />
        <Tooltip content={<ChartTip fmt={fmt} />} cursor={{ fill: '#ffffff08' }} />
        <Bar dataKey="txns" name="Transactions" radius={[6, 6, 0, 0]} animationDuration={1200}>
          {data.map((_, i) => (
            <Cell key={i} fill={i % 2 === 0 ? '#00E5FF' : '#7B61FF'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Donut({ data }: { data: { name: string; value: number; color: string }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="62%"
          outerRadius="92%"
          paddingAngle={3}
          stroke="none"
          animationDuration={1200}
        >
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Pie>
        <Tooltip content={<ChartTip fmt={(v: number) => `${v}%`} />} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function LatencyLine({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <XAxis dataKey="h" {...AXIS} interval={3} />
        <YAxis {...AXIS} width={42} domain={['dataMin - 40', 'dataMax + 40']} />
        <Tooltip content={<ChartTip fmt={(v: number) => `${v}ms`} />} cursor={{ stroke: '#ffffff20' }} />
        <Line type="monotone" dataKey="ms" name="Latency" stroke="#00FFA3" strokeWidth={2.5} dot={false} animationDuration={1400} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function FraudArea({ data, fmt }: { data: any[]; fmt?: (v: number) => string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <defs>
          <linearGradient id="fraudFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF4D6D" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#FF4D6D" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="d" {...AXIS} />
        <YAxis {...AXIS} width={42} />
        <Tooltip content={<ChartTip fmt={fmt} />} cursor={{ stroke: '#ffffff20' }} />
        <Area type="monotone" dataKey="baseline" name="Baseline" stroke="#454E5E" strokeWidth={1.5} strokeDasharray="4 4" fill="none" />
        <Area type="monotone" dataKey="amount" name="Amount" stroke="#FF4D6D" strokeWidth={2.5} fill="url(#fraudFill)" animationDuration={1400} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
