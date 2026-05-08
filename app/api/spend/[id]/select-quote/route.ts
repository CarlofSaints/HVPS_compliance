import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rolesData";
import { getSpendById, updateSpendApplication } from "@/lib/spendData";

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

  if (app.status !== "approved") {
    return NextResponse.json(
      { error: "Can only select a quote for approved applications" },
      { status: 400 }
    );
  }

  if (app.selectedQuoteIndex !== undefined) {
    return NextResponse.json(
      { error: "A quote has already been selected" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const { quoteIndex } = body;

    if (
      typeof quoteIndex !== "number" ||
      quoteIndex < 0 ||
      quoteIndex >= app.quoteDetails.length
    ) {
      return NextResponse.json(
        { error: "Invalid quote index" },
        { status: 400 }
      );
    }

    const selectedQuote = app.quoteDetails[quoteIndex];
    const approvedAmount = selectedQuote.priceExclVat || 0;

    await updateSpendApplication(id, {
      selectedQuoteIndex: quoteIndex,
      approvedAmount,
    });

    return NextResponse.json({ success: true, approvedAmount });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
