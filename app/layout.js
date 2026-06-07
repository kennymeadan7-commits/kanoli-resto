import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// 🔒 ICI : Configuration de l'Anti-Zoom pour mobile
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,     // Bloque le zoom maximum à 100%
  userScalable: false, // Empêche l'utilisateur de pincer pour zoomer
};

export const metadata = {
  title: "Kanoli Resto",
  description: "Le meilleur de la cuisine béninoise",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="scroll-smooth">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}