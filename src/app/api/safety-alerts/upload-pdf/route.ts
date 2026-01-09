import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// POST - Upload a single PDF file to an existing safety alert
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertId, filename, data } = body;

    if (!alertId || !filename || !data) {
      return NextResponse.json(
        { error: "Alert ID, filename, and data are required" },
        { status: 400 }
      );
    }

    // Get existing alert
    const existingAlert = await prisma.safety_alerts.findUnique({
      where: { id: BigInt(alertId) },
    });

    if (!existingAlert) {
      return NextResponse.json(
        { error: "Safety alert not found" },
        { status: 404 }
      );
    }

    // Get existing PDF files or initialize empty array
    const existingPdfFiles = (existingAlert.pdf_files as { filename: string; data: string }[] | null) || [];

    // Add new PDF file
    const updatedPdfFiles = [...existingPdfFiles, { filename, data }];

    // Update the alert with new PDF file
    const updatedAlert = await prisma.safety_alerts.update({
      where: { id: BigInt(alertId) },
      data: {
        pdf_files: updatedPdfFiles,
        // Also update legacy fields with first PDF for backward compatibility
        pdf_data: updatedPdfFiles[0]?.data || null,
        pdf_filename: updatedPdfFiles[0]?.filename || null,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      pdfCount: updatedPdfFiles.length,
      id: updatedAlert.id.toString(),
    });
  } catch (error) {
    console.error("Error uploading PDF:", error);
    return NextResponse.json(
      { error: "Failed to upload PDF" },
      { status: 500 }
    );
  }
}
