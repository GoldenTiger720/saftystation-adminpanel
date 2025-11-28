import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface YouTubeVideoItem {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      high?: { url: string };
      medium?: { url: string };
      default?: { url: string };
    };
    publishedAt: string;
    channelTitle: string;
  };
}

interface YouTubeVideoDetails {
  id: string;
  contentDetails: {
    duration: string;
  };
  statistics: {
    viewCount: string;
    likeCount: string;
  };
}

// Convert ISO 8601 duration to readable format
function formatDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "0:00";

  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// POST - Fetch videos from YouTube and save to database
export async function POST() {
  try {
    // Get YouTube API credentials from database
    const apiKeyRecord = await prisma.api_keys.findUnique({
      where: { key_name: "youtube_api_key" },
    });

    if (!apiKeyRecord) {
      return NextResponse.json(
        { error: "YouTube API key not configured. Please add it in Settings." },
        { status: 400 }
      );
    }

    const apiKey = apiKeyRecord.key_value;
    const channelId = apiKeyRecord.channel_id;

    if (!channelId) {
      return NextResponse.json(
        { error: "YouTube Channel ID not configured. Please add it in Settings." },
        { status: 400 }
      );
    }

    // Fetch videos from YouTube Data API
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet&type=video&order=date&maxResults=50`;

    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      const errorData = await searchResponse.json();
      console.error("YouTube API error:", errorData);
      return NextResponse.json(
        { error: "Failed to fetch videos from YouTube API", details: errorData },
        { status: 500 }
      );
    }

    const searchData = await searchResponse.json();
    const videos: YouTubeVideoItem[] = searchData.items || [];

    if (videos.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No videos found on this channel",
        videosUpdated: 0,
      });
    }

    // Get video IDs for detailed info
    const videoIds = videos.map((v) => v.id.videoId).join(",");

    // Fetch video details (duration, view count, like count)
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&id=${videoIds}&part=contentDetails,statistics`;

    const detailsResponse = await fetch(detailsUrl);
    if (!detailsResponse.ok) {
      console.error("Failed to fetch video details");
    }

    const detailsData = await detailsResponse.json();
    const videoDetails: YouTubeVideoDetails[] = detailsData.items || [];

    // Create a map of video details
    const detailsMap = new Map<string, YouTubeVideoDetails>();
    videoDetails.forEach((detail) => {
      detailsMap.set(detail.id, detail);
    });

    // Upsert videos to database
    let videosUpdated = 0;
    const now = new Date();

    for (const video of videos) {
      const videoId = video.id.videoId;
      const details = detailsMap.get(videoId);

      const thumbnailUrl =
        video.snippet.thumbnails.high?.url ||
        video.snippet.thumbnails.medium?.url ||
        video.snippet.thumbnails.default?.url ||
        "";

      await prisma.rhomberg_videos.upsert({
        where: { video_id: videoId },
        update: {
          title: video.snippet.title,
          description: video.snippet.description,
          thumbnail_url: thumbnailUrl,
          video_url: `https://www.youtube.com/watch?v=${videoId}`,
          duration: details ? formatDuration(details.contentDetails.duration) : "0:00",
          view_count: details ? parseInt(details.statistics.viewCount || "0") : 0,
          like_count: details ? parseInt(details.statistics.likeCount || "0") : 0,
          channel_title: video.snippet.channelTitle,
          updated_at: now,
        },
        create: {
          video_id: videoId,
          title: video.snippet.title,
          description: video.snippet.description,
          thumbnail_url: thumbnailUrl,
          video_url: `https://www.youtube.com/watch?v=${videoId}`,
          duration: details ? formatDuration(details.contentDetails.duration) : "0:00",
          published_at: new Date(video.snippet.publishedAt),
          view_count: details ? parseInt(details.statistics.viewCount || "0") : 0,
          like_count: details ? parseInt(details.statistics.likeCount || "0") : 0,
          channel_title: video.snippet.channelTitle,
          fetched_at: now,
          updated_at: now,
          is_active: true,
        },
      });
      videosUpdated++;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully fetched ${videosUpdated} videos from YouTube`,
      videosUpdated,
      totalVideosOnChannel: searchData.pageInfo?.totalResults || videos.length,
    });
  } catch (error) {
    console.error("Error fetching YouTube videos:", error);
    return NextResponse.json(
      { error: "Failed to fetch videos from YouTube", details: String(error) },
      { status: 500 }
    );
  }
}

// GET - Get YouTube API configuration status
export async function GET() {
  try {
    const apiKeyRecord = await prisma.api_keys.findUnique({
      where: { key_name: "youtube_api_key" },
    });

    return NextResponse.json({
      configured: !!apiKeyRecord,
      hasApiKey: !!apiKeyRecord?.key_value,
      hasChannelId: !!apiKeyRecord?.channel_id,
    });
  } catch (error) {
    console.error("Error checking YouTube configuration:", error);
    return NextResponse.json(
      { error: "Failed to check YouTube configuration" },
      { status: 500 }
    );
  }
}
