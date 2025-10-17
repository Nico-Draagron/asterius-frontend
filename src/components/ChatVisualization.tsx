import React from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

interface ChartData {
  type: 'line' | 'area' | 'bar' | 'scatter' | 'pie' | 'boxplot';
  labels: string[];
  values: number[];
  extra?: {
    title?: string;
    colors?: string[];
    datasets?: Array<{
      label: string;
      data: number[];
      color?: string;
    }>;
  };
}

interface ChatVisualizationProps {
  data: ChartData;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'
];

const ChatVisualization: React.FC<ChatVisualizationProps> = ({ data }) => {
  // Prepara dados para Recharts
  const chartData = data.labels.map((label, index) => ({
    name: label,
    value: data.values[index],
    // Adiciona datasets extras se existirem
    ...(data.extra?.datasets?.reduce((acc, dataset, dsIndex) => {
      acc[dataset.label] = dataset.data[index] || 0;
      return acc;
    }, {} as Record<string, number>) || {})
  }));

  const renderChart = () => {
    const title = data.extra?.title || 'Gráfico';
    
    switch (data.type) {
      case 'line':
        return (
          <div className="w-full">
            <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={COLORS[0]} 
                  strokeWidth={2}
                  dot={{ fill: COLORS[0], strokeWidth: 2, r: 4 }}
                  name="Valores"
                />
                {/* Renderiza datasets extras */}
                {data.extra?.datasets?.map((dataset, index) => (
                  <Line
                    key={dataset.label}
                    type="monotone"
                    dataKey={dataset.label}
                    stroke={dataset.color || COLORS[index + 1]}
                    strokeWidth={2}
                    dot={{ fill: dataset.color || COLORS[index + 1], strokeWidth: 2, r: 4 }}
                    name={dataset.label}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        );

      case 'area':
        return (
          <div className="w-full">
            <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={COLORS[0]} 
                  fill={COLORS[0]}
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );

      case 'bar':
        return (
          <div className="w-full">
            <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="value" 
                  fill={COLORS[0]}
                  name="Valores"
                  radius={[4, 4, 0, 0]}
                />
                {/* Barras extras para comparação */}
                {data.extra?.datasets?.map((dataset, index) => (
                  <Bar
                    key={dataset.label}
                    dataKey={dataset.label}
                    fill={dataset.color || COLORS[index + 1]}
                    name={dataset.label}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'pie':
        const pieData = chartData.map((item, index) => ({
          name: item.name,
          value: item.value,
          fill: COLORS[index % COLORS.length]
        }));
        
        return (
          <div className="w-full">
            <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );

      case 'scatter':
        return (
          <div className="w-full">
            <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Scatter 
                  dataKey="value" 
                  fill={COLORS[0]}
                  name="Dados"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        );

      case 'boxplot':
        // Para boxplot, vamos usar um gráfico de barras com informações estatísticas
        const stats = calculateBoxplotStats(data.values);
        const boxplotData = [
          { name: 'Min', value: stats.min },
          { name: 'Q1', value: stats.q1 },
          { name: 'Mediana', value: stats.median },
          { name: 'Q3', value: stats.q3 },
          { name: 'Max', value: stats.max }
        ];

        return (
          <div className="w-full">
            <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={boxplotData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Bar 
                  dataKey="value" 
                  fill={COLORS[2]}
                  name="Estatísticas"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      default:
        return (
          <div className="w-full p-4 bg-muted rounded-lg">
            <p className="text-muted-foreground">
              Tipo de gráfico não suportado: {data.type}
            </p>
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 bg-card rounded-lg border shadow-sm">
      {renderChart()}
    </div>
  );
};

// Função auxiliar para calcular estatísticas do boxplot
function calculateBoxplotStats(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  
  return {
    min: sorted[0],
    q1: sorted[Math.floor(n * 0.25)],
    median: sorted[Math.floor(n * 0.5)],
    q3: sorted[Math.floor(n * 0.75)],
    max: sorted[n - 1]
  };
}

export default ChatVisualization;