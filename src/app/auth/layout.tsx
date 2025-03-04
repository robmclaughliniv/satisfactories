import { ReactNode } from 'react';
import { Metadata } from 'next';
import '../globals.css';
import { Inter } from 'next/font/google';
import NavBar from '../../components/ui/NavBar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Satisfactory Factory Planner',
  description: 'Plan and optimize your Satisfactory factories',
};

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className={`min-h-screen bg-gray-100 ${inter.className}`}>
      <NavBar activeItem="users" />
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
} 