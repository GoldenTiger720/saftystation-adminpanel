import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Fetch a single depot induction video
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const video = await prisma.depot_induction_videos.findUnique({
      where: { id: BigInt(id) },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: video.id.toString(),
      title: video.title,
      youtubeUrl: video.youtube_url,
      youtubeId: video.youtube_id,
      isActive: video.is_active,
      createdAt: video.created_at.toISOString(),
      updatedAt: video.updated_at.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching depot induction video:", error);
    return NextResponse.json({ error: "Failed to fetch video" }, { status: 500 });
  }
}

// PUT - Update a depot induction video
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, youtubeUrl, youtubeId, isActive } = body;

    if (!title || !youtubeUrl || !youtubeId) {
      return NextResponse.json(
        { error: "Title, YouTube URL, and YouTube ID are required" },
        { status: 400 }
      );
    }

    const video = await prisma.depot_induction_videos.update({
      where: { id: BigInt(id) },
      data: {
        title,
        youtube_url: youtubeUrl,
        youtube_id: youtubeId,
        is_active: isActive,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      id: video.id.toString(),
      title: video.title,
      youtubeUrl: video.youtube_url,
      youtubeId: video.youtube_id,
      isActive: video.is_active,
      createdAt: video.created_at.toISOString(),
      updatedAt: video.updated_at.toISOString(),
    });
  } catch (error) {
    console.error("Error updating depot induction video:", error);
    return NextResponse.json({ error: "Failed to update video" }, { status: 500 });
  }
}

// PATCH - Toggle video active status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { isActive } = body;

    const video = await prisma.depot_induction_videos.update({
      where: { id: BigInt(id) },
      data: {
        is_active: isActive,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      id: video.id.toString(),
      title: video.title,
      youtubeUrl: video.youtube_url,
      youtubeId: video.youtube_id,
      isActive: video.is_active,
      createdAt: video.created_at.toISOString(),
      updatedAt: video.updated_at.toISOString(),
    });
  } catch (error) {
    console.error("Error updating depot induction video status:", error);
    return NextResponse.json({ error: "Failed to update video status" }, { status: 500 });
  }
}

// DELETE - Delete a depot induction video
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.depot_induction_videos.delete({
      where: { id: BigInt(id) },
    });

    return NextResponse.json({ success: true, message: "Video deleted successfully" });
  } catch (error) {
    console.error("Error deleting depot induction video:", error);
    return NextResponse.json({ error: "Failed to delete video" }, { status: 500 });
  }
}
