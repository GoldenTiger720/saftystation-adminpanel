import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET - Fetch a single news item by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const newsItem = await prisma.news.findUnique({
      where: { id: BigInt(id) },
    });

    if (!newsItem) {
      return NextResponse.json(
        { error: "News item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: newsItem.id.toString(),
      title: newsItem.title,
      description: newsItem.description,
      imageData: newsItem.image_data,
      avatarData: newsItem.avatar_data,
      newsLink: newsItem.news_link,
      posterName: newsItem.poster_name,
      posterTitle: newsItem.poster_title,
      isActive: newsItem.is_active,
      createdAt: newsItem.created_at.toISOString(),
      updatedAt: newsItem.updated_at.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching news item:", error);
    return NextResponse.json(
      { error: "Failed to fetch news item" },
      { status: 500 }
    );
  }
}

// PUT - Update a news item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, imageData, avatarData, newsLink, posterName, posterTitle } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }

    const updatedNewsItem = await prisma.news.update({
      where: { id: BigInt(id) },
      data: {
        title,
        description,
        image_data: imageData || null,
        avatar_data: avatarData || null,
        news_link: newsLink || null,
        poster_name: posterName || null,
        poster_title: posterTitle || null,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      id: updatedNewsItem.id.toString(),
      title: updatedNewsItem.title,
      description: updatedNewsItem.description,
      imageData: updatedNewsItem.image_data,
      avatarData: updatedNewsItem.avatar_data,
      newsLink: updatedNewsItem.news_link,
      posterName: updatedNewsItem.poster_name,
      posterTitle: updatedNewsItem.poster_title,
      isActive: updatedNewsItem.is_active,
      createdAt: updatedNewsItem.created_at.toISOString(),
      updatedAt: updatedNewsItem.updated_at.toISOString(),
    });
  } catch (error) {
    console.error("Error updating news item:", error);
    return NextResponse.json(
      { error: "Failed to update news item" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a news item
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.news.delete({
      where: { id: BigInt(id) },
    });

    return NextResponse.json({ message: "News item deleted successfully" });
  } catch (error) {
    console.error("Error deleting news item:", error);
    return NextResponse.json(
      { error: "Failed to delete news item" },
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

    const updatedNewsItem = await prisma.news.update({
      where: { id: BigInt(id) },
      data: {
        is_active: isActive,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      id: updatedNewsItem.id.toString(),
      title: updatedNewsItem.title,
      description: updatedNewsItem.description,
      imageData: updatedNewsItem.image_data,
      avatarData: updatedNewsItem.avatar_data,
      newsLink: updatedNewsItem.news_link,
      posterName: updatedNewsItem.poster_name,
      posterTitle: updatedNewsItem.poster_title,
      isActive: updatedNewsItem.is_active,
      createdAt: updatedNewsItem.created_at.toISOString(),
      updatedAt: updatedNewsItem.updated_at.toISOString(),
    });
  } catch (error) {
    console.error("Error updating news item status:", error);
    return NextResponse.json(
      { error: "Failed to update news item status" },
      { status: 500 }
    );
  }
}
