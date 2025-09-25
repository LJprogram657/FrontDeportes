import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { AuthProvider } from '@/contexts/AuthContext';
import MainLayout from "@/components/MainLayout";
import { Toaster } from 'sonner';
import "./styles/base.css";
import "./styles/header.css";
import "./styles/hero.css";
import "./styles/tournaments.css";
import "./styles/footer.css";
import "./styles/modal.css";
import "./styles/tournament-details.css";
import "./styles/breadcrumbs.css";
import "./styles/sidebar-nav.css";
import "./styles/back-button.css";
import "./styles/logo.css";
import "./styles/tournament-detail.css";

const geistSans = GeistSans;

const geistMono = GeistMono;

export const metadata: Metadata = {
  title: "Sistema Deportivo Rey",
  description: "Gestión de torneos deportivos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className={`${geistSans.className} ${geistMono.variable}`}>
        <AuthProvider>
          <MainLayout>
            {children}
            <Toaster />
          </MainLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
