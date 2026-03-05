// ── Frontend-hardcoded subjects ──────────────────────────────
export const SUBJECTS = [
  { id: "MATH", name: "Maths" },
  { id: "PHY", name: "Physics" },
  { id: "BEEE", name: "BEEE" },
  { id: "PENG", name: "Professional English" },
  { id: "TAM", name: "Tamil" },
  { id: "JAVA", name: "Java" },
] as const;

export type SubjectEntry = (typeof SUBJECTS)[number];

// ── Subject map for quick lookup ─────────────────────────────
export const SUBJECT_MAP: Record<string, string> = Object.fromEntries(
  SUBJECTS.map((s) => [s.id, s.name]),
);

// ── Generate 711625AM101 – 711625AM163 (63 students) ─────────
export const STUDENTS: string[] = Array.from({ length: 63 }, (_, i) => {
  const num = 101 + i;
  return `711625AM${num}`;
});

// ── Validate a registration number ───────────────────────────
export function isValidRegNo(regNo: string): boolean {
  const match = /^711625AM(\d{3})$/i.exec(regNo.trim());
  if (!match) return false;
  const num = Number.parseInt(match[1], 10);
  return num >= 101 && num <= 163;
}

// ── On-duty localStorage helpers ─────────────────────────────
const OD_KEY_PREFIX = "onDuty_";

export function getOnDutyKey(subjectId: string, date: string): string {
  return `${OD_KEY_PREFIX}${subjectId}_${date}`;
}

export function saveOnDutyList(
  subjectId: string,
  date: string,
  regNos: string[],
): void {
  const key = getOnDutyKey(subjectId, date);
  if (regNos.length === 0) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, JSON.stringify(regNos));
  }
}

export function getOnDutyList(subjectId: string, date: string): string[] {
  try {
    const raw = localStorage.getItem(getOnDutyKey(subjectId, date));
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

/** Returns a map of subjectId → Set of dates that have on-duty entries for this student */
export function getAllOnDutyForStudent(regNo: string): Map<string, string[]> {
  const result = new Map<string, string[]>();
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(OD_KEY_PREFIX)) continue;
    // key format: onDuty_SUBJECTID_DATE
    const rest = key.slice(OD_KEY_PREFIX.length);
    const firstUnder = rest.indexOf("_");
    if (firstUnder === -1) continue;
    const subjectId = rest.slice(0, firstUnder);
    const date = rest.slice(firstUnder + 1);
    try {
      const regNos: string[] = JSON.parse(
        localStorage.getItem(key) ?? "[]",
      ) as string[];
      if (regNos.includes(regNo)) {
        if (!result.has(subjectId)) result.set(subjectId, []);
        result.get(subjectId)!.push(date);
      }
    } catch {
      // ignore corrupted entries
    }
  }
  return result;
}
