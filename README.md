# Painel de Viagens do Governo Federal

Projeto de familiarização com Next.js 14 construído sobre dados reais de viagens a serviço do governo federal brasileiro (~229 mil registros, fonte: Portal da Transparência).

## O que o projeto faz

Dashboard com 6 consultas SQL sobre um banco MySQL populado via ETL em Python. Cada consulta é visualizada com um tipo diferente de gráfico (recharts).

| Consulta | Visualização |
|---|---|
| Top 15 servidores por gasto total | Barra horizontal |
| Funções com mais destinos distintos | Treemap |
| Perfil de gasto por função (inclui sem função) | Barra dupla horizontal |
| Mês de pico de gastos por ministério | Scatter com ZAxis |
| Destinos com passagem acima da média | Barra + ReferenceLine |
| Composição de gasto dos 5 maiores ministérios | Barra empilhada |

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **MySQL** via `mysql2`
- **recharts** para visualização
- ETL separado em Python (`etl_viagens.py`, não incluso)

## O que aprendi

Este projeto foi intencionalmente escolhido como veículo de aprendizado de Next.js. Partindo de conhecimento básico em React e JavaScript, os conceitos trabalhados foram:

**App Router e roteamento por convenção de pastas**
O Next.js define rotas pelo nome e posição dos arquivos — `app/page.tsx` vira `/`, `app/sobre/page.tsx` viraria `/sobre`. Não há configuração de rotas explícita.

**Server Components vs Client Components**
Por padrão, componentes em `app/` rodam no servidor e têm acesso direto ao banco de dados, sem expor credenciais ao browser. Componentes que precisam de interatividade (estado, eventos) recebem a diretiva `'use client'` e rodam no browser. Neste projeto, `page.tsx` é Server Component e faz as queries diretamente; `Charts.tsx` é Client Component e só recebe os dados prontos via props.

**Acesso direto ao banco no servidor**
Em vez de criar uma API intermediária, o Server Component conecta ao MySQL com `mysql2` e passa os dados serializados para o componente cliente. Isso elimina uma camada inteira de código (rotas de API) para casos de leitura simples.

**TypeScript com React**
Interfaces para tipar o retorno de cada query SQL, props tipadas nos componentes, e `import type` para importações que existem apenas em tempo de compilação. O compilador aponta inconsistências antes de rodar o código.

**Variáveis de ambiente e segurança básica**
Credenciais em `.env.local`, excluído do Git via `.gitignore`. Em produção, seriam injetadas pelo ambiente de deploy.

**Ecossistema npm**
`package.json` como contrato de dependências, `node_modules/` como instalação local recriável, diferença entre `dev`/`build`/`start`, e como auditar vulnerabilidades com `npm audit`.

## Estrutura

```
app/
  page.tsx          # Server Component — queries SQL + montagem da página
  layout.tsx        # Layout raiz (html + body)
  components/
    Charts.tsx      # Client Component — todos os gráficos (recharts)
lib/
  db.ts             # Pool de conexão MySQL (singleton)
  types.ts          # Interfaces TypeScript para cada query
styles/
  globals.css
```

## Como rodar

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.local.example .env.local
# editar .env.local com suas credenciais MySQL

# 3. Subir o servidor de desenvolvimento
npm run dev
```

Acesse `http://localhost:3000`.

> O banco de dados precisa estar populado previamente. O script ETL (`etl_viagens.py`) não está incluído neste repositório. O CSV de origem é o arquivo `2022_Viagem.csv`, disponível para download no [Portal da Transparência do Governo Federal](https://portaldatransparencia.gov.br/download-de-dados/viagens). O arquivo tem ~365 MB e não é rastreado pelo Git.
