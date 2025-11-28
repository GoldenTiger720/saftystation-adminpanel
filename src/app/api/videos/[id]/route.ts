import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Fetch single video
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const video = await prisma.rhomberg_videos.findUnique({
      where: { id: BigInt(id) },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: video.id.toString(),
      title: video.title,
      description: video.description,
      youtubeId: video.video_id,
      thumbnailUrl: video.thumbnail_url,
      videoUrl: video.video_url,
      duration: video.duration,
      views: video.view_count,
      likes: video.like_count,
      channelTitle: video.channel_title,
      status: video.is_active ? "active" : "inactive",
    });
  } catch (error) {
    console.error("Error fetching video:", error);
    return NextResponse.json({ error: "Failed to fetch video" }, { status: 500 });
  }
}

// PUT - Update video
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, isActive } = body;

    const video = await prisma.rhomberg_videos.update({
      where: { id: BigInt(id) },
      data: {
        title,
        description: description || "",
        is_active: isActive !== false,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      id: video.id.toString(),
      title: video.title,
      description: video.description,
      status: video.is_active ? "active" : "inactive",
    });
  } catch (error) {
    console.error("Error updating video:", error);
    return NextResponse.json({ error: "Failed to update video" }, { status: 500 });
  }
}

// DELETE - Delete video
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.rhomberg_videos.delete({
      where: { id: BigInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting video:", error);
    return NextResponse.json({ error: "Failed to delete video" }, { status: 500 });
  }
}

// PATCH - Toggle video active status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const video = await prisma.rhomberg_videos.findUnique({
      where: { id: BigInt(id) },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const updatedVideo = await prisma.rhomberg_videos.update({
      where: { id: BigInt(id) },
      data: {
        is_active: !video.is_active,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      id: updatedVideo.id.toString(),
      isActive: updatedVideo.is_active,
      status: updatedVideo.is_active ? "active" : "inactive",
    });
  } catch (error) {
    console.error("Error toggling video status:", error);
    return NextResponse.json({ error: "Failed to toggle video status" }, { status: 500 });
  }
}
