// Server Component — sem 'use client', sem tipos de browser
import { getPool } from '../lib/db';
import type {
  Servidor, FuncaoDestino, FuncaoPerfil,
  PicoMensal, DestinoCaro, ComposicaoMinisterio,
} from '../lib/types';
import Charts from './components/Charts';
import { RowDataPacket } from 'mysql2';

// ── SQLs (inalterados) ────────────────────────────────────────────────────────

const SQL_SERVIDORES = `
SELECT p.Nome AS servidor, p.CPF,
    COUNT(*) AS qtd_viagens,
    ROUND(SUM(c.Valor_passagens + c.Valor_diarias
              + c.Valor_outros_gastos - c.Valor_devolucao), 2) AS gasto_total,
    ROUND(AVG(c.Valor_passagens + c.Valor_diarias
              + c.Valor_outros_gastos - c.Valor_devolucao), 2) AS media_por_viagem
FROM Viagem v
JOIN Proposto p ON p.CPF = v.fk_Proposto_CPF
JOIN Conta    c ON c.fk_PCDP_Identificador_do_processo = v.fk_PCDP_Identificador_do_processo
GROUP BY p.CPF, p.Nome ORDER BY gasto_total DESC LIMIT 15`;

const SQL_FUNCOES_DESTINOS = `
SELECT f.Nome AS funcao, f.Descricao AS descricao,
    COUNT(DISTINCT pos.fk_Destino_Nome) AS qtd_destinos,
    COUNT(DISTINCT v.fk_PCDP_Identificador_do_processo) AS qtd_viagens
FROM Funcao f
JOIN Viagem v   ON v.fk_Funcao_Nome                      = f.Nome
JOIN Possui pos ON pos.fk_PCDP_Identificador_do_processo = v.fk_PCDP_Identificador_do_processo
GROUP BY f.Nome, f.Descricao ORDER BY qtd_destinos DESC LIMIT 15`;

const SQL_FUNCOES_PERFIL = `
SELECT
    COALESCE(f.Nome,      'Sem função') AS funcao,
    COALESCE(f.Descricao, '—')          AS descricao,
    COUNT(*) AS qtd_viagens,
    ROUND(AVG(c.Valor_passagens + c.Valor_diarias + c.Valor_outros_gastos), 2) AS media_gasto,
    ROUND(SUM(c.Valor_passagens + c.Valor_diarias + c.Valor_outros_gastos), 2) AS total_gasto
FROM Viagem v
LEFT JOIN Funcao f ON f.Nome = v.fk_Funcao_Nome
JOIN      Conta  c ON c.fk_PCDP_Identificador_do_processo = v.fk_PCDP_Identificador_do_processo
GROUP BY f.Nome, f.Descricao ORDER BY qtd_viagens DESC LIMIT 16`;

const SQL_PICO_MENSAL = `
SELECT os.Nome AS ministerio, pico.mes AS mes_pico,
    pico.gasto_mes AS gasto_pico, pico.qtd_viagens AS viagens_no_pico
FROM (
    SELECT o.fk_Orgao_Superior AS cod_superior,
        DATE_FORMAT(p.Data_de_inicio, '%Y-%m') AS mes,
        ROUND(SUM(c.Valor_passagens + c.Valor_diarias + c.Valor_outros_gastos), 2) AS gasto_mes,
        COUNT(*) AS qtd_viagens,
        RANK() OVER (
            PARTITION BY o.fk_Orgao_Superior
            ORDER BY SUM(c.Valor_passagens + c.Valor_diarias + c.Valor_outros_gastos) DESC
        ) AS rnk
    FROM PCDP p
    JOIN Orgao o ON o.Codigo = p.FK_Orgao_Codigo
    JOIN Conta c ON c.fk_PCDP_Identificador_do_processo = p.Identificador_do_processo
    WHERE o.fk_Orgao_Superior IS NOT NULL
    GROUP BY o.fk_Orgao_Superior, DATE_FORMAT(p.Data_de_inicio, '%Y-%m')
) AS pico
JOIN Orgao os ON os.Codigo = pico.cod_superior
WHERE pico.rnk = 1 ORDER BY pico.gasto_mes DESC LIMIT 15`;

const SQL_DESTINOS_CAROS = `
SELECT d.Nome AS destino, COUNT(*) AS qtd_viagens,
    ROUND(AVG(c.Valor_passagens), 2) AS media_passagens,
    ROUND(SUM(c.Valor_passagens), 2) AS total_passagens
FROM Destino d
JOIN Possui pos ON pos.fk_Destino_Nome                 = d.Nome
JOIN Conta  c   ON c.fk_PCDP_Identificador_do_processo = pos.fk_PCDP_Identificador_do_processo
WHERE c.Valor_passagens > 0
GROUP BY d.Nome
HAVING AVG(c.Valor_passagens) > (
    SELECT AVG(Valor_passagens) FROM Conta WHERE Valor_passagens > 0
)
ORDER BY media_passagens DESC LIMIT 20`;

const SQL_COMPOSICAO_TOP5 = `
SELECT os.Nome AS ministerio,
    ROUND(SUM(c.Valor_diarias),       2) AS total_diarias,
    ROUND(SUM(c.Valor_passagens),     2) AS total_passagens,
    ROUND(SUM(c.Valor_outros_gastos), 2) AS total_outros,
    ROUND(SUM(c.Valor_devolucao),     2) AS total_devolucao
FROM PCDP p
JOIN Orgao o  ON o.Codigo  = p.FK_Orgao_Codigo
JOIN Orgao os ON os.Codigo = o.fk_Orgao_Superior
JOIN Conta c  ON c.fk_PCDP_Identificador_do_processo = p.Identificador_do_processo
WHERE o.fk_Orgao_Superior IN (
    SELECT top5.cod FROM (
        SELECT o2.fk_Orgao_Superior AS cod
        FROM PCDP p2
        JOIN Orgao o2 ON o2.Codigo = p2.FK_Orgao_Codigo
        JOIN Conta c2 ON c2.fk_PCDP_Identificador_do_processo = p2.Identificador_do_processo
        WHERE o2.fk_Orgao_Superior IS NOT NULL
        GROUP BY o2.fk_Orgao_Superior
        ORDER BY SUM(c2.Valor_passagens + c2.Valor_diarias + c2.Valor_outros_gastos) DESC
        LIMIT 5
    ) AS top5
)
GROUP BY os.Codigo, os.Nome
ORDER BY (total_diarias + total_passagens + total_outros) DESC`;

// ── Helpers para cast dos resultados do mysql2 ────────────────────────────────
// mysql2 retorna RowDataPacket[] — precisamos fazer cast para nossos tipos
function cast<T>(rows: RowDataPacket[]): T[] {
  return JSON.parse(JSON.stringify(rows)) as T[];
}

// ── Server Component ──────────────────────────────────────────────────────────
export default async function Page() {
  const pool = getPool();

  const [
    [r1], [r2], [r3], [r4], [r5], [r6],
  ] = await Promise.all([
    pool.query<RowDataPacket[]>(SQL_SERVIDORES),
    pool.query<RowDataPacket[]>(SQL_FUNCOES_DESTINOS),
    pool.query<RowDataPacket[]>(SQL_FUNCOES_PERFIL),
    pool.query<RowDataPacket[]>(SQL_PICO_MENSAL),
    pool.query<RowDataPacket[]>(SQL_DESTINOS_CAROS),
    pool.query<RowDataPacket[]>(SQL_COMPOSICAO_TOP5),
  ]);

  return (
    <>
      <header>
        <h1>Painel de Viagens do Governo Federal</h1>
        <p>6 consultas SQL · viagens_db · 2026</p>
      </header>
      <main>
        <Charts
          q1={cast<Servidor>(r1)}
          q2={cast<FuncaoDestino>(r2)}
          q3={cast<FuncaoPerfil>(r3)}
          q4={cast<PicoMensal>(r4)}
          q5={cast<DestinoCaro>(r5)}
          q6={cast<ComposicaoMinisterio>(r6)}
        />
      </main>
    </>
  );
}
