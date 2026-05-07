import { NextRequest, NextResponse } from "next/server";
import { requirePermission, requireLogin } from "@/lib/rolesData";
import { getPolicies, createPolicy, savePolicyVersions, uploadPolicyFile } from "@/lib/policyData";
import { v4 as uuidv4 } from "uuid";

export async function GET(req: NextRequest) {
  const session = await requireLogin(req);
  if (session instanceof NextResponse) return session;

  const policies = await getPolicies();
  return NextResponse.json(policies);
}

export async function POST(req: NextRequest) {
  const session = await requirePermission(req, "upload_policies");
  if (session instanceof NextResponse) return session;

  try {
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const file = formData.get("file") as File;

    if (!name || !file) {
      return NextResponse.json(
        { error: "Name and file are required" },
        { status: 400 }
      );
    }

    const policyId = uuidv4();
    const ext = file.name.split(".").pop() || "pdf";
    const buffer = Buffer.from(await file.arrayBuffer());

    await uploadPolicyFile(policyId, 1, ext, buffer);

    await savePolicyVersions(policyId, [
      {
        version: 1,
        filename: file.name,
        ext,
        uploadedBy: session.id,
        uploadedAt: new Date().toISOString(),
        size: buffer.length,
      },
    ]);

    const now = new Date().toISOString();
    await createPolicy({
      id: policyId,
      name,
      description: description || "",
      category: category || "General",
      currentVersion: 1,
      createdBy: session.id,
      createdAt: now,
      updatedAt: now,
      lastCheckScore: null,
      lastCheckDate: null,
    });

    return NextResponse.json({ id: policyId }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
