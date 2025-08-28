import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from '@/contexts/AuthContext';
import MainLayout from "@/components/MainLayout";
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

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AuthProvider>
          <MainLayout>{children}</MainLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
