import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Fetch all documents
export async function GET() {
  try {
    const documents = await prisma.documents_document.findMany({
      orderBy: { created_at: "desc" },
    });

    const formattedDocuments = documents.map((doc) => ({
      id: doc.id.toString(),
      title: doc.title,
      description: doc.description,
      category: doc.category,
      documentType: doc.document_type,
      file: doc.file,
      fileSize: doc.file_size,
      isActive: doc.is_active,
      downloadCount: doc.download_count,
      uploadedBy: doc.uploaded_by,
      createdAt: doc.created_at ? new Date(doc.created_at).toISOString().split("T")[0] : "",
      updatedAt: doc.updated_at ? new Date(doc.updated_at).toISOString() : "",
    }));

    return NextResponse.json(formattedDocuments);
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

// POST - Create a new document
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, category, documentType, file, fileSize, uploadedBy } = body;

    const document = await prisma.documents_document.create({
      data: {
        title,
        description: description || "",
        category: category || "general",
        document_type: documentType || "pdf",
        file: file || "",
        file_size: fileSize || 0,
        uploaded_by: uploadedBy || "Admin",
        is_active: true,
        download_count: 0,
        created_at: new Date(),
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
    console.error("Error creating document:", error);
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }
}
