import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/lib/themeContext';

export const metadata: Metadata = {
  title: 'NexusAnime - Streaming Anime Gratis Futuristik (Sanka Vollerei REST API)',
  description: 'Nonton anime gratis terlengkap dengan subtitle Indonesia, desain Fluent Glassmorphism gelap, multi-server super cepat bertenaga Sanka Vollerei REST API.',
  keywords: ['anime streaming', 'sankavollerei', 'nonton anime gratis', 'anime sub indo', 'fluent glassmorphism'],
  authors: [{ name: 'Nexus Anime' }],
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  themeColor: '#06080e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <body className="bg-[#06080e] text-zinc-100 min-h-screen flex flex-col antialiased selection:bg-white selection:text-black">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
