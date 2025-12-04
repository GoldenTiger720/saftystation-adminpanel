import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Fetch all depot induction videos
export async function GET() {
  try {
    const videos = await prisma.depot_induction_videos.findMany({
      orderBy: { created_at: "desc" },
    });

    const formattedVideos = videos.map((video) => ({
      id: video.id.toString(),
      title: video.title,
      youtubeUrl: video.youtube_url,
      youtubeId: video.youtube_id,
      isActive: video.is_active,
      createdAt: video.created_at.toISOString(),
      updatedAt: video.updated_at.toISOString(),
    }));

    return NextResponse.json({ videos: formattedVideos });
  } catch (error) {
    console.error("Error fetching depot induction videos:", error);
    return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 });
  }
}

// POST - Create a new depot induction video
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, youtubeUrl, youtubeId, isActive } = body;

    if (!title || !youtubeUrl || !youtubeId) {
      return NextResponse.json(
        { error: "Title, YouTube URL, and YouTube ID are required" },
        { status: 400 }
      );
    }

    const video = await prisma.depot_induction_videos.create({
      data: {
        title,
        youtube_url: youtubeUrl,
        youtube_id: youtubeId,
        is_active: isActive !== false,
        created_at: new Date(),
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
    console.error("Error creating depot induction video:", error);
    return NextResponse.json({ error: "Failed to create video" }, { status: 500 });
  }
}
