import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Fetch all realtime schedule links
export async function GET() {
  try {
    const links = await prisma.realtime_schedule_links.findMany({
      orderBy: { team_type: "asc" },
    });

    return NextResponse.json(
      links.map((link) => ({
        id: link.id.toString(),
        teamType: link.team_type,
        title: link.title,
        linkUrl: link.link_url,
        description: link.description,
        isActive: link.is_active,
        createdAt: link.created_at.toISOString(),
        updatedAt: link.updated_at.toISOString(),
      }))
    );
  } catch (error) {
    console.error("Error fetching realtime schedule links:", error);
    return NextResponse.json(
      { error: "Failed to fetch realtime schedule links" },
      { status: 500 }
    );
  }
}

// POST - Create new realtime schedule link
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamType, title, linkUrl, description } = body;

    if (!teamType || !title || !linkUrl) {
      return NextResponse.json(
        { error: "Team type, title, and link URL are required" },
        { status: 400 }
      );
    }

    const newLink = await prisma.realtime_schedule_links.create({
      data: {
        team_type: teamType,
        title: title,
        link_url: linkUrl,
        description: description || null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      id: newLink.id.toString(),
      teamType: newLink.team_type,
      title: newLink.title,
      linkUrl: newLink.link_url,
      description: newLink.description,
      isActive: newLink.is_active,
      createdAt: newLink.created_at.toISOString(),
      updatedAt: newLink.updated_at.toISOString(),
    });
  } catch (error) {
    console.error("Error creating realtime schedule link:", error);
    return NextResponse.json(
      { error: "Failed to create realtime schedule link" },
      { status: 500 }
    );
  }
}
