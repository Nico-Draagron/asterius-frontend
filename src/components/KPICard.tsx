import { LucideIcon } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number }[] | string;
  iconColor?: string;
}

export const KPICard = ({ title, value, subtitle, icon: Icon, trend, iconColor = "hsl(var(--accent))" }: KPICardProps) => {
  return (
    <div className="bg-[hsl(var(--card))] rounded-2xl p-6 shadow-lg hover-lift animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-medium text-[hsl(var(--muted-foreground))]">{title}</h3>
        <Icon className="w-5 h-5" style={{ color: iconColor }} />
      </div>
      <p className="text-3xl font-bold text-[hsl(var(--card-foreground))] mb-1">{value}</p>
      {subtitle && (
        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3">{subtitle}</p>
      )}
      {trend && Array.isArray(trend) && trend.length > 0 && (
        <div className="h-12 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--accent))"
                strokeWidth={2}
                dot={false}
                opacity={0.4}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {trend && typeof trend === 'string' && (
        <div className="flex items-center gap-1 text-sm">
          <span className={`inline-block w-2 h-2 rounded-full ${
            trend === 'up' ? 'bg-green-500' : 
            trend === 'down' ? 'bg-red-500' : 'bg-yellow-500'
          }`}></span>
          <span className="text-muted-foreground capitalize">{trend === 'up' ? 'Alta' : trend === 'down' ? 'Baixa' : 'Estável'}</span>
        </div>
      )}
    </div>
  );
};
