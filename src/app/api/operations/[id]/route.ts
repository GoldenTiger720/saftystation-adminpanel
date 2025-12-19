import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET single operation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const operation = await prisma.operations.findUnique({
      where: { id: BigInt(id) },
    });

    if (!operation) {
      return NextResponse.json(
        { error: "Operation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: operation.id.toString(),
      weekNumber: operation.week_number,
      year: operation.year,
      title: operation.title,
      description: operation.description,
      excelData: operation.excel_data,
      excelFilename: operation.excel_filename,
      scheduleType: operation.schedule_type,
      isActive: operation.is_active,
      createdAt: operation.created_at.toISOString(),
      updatedAt: operation.updated_at.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching operation:", error);
    return NextResponse.json(
      { error: "Failed to fetch operation" },
      { status: 500 }
    );
  }
}

// PUT update operation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { weekNumber, year, title, description, excelData, excelFilename, scheduleType } = body;

    if (!weekNumber || !year || !title) {
      return NextResponse.json(
        { error: "Week number, year, and title are required" },
        { status: 400 }
      );
    }

    const updatedOperation = await prisma.operations.update({
      where: { id: BigInt(id) },
      data: {
        week_number: weekNumber,
        year: year,
        title: title,
        description: description || null,
        excel_data: excelData || null,
        excel_filename: excelFilename || null,
        schedule_type: scheduleType,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      id: updatedOperation.id.toString(),
      weekNumber: updatedOperation.week_number,
      year: updatedOperation.year,
      title: updatedOperation.title,
      description: updatedOperation.description,
      excelData: updatedOperation.excel_data,
      excelFilename: updatedOperation.excel_filename,
      scheduleType: updatedOperation.schedule_type,
      isActive: updatedOperation.is_active,
      createdAt: updatedOperation.created_at.toISOString(),
      updatedAt: updatedOperation.updated_at.toISOString(),
    });
  } catch (error) {
    console.error("Error updating operation:", error);
    return NextResponse.json(
      { error: "Failed to update operation" },
      { status: 500 }
    );
  }
}

// PATCH update operation status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { isActive } = body;

    const updatedOperation = await prisma.operations.update({
      where: { id: BigInt(id) },
      data: {
        is_active: isActive,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      id: updatedOperation.id.toString(),
      weekNumber: updatedOperation.week_number,
      year: updatedOperation.year,
      title: updatedOperation.title,
      description: updatedOperation.description,
      excelData: updatedOperation.excel_data,
      excelFilename: updatedOperation.excel_filename,
      scheduleType: updatedOperation.schedule_type,
      isActive: updatedOperation.is_active,
      createdAt: updatedOperation.created_at.toISOString(),
      updatedAt: updatedOperation.updated_at.toISOString(),
    });
  } catch (error) {
    console.error("Error updating operation status:", error);
    return NextResponse.json(
      { error: "Failed to update operation status" },
      { status: 500 }
    );
  }
}

// DELETE operation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.operations.delete({
      where: { id: BigInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting operation:", error);
    return NextResponse.json(
      { error: "Failed to delete operation" },
      { status: 500 }
    );
  }
}
