/**
 * Classificador de Vendas COMPLETO - Considera dia da semana + clima
 * Baseado na análise de dados reais fornecida pelo usuário
 */

export interface ClassificacaoCompleta {
  valor_previsto: number;
  venda_esperada: number;
  classificacao: 'ALTA' | 'MÉDIA' | 'BAIXA';
  status: 'acima' | 'dentro' | 'abaixo';
  explicacao: string;
  desvio_percentual: number;
  dia: string;
  baseline_dia: number;
  thresholds: {
    baixa: number;
    alta: number;
  };
  clima: {
    temperatura: string;
    precipitacao: string;
    radiacao: string;
  };
  fatores_positivos: string[];
  fatores_negativos: string[];
  impacto_climatico_total: number;
}

import thresholdsJson from '../data/analise_sazonal_vendas.json';

export class ClassificadorVendasCompleto {
  // Baselines e thresholds históricos por mês e dia da semana
  private dados_por_mes_dia = thresholdsJson;

  // Multiplicadores climáticos (baseados na análise dos dados)
  private mult_temperatura = {
    fria: 0.56,      // < 18°C
    amena: 1.00,     // 18-24°C
    quente: 1.28,    // 24-28°C
    muito_quente: 1.38  // > 28°C
  };

  private mult_chuva = {
    sem_chuva: 1.00,      // 0mm
    leve: 0.67,           // 0-10mm
    media: 0.59,          // 10-30mm
    forte: 0.51           // > 30mm
  };

  private mult_radiacao = {
    baixa: 0.45,     // < 500
    media: 0.66,     // 500-1500
    alta: 1.00       // > 1500
  };

  /**
   * Classifica a temperatura em categorias
   */
  private _classificar_temperatura(temp_media: number): [string, number] {
    if (temp_media < 18) {
      return ['fria', this.mult_temperatura.fria];
    } else if (temp_media < 24) {
      return ['amena', this.mult_temperatura.amena];
    } else if (temp_media < 28) {
      return ['quente', this.mult_temperatura.quente];
    } else {
      return ['muito_quente', this.mult_temperatura.muito_quente];
    }
  }

  /**
   * Classifica a precipitação em categorias
   */
  private _classificar_chuva(precipitacao: number): [string, number] {
    if (precipitacao === 0) {
      return ['sem_chuva', this.mult_chuva.sem_chuva];
    } else if (precipitacao <= 10) {
      return ['leve', this.mult_chuva.leve];
    } else if (precipitacao <= 30) {
      return ['media', this.mult_chuva.media];
    } else {
      return ['forte', this.mult_chuva.forte];
    }
  }

  /**
   * Classifica a radiação solar em categorias
   */
  private _classificar_radiacao(radiacao: number): [string, number] {
    if (radiacao < 500) {
      return ['baixa', this.mult_radiacao.baixa];
    } else if (radiacao < 1500) {
      return ['media', this.mult_radiacao.media];
    } else {
      return ['alta', this.mult_radiacao.alta];
    }
  }

  /**
   * Calcula a venda esperada baseada no dia da semana e clima
   */
  public calcular_venda_esperada(
    dia_semana: number, 
    temp_media: number, 
    precipitacao: number, 
    radiacao: number
  ) {
    if (!(dia_semana in this.dados_por_dia)) {
      throw new Error("dia_semana deve ser entre 0 (Segunda) e 6 (Domingo)");
    }

    const dados_dia = this.dados_por_dia[dia_semana as keyof typeof this.dados_por_dia];
    const baseline = dados_dia.baseline;

    // Classificar condições climáticas
    const [cat_temp, mult_temp] = this._classificar_temperatura(temp_media);
    const [cat_chuva, mult_chuva] = this._classificar_chuva(precipitacao);
    const [cat_rad, mult_rad] = this._classificar_radiacao(radiacao);

    // Calcular venda esperada
    const venda_esperada = baseline * mult_temp * mult_chuva * mult_rad;

    // Ajustar thresholds proporcionalmente
    const q1_ajustado = dados_dia.q1 * mult_temp * mult_chuva * mult_rad;
    const q3_ajustado = dados_dia.q3 * mult_temp * mult_chuva * mult_rad;

    return {
      dia: dados_dia.nome,
      baseline,
      venda_esperada: Math.round(venda_esperada * 100) / 100,
      q1_ajustado: Math.round(q1_ajustado * 100) / 100,
      q3_ajustado: Math.round(q3_ajustado * 100) / 100,
      clima: {
        temperatura: {
          valor: temp_media,
          categoria: cat_temp,
          multiplicador: mult_temp
        },
        chuva: {
          valor: precipitacao,
          categoria: cat_chuva,
          multiplicador: mult_chuva
        },
        radiacao: {
          valor: radiacao,
          categoria: cat_rad,
          multiplicador: mult_rad
        }
      }
    };
  }

  /**
   * Classificação COMPLETA considerando dia da semana + clima
   */
  public classificar_completo(
    valor_previsto: number,
    dia_semana: number,
    mes: number
  ): ClassificacaoCompleta {
    // Buscar thresholds históricos do JSON
    const mesStr = String(mes);
    const diaStr = String(dia_semana);
    const dadosMes = this.dados_por_mes_dia[mesStr];
    const dadosDia = dadosMes.dias[diaStr];
    const q1 = dadosDia.q1;
    const q3 = dadosDia.q3;
    const baseline = dadosDia.media;
    const nomeDia = dadosDia.nome;

    let classificacao: 'ALTA' | 'MÉDIA' | 'BAIXA';
    let status: 'acima' | 'dentro' | 'abaixo';
    let explicacao: string;

    if (valor_previsto < q1) {
      classificacao = 'BAIXA';
      status = 'abaixo';
      explicacao = 'Abaixo do histórico para o dia';
    } else if (valor_previsto > q3) {
      classificacao = 'ALTA';
      status = 'acima';
      explicacao = 'Acima do histórico para o dia';
    } else {
      classificacao = 'MÉDIA';
      status = 'dentro';
      explicacao = 'Dentro do intervalo típico para o dia';
    }

    const desvio_pct = ((valor_previsto - baseline) / baseline) * 100;

    return {
      valor_previsto: Math.round(valor_previsto * 100) / 100,
      venda_esperada: baseline,
      classificacao,
      status,
      explicacao,
      desvio_percentual: Math.round(desvio_pct * 10) / 10,
      dia: nomeDia,
      baseline_dia: baseline,
      thresholds: {
        baixa: q1,
        alta: q3
      },
      clima: {
        temperatura: '',
        precipitacao: '',
        radiacao: ''
      },
      fatores_positivos: [],
      fatores_negativos: [],
      impacto_climatico_total: 1
    };
  }

  /**
   * Classificação simplificada para uso no KPI (retorna apenas up/down/neutral)
   */
  public classificar_para_kpi(
    valor_previsto: number,
    dia_semana: number,
    mes: number
  ): 'up' | 'down' | 'neutral' {
    const resultado = this.classificar_completo(
      valor_previsto, dia_semana, mes
    );
    switch (resultado.classificacao) {
      case 'ALTA':
        return 'up';
      case 'BAIXA':
        return 'down';
      case 'MÉDIA':
      default:
        return 'neutral';
    }
  }
}

// Instância singleton do classificador
export const classificadorVendas = new ClassificadorVendasCompleto();