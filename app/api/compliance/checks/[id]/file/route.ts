import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rolesData";
import {
  getComplianceCheckById,
  downloadComplianceCheckFile,
} from "@/lib/complianceCheckData";

export const dynamic = "force-dynamic";

const CONTENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
  md: "text/markdown",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requirePermission(req, "check_compliance");
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const check = await getComplianceCheckById(id);
  if (!check) {
    return NextResponse.json({ error: "Check not found" }, { status: 404 });
  }

  const buffer = await downloadComplianceCheckFile(id, check.filename);
  if (!buffer) {
    return NextResponse.json(
      { error: "Document file not found" },
      { status: 404 }
    );
  }

  const ext = check.ext.toLowerCase().replace(".", "");
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": CONTENT_TYPES[ext] || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${check.filename}"`,
    },
  });
}
