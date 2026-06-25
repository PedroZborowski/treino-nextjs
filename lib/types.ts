// Tipos que descrevem exatamente o que cada query retorna.
// Se o SQL mudar e uma coluna sumir, o TypeScript avisa em todos
// os lugares que usam esse tipo — antes de rodar o código.

export interface Servidor {
  servidor:         string;
  CPF:              string;
  qtd_viagens:      number;
  gasto_total:      number;
  media_por_viagem: number;
}

export interface FuncaoDestino {
  funcao:       string;
  descricao:    string | null;
  qtd_destinos: number;
  qtd_viagens:  number;
}

export interface FuncaoPerfil {
  funcao:      string;
  descricao:   string;
  qtd_viagens: number;
  media_gasto: number;
  total_gasto: number;
}

export interface PicoMensal {
  ministerio:     string;
  mes_pico:       string;
  gasto_pico:     number;
  viagens_no_pico:number;
}

export interface DestinoCaro {
  destino:          string;
  qtd_viagens:      number;
  media_passagens:  number;
  total_passagens:  number;
}

export interface ComposicaoMinisterio {
  ministerio:       string;
  total_diarias:    number;
  total_passagens:  number;
  total_outros:     number;
  total_devolucao:  number;
}

// Props do componente Charts — agrupa todos os tipos acima
export interface ChartsProps {
  q1: Servidor[];
  q2: FuncaoDestino[];
  q3: FuncaoPerfil[];
  q4: PicoMensal[];
  q5: DestinoCaro[];
  q6: ComposicaoMinisterio[];
}
