import type { Metadata, Viewport } from 'next';
import './globals.css';
import CyberNavbar from '@/components/CyberNavbar';
import FlutterBottomNav from '@/components/FlutterBottomNav';

export const metadata: Metadata = {
  title: 'NexusAnime - Streaming Anime Gratis Futuristik (SankaVollerei REST API)',
  description: 'Nonton anime gratis terlengkap dengan subtitle Indonesia, desain futuristik bergaya Flutter, multi-server super cepat bertenaga SankaVollerei REST API.',
  keywords: ['anime streaming', 'sankavollerei', 'nonton anime gratis', 'anime sub indo', 'flutter futuristic'],
  authors: [{ name: 'Nexus Anime' }],
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  themeColor: '#07090e',
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
      <body className="bg-[#07090e] text-slate-100 min-h-screen flex flex-col antialiased selection:bg-cyan-500 selection:text-black">
        {/* Futuristic Ambient Glow Background */}
        <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-cyan-600/10 blur-[120px]" />
          <div className="absolute bottom-[5%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-600/10 blur-[130px]" />
          <div className="absolute top-[40%] right-[10%] w-[35vw] h-[35vw] rounded-full bg-pink-600/5 blur-[120px]" />
        </div>

        {/* Top Cyber Navbar */}
        <CyberNavbar />

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 safe-bottom">
          {children}
        </main>

        {/* Flutter Floating Bottom Navigation for Mobile */}
        <FlutterBottomNav />

        {/* Futuristic Footer */}
        <footer className="w-full border-t border-white/5 py-8 mt-12 bg-[#090d14]/60 text-center text-xs text-slate-500 hidden md:block">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-300">NEXUSSTREAM</span>
              <span>— Powered by SankaVollerei REST API</span>
            </div>
            <p>© {new Date().getFullYear()} Nexus Anime. Made with Next.js & Flutter Futuristic Design.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
