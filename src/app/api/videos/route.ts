import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Fetch all videos (from rhomberg_videos table - YouTube videos)
export async function GET() {
  try {
    const videos = await prisma.rhomberg_videos.findMany({
      orderBy: { published_at: "desc" },
    });

    const formattedVideos = videos.map((video) => ({
      id: video.id.toString(),
      title: video.title,
      description: video.description,
      youtubeId: video.video_id,
      thumbnailUrl: video.thumbnail_url,
      videoUrl: video.video_url,
      duration: video.duration,
      publishDate: video.published_at ? new Date(video.published_at).toISOString().split("T")[0] : "",
      uploadDate: video.fetched_at ? new Date(video.fetched_at).toISOString().split("T")[0] : "",
      category: "Safety Training",
      tags: [],
      isActive: video.is_active,
      views: video.view_count,
      likes: video.like_count,
      status: video.is_active ? "active" : "inactive",
      channelTitle: video.channel_title,
    }));

    return NextResponse.json(formattedVideos);
  } catch (error) {
    console.error("Error fetching videos:", error);
    return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 });
  }
}

// POST - Create/Add a new video
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, youtubeId, category, isActive } = body;

    const video = await prisma.rhomberg_videos.create({
      data: {
        video_id: youtubeId,
        title,
        description: description || "",
        thumbnail_url: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
        video_url: `https://www.youtube.com/watch?v=${youtubeId}`,
        duration: "0:00",
        published_at: new Date(),
        view_count: 0,
        like_count: 0,
        channel_title: category || "RSRG",
        fetched_at: new Date(),
        updated_at: new Date(),
        is_active: isActive !== false,
      },
    });

    return NextResponse.json({
      id: video.id.toString(),
      title: video.title,
      description: video.description,
      youtubeId: video.video_id,
      thumbnailUrl: video.thumbnail_url,
      status: video.is_active ? "active" : "inactive",
    });
  } catch (error) {
    console.error("Error creating video:", error);
    return NextResponse.json({ error: "Failed to create video" }, { status: 500 });
  }
}
