import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Fetch single news item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const newsItem = await prisma.news_newsitem.findUnique({
      where: { id: BigInt(id) },
    });

    if (!newsItem) {
      return NextResponse.json({ error: "News item not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: newsItem.id.toString(),
      title: newsItem.title,
      summary: newsItem.summary,
      content: newsItem.content,
      category: newsItem.category,
      priority: newsItem.priority,
      author: newsItem.author,
      status: newsItem.is_published ? "published" : "draft",
      publishDate: newsItem.published_at?.toISOString().split("T")[0] || "",
    });
  } catch (error) {
    console.error("Error fetching news item:", error);
    return NextResponse.json({ error: "Failed to fetch news item" }, { status: 500 });
  }
}

// PUT - Update news item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, summary, content, category, priority, author, status } = body;

    const newsItem = await prisma.news_newsitem.update({
      where: { id: BigInt(id) },
      data: {
        title,
        summary: summary || "",
        content: content || "",
        category: category || "general",
        priority: priority || "normal",
        author: author || "Admin",
        is_published: status === "published",
        published_at: status === "published" ? new Date() : null,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      id: newsItem.id.toString(),
      title: newsItem.title,
      summary: newsItem.summary,
      content: newsItem.content,
      category: newsItem.category,
      status: newsItem.is_published ? "published" : "draft",
    });
  } catch (error) {
    console.error("Error updating news item:", error);
    return NextResponse.json({ error: "Failed to update news item" }, { status: 500 });
  }
}

// DELETE - Delete news item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.news_newsitem.delete({
      where: { id: BigInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting news item:", error);
    return NextResponse.json({ error: "Failed to delete news item" }, { status: 500 });
  }
}

// PATCH - Publish/Unpublish news item
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    const newsItem = await prisma.news_newsitem.findUnique({
      where: { id: BigInt(id) },
    });

    if (!newsItem) {
      return NextResponse.json({ error: "News item not found" }, { status: 404 });
    }

    const updatedNewsItem = await prisma.news_newsitem.update({
      where: { id: BigInt(id) },
      data: {
        is_published: action === "publish",
        published_at: action === "publish" ? new Date() : null,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      id: updatedNewsItem.id.toString(),
      status: updatedNewsItem.is_published ? "published" : "draft",
    });
  } catch (error) {
    console.error("Error updating news status:", error);
    return NextResponse.json({ error: "Failed to update news status" }, { status: 500 });
  }
}
