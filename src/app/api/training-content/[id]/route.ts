import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Fetch single training content
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const content = await prisma.training_content.findUnique({
      where: { id: BigInt(id) },
    });

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: content.id.toString(),
      contentType: content.content_type,
      title: content.title,
      description: content.description,
      linkUrl: content.link_url,
      pdfData: content.pdf_data,
      pdfFilename: content.pdf_filename,
      displayOrder: content.display_order,
      isActive: content.is_active,
      createdAt: content.created_at.toISOString(),
      updatedAt: content.updated_at.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching training content:", error);
    return NextResponse.json(
      { error: "Failed to fetch training content" },
      { status: 500 }
    );
  }
}

// PUT - Update training content
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { contentType, title, description, linkUrl, pdfData, pdfFilename, displayOrder } = body;

    if (!contentType || !title) {
      return NextResponse.json(
        { error: "Content type and title are required" },
        { status: 400 }
      );
    }

    const updatedContent = await prisma.training_content.update({
      where: { id: BigInt(id) },
      data: {
        content_type: contentType,
        title: title,
        description: description || null,
        link_url: linkUrl || null,
        pdf_data: pdfData || null,
        pdf_filename: pdfFilename || null,
        display_order: displayOrder || 0,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      id: updatedContent.id.toString(),
      contentType: updatedContent.content_type,
      title: updatedContent.title,
      description: updatedContent.description,
      linkUrl: updatedContent.link_url,
      pdfData: updatedContent.pdf_data,
      pdfFilename: updatedContent.pdf_filename,
      displayOrder: updatedContent.display_order,
      isActive: updatedContent.is_active,
      createdAt: updatedContent.created_at.toISOString(),
      updatedAt: updatedContent.updated_at.toISOString(),
    });
  } catch (error) {
    console.error("Error updating training content:", error);
    return NextResponse.json(
      { error: "Failed to update training content" },
      { status: 500 }
    );
  }
}

// PATCH - Toggle status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { isActive } = body;

    const updatedContent = await prisma.training_content.update({
      where: { id: BigInt(id) },
      data: {
        is_active: isActive,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      id: updatedContent.id.toString(),
      contentType: updatedContent.content_type,
      title: updatedContent.title,
      isActive: updatedContent.is_active,
      updatedAt: updatedContent.updated_at.toISOString(),
    });
  } catch (error) {
    console.error("Error updating training content status:", error);
    return NextResponse.json(
      { error: "Failed to update training content status" },
      { status: 500 }
    );
  }
}

// DELETE - Delete training content
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.training_content.delete({
      where: { id: BigInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting training content:", error);
    return NextResponse.json(
      { error: "Failed to delete training content" },
      { status: 500 }
    );
  }
}
