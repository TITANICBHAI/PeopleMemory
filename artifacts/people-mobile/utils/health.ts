import { Person } from '@/context/AppContext';

export interface HealthScore {
  score: number;
  label: 'Strong' | 'Good' | 'Fading' | 'Cold' | 'Dormant';
  color: string;
  daysSinceContact: number | null;
  reason: string;
}

function daysBetween(a: Date, b: Date): number {
  return Math.abs(Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24)));
}

function avgInteractionGap(person: Person): number | null {
  const interactions = person.interactions ?? [];
  if (interactions.length < 2) return null;
  const sorted = [...interactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  let total = 0;
  for (let i = 1; i < sorted.length; i++) {
    total += daysBetween(new Date(sorted[i].date), new Date(sorted[i - 1].date));
  }
  return total / (sorted.length - 1);
}

export function calculateHealthScore(person: Person): HealthScore {
  const now = new Date();
  const candidates: Date[] = [];
  if (person.lastMet) candidates.push(new Date(person.lastMet));
  if (person.interactions?.length) {
    const sorted = [...person.interactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    candidates.push(new Date(sorted[0].date));
  }
  const lastContact = candidates.length
    ? new Date(Math.max(...candidates.map(d => d.getTime())))
    : null;
  const daysSinceContact = lastContact ? daysBetween(now, lastContact) : null;

  let score = 60;

  if (daysSinceContact === null) {
    score = 25;
  } else if (daysSinceContact <= 7) {
    score += 35;
  } else if (daysSinceContact <= 14) {
    score += 20;
  } else if (daysSinceContact <= 30) {
    score += 5;
  } else if (daysSinceContact <= 60) {
    score -= 10;
  } else if (daysSinceContact <= 90) {
    score -= 25;
  } else if (daysSinceContact <= 180) {
    score -= 40;
  } else {
    score -= 55;
  }

  const avgGap = avgInteractionGap(person);
  if (avgGap !== null && daysSinceContact !== null) {
    if (daysSinceContact > avgGap * 1.5) score -= 8;
    else if (daysSinceContact < avgGap * 0.7) score += 5;
  }

  if (person.trustLevel !== null && person.trustLevel !== undefined) {
    score += Math.round((person.trustLevel - 5) * 1.5);
  }

  score = Math.max(0, Math.min(100, score));

  let label: HealthScore['label'];
  let color: string;
  let reason: string;

  if (score >= 80) {
    label = 'Strong';
    color = '#4EC94E';
    reason = daysSinceContact !== null ? `Last contact ${daysSinceContact}d ago` : 'Active';
  } else if (score >= 60) {
    label = 'Good';
    color = '#7BC67B';
    reason = daysSinceContact !== null ? `${daysSinceContact} days since contact` : 'Active';
  } else if (score >= 40) {
    label = 'Fading';
    color = '#E5C07B';
    reason = daysSinceContact !== null ? `${daysSinceContact}d — check in soon` : 'No contact logged';
  } else if (score >= 20) {
    label = 'Cold';
    color = '#F4A747';
    reason = daysSinceContact !== null ? `${daysSinceContact}d — reach out` : 'No contact logged';
  } else {
    label = 'Dormant';
    color = '#F44747';
    reason = daysSinceContact !== null ? `${daysSinceContact}d — long overdue` : 'Never contacted';
  }

  return { score, label, color, daysSinceContact, reason };
}

export function getReconnectList(
  people: Person[]
): { person: Person; health: HealthScore }[] {
  return people
    .map(p => ({ person: p, health: calculateHealthScore(p) }))
    .filter(({ health }) => health.score < 55)
    .sort((a, b) => a.health.score - b.health.score)
    .slice(0, 8);
}
