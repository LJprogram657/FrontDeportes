'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import tournaments from '@/data/tournaments.json';

const Breadcrumbs = () => {
  const pathname = usePathname();
  const pathSegments = pathname.split('/').filter(segment => segment);

  const breadcrumbs = [{ label: 'Inicio', href: '/' }];

  // Tipado explícito del JSON para evitar 'never'
  interface TournamentData {
    id: number;
    title: string;
    category: string;
  }
  const tournamentsData: TournamentData[] = Array.isArray(tournaments)
    ? (tournaments as unknown as TournamentData[])
    : [];

  // Detectar si es una página de detalles por el ID numérico
  const lastSegment = pathSegments[pathSegments.length - 1];
  const isDetailsPage = lastSegment && /^\d+$/.test(lastSegment);

  if (isDetailsPage) {
    const tournamentId = parseInt(lastSegment, 10);
    const tournament = tournamentsData.find(t => t.id === tournamentId);
    if (tournament) {
      const categoryPath = `/tournaments/${tournament.category.toLowerCase()}`;
      const categoryLabel = `Torneos ${tournament.category}`;
      breadcrumbs.push({ label: categoryLabel, href: categoryPath });
      breadcrumbs.push({ label: tournament.title, href: pathname });
    }
  } else if (pathSegments.includes('masculino')) {
    breadcrumbs.push({ label: 'Torneos Masculinos', href: '/tournaments/masculino' });
  } else if (pathSegments.includes('femenino')) {
    breadcrumbs.push({ label: 'Torneos Femeninos', href: '/tournaments/femenino' });
  }

  // No mostrar breadcrumbs si solo hay "Inicio"
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav aria-label="breadcrumb" className="py-4 text-sm">
      <ol className="flex items-center space-x-2">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.href} className="flex items-center">
            {index < breadcrumbs.length - 1 ? (
              <Link href={breadcrumb.href} className="text-gray-400 hover:text-[#e31c25] transition-colors">
                {breadcrumb.label}
              </Link>
            ) : (
              <span className="text-white font-medium">{breadcrumb.label}</span>
            )}
            {index < breadcrumbs.length - 1 && (
              <span className="mx-2 text-gray-600">&gt;</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;