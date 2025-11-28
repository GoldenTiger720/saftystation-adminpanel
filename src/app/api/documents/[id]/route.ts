import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Fetch single document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const document = await prisma.documents_document.findUnique({
      where: { id: BigInt(id) },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: document.id.toString(),
      title: document.title,
      description: document.description,
      category: document.category,
      documentType: document.document_type,
      file: document.file,
      fileSize: document.file_size,
      isActive: document.is_active,
      downloadCount: document.download_count,
      uploadedBy: document.uploaded_by,
    });
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 });
  }
}

// PUT - Update document
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, category, isActive } = body;

    const document = await prisma.documents_document.update({
      where: { id: BigInt(id) },
      data: {
        title,
        description: description || "",
        category: category || "general",
        is_active: isActive !== false,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      id: document.id.toString(),
      title: document.title,
      description: document.description,
      category: document.category,
      isActive: document.is_active,
    });
  } catch (error) {
    console.error("Error updating document:", error);
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
  }
}

// DELETE - Delete document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.documents_document.delete({
      where: { id: BigInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}

// PATCH - Toggle document active status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const document = await prisma.documents_document.findUnique({
      where: { id: BigInt(id) },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const updatedDocument = await prisma.documents_document.update({
      where: { id: BigInt(id) },
      data: {
        is_active: !document.is_active,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      id: updatedDocument.id.toString(),
      isActive: updatedDocument.is_active,
    });
  } catch (error) {
    console.error("Error toggling document status:", error);
    return NextResponse.json({ error: "Failed to toggle document status" }, { status: 500 });
  }
}
