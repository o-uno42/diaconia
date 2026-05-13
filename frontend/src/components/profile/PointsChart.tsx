import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { WeeklyPoints } from '@shared/types';

interface PointsChartProps {
  pointsHistory: WeeklyPoints[];
}

export default function PointsChart({ pointsHistory }: PointsChartProps) {
  if (pointsHistory.length === 0) {
    return <p className="text-white/40 text-sm text-center py-8">Nessun dato disponibile</p>;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={pointsHistory} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="weekLabel" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px', color: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
            labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
          />
          <Line
            type="monotone" dataKey="points" stroke="#6366f1" strokeWidth={3}
            dot={{ fill: '#6366f1', r: 5, strokeWidth: 2, stroke: '#312e81' }}
            activeDot={{ r: 7, fill: '#818cf8', stroke: '#6366f1', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
