import { readJson, writeJson, writeFile, readFile } from "./controlData";

export type RiskStatus =
  | "not_an_issue"
  | "needs_addressing"
  | "in_progress"
  | "addressed";

export const RISK_STATUSES: RiskStatus[] = [
  "not_an_issue",
  "needs_addressing",
  "in_progress",
  "addressed",
];

export interface StatusCounts {
  not_an_issue: number;
  needs_addressing: number;
  in_progress: number;
  addressed: number;
  unreviewed: number;
}

export interface ComplianceCheckRisk {
  severity: "low" | "medium" | "high";
  section: string;
  description: string;
  guideline_reference: string;
  suggestion: string;
  status?: RiskStatus; // workflow status set by reviewers; undefined = unreviewed
}

export function countStatuses(risks: ComplianceCheckRisk[]): StatusCounts {
  const counts: StatusCounts = {
    not_an_issue: 0,
    needs_addressing: 0,
    in_progress: 0,
    addressed: 0,
    unreviewed: 0,
  };
  for (const r of risks) {
    if (r.status) counts[r.status]++;
    else counts.unreviewed++;
  }
  return counts;
}

export interface ComplianceCheckRecord {
  id: string;
  name: string; // document name given by the user
  filename: string; // original uploaded filename (for download)
  ext: string;
  hash?: string; // sha256 of the uploaded file bytes (for duplicate detection)
  score: number;
  summary: string;
  risks: ComplianceCheckRisk[];
  sources?: { title: string; url: string }[];
  issueCount: number;
  checkedBy: string; // user id
  checkedByName: string;
  checkedAt: string;
}

const CHECKS_INDEX = "compliance/checks.json";

export async function getComplianceChecks(): Promise<ComplianceCheckRecord[]> {
  const checks = await readJson<ComplianceCheckRecord[]>(CHECKS_INDEX, []);
  return [...checks].sort(
    (a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime()
  );
}

export async function getComplianceCheckById(
  id: string
): Promise<ComplianceCheckRecord | undefined> {
  const checks = await readJson<ComplianceCheckRecord[]>(CHECKS_INDEX, []);
  return checks.find((c) => c.id === id);
}

// Duplicate detection by file content (sha256). Same bytes = duplicate, even
// if the document was renamed; an edited file produces a different hash and is
// treated as a new check.
export async function findComplianceCheckByHash(
  hash: string
): Promise<ComplianceCheckRecord | undefined> {
  const checks = await readJson<ComplianceCheckRecord[]>(CHECKS_INDEX, []);
  return checks.find((c) => c.hash === hash);
}

// Saves the uploaded file alongside the check record so it can be downloaded later.
export async function addComplianceCheck(
  record: ComplianceCheckRecord,
  fileData: Buffer
): Promise<void> {
  await writeFile(`compliance/${record.id}/${record.filename}`, fileData);
  const checks = await readJson<ComplianceCheckRecord[]>(CHECKS_INDEX, []);
  checks.push(record);
  await writeJson(CHECKS_INDEX, checks);
}

export async function downloadComplianceCheckFile(
  id: string,
  filename: string
): Promise<Buffer | null> {
  return readFile(`compliance/${id}/${filename}`);
}

// Sets (or clears, when status is null) the workflow status of one risk.
export async function updateRiskStatus(
  checkId: string,
  riskIndex: number,
  status: RiskStatus | null
): Promise<ComplianceCheckRecord | null> {
  const checks = await readJson<ComplianceCheckRecord[]>(CHECKS_INDEX, []);
  const check = checks.find((c) => c.id === checkId);
  if (!check || riskIndex < 0 || riskIndex >= check.risks.length) return null;

  if (status === null) {
    delete check.risks[riskIndex].status;
  } else {
    check.risks[riskIndex].status = status;
  }
  await writeJson(CHECKS_INDEX, checks);
  return check;
}
