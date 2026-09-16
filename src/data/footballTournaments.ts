import { Tournament } from '../types';

export const FOOTBALL_TOURNAMENTS: Tournament[] = [
  {
    id: 'tourn-futbol-mini',
    name: 'TORNEO FÚTBOL SAN FELIPE NERI 2026 - MIXTO MINI',
    sport: 'futbol',
    category: 'Mixto Categoría Mini (Transición y Primero)',
    description: 'Colegio San Felipe Neri • Torneo Escolar de Fútbol Categoría Mini Mixto (Transición y 1°). Partidos de ida y vuelta disputados en los descansos escolares.',
    status: 'active',
    venue: 'Cancha Infantil San Felipe Neri',
    createdAt: '2026-08-01',
    rules: {
      pointsForWin: 3,
      pointsForDraw: 1,
      pointsForLoss: 0,
      matchDurationMinutes: 24, // 2 tiempos de 12 min
      registrationFee: 5000,
    },
  },
  {
    id: 'tourn-futbol-junior-masc',
    name: 'TORNEO FÚTBOL SAN FELIPE NERI 2026 - MASCULINO JUNIOR',
    sport: 'futbol',
    category: 'Masculino Categoría Junior (2° a 5°)',
    description: 'Colegio San Felipe Neri • Torneo Escolar de Fútbol Categoría Junior Masculino (2°, 3°, 4° y 5°). Cuadrangular escolar con partidos en descansos.',
    status: 'active',
    venue: 'Cancha Central San Felipe Neri',
    createdAt: '2026-08-01',
    rules: {
      pointsForWin: 3,
      pointsForDraw: 1,
      pointsForLoss: 0,
      matchDurationMinutes: 24, // 2 tiempos de 12 min
      registrationFee: 5000,
    },
  },
  {
    id: 'tourn-futbol-junior-fem',
    name: 'TORNEO FÚTBOL SAN FELIPE NERI 2026 - FEMENINO JUNIOR',
    sport: 'futbol',
    category: 'Femenino Categoría Junior (2° a 5°)',
    description: 'Colegio San Felipe Neri • Torneo Escolar de Fútbol Categoría Junior Femenino (2°, 3°, 4° y 5°). Cuadrangular escolar con partidos en descansos.',
    status: 'active',
    venue: 'Cancha Central San Felipe Neri',
    createdAt: '2026-08-01',
    rules: {
      pointsForWin: 3,
      pointsForDraw: 1,
      pointsForLoss: 0,
      matchDurationMinutes: 24, // 2 tiempos de 12 min
      registrationFee: 5000,
    },
  },
  {
    id: 'tourn-futsal-prejuvenil',
    name: 'TORNEO FÚTBOL DE SALÓN - PRE-JUVENIL MASCULINO (6°, 7°, 8°)',
    sport: 'futsal',
    category: 'Pre-Juvenil Masculino (6°, 7°, 8°)',
    description: 'Colegio San Felipe Neri • Torneo de Microfútbol Escolar Categoría Pre-Juvenil Masculino (6°, 7° y 8°). Partidos de 2 tiempos de 12 minutos con arbitraje y control de sanciones.',
    status: 'active',
    venue: 'Cancha de Microfútbol San Felipe Neri',
    createdAt: '2026-08-01',
    rules: {
      pointsForWin: 3,
      pointsForDraw: 1,
      pointsForLoss: 0,
      matchDurationMinutes: 24, // 2 tiempos de 12 min
      registrationFee: 5000,
    },
  },
  {
    id: 'tourn-futsal-juvenil-fem',
    name: 'TORNEO FÚTBOL DE SALÓN - FEMENINO JUVENIL (9°, 10°, 11°, Profesoras)',
    sport: 'futsal',
    category: 'Juvenil Femenino (9°, 10°, 11°, Profesoras)',
    description: 'Colegio San Felipe Neri • Torneo de Microfútbol Escolar Categoría Femenino Juvenil (9°, 10°, 11° y Profesoras). Partidos de 2 tiempos de 12 minutos.',
    status: 'active',
    venue: 'Cancha de Microfútbol San Felipe Neri',
    createdAt: '2026-08-01',
    rules: {
      pointsForWin: 3,
      pointsForDraw: 1,
      pointsForLoss: 0,
      matchDurationMinutes: 24, // 2 tiempos de 12 min
      registrationFee: 5000,
    },
  },
  {
    id: 'tourn-futsal-juvenil-masc',
    name: 'TORNEO FÚTBOL DE SALÓN - JUVENIL MASCULINO (9°, 10°, 11°, Profes y Exalumnos)',
    sport: 'futsal',
    category: 'Juvenil Masculino (9°, 10°, 11°, Profes y Exalumnos)',
    description: 'Colegio San Felipe Neri • Torneo de Microfútbol Escolar Categoría Juvenil Masculino (9°, 10°, 11°, Profesores y Exalumnos). Partidos oficiales de 2 tiempos de 12 minutos.',
    status: 'active',
    venue: 'Cancha de Microfútbol San Felipe Neri',
    createdAt: '2026-08-01',
    rules: {
      pointsForWin: 3,
      pointsForDraw: 1,
      pointsForLoss: 0,
      matchDurationMinutes: 24, // 2 tiempos de 12 min
      registrationFee: 5000,
    },
  },
];
