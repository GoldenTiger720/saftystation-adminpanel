import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET all operations
export async function GET() {
  try {
    const operations = await prisma.operations.findMany({
      orderBy: [
        { year: "desc" },
        { week_number: "desc" },
      ],
    });

    const formattedOperations = operations.map((op) => ({
      id: op.id.toString(),
      weekNumber: op.week_number,
      year: op.year,
      title: op.title,
      description: op.description,
      pdfData: op.pdf_data,
      pdfFilename: op.pdf_filename,
      scheduleType: op.schedule_type,
      isActive: op.is_active,
      createdAt: op.created_at.toISOString(),
      updatedAt: op.updated_at.toISOString(),
    }));

    return NextResponse.json(formattedOperations);
  } catch (error) {
    console.error("Error fetching operations:", error);
    return NextResponse.json(
      { error: "Failed to fetch operations" },
      { status: 500 }
    );
  }
}

// POST create new operation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { weekNumber, year, title, description, pdfData, pdfFilename, scheduleType } = body;

    if (!weekNumber || !year || !title || !scheduleType) {
      return NextResponse.json(
        { error: "Week number, year, title, and schedule type are required" },
        { status: 400 }
      );
    }

    // Validate scheduleType
    if (!["this_week", "next_week"].includes(scheduleType)) {
      return NextResponse.json(
        { error: "Schedule type must be 'this_week' or 'next_week'" },
        { status: 400 }
      );
    }

    // Check if operation for this schedule type already exists
    const existing = await prisma.operations.findUnique({
      where: {
        schedule_type: scheduleType,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `A schedule for ${scheduleType === "this_week" ? "this week" : "next week"} already exists. Please edit the existing one.` },
        { status: 400 }
      );
    }

    const newOperation = await prisma.operations.create({
      data: {
        week_number: weekNumber,
        year: year,
        title: title,
        description: description || null,
        pdf_data: pdfData || null,
        pdf_filename: pdfFilename || null,
        schedule_type: scheduleType,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      id: newOperation.id.toString(),
      weekNumber: newOperation.week_number,
      year: newOperation.year,
      title: newOperation.title,
      description: newOperation.description,
      pdfData: newOperation.pdf_data,
      pdfFilename: newOperation.pdf_filename,
      scheduleType: newOperation.schedule_type,
      isActive: newOperation.is_active,
      createdAt: newOperation.created_at.toISOString(),
      updatedAt: newOperation.updated_at.toISOString(),
    });
  } catch (error) {
    console.error("Error creating operation:", error);
    return NextResponse.json(
      { error: "Failed to create operation" },
      { status: 500 }
    );
  }
}
