import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Fetch all news items
export async function GET() {
  try {
    const newsItems = await prisma.news_newsitem.findMany({
      orderBy: { created_at: "desc" },
    });

    const formattedNews = newsItems.map((item) => ({
      id: item.id.toString(),
      title: item.title,
      summary: item.summary,
      content: item.content,
      category: item.category,
      priority: item.priority,
      author: item.author,
      status: item.is_published ? "published" : "draft",
      publishDate: item.published_at ? new Date(item.published_at).toISOString().split("T")[0] : "",
      lastModified: item.updated_at ? new Date(item.updated_at).toISOString() : "",
      createdAt: item.created_at ? new Date(item.created_at).toISOString().split("T")[0] : "",
    }));

    return NextResponse.json(formattedNews);
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}

// POST - Create a new news item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, summary, content, category, priority, author } = body;

    const newsItem = await prisma.news_newsitem.create({
      data: {
        title,
        summary: summary || "",
        content: content || "",
        category: category || "general",
        priority: priority || "normal",
        author: author || "Admin",
        is_published: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      id: newsItem.id.toString(),
      title: newsItem.title,
      summary: newsItem.summary,
      content: newsItem.content,
      category: newsItem.category,
      priority: newsItem.priority,
      author: newsItem.author,
      status: "draft",
    });
  } catch (error) {
    console.error("Error creating news:", error);
    return NextResponse.json({ error: "Failed to create news" }, { status: 500 });
  }
}
