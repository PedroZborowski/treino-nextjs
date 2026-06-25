'use client';

import type { ChartsProps } from '../../lib/types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart, ReferenceLine,
  ScatterChart, Scatter, ZAxis,
  Treemap, Cell,
} from 'recharts';

// ── Formatadores ──────────────────────────────────────────────────────────────
const BRL   = (v: number): string =>
  v.toLocaleString('pt-BR', { style:'currency', currency:'BRL', maximumFractionDigits:0 });
const NUM   = (v: number): string => v.toLocaleString('pt-BR');
const SHORT = (s: string, n = 26): string => s.slice(0, n);

const COLORS = ['#4299e1','#48bb78','#ed8936','#9f7aea','#f56565',
                '#38b2ac','#ecc94b','#667eea','#fc8181','#68d391',
                '#90cdf4','#fbd38d','#b794f4','#9ae6b4','#feb2b2'];

// ── Tipos auxiliares para o tooltip ──────────────────────────────────────────
interface TooltipPayloadItem {
  name:  string;
  value: number;
  color: string;
}
interface TooltipProps {
  active?:  boolean;
  payload?: TooltipPayloadItem[];
  label?:   string;
}

// ── Componentes auxiliares ────────────────────────────────────────────────────
interface BadgeProps { label: string; type: string; }
interface CardProps {
  title:       string;
  badges:      BadgeProps[];
  description: string;
  children:    React.ReactNode;
}

function Card({ title, badges, description, children }: CardProps) {
  return (
    <div className="card">
      <div className="card-header">
        <h2>
          {title}
          {badges.map(b => (
            <span key={b.label} className={`badge badge-${b.type}`}>{b.label}</span>
          ))}
        </h2>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}

function TipBRL({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'white', border:'1px solid #e2e8f0', borderRadius:8, padding:'10px 14px', fontSize:12, maxWidth:240 }}>
      <p style={{ fontWeight:600, marginBottom:4, wordBreak:'break-word' }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color:p.color, margin:'2px 0' }}>
          {p.name}: {p.value > 500 ? BRL(p.value) : NUM(p.value)}
        </p>
      ))}
    </div>
  );
}

interface TreemapEntry {
  x: number; y: number; width: number; height: number;
  name: string; value: number; index: number;
  // payload extra que recharts injeta
  viagens?: number;
}

function TreemapContent({ x, y, width, height, name, value, index }: TreemapEntry) {
  if (width < 30 || height < 20) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height}
        fill={COLORS[index % COLORS.length]} stroke="white" strokeWidth={2} rx={4} />
      {width > 60 && height > 30 && (
        <>
          <text x={x+8} y={y+18} fill="white" fontSize={11} fontWeight={600}
            style={{ pointerEvents:'none' }}>
            {(name ?? '').slice(0, 16)}
          </text>
          {height > 44 && (
            <text x={x+8} y={y+34} fill="rgba(255,255,255,0.85)" fontSize={10}
              style={{ pointerEvents:'none' }}>
              {NUM(value)} destinos
            </text>
          )}
        </>
      )}
    </g>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
// ChartsProps vem de lib/types.ts — o TypeScript garante que q1..q6
// têm exatamente as colunas certas, com os tipos certos
export default function Charts({ q1, q2, q3, q4, q5, q6 }: ChartsProps) {

  const q1data = q1.map(r => ({
    servidor:         SHORT(r.servidor),
    gasto_total:      Number(r.gasto_total),
    media_por_viagem: Number(r.media_por_viagem),
    qtd_viagens:      Number(r.qtd_viagens),
  }));

  const q2data = q2.map(r => ({
    name:    r.funcao,
    value:   Number(r.qtd_destinos),
    viagens: Number(r.qtd_viagens),
  }));

  const q3data = q3.slice(0, 12).map(r => ({
    funcao:      SHORT(r.funcao),
    qtd_viagens: Number(r.qtd_viagens),
    media_gasto: Number(r.media_gasto),
  }));

  const q4data = q4.map(r => ({
    ministerio: SHORT(r.ministerio.replace('Ministério ', 'Min. ')),
    mes:        r.mes_pico,
    gasto:      Number(r.gasto_pico),
    viagens:    Number(r.viagens_no_pico),
  }));

  const mediaGlobal = q5.length
    ? Math.min(...q5.map(r => Number(r.media_passagens)))
    : 0;
  const q5data = q5.slice(0, 15).map(r => ({
    destino:         SHORT(r.destino),
    media_passagens: Number(r.media_passagens),
    qtd:             Number(r.qtd_viagens),
  }));

  const q6data = q6.map(r => ({
    ministerio:  r.ministerio.replace('Ministério d', 'Min. d').replace('Ministério ', 'Min. ').slice(0, 22),
    Diárias:     Number(r.total_diarias),
    Passagens:   Number(r.total_passagens),
    Outros:      Number(r.total_outros),
    Devoluções: -Number(r.total_devolucao),
  }));

  return (
    <>
      <Card title="1. Top 15 Servidores por Gasto Total"
        badges={[{label:'JOINs múltiplos',type:'join'},{label:'Agregação + GROUP BY',type:'agg'}]}
        description="Viagem → Proposto + Viagem → Conta.">
        <ResponsiveContainer width="100%" height={380}>
          <BarChart data={q1data} layout="vertical" margin={{ top:8, right:110, left:170, bottom:8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#edf2f7" horizontal={false} />
            <XAxis type="number" tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} tick={{ fontSize:11 }} />
            <YAxis type="category" dataKey="servidor" tick={{ fontSize:11 }} width={165} />
            <Tooltip content={<TipBRL />} />
            <Bar dataKey="gasto_total" name="Gasto Total (R$)" radius={[0,6,6,0]}>
              {q1data.map((_, i) => <Cell key={i} fill={`hsl(${210 + i*4}, 70%, ${55 - i*1.5}%)`} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="2. Funções com Mais Destinos Distintos"
        badges={[{label:'JOINs múltiplos',type:'join'},{label:'Agregação + GROUP BY',type:'agg'}]}
        description="Funcao → Viagem → Possui. COUNT DISTINCT de destinos por função.">
        <ResponsiveContainer width="100%" height={340}>
          <Treemap data={q2data} dataKey="value" nameKey="name"
            content={<TreemapContent x={0} y={0} width={0} height={0} name="" value={0} index={0} />}
            aspectRatio={4/3}>
            <Tooltip formatter={(v: number, _n: string, p: { payload: { name: string; viagens: number } }) =>
              [`${NUM(v)} destinos · ${NUM(p.payload.viagens)} viagens`, p.payload.name]} />
          </Treemap>
        </ResponsiveContainer>
      </Card>

      <Card title="3. Perfil de Gasto por Função (inclui Sem Função)"
        badges={[{label:'LEFT OUTER JOIN',type:'outer'},{label:'JOINs múltiplos',type:'join'},{label:'Agregação + GROUP BY',type:'agg'}]}
        description="LEFT JOIN Viagem → Funcao preserva as ~108k viagens sem função cadastrada.">
        <ResponsiveContainer width="100%" height={360}>
          <BarChart data={q3data} layout="vertical" margin={{ top:8, right:16, left:180, bottom:8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#edf2f7" horizontal={false} />
            <XAxis type="number" tick={{ fontSize:10 }}
              tickFormatter={(v: number) => v > 10000 ? `R$${(v/1000).toFixed(0)}k` : NUM(v)} />
            <YAxis type="category" dataKey="funcao" tick={{ fontSize:10 }} width={175} />
            <Tooltip content={<TipBRL />} />
            <Legend />
            <Bar dataKey="qtd_viagens" name="Nº Viagens"       fill="#4299e1" radius={[0,4,4,0]} />
            <Bar dataKey="media_gasto" name="Gasto Médio (R$)" fill="#ed8936" radius={[0,4,4,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="4. Mês de Pico de Gastos por Ministério"
        badges={[{label:'Subconsulta no FROM',type:'sub'},{label:'JOINs múltiplos',type:'join'}]}
        description="Subconsulta no FROM com RANK() OVER PARTITION identifica o mês de pico de cada ministério.">
        <ResponsiveContainer width="100%" height={360}>
          <ScatterChart margin={{ top:16, right:24, left:24, bottom:80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#edf2f7" />
            <XAxis dataKey="mes" type="category" name="Mês" angle={-40} textAnchor="end" tick={{ fontSize:10 }} />
            <YAxis dataKey="gasto" name="Gasto (R$)"
              tickFormatter={(v: number) => `R$${(v/1e6).toFixed(0)}M`} tick={{ fontSize:10 }} />
            <ZAxis dataKey="viagens" range={[60, 400]} name="Viagens" />
            <Tooltip cursor={{ strokeDasharray:'3 3' }}
              content={({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof q4data[0] }> }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div style={{ background:'white', border:'1px solid #e2e8f0', borderRadius:8, padding:'10px 14px', fontSize:12 }}>
                    <p style={{ fontWeight:600 }}>{d.ministerio}</p>
                    <p>Mês pico: {d.mes}</p>
                    <p>Gasto: {BRL(d.gasto)}</p>
                    <p>Viagens: {NUM(d.viagens)}</p>
                  </div>
                );
              }}
            />
            <Scatter data={q4data} fill="#9f7aea" fillOpacity={0.8} />
          </ScatterChart>
        </ResponsiveContainer>
        <p style={{ fontSize:11, color:'#718096', textAlign:'center', marginTop:4 }}>
          Tamanho do círculo proporcional ao nº de viagens no mês de pico
        </p>
      </Card>

      <Card title="5. Destinos com Passagem Acima da Média Geral"
        badges={[{label:'Subconsulta aninhada',type:'sub'},{label:'JOINs múltiplos',type:'join'},{label:'Agregação + GROUP BY',type:'agg'}]}
        description="HAVING AVG > (SELECT AVG FROM Conta). Subconsulta escalar no HAVING.">
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={q5data} layout="vertical" margin={{ top:8, right:100, left:180, bottom:8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#edf2f7" horizontal={false} />
            <XAxis type="number" tickFormatter={(v: number) => BRL(v)} tick={{ fontSize:10 }} />
            <YAxis type="category" dataKey="destino" tick={{ fontSize:10 }} width={175} />
            <Tooltip content={<TipBRL />} />
            <Bar dataKey="media_passagens" name="Média Passagem (R$)" radius={[0,6,6,0]}>
              {q5data.map((_, i) => <Cell key={i} fill={`hsl(${160 + i*8}, 60%, 45%)`} />)}
            </Bar>
            <ReferenceLine x={mediaGlobal} stroke="#f56565" strokeDasharray="5 5" strokeWidth={2}
              label={{ value:'Média global', position:'insideTopRight', fontSize:11, fill:'#f56565' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      <Card title="6. Composição dos 5 Ministérios que Mais Gastam"
        badges={[{label:'Subconsulta aninhada',type:'sub'},{label:'JOINs múltiplos',type:'join'},{label:'Agregação + GROUP BY',type:'agg'}]}
        description="WHERE IN com subconsulta em tabela derivada filtra os top 5 ministérios.">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={q6data} margin={{ top:8, right:16, left:16, bottom:40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#edf2f7" />
            <XAxis dataKey="ministerio" angle={-20} textAnchor="end" tick={{ fontSize:11 }} />
            <YAxis tickFormatter={(v: number) => `R$${(v/1e6).toFixed(0)}M`} tick={{ fontSize:11 }} />
            <Tooltip content={<TipBRL />} />
            <Legend verticalAlign="top" />
            <Bar dataKey="Diárias"    stackId="a" fill="#4299e1" />
            <Bar dataKey="Passagens"  stackId="a" fill="#48bb78" />
            <Bar dataKey="Outros"     stackId="a" fill="#ed8936" radius={[4,4,0,0]} />
            <Bar dataKey="Devoluções" stackId="a" fill="#fc8181" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </>
  );
}
