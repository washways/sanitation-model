
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ModelOutputs, ChartDataPoint } from '../types';
import { COLOR_PALETTE } from '../constants';

interface CostChartProps {
  outputs: ModelOutputs;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-slate-200 p-3 rounded shadow-lg z-50">
        <p className="font-bold text-brand-dark">{data.name}</p>
        <p className="text-brand-primary font-mono font-bold">
          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(data.value)}
        </p>
      </div>
    );
  }
  return null;
};

export const CostChart: React.FC<CostChartProps> = ({ outputs }) => {
  const rawData: ChartDataPoint[] = [
    { name: 'Health Care', value: outputs.costsUSD.healthCare, color: COLOR_PALETTE.healthCare },
    { name: 'Productivity', value: outputs.costsUSD.productivity, color: COLOR_PALETTE.productivity },
    { name: 'Mortality', value: outputs.costsUSD.mortality, color: COLOR_PALETTE.mortality },
    { name: 'Stunting', value: outputs.costsUSD.nutrition, color: COLOR_PALETTE.nutrition },
    { name: 'Access Time', value: outputs.costsUSD.accessTime, color: COLOR_PALETTE.accessTime },
    { name: 'Carbon (GHG)', value: outputs.costsUSD.carbon, color: COLOR_PALETTE.carbon },
    { name: 'Cholera', value: outputs.costsUSD.choleraAndFunerals, color: COLOR_PALETTE.choleraAndFunerals },
    { name: 'Tourism', value: outputs.costsUSD.tourism, color: COLOR_PALETTE.tourism },
  ];

  // Sort data descending for the bar chart
  const data = rawData.sort((a, b) => b.value - a.value);

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
          <XAxis 
             type="number" 
             tickFormatter={(val) => `$${(val / 1000000).toFixed(1)}M`} 
             stroke="#64748b"
             fontSize={11}
             fontWeight={500}
          />
          <YAxis 
             type="category" 
             dataKey="name" 
             width={100} 
             stroke="#475569"
             fontSize={12}
             fontWeight={600}
          />
          <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={28}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};