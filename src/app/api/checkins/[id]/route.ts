import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Fetch single check-in record
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const record = await prisma.staff_checkinrecord.findUnique({
      where: { id: BigInt(id) },
    });

    if (!record) {
      return NextResponse.json({ error: "Check-in record not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: record.id.toString(),
      name: record.name,
      company: record.company,
      reason: record.reason,
      checkInTime: record.check_in_time?.toISOString(),
      checkOutTime: record.check_out_time?.toISOString(),
      status: record.status,
    });
  } catch (error) {
    console.error("Error fetching check-in record:", error);
    return NextResponse.json({ error: "Failed to fetch check-in record" }, { status: 500 });
  }
}

// PUT - Update check-in record
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, company, reason, status } = body;

    const record = await prisma.staff_checkinrecord.update({
      where: { id: BigInt(id) },
      data: {
        name,
        company: company || "",
        reason: reason || "",
        status: status || "checked_in",
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      id: record.id.toString(),
      name: record.name,
      company: record.company,
      reason: record.reason,
      status: record.status,
    });
  } catch (error) {
    console.error("Error updating check-in record:", error);
    return NextResponse.json({ error: "Failed to update check-in record" }, { status: 500 });
  }
}

// DELETE - Delete check-in record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.staff_checkinrecord.delete({
      where: { id: BigInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting check-in record:", error);
    return NextResponse.json({ error: "Failed to delete check-in record" }, { status: 500 });
  }
}

// PATCH - Check out
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const record = await prisma.staff_checkinrecord.update({
      where: { id: BigInt(id) },
      data: {
        check_out_time: new Date(),
        status: "checked_out",
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      id: record.id.toString(),
      checkOutTime: record.check_out_time?.toISOString(),
      status: record.status,
    });
  } catch (error) {
    console.error("Error checking out:", error);
    return NextResponse.json({ error: "Failed to check out" }, { status: 500 });
  }
}
