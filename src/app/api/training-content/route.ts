import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Fetch all training content
export async function GET() {
  try {
    const content = await prisma.training_content.findMany({
      orderBy: [{ content_type: "asc" }, { display_order: "asc" }, { created_at: "desc" }],
    });

    const formattedContent = content.map((item) => ({
      id: item.id.toString(),
      contentType: item.content_type,
      title: item.title,
      description: item.description,
      linkUrl: item.link_url,
      pdfData: item.pdf_data,
      pdfFilename: item.pdf_filename,
      displayOrder: item.display_order,
      isActive: item.is_active,
      createdAt: item.created_at.toISOString(),
      updatedAt: item.updated_at.toISOString(),
    }));

    return NextResponse.json(formattedContent);
  } catch (error) {
    console.error("Error fetching training content:", error);
    return NextResponse.json(
      { error: "Failed to fetch training content" },
      { status: 500 }
    );
  }
}

// POST - Create new training content
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contentType, title, description, linkUrl, pdfData, pdfFilename, displayOrder } = body;

    if (!contentType || !title) {
      return NextResponse.json(
        { error: "Content type and title are required" },
        { status: 400 }
      );
    }

    // Validate content type
    if (!["training_videos", "work_instructions", "documents"].includes(contentType)) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      );
    }

    const newContent = await prisma.training_content.create({
      data: {
        content_type: contentType,
        title: title,
        description: description || null,
        link_url: linkUrl || null,
        pdf_data: pdfData || null,
        pdf_filename: pdfFilename || null,
        display_order: displayOrder || 0,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      id: newContent.id.toString(),
      contentType: newContent.content_type,
      title: newContent.title,
      description: newContent.description,
      linkUrl: newContent.link_url,
      pdfData: newContent.pdf_data,
      pdfFilename: newContent.pdf_filename,
      displayOrder: newContent.display_order,
      isActive: newContent.is_active,
      createdAt: newContent.created_at.toISOString(),
      updatedAt: newContent.updated_at.toISOString(),
    });
  } catch (error) {
    console.error("Error creating training content:", error);
    return NextResponse.json(
      { error: "Failed to create training content" },
      { status: 500 }
    );
  }
}
