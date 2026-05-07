import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rolesData";
import { getSpendById, updateSpendApplication } from "@/lib/spendData";
import { getPeople } from "@/lib/peopleData";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requirePermission(req, "approve_spend");
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const app = await getSpendById(id);
  if (!app) {
    return NextResponse.json(
      { error: "Spend application not found" },
      { status: 404 }
    );
  }

  try {
    const body = await req.json();
    const { decision, comments } = body;

    if (!["approved", "rejected", "requires_changes"].includes(decision)) {
      return NextResponse.json(
        { error: "Invalid decision" },
        { status: 400 }
      );
    }

    // Find person position for this user
    const people = await getPeople();
    const person = people.find((p) => p.userId === session.id);
    const position = person?.position || "Unknown";

    const approval = {
      userId: session.id,
      userName: `${session.name} ${session.surname}`,
      position,
      decision: decision as "approved" | "rejected" | "requires_changes",
      comments: comments || "",
      decidedAt: new Date().toISOString(),
    };

    const updatedApprovals = [...app.approvals, approval];

    // Determine overall status
    let newStatus = app.status;
    if (decision === "rejected") {
      newStatus = "rejected";
    } else if (decision === "requires_changes") {
      newStatus = "requires_changes";
    } else {
      // Check if all required approvers have approved
      const approverPositions = [
        "Principal",
        "SGB Treasurer",
        "SGB Chairperson",
        "SGB Vice Chairperson",
      ];
      const approvedPositions = updatedApprovals
        .filter((a) => a.decision === "approved")
        .map((a) => a.position);
      const allApproved = approverPositions.every(
        (pos) =>
          approvedPositions.includes(pos) ||
          !people.some((p) => p.position === pos && p.userId)
      );
      if (allApproved) {
        newStatus = "approved";
      }
    }

    await updateSpendApplication(id, {
      approvals: updatedApprovals,
      status: newStatus,
    });

    return NextResponse.json({ success: true, status: newStatus });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
