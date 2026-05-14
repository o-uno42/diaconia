import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { WeeklyPoints } from '@shared/types';
import { useAppContext } from '../../store/AppContext';
import { t } from '../../i18n/translations';

interface PointsChartProps {
  pointsHistory: WeeklyPoints[];
}

const CustomXAxisTick = (props: any) => {
  const { x, y, payload } = props;
  const label = payload.value as string;
  
  // Pattern per due mesi: "30 Mar–5 Apr" (con en-dash)
  const twoMonthMatch = label.match(/^(\d+)\s+([A-Za-z]+)–(\d+)\s+([A-Za-z]+)$/);
  if (twoMonthMatch) {
    const [, day1, month1, day2, month2] = twoMonthMatch;
    return (
      <g>
        <text x={x} y={y + 8} textAnchor="middle" fill="#78716c" fontSize={12} fontWeight={500}>
          {day1}–{day2}
        </text>
        <text x={x} y={y + 22} textAnchor="middle" fill="#78716c" fontSize={12} fontWeight={500}>
          {month1}–{month2}
        </text>
      </g>
    );
  }
  
  // Pattern per un mese: "1–7 Mar" (con en-dash)
  const oneMonthMatch = label.match(/^(\d+)–(\d+)\s+([A-Za-z]+)$/);
  if (oneMonthMatch) {
    const [, day1, day2, month] = oneMonthMatch;
    return (
      <g>
        <text x={x} y={y + 8} textAnchor="middle" fill="#78716c" fontSize={12} fontWeight={500}>
          {day1}–{day2}
        </text>
        <text x={x} y={y + 22} textAnchor="middle" fill="#78716c" fontSize={12} fontWeight={500}>
          {month}
        </text>
      </g>
    );
  }
  
  // Fallback per altri formati
  return <text x={x} y={y} textAnchor="middle" fill="#78716c" fontSize={12}>{label}</text>;
};

export default function PointsChart({ pointsHistory }: PointsChartProps) {
  const { state } = useAppContext();
  const lang = state.language;

  if (pointsHistory.length === 0) {
    return <p className="text-stone-800/40 text-sm text-center py-8">{t('common_no_data', lang)}</p>;
  }

  return (
    <div className="h-72 w-full pb-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={pointsHistory} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(120, 113, 108, 0.2)" />
          <XAxis dataKey="weekLabel" tick={<CustomXAxisTick />} height={44} tickMargin={8} axisLine={{ stroke: '#d6d3d1' }} />
          <YAxis width={34} tick={{ fill: '#78716c', fontSize: 12, fontWeight: 500 }} axisLine={{ stroke: '#d6d3d1' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.85)', border: '1px solid rgba(212, 207, 202, 0.4)',
              borderRadius: '12px', color: '#78716c', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            }}
            labelStyle={{ color: '#57514f', fontWeight: 600 }}
          />
          <Line
            type="monotone" dataKey="points" name={t('chart_points', lang)} stroke="#6366f1" strokeWidth={3}
            dot={{ fill: '#6366f1', r: 5, strokeWidth: 2, stroke: '#312e81' }}
            activeDot={{ r: 7, fill: '#818cf8', stroke: '#6366f1', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
