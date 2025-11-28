import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Fetch all API keys
export async function GET() {
  try {
    const apiKeys = await prisma.api_keys.findMany({
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(
      apiKeys.map((key) => ({
        id: key.id.toString(),
        keyName: key.key_name,
        keyValue: key.key_value,
        channelId: key.channel_id,
        isActive: key.is_active,
        createdAt: key.created_at.toISOString(),
        updatedAt: key.updated_at.toISOString(),
      }))
    );
  } catch (error) {
    console.error("Error fetching API keys:", error);
    return NextResponse.json({ error: "Failed to fetch API keys" }, { status: 500 });
  }
}

// POST - Create or update API key (with optional channel ID)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyName, keyValue, channelId } = body;

    if (!keyName || !keyValue) {
      return NextResponse.json(
        { error: "Key name and value are required" },
        { status: 400 }
      );
    }

    const apiKey = await prisma.api_keys.upsert({
      where: { key_name: keyName },
      update: {
        key_value: keyValue,
        channel_id: channelId || null,
        updated_at: new Date(),
      },
      create: {
        key_name: keyName,
        key_value: keyValue,
        channel_id: channelId || null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      id: apiKey.id.toString(),
      keyName: apiKey.key_name,
      keyValue: apiKey.key_value,
      channelId: apiKey.channel_id,
      isActive: apiKey.is_active,
      createdAt: apiKey.created_at.toISOString(),
      updatedAt: apiKey.updated_at.toISOString(),
    });
  } catch (error) {
    console.error("Error saving API key:", error);
    return NextResponse.json({ error: "Failed to save API key" }, { status: 500 });
  }
}

// DELETE - Delete API key by name
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyName = searchParams.get("keyName");

    if (!keyName) {
      return NextResponse.json(
        { error: "Key name is required" },
        { status: 400 }
      );
    }

    await prisma.api_keys.delete({
      where: { key_name: keyName },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting API key:", error);
    return NextResponse.json({ error: "Failed to delete API key" }, { status: 500 });
  }
}
