// ── Department configuration ─────────────────────────────────

export interface DeptConfig {
  label: string;
  code: string;
  ranges: Record<number, [number, number]>;
}

export const DEPT_CONFIG: Record<string, DeptConfig> = {
  AIDS: {
    label: "CSE (AIDS)",
    code: "AD",
    ranges: { 1: [101, 170], 2: [101, 145], 3: [101, 155], 4: [101, 137] },
  },
  AIML: {
    label: "CSE (AIML)",
    code: "AM",
    ranges: { 1: [101, 163], 2: [101, 160], 3: [101, 154], 4: [101, 144] },
  },
  CSE: {
    label: "CSE",
    code: "CS",
    ranges: { 1: [101, 160], 2: [101, 158], 3: [101, 150], 4: [101, 138] },
  },
  ECE: {
    label: "ECE",
    code: "EC",
    ranges: { 1: [101, 158], 2: [101, 153], 3: [101, 147], 4: [101, 140] },
  },
  EEE: {
    label: "EEE",
    code: "EE",
    ranges: { 1: [101, 160], 2: [101, 158], 3: [101, 160], 4: [101, 140] },
  },
};

export const YEAR_CODE: Record<number, string> = {
  1: "25",
  2: "24",
  3: "23",
  4: "22",
};

// ── Dynamic student list generator ──────────────────────────

export function getStudentsForDept(deptKey: string, year: number): string[] {
  const dept = DEPT_CONFIG[deptKey];
  if (!dept) return [];
  const range = dept.ranges[year];
  if (!range) return [];
  const yearCode = YEAR_CODE[year];
  if (!yearCode) return [];

  const [start, end] = range;
  return Array.from({ length: end - start + 1 }, (_, i) => {
    const num = start + i;
    return `7116${yearCode}${dept.code}${num}`;
  });
}

// ── Validate a registration number for a given dept+year ─────

export function isValidRegNoForDept(
  regNo: string,
  deptKey: string,
  year: number,
): boolean {
  const dept = DEPT_CONFIG[deptKey];
  if (!dept) return false;
  const range = dept.ranges[year];
  if (!range) return false;
  const yearCode = YEAR_CODE[year];
  if (!yearCode) return false;

  const prefix = `7116${yearCode}${dept.code}`;
  const upper = regNo.trim().toUpperCase();
  if (!upper.startsWith(prefix.toUpperCase())) return false;
  const numStr = upper.slice(prefix.length);
  const num = Number.parseInt(numStr, 10);
  if (Number.isNaN(num)) return false;
  return num >= range[0] && num <= range[1];
}

// ── Human-readable label ──────────────────────────────────────

export function getDeptYearLabel(deptKey: string, year: number): string {
  const dept = DEPT_CONFIG[deptKey];
  const yearSuffix = ["1st", "2nd", "3rd", "4th"][year - 1] ?? `${year}th`;
  if (!dept) return `${deptKey} - ${yearSuffix} Year`;
  return `${dept.label} - ${yearSuffix} Year`;
}

// ── Dynamic subjects per department (localStorage) ────────────

export interface SubjectEntry {
  id: string;
  name: string;
}

export function getSubjectsForDept(deptKey: string): SubjectEntry[] {
  try {
    const raw = localStorage.getItem(`subjects_${deptKey}`);
    if (!raw) return [];
    return JSON.parse(raw) as SubjectEntry[];
  } catch {
    return [];
  }
}

export function saveSubjectsForDept(
  deptKey: string,
  subjects: SubjectEntry[],
): void {
  localStorage.setItem(`subjects_${deptKey}`, JSON.stringify(subjects));
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

// ── Backward compatibility exports (AIML 1st year defaults) ──

export const STUDENTS: string[] = getStudentsForDept("AIML", 1);

export const SUBJECTS: SubjectEntry[] = [
  { id: "MATH", name: "Maths" },
  { id: "PHY", name: "Physics" },
  { id: "BEEE", name: "BEEE" },
  { id: "PENG", name: "Professional English" },
  { id: "TAM", name: "Tamil" },
  { id: "JAVA", name: "Java" },
];

export const SUBJECT_MAP: Record<string, string> = Object.fromEntries(
  SUBJECTS.map((s) => [s.id, s.name]),
);

export function isValidRegNo(regNo: string): boolean {
  return isValidRegNoForDept(regNo, "AIML", 1);
}
