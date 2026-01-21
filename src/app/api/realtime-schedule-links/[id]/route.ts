import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Fetch single realtime schedule link
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const link = await prisma.realtime_schedule_links.findUnique({
      where: { id: BigInt(id) },
    });

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: link.id.toString(),
      teamType: link.team_type,
      title: link.title,
      linkUrl: link.link_url,
      description: link.description,
      isActive: link.is_active,
      createdAt: link.created_at.toISOString(),
      updatedAt: link.updated_at.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching realtime schedule link:", error);
    return NextResponse.json(
      { error: "Failed to fetch realtime schedule link" },
      { status: 500 }
    );
  }
}

// PUT - Update realtime schedule link
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { teamType, title, linkUrl, description } = body;

    if (!teamType || !title || !linkUrl) {
      return NextResponse.json(
        { error: "Team type, title, and link URL are required" },
        { status: 400 }
      );
    }

    const updatedLink = await prisma.realtime_schedule_links.update({
      where: { id: BigInt(id) },
      data: {
        team_type: teamType,
        title: title,
        link_url: linkUrl,
        description: description || null,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      id: updatedLink.id.toString(),
      teamType: updatedLink.team_type,
      title: updatedLink.title,
      linkUrl: updatedLink.link_url,
      description: updatedLink.description,
      isActive: updatedLink.is_active,
      createdAt: updatedLink.created_at.toISOString(),
      updatedAt: updatedLink.updated_at.toISOString(),
    });
  } catch (error) {
    console.error("Error updating realtime schedule link:", error);
    return NextResponse.json(
      { error: "Failed to update realtime schedule link" },
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

    const updatedLink = await prisma.realtime_schedule_links.update({
      where: { id: BigInt(id) },
      data: {
        is_active: isActive,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      id: updatedLink.id.toString(),
      teamType: updatedLink.team_type,
      title: updatedLink.title,
      isActive: updatedLink.is_active,
      updatedAt: updatedLink.updated_at.toISOString(),
    });
  } catch (error) {
    console.error("Error updating realtime schedule link status:", error);
    return NextResponse.json(
      { error: "Failed to update realtime schedule link status" },
      { status: 500 }
    );
  }
}

// DELETE - Delete realtime schedule link
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.realtime_schedule_links.delete({
      where: { id: BigInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting realtime schedule link:", error);
    return NextResponse.json(
      { error: "Failed to delete realtime schedule link" },
      { status: 500 }
    );
  }
}
