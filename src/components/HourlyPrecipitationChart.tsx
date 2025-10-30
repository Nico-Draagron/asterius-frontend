import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { X } from "lucide-react";

interface HourlyData {
  hour: string;
  precipitation: number;
  temperature?: number;
}

interface HourlyPrecipitationChartProps {
  date: string;
  data: HourlyData[];
  onClose: () => void;
}

const getRainIntensity = (rain: number) => {
  if (rain === 0) return { type: "Sem Chuva", icon: "☀️", color: "#f59e0b" };
  if (rain < 2.5) return { type: "Garoa", icon: "🌦️", color: "#10b981" };
  if (rain < 10) return { type: "Chuva Fraca", icon: "🌧️", color: "#3b82f6" };
  if (rain < 50) return { type: "Chuva Moderada", icon: "⛈️", color: "#8b5cf6" };
  return { type: "Chuva Forte", icon: "🌩️", color: "#ef4444" };
};

const generateMockHourlyData = (): HourlyData[] => {
  const hours = [];
  for (let i = 0; i < 24; i++) {
    const hour = `${i.toString().padStart(2, '0')}:00`;
    let precipitation = 0;
    if (i >= 14 && i <= 18) {
      precipitation = Math.random() * 8;
    } else if (i >= 20 && i <= 23) {
      precipitation = Math.random() * 4;
    } else {
      precipitation = Math.random() * 1;
    }
    hours.push({
      hour,
      precipitation: Math.round(precipitation * 10) / 10,
      temperature: 20 + Math.random() * 10
    });
  }
  return hours;
};

export const HourlyPrecipitationChart = ({ date, data, onClose }: HourlyPrecipitationChartProps) => {
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHourlyData = async () => {
      try {
        setIsLoading(true);
        const formattedDate = new Date(date).toISOString().split('T')[0];
        const response = await fetch(`${import.meta.env.VITE_API_URL}/hourly-precipitation/${formattedDate}`);
        const result = await response.json();
        if (result.success && result.data) {
          setHourlyData(result.data.map((d: {
            hour: string;
            precipitacao_total?: number;
            Chuva_aberta?: number;
            precipitation?: number;
            temperature?: number;
            temp_media?: number;
            temp_max?: number;
          }) => ({
            hour: d.hour,
            precipitation: d.precipitacao_total ?? d.Chuva_aberta ?? d.precipitation ?? 0,
            temperature: d.temperature ?? d.temp_media ?? d.temp_max ?? undefined
          })));
        } else {
          setHourlyData(generateMockHourlyData());
        }
      } catch {
        setHourlyData(generateMockHourlyData());
      } finally {
        setIsLoading(false);
      }
    };
    fetchHourlyData();
  }, [date]);

  // Sempre normaliza precipitation para número e mostra todos os valores
  const normalizePrecip = (v: number | string | undefined) => typeof v === 'number' ? v : parseFloat(String(v)) || 0;
  const displayData = (data.length > 0 ? data : hourlyData)
    .map(d => ({
      ...d,
      precipitation: normalizePrecip(d.precipitation)
    }));

  interface TooltipProps {
    active?: boolean;
    payload?: Array<{ payload: HourlyData }>;
    label?: string;
  }
  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      const rainIntensity = getRainIntensity(d.precipitation);
      // Garante que precipitation é número antes de chamar toFixed
      const precipitationValue = typeof d.precipitation === 'number' && !isNaN(d.precipitation) ? d.precipitation : 0;
      return (
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-4 shadow-xl">
          <div className="border-b border-[hsl(var(--border))] pb-2 mb-2">
            <p className="font-bold text-[hsl(var(--card-foreground))] text-lg">{label}</p>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {new Date(date).toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{rainIntensity.icon}</span>
              <div>
                <p className="text-lg font-bold" style={{ color: rainIntensity.color }}>
                  {precipitationValue.toFixed(1)}mm/h
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  {rainIntensity.type}
                </p>
              </div>
            </div>
            {d.temperature !== undefined && (
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                🌡️ Temperatura: {d.temperature.toFixed(1)}°C
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[hsl(var(--card))] rounded-2xl p-6 shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-[hsl(var(--card-foreground))] mb-2">⏰ Precipitação por Hora</h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {new Date(date).toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[hsl(var(--muted))] rounded-lg transition-colors"
          >
            <X size={20} className="text-[hsl(var(--muted-foreground))]" />
          </button>
        </div>
        {isLoading ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-[hsl(var(--muted-foreground))]">Carregando dados horários...</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={displayData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.3}
                horizontal={true}
                vertical={false}
              />
              <XAxis
                dataKey="hour"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 500 }}
                interval={1}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickFormatter={(value) => `${value}mm/h`}
                domain={[0, 'dataMax + 2']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="precipitation"
                name="Precipitação (mm/h)"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                fillOpacity={0.8}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};