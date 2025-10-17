import { LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

interface MiniChartProps {
  title: string;
  data: { day: string; fullDate?: string; value: number }[];
  type: "line" | "bar";
  color: string;
}

export const MiniChart = ({ title, data, type, color }: MiniChartProps) => {
  // Validação dos dados
  const chartData = Array.isArray(data) ? data : [];
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-2 shadow-lg">
          <p className="font-semibold text-[hsl(var(--card-foreground))] text-xs">{label}</p>
          {data.fullDate && (
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">
              {new Date(data.fullDate).toLocaleDateString('pt-BR')}
            </p>
          )}
          <p className="text-xs" style={{ color: color }}>
            {title.includes('Temperatura') 
              ? `${payload[0].value.toFixed(1)}°C`
              : `${payload[0].value.toFixed(1)}mm`
            }
          </p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="bg-[hsl(var(--card))] rounded-2xl p-5 shadow-lg hover-lift animate-fade-in">
      <h3 className="text-sm font-semibold text-[hsl(var(--card-foreground))] mb-4">{title}</h3>
      {chartData.length === 0 ? (
        <div className="h-[120px] flex items-center justify-center text-muted-foreground text-xs">
          Carregando...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={120}>
          {type === "line" ? (
            <LineChart data={chartData}>
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                angle={-45}
                textAnchor="end"
                height={40}
                interval={0}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={{ fill: color, r: 3, strokeWidth: 1, stroke: "white" }}
                activeDot={{ r: 4, stroke: color, strokeWidth: 2, fill: "white" }}
              />
            </LineChart>
          ) : (
            <BarChart data={chartData}>
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                angle={-45}
                textAnchor="end"
                height={40}
                interval={0}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill={color} radius={[2, 2, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      )}
    </div>
  );
};
