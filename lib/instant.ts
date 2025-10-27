import { init, id } from "@instantdb/react";
import schema from "../instant.schema";

// Initialize InstantDB
// You'll need to get your APP_ID from https://instantdb.com/dash
// For now, using a placeholder - replace with your actual app ID
const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID || "REPLACE_WITH_YOUR_APP_ID";

export const db = init({ appId: APP_ID, schema });

// Export the id function for creating new entities
export { id };

// Helper types derived from schema
// Note: These types are inferred from the schema but not directly indexable
// Use the InstantDB query results directly instead

// Status type guards
export const OKRStatus = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
} as const;

export const HealthStatus = {
  ON_TRACK: 'on-track',
  AT_RISK: 'at-risk',
  BLOCKED: 'blocked',
  UNKNOWN: 'unknown',
} as const;

export const ReflectionType = {
  MOMENT: 'moment',
  LEARNING: 'learning',
  ADVICE: 'advice',
  TREND: 'trend',
  EVENT: 'event',
} as const;

// Utility functions
export function getCurrentQuarter(): string {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3) + 1;
  const year = now.getFullYear();
  return `${year}-Q${quarter}`;
}

export function getCurrentWave(): string {
  // Calculate wave number based on quarters since a reference point
  // Starting from 2025-Q1 as Wave 1
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1;

  const referenceYear = 2025;
  const referenceQuarter = 1;

  const yearDiff = currentYear - referenceYear;
  const waveNumber = (yearDiff * 4) + currentQuarter - referenceQuarter + 1;

  return `Wave ${waveNumber}`;
}

export function getNextQuarter(current: string): string {
  const [year, q] = current.split('-Q');
  const quarter = parseInt(q || '1');

  if (quarter === 4) {
    return `${parseInt(year || '2025') + 1}-Q1`;
  }
  return `${year || '2025'}-Q${quarter + 1}`;
}

export function calculateProgress(current: number, target: number): number {
  if (target === 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

export function getDaysRemaining(targetDate: number): number {
  const now = Date.now();
  const diff = targetDate - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getDaysFromNow(targetDate: number): number {
  const now = Date.now();
  const diff = targetDate - now;
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

export function formatDaysFromNow(days: number): string {
  if (days < 0) return `(${Math.abs(days)} days ago)`;
  if (days === 0) return "(today)";
  if (days === 1) return "(in 1 day)";
  return `(in ${days} days)`;
}

// Calculate health status based on progress vs time elapsed
export function calculateHealthStatus(
  createdAt: number,
  targetDate: number,
  progress: number
): "on-track" | "at-risk" | "blocked" {
  const now = Date.now();
  const totalDuration = targetDate - createdAt;
  const elapsed = now - createdAt;
  const timeProgress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

  // If we're past the target date
  if (now > targetDate) {
    return progress >= 100 ? "on-track" : "blocked";
  }

  // Calculate how far behind we are
  const progressDelta = progress - timeProgress;

  // On track: progress is keeping up with or ahead of time
  if (progressDelta >= -10) {
    return "on-track";
  }

  // At risk: progress is 10-25% behind time
  if (progressDelta >= -25) {
    return "at-risk";
  }

  // Blocked: progress is more than 25% behind time
  return "blocked";
}
