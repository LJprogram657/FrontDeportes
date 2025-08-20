import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
// El componente Logo ya no se importa aquí
import "./styles/base.css";
import "./styles/header.css";
import "./styles/footer.css";
import "./styles/hero.css";
import "./styles/tournaments.css";
import "./styles/tournament-details.css";
import "./styles/modal.css";
import "./styles/back-button.css";
// El CSS del logo ya no se importa aquí

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Eventos Deportivos LCG",
  description: "Plataforma para la gestión de torneos deportivos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <div className="main-container">
          {/* El logo ya no se renderiza aquí */}
          <Header />
          <main>{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
