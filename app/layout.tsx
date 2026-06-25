import type { Metadata } from 'next';
import '../styles/globals.css';

// Metadata é um tipo do Next.js — o editor avisa se você
// colocar uma propriedade inválida aqui
export const metadata: Metadata = {
  title: 'Painel de Viagens do Governo Federal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode; // qualquer coisa que o React consegue renderizar
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
