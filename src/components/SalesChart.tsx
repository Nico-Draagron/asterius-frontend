import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { useState } from "react";
import { classificadorVendas } from "@/lib/classificadorVendas";

interface SalesChartProps {
  data: { day: string; fullDate?: string; sales: number; rain: number; temperature?: number }[];
}

export const SalesChart = ({ data }: SalesChartProps) => {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  
  // Validação dos dados e cálculo de acumulados
  const chartData = Array.isArray(data) ? data : [];
  
  // Calcular vendas acumuladas
  let accumulated = 0;
  const processedData = chartData.map((item, index) => {
    accumulated += item.sales;
    return {
      ...item,
      salesDaily: item.sales,
      salesAccumulated: accumulated,
      dayIndex: index
    };
  });

  // Calcular estatísticas
  const totalSales = accumulated;
  const averageDaily = totalSales / (chartData.length || 1);
  const maxDaily = Math.max(...chartData.map(d => d.sales));
  const minDaily = Math.min(...chartData.map(d => d.sales));
  
  // Classificar performance de vendas usando classificador contextual
  const getSalesPerformance = (sales: number, day: string, _temperature?: number, _rain?: number, _radiation?: number) => {
    // Mapear dia da semana para número (0=Segunda, 6=Domingo)
    const dias = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    const diaSemana = dias.indexOf(day);
    const today = new Date();
    const mesAtual = today.getMonth() + 1;
    const kpi = classificadorVendas.classificar_para_kpi(sales, diaSemana, mesAtual);
    if (kpi === 'up') return { type: "ALTA", icon: "🚀", color: "#22c55e" };
    if (kpi === 'down') return { type: "BAIXA", icon: "📉", color: "#ef4444" };
    return { type: "MÉDIA", icon: "📊", color: "#3b82f6" };
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const salesPerformance = getSalesPerformance(
        data.salesDaily,
        data.day
      );
      
      return (
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-4 shadow-xl">
          <div className="border-b border-[hsl(var(--border))] pb-2 mb-2">
            <p className="font-bold text-[hsl(var(--card-foreground))] text-lg">{label}</p>
            {data.fullDate && (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {new Date(data.fullDate + 'T00:00:00').toLocaleDateString('pt-BR', { 
                  weekday: 'long', 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric' 
                })}
              </p>
            )}
          </div>
          <div className="space-y-2">
            {/* Performance das vendas */}
            <div className="flex items-center gap-2">
              <span className="text-2xl">{salesPerformance.icon}</span>
              <div>
                <p className="text-lg font-bold" style={{ color: salesPerformance.color }}>
                  R$ {data.salesDaily.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  {salesPerformance.type}
                </p>
              </div>
            </div>
            
            {/* Informações detalhadas */}
            <div className="text-xs text-[hsl(var(--muted-foreground))] space-y-1">
              <p>📈 Total acumulado: R$ {data.salesAccumulated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p>📊 Média diária: R$ {averageDaily.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              {data.temperature !== undefined && data.temperature !== null && (
                <p>🌡️ Temperatura: {data.temperature.toFixed(1)}°C</p>
              )}
              <p>🌧️ Precipitação: {(data.rain || 0).toFixed(1)}mm</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[hsl(var(--card))] rounded-2xl p-6 shadow-lg animate-fade-in">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-[hsl(var(--card-foreground))] mb-2">
            💰 Previsão de Vendas - 7 Dias
          </h2>
          {/* Mensagem removida conforme solicitado */}
        </div>
        
        {/* Estatísticas rápidas */}
        <div className="text-right space-y-1">
          <div className="text-xs text-[hsl(var(--muted-foreground))]">Total Previsto</div>
          <div className="text-lg font-bold text-blue-600">
            R$ {totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-[hsl(var(--muted-foreground))]">
            Média diária: R$ {averageDaily.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-[400px] flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p>Carregando dados de previsão...</p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={450}>
          <ComposedChart 
            data={processedData} 
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            onMouseMove={(e: any) => {
              if (e.activeTooltipIndex !== undefined) {
                setHoveredPoint(e.activeTooltipIndex);
              }
            }}
            onMouseLeave={() => setHoveredPoint(null)}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              opacity={0.3} 
              horizontal={true}
              vertical={false}
            />
            <XAxis
              dataKey="day"
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 500 }}
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis
              yAxisId="sales"
              orientation="left"
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              tickFormatter={(value) => {
                const numValue = Number(value) || 0;
                if (numValue >= 1000000) return `R$ ${(numValue/1000000).toFixed(1)}M`;
                if (numValue >= 1000) return `R$ ${(numValue/1000).toFixed(0)}k`;
                return `R$ ${numValue.toFixed(0)}`;
              }}
              domain={['dataMin - 1000', 'dataMax + 1000']}
            />
            <YAxis
              yAxisId="accumulated"
              orientation="right"
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              tickFormatter={(value) => {
                const numValue = Number(value) || 0;
                if (numValue >= 1000000) return `${(numValue/1000000).toFixed(1)}M`;
                if (numValue >= 1000) return `${(numValue/1000).toFixed(0)}k`;
                return `${numValue.toFixed(0)}`;
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '15px' }}
            />
            
            {/* Linha de referência para a média diária removida conforme solicitado */}
            
            {/* Barras - Vendas Diárias */}
            <Bar
              yAxisId="sales"
              dataKey="salesDaily"
              name="💰 Vendas Diárias (R$)"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              fillOpacity={0.8}
            />
            
            {/* Linha - Vendas Acumuladas */}
            <Line
              yAxisId="accumulated"
              type="monotone"
              dataKey="salesAccumulated"
              name="💹 Vendas Acumuladas (R$)"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ 
                fill: "#3b82f6", 
                r: 5, 
                strokeWidth: 2, 
                stroke: "white",
                style: { filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))' }
              }}
              activeDot={{ 
                r: 7, 
                stroke: "#3b82f6", 
                strokeWidth: 2, 
                fill: "white",
                style: { filter: 'drop-shadow(0 4px 8px rgba(59, 130, 246, 0.5))' }
              }}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
