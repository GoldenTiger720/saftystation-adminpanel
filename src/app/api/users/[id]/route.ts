import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Fetch single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await prisma.authentication_customuser.findUnique({
      where: { id: BigInt(id) },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id.toString(),
      name: `${user.first_name} ${user.last_name}`.trim() || user.username,
      email: user.email,
      phone: user.phone,
      department: user.department,
      role: user.role,
      status: user.is_active ? "active" : "inactive",
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

// PUT - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, phone, department, role, status } = body;

    const nameParts = name?.split(" ") || [];
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const user = await prisma.authentication_customuser.update({
      where: { id: BigInt(id) },
      data: {
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phone || "",
        department: department || "",
        role: role || "employee",
        is_active: status === "active",
        is_staff: role === "supervisor" || role === "admin",
        is_superuser: role === "admin",
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      id: user.id.toString(),
      name: `${user.first_name} ${user.last_name}`.trim(),
      email: user.email,
      phone: user.phone,
      department: user.department,
      role: user.role,
      status: user.is_active ? "active" : "inactive",
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// DELETE - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.authentication_customuser.delete({
      where: { id: BigInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}

// PATCH - Toggle user status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await prisma.authentication_customuser.findUnique({
      where: { id: BigInt(id) },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updatedUser = await prisma.authentication_customuser.update({
      where: { id: BigInt(id) },
      data: {
        is_active: !user.is_active,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      id: updatedUser.id.toString(),
      status: updatedUser.is_active ? "active" : "inactive",
    });
  } catch (error) {
    console.error("Error toggling user status:", error);
    return NextResponse.json({ error: "Failed to toggle user status" }, { status: 500 });
  }
}
