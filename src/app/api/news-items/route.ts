import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET - Fetch all news items
export async function GET() {
  try {
    const newsItems = await prisma.news.findMany({
      orderBy: { created_at: "desc" },
    });

    const formattedNews = newsItems.map((item) => ({
      id: item.id.toString(),
      title: item.title,
      description: item.description,
      imageData: item.image_data,
      avatarData: item.avatar_data,
      newsLink: item.news_link,
      posterName: item.poster_name,
      posterTitle: item.poster_title,
      isActive: item.is_active,
      createdAt: item.created_at.toISOString(),
      updatedAt: item.updated_at.toISOString(),
    }));

    return NextResponse.json(formattedNews);
  } catch (error) {
    console.error("Error fetching news items:", error);
    return NextResponse.json(
      { error: "Failed to fetch news items" },
      { status: 500 }
    );
  }
}

// POST - Create a new news item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, imageData, avatarData, newsLink, posterName, posterTitle } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }

    const newNewsItem = await prisma.news.create({
      data: {
        title,
        description,
        image_data: imageData || null,
        avatar_data: avatarData || null,
        news_link: newsLink || null,
        poster_name: posterName || null,
        poster_title: posterTitle || null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      id: newNewsItem.id.toString(),
      title: newNewsItem.title,
      description: newNewsItem.description,
      imageData: newNewsItem.image_data,
      avatarData: newNewsItem.avatar_data,
      newsLink: newNewsItem.news_link,
      posterName: newNewsItem.poster_name,
      posterTitle: newNewsItem.poster_title,
      isActive: newNewsItem.is_active,
      createdAt: newNewsItem.created_at.toISOString(),
      updatedAt: newNewsItem.updated_at.toISOString(),
    });
  } catch (error) {
    console.error("Error creating news item:", error);
    return NextResponse.json(
      { error: "Failed to create news item" },
      { status: 500 }
    );
  }
}
