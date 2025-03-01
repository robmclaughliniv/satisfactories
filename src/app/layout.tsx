import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Satisfactories",
  description: "The ultimate planning tool for Satisfactory, the factory-building game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gray-100 dark:bg-gray-900`}>
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-10 border-b bg-white dark:bg-gray-950 dark:border-gray-800">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">Satisfactories</span>
              </div>
              <nav className="flex items-center gap-4">
                {/* Add navigation items here */}
              </nav>
            </div>
          </header>
          <main className="flex-1">
            {children}
          </main>
          <footer className="border-t py-4 bg-white dark:bg-gray-950 dark:border-gray-800">
            <div className="container mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
              &copy; {new Date().getFullYear()} Satisfactories
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
