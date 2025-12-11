import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET - Fetch a single safety alert by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const safetyAlert = await prisma.safety_alerts.findUnique({
      where: { id: BigInt(id) },
    });

    if (!safetyAlert) {
      return NextResponse.json(
        { error: "Safety alert not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: safetyAlert.id.toString(),
      weekNumber: safetyAlert.week_number,
      year: safetyAlert.year,
      category: safetyAlert.category,
      title: safetyAlert.title,
      content: safetyAlert.content,
      thumbnailData: safetyAlert.thumbnail_data,
      pdfData: safetyAlert.pdf_data,
      pdfFilename: safetyAlert.pdf_filename,
      pdfFiles: safetyAlert.pdf_files,
      isActive: safetyAlert.is_active,
      createdAt: safetyAlert.created_at.toISOString(),
      updatedAt: safetyAlert.updated_at.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching safety alert:", error);
    return NextResponse.json(
      { error: "Failed to fetch safety alert" },
      { status: 500 }
    );
  }
}

// PUT - Update a safety alert
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { weekNumber, year, category, title, content, thumbnailData, pdfData, pdfFilename, pdfFiles } = body;

    if (!weekNumber || !year || !category || !title || !content) {
      return NextResponse.json(
        { error: "Week number, year, category, title, and content are required" },
        { status: 400 }
      );
    }

    // Check if another alert with same week/year exists (excluding current one)
    const existingAlert = await prisma.safety_alerts.findFirst({
      where: {
        week_number: weekNumber,
        year: year,
        NOT: { id: BigInt(id) },
      },
    });

    if (existingAlert) {
      return NextResponse.json(
        { error: `Safety alert for week ${weekNumber} of ${year} already exists` },
        { status: 409 }
      );
    }

    const updatedSafetyAlert = await prisma.safety_alerts.update({
      where: { id: BigInt(id) },
      data: {
        week_number: weekNumber,
        year: year,
        category,
        title,
        content,
        thumbnail_data: thumbnailData || null,
        pdf_data: pdfData || null,
        pdf_filename: pdfFilename || null,
        pdf_files: pdfFiles || null,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      id: updatedSafetyAlert.id.toString(),
      weekNumber: updatedSafetyAlert.week_number,
      year: updatedSafetyAlert.year,
      category: updatedSafetyAlert.category,
      title: updatedSafetyAlert.title,
      content: updatedSafetyAlert.content,
      thumbnailData: updatedSafetyAlert.thumbnail_data,
      pdfData: updatedSafetyAlert.pdf_data,
      pdfFilename: updatedSafetyAlert.pdf_filename,
      pdfFiles: updatedSafetyAlert.pdf_files,
      isActive: updatedSafetyAlert.is_active,
      createdAt: updatedSafetyAlert.created_at.toISOString(),
      updatedAt: updatedSafetyAlert.updated_at.toISOString(),
    });
  } catch (error) {
    console.error("Error updating safety alert:", error);
    return NextResponse.json(
      { error: "Failed to update safety alert" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a safety alert
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.safety_alerts.delete({
      where: { id: BigInt(id) },
    });

    return NextResponse.json({ message: "Safety alert deleted successfully" });
  } catch (error) {
    console.error("Error deleting safety alert:", error);
    return NextResponse.json(
      { error: "Failed to delete safety alert" },
      { status: 500 }
    );
  }
}

// PATCH - Toggle active status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { isActive } = body;

    const updatedSafetyAlert = await prisma.safety_alerts.update({
      where: { id: BigInt(id) },
      data: {
        is_active: isActive,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      id: updatedSafetyAlert.id.toString(),
      weekNumber: updatedSafetyAlert.week_number,
      year: updatedSafetyAlert.year,
      category: updatedSafetyAlert.category,
      title: updatedSafetyAlert.title,
      content: updatedSafetyAlert.content,
      thumbnailData: updatedSafetyAlert.thumbnail_data,
      pdfData: updatedSafetyAlert.pdf_data,
      pdfFilename: updatedSafetyAlert.pdf_filename,
      pdfFiles: updatedSafetyAlert.pdf_files,
      isActive: updatedSafetyAlert.is_active,
      createdAt: updatedSafetyAlert.created_at.toISOString(),
      updatedAt: updatedSafetyAlert.updated_at.toISOString(),
    });
  } catch (error) {
    console.error("Error updating safety alert status:", error);
    return NextResponse.json(
      { error: "Failed to update safety alert status" },
      { status: 500 }
    );
  }
}
