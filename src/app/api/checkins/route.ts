import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Fetch all check-in records
export async function GET() {
  try {
    const records = await prisma.staff_checkinrecord.findMany({
      orderBy: { created_at: "desc" },
    });

    const formattedRecords = records.map((record) => ({
      id: record.id.toString(),
      name: record.name,
      company: record.company,
      reason: record.reason,
      checkInTime: record.check_in_time ? new Date(record.check_in_time).toISOString() : null,
      checkOutTime: record.check_out_time ? new Date(record.check_out_time).toISOString() : null,
      status: record.status,
      createdAt: record.created_at ? new Date(record.created_at).toISOString() : "",
    }));

    return NextResponse.json(formattedRecords);
  } catch (error) {
    console.error("Error fetching check-in records:", error);
    return NextResponse.json({ error: "Failed to fetch check-in records" }, { status: 500 });
  }
}

// POST - Create a new check-in record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, company, reason } = body;

    const record = await prisma.staff_checkinrecord.create({
      data: {
        name,
        company: company || "",
        reason: reason || "",
        check_in_time: new Date(),
        status: "checked_in",
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      id: record.id.toString(),
      name: record.name,
      company: record.company,
      reason: record.reason,
      checkInTime: record.check_in_time?.toISOString(),
      status: record.status,
    });
  } catch (error) {
    console.error("Error creating check-in record:", error);
    return NextResponse.json({ error: "Failed to create check-in record" }, { status: 500 });
  }
}
