import { Match, Team, Tournament } from '../types';
import {
  TABLE_TENNIS_MATCHES,
  TABLE_TENNIS_TEAMS,
  TABLE_TENNIS_TOURNAMENTS,
} from './tableTennisData';
import {
  VOLLEYBALL_MATCHES,
  VOLLEYBALL_TEAMS,
  VOLLEYBALL_TOURNAMENTS,
} from './volleyballData';
import {
  FOOTBALL_MATCHES,
  FOOTBALL_TEAMS,
  FOOTBALL_TOURNAMENTS,
} from './footballData';

// Master List of Tournaments: Ping-Pong (preservado) + Voleibol (Pre-Juvenil & Juvenil Mixto) + Fútbol (Mini, Junior Masc, Junior Fem)
export const INITIAL_TOURNAMENTS: Tournament[] = [
  ...TABLE_TENNIS_TOURNAMENTS,
  ...VOLLEYBALL_TOURNAMENTS,
  ...FOOTBALL_TOURNAMENTS,
];

// Master List of Teams
export const INITIAL_TEAMS: Team[] = [
  ...TABLE_TENNIS_TEAMS,
  ...VOLLEYBALL_TEAMS,
  ...FOOTBALL_TEAMS,
];

// Master List of Matches
export const INITIAL_MATCHES: Match[] = [
  ...TABLE_TENNIS_MATCHES,
  ...VOLLEYBALL_MATCHES,
  ...FOOTBALL_MATCHES,
];
