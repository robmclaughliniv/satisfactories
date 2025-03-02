import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
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
                <Link href="/" className="text-xl font-bold">Satisfactories</Link>
              </div>
              <nav className="flex items-center gap-4">
                <Link href="/users" className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400">
                  Users
                </Link>
                <Link href="/worlds" className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400">
                  Worlds
                </Link>
                <Link href="/recipes" className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400">
                  Recipes
                </Link>
                <Link href="/game-data" className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400">
                  Game Data
                </Link>
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
