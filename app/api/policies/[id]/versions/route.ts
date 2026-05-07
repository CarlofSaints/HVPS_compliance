import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rolesData";
import {
  getPolicyById,
  updatePolicy,
  getPolicyVersions,
  savePolicyVersions,
  uploadPolicyFile,
} from "@/lib/policyData";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requirePermission(req, "upload_policies");
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const policy = await getPolicyById(id);
  if (!policy) {
    return NextResponse.json({ error: "Policy not found" }, { status: 404 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop() || "pdf";
    const buffer = Buffer.from(await file.arrayBuffer());
    const versions = await getPolicyVersions(id);
    const newVersion = (policy.currentVersion || versions.length) + 1;

    await uploadPolicyFile(id, newVersion, ext, buffer);

    versions.push({
      version: newVersion,
      filename: file.name,
      ext,
      uploadedBy: session.id,
      uploadedAt: new Date().toISOString(),
      size: buffer.length,
    });
    await savePolicyVersions(id, versions);
    await updatePolicy(id, { currentVersion: newVersion });

    return NextResponse.json({ version: newVersion }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
