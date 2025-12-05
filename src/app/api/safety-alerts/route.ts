import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET - Fetch all safety alerts
export async function GET() {
  try {
    const safetyAlerts = await prisma.safety_alerts.findMany({
      orderBy: [{ year: "desc" }, { week_number: "desc" }],
    });

    const formattedAlerts = safetyAlerts.map((item) => ({
      id: item.id.toString(),
      weekNumber: item.week_number,
      year: item.year,
      category: item.category,
      title: item.title,
      content: item.content,
      thumbnailData: item.thumbnail_data,
      pdfData: item.pdf_data,
      pdfFilename: item.pdf_filename,
      isActive: item.is_active,
      createdAt: item.created_at.toISOString(),
      updatedAt: item.updated_at.toISOString(),
    }));

    return NextResponse.json(formattedAlerts);
  } catch (error) {
    console.error("Error fetching safety alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch safety alerts" },
      { status: 500 }
    );
  }
}

// POST - Create a new safety alert
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { weekNumber, year, category, title, content, thumbnailData, pdfData, pdfFilename } = body;

    if (!weekNumber || !year || !category || !title || !content) {
      return NextResponse.json(
        { error: "Week number, year, category, title, and content are required" },
        { status: 400 }
      );
    }

    const newSafetyAlert = await prisma.safety_alerts.create({
      data: {
        week_number: weekNumber,
        year: year,
        category,
        title,
        content,
        thumbnail_data: thumbnailData || null,
        pdf_data: pdfData || null,
        pdf_filename: pdfFilename || null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      id: newSafetyAlert.id.toString(),
      weekNumber: newSafetyAlert.week_number,
      year: newSafetyAlert.year,
      category: newSafetyAlert.category,
      title: newSafetyAlert.title,
      content: newSafetyAlert.content,
      thumbnailData: newSafetyAlert.thumbnail_data,
      pdfData: newSafetyAlert.pdf_data,
      pdfFilename: newSafetyAlert.pdf_filename,
      isActive: newSafetyAlert.is_active,
      createdAt: newSafetyAlert.created_at.toISOString(),
      updatedAt: newSafetyAlert.updated_at.toISOString(),
    });
  } catch (error) {
    console.error("Error creating safety alert:", error);
    return NextResponse.json(
      { error: "Failed to create safety alert" },
      { status: 500 }
    );
  }
}
