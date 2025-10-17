import React, { useState } from "react";
import { LucideIcon } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { classificadorVendas, ClassificacaoCompleta } from "@/lib/classificadorVendas";
import { Info, X } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: { value: number }[] | string;
  iconColor?: string;
  // Novos props para classificação inteligente
  salesValue?: number;
  dayOfWeek?: number;
  temperature?: number;
  precipitation?: number;
  radiation?: number;
}

interface ClassificationModalProps {
  classification: ClassificacaoCompleta;
  onClose: () => void;
}

interface ClassificationModalPropsFull extends ClassificationModalProps {
  temperature?: number;
  precipitation?: number;
  radiation?: number;
}

const ClassificationModal = ({ classification, onClose, temperature, precipitation, radiation }: ClassificationModalPropsFull) => {
  const [showComparativo, setShowComparativo] = useState(false);
  // Valores de referência do dia/mes
  const referencia = classification.thresholds;
  const media = classification.baseline_dia;
  // Lógica para fatores positivos/negativos baseada nos dados reais do dia
  const fatores_positivos: string[] = [];
  const fatores_negativos: string[] = [];
  if (temperature !== undefined) {
    if (temperature >= 24 && temperature <= 28) fatores_positivos.push('Temperatura quente favorável');
    else if (temperature > 28) fatores_positivos.push('Temperatura muito quente (pode favorecer vendas)');
    else if (temperature < 18) fatores_negativos.push('Temperatura fria prejudica vendas');
    else fatores_negativos.push('Temperatura amena/neutra');
  }
  if (precipitation !== undefined) {
    if (precipitation === 0) fatores_positivos.push('Sem chuva favorece vendas');
    else if (precipitation <= 10) fatores_positivos.push('Chuva leve, pouco impacto');
    else if (precipitation <= 30) fatores_negativos.push('Chuva moderada pode prejudicar vendas');
    else fatores_negativos.push('Chuva forte prejudica vendas');
  }
  if (radiation !== undefined) {
    if (radiation > 1500) fatores_positivos.push('Alta radiação solar favorece movimento');
    else if (radiation < 500) fatores_negativos.push('Radiação solar baixa, menos movimento');
    else fatores_negativos.push('Radiação solar moderada');
  }
  const getClassificationColor = (classificacao: string) => {
    switch (classificacao) {
      case 'ALTA': return 'text-green-600 bg-green-50';
      case 'MÉDIA': return 'text-blue-600 bg-blue-50';
      case 'BAIXA': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getClassificationEmoji = (classificacao: string) => {
    switch (classificacao) {
      case 'ALTA': return '🚀';
      case 'MÉDIA': return '📊';
      case 'BAIXA': return '📉';
      default: return '❓';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-50 rounded-2xl shadow-md max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 relative">
        {/* Botão X para fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-200 transition"
          aria-label="Fechar"
        >
          <X size={22} className="text-gray-500" />
        </button>
        {/* Header: Contexto e Classificação */}
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900">Contexto: {classification.dia}</h2>
            <span className={`px-3 py-1 rounded-xl font-bold text-sm md:text-base ${classification.classificacao === 'ALTA' ? 'bg-green-100 text-green-700' : classification.classificacao === 'MÉDIA' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{classification.classificacao}</span>
          </div>
          <p className={`text-3xl md:text-4xl font-bold ${classification.classificacao === 'BAIXA' ? 'text-red-600' : classification.classificacao === 'ALTA' ? 'text-green-600' : 'text-blue-600'}`}>R$ {classification.valor_previsto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>

        {/* Faixas de referência */}
        <div className="bg-white rounded-xl shadow-sm p-4 mt-2 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-700">Faixas de referência</span>
            <button
              className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 transition"
              onClick={() => setShowComparativo((v) => !v)}
            >
              {showComparativo ? 'Ocultar' : 'Ver detalhes'}
            </button>
          </div>
          <ul className="list-disc ml-6 text-sm text-gray-600">
            <li><span className="font-semibold text-red-700">Baixo:</span> até <b>R$ {referencia.baixa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></li>
            <li><span className="font-semibold text-blue-700">Média:</span> entre <b>R$ {referencia.baixa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b> e <b>R$ {referencia.alta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></li>
            <li><span className="font-semibold text-green-700">Alto:</span> acima de <b>R$ {referencia.alta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></li>
          </ul>
          {showComparativo && (
            <div className="text-xs text-blue-700 mt-2">Baseado no histórico deste dia da semana e mês.</div>
          )}
        </div>

        {/* Condições Climáticas */}
        <div className="bg-blue-50 rounded-xl p-4 mt-4">
          <h3 className="font-semibold mb-2 flex items-center gap-2 text-blue-700 text-base md:text-lg">🌦️ Condições Climáticas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-700">
            <div>🌡️ Temperatura: <b>{temperature !== undefined ? `${temperature}°C` : 'N/A'}</b></div>
            <div>🌧️ Precipitação: <b>{precipitation !== undefined ? `${precipitation}mm` : 'N/A'}</b></div>
            <div>☀️ Radiação Solar: <b>{radiation !== undefined ? `${radiation}` : 'N/A'}</b></div>
          </div>
        </div>

        {/* Fatores Negativos */}
        {fatores_negativos.length > 0 && (
          <div className="bg-red-50 rounded-xl p-4 mt-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2 text-red-700 text-base md:text-lg">⚠️ Fatores Negativos</h3>
            <ul className="list-disc ml-6 text-sm text-gray-700">
              {fatores_negativos.map((fator, index) => (
                <li key={index}>{fator}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Fatores Positivos */}
        {fatores_positivos.length > 0 && (
          <div className="bg-green-50 rounded-xl p-4 mt-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2 text-green-700 text-base md:text-lg">✅ Fatores Positivos</h3>
            <ul className="list-disc ml-6 text-sm text-gray-700">
              {fatores_positivos.map((fator, index) => (
                <li key={index}>{fator}</li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </div>
  );
};

export const KPICard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  iconColor = "hsl(var(--accent))",
  salesValue,
  dayOfWeek,
  temperature,
  precipitation,
  radiation
}: KPICardProps) => {
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Para análise, só precisa salesValue, dayOfWeek e mês (exemplo: mês atual)
  const mesAtual = new Date().getMonth() + 1;
  const canShowAnalysis = salesValue !== undefined && dayOfWeek !== undefined && title.includes("Previsão");

  const handleCardClick = () => {
    if (canShowAnalysis) {
      setShowAnalysis(true);
    }
  };

  const classification = canShowAnalysis ? 
    classificadorVendas.classificar_completo(
      salesValue!,
      dayOfWeek!,
      mesAtual
    ) : null;

  return (
    <>
      <div 
        className={`bg-[hsl(var(--card))] rounded-2xl p-6 shadow-lg hover-lift animate-fade-in ${
          canShowAnalysis ? 'cursor-pointer hover:shadow-xl transition-shadow' : ''
        }`}
        onClick={handleCardClick}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-[hsl(var(--muted-foreground))]">{title}</h3>
            {canShowAnalysis && (
              <Info size={14} className="text-[hsl(var(--muted-foreground))] opacity-60" />
            )}
          </div>
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>
        <p className="text-3xl font-bold text-[hsl(var(--card-foreground))] mb-4">{value}</p>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm">
              <span className={`inline-block w-2 h-2 rounded-full ${
                trend === 'up' ? 'bg-green-500' : 
                trend === 'down' ? 'bg-red-500' : 'bg-yellow-500'
              }`}></span>
              <span className="text-muted-foreground capitalize">
                {trend === 'up' ? 'Alta' : trend === 'down' ? 'Baixa' : 'Estável'}
              </span>
            </div>
            {canShowAnalysis && (
              <div className="text-xs text-[hsl(var(--muted-foreground))] opacity-60">
                Clique para detalhes
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Análise */}
      {showAnalysis && classification && (
        <ClassificationModal
          classification={classification}
          onClose={() => setShowAnalysis(false)}
          temperature={temperature}
          precipitation={precipitation}
          radiation={radiation}
        />
      )}
    </>
  );
};

export default KPICard;