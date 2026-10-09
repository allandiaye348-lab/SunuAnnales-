import React from 'react';
import VideoBackground from '../components/VideoBackground';
import '../src/index.css';

export const metadata = {
  title: 'SunuAnnales — Annales et Concours Officiels au Sénégal',
  description: 'Annales officielles corrigées et sujets de concours au Sénégal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body className="min-h-screen bg-[#020617] text-slate-100 antialiased font-sans">
        <VideoBackground />
        <main className="relative z-0 min-h-screen bg-transparent">
          {children}
        </main>
      </body>
    </html>
  );
}
