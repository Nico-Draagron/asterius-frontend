import React from 'react';

interface SimpleChartProps {
  data?: any;
}

const SimpleChart: React.FC<SimpleChartProps> = ({ data }) => {
  if (!data) {
    return null;
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4 bg-card rounded-lg border shadow-sm">
      <div className="w-full">
        <h3 className="text-lg font-semibold mb-4 text-center">
          {data.extra?.title || 'Visualização'}
        </h3>
        <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Gráfico será renderizado aqui: {data.type}
          </p>
          <div className="mt-2">
            <p className="text-xs">Dados: {data.values?.join(', ')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleChart;