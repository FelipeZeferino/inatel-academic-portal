"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavLinks() {
  const pathname = usePathname();

  const links = [
    { name: 'Dashboard', href: '/aluno/dashboard' },
    { name: 'Minhas Disciplinas', href: '/aluno/disciplinas' },
    { name: 'Informações', href: '/aluno/informacoes' },
    { name: 'Assistente IA', href: '/aluno/ia' },
  ];

  return (
    <nav className="hidden md:flex h-full">
      {links.map((link) => {
        const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
        
        return (
          <Link
            key={link.name}
            href={link.href}
            className={`flex items-center px-4 text-sm font-medium border-b-2 transition-colors ${
              isActive
                ? 'border-white text-white'
                : 'border-transparent text-blue-100 hover:text-white hover:border-blue-300'
            }`}
          >
            {link.name}
          </Link>
        );
      })}
    </nav>
  );
}
