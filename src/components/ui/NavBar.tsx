import Link from 'next/link';
import { Button } from './button';

type NavBarProps = {
  activeItem?: 'users' | 'worlds' | 'factories';
};

export default function NavBar({ activeItem = 'users' }: NavBarProps) {
  const navItems = [
    { name: 'Users', href: '/', key: 'users' },
    { name: 'Worlds', href: '/worlds', key: 'worlds' },
    { name: 'Factories', href: '/factories', key: 'factories' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-10 bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-blue-600">
              Satisfactory Planner
            </Link>
          </div>
          <div className="flex space-x-4">
            {navItems.map((item) => (
              <Button
                key={item.key}
                variant={activeItem === item.key ? "default" : "ghost"}
                asChild
              >
                <Link href={item.href}>
                  {item.name}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
} 