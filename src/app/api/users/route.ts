import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Fetch all users
export async function GET() {
  try {
    const users = await prisma.authentication_customuser.findMany({
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        username: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        department: true,
        role: true,
        is_active: true,
        is_staff: true,
        is_superuser: true,
        last_login: true,
        date_joined: true,
        created_at: true,
        employee_id: true,
      },
    });

    const formattedUsers = users.map((user) => ({
      id: user.id.toString(),
      name: `${user.first_name} ${user.last_name}`.trim() || user.username,
      email: user.email,
      phone: user.phone || "",
      company: "RSRG",
      role: user.is_superuser ? "admin" : user.is_staff ? "supervisor" : user.role || "employee",
      department: user.department || "",
      status: user.is_active ? "active" : "inactive",
      lastLogin: user.last_login ? new Date(user.last_login).toISOString() : "Never",
      createdAt: user.created_at ? new Date(user.created_at).toISOString().split("T")[0] : "",
      employeeId: user.employee_id,
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// POST - Create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, department, role } = body;

    const nameParts = name.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const user = await prisma.authentication_customuser.create({
      data: {
        username: email.split("@")[0],
        email,
        first_name: firstName,
        last_name: lastName,
        phone: phone || "",
        department: department || "",
        role: role || "employee",
        password: "temp_password_hash",
        is_active: true,
        is_staff: role === "supervisor" || role === "admin",
        is_superuser: role === "admin",
        date_joined: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        visit_reason: "",
      },
    });

    return NextResponse.json({
      id: user.id.toString(),
      name: `${user.first_name} ${user.last_name}`.trim(),
      email: user.email,
      phone: user.phone,
      department: user.department,
      role: user.role,
      status: "active",
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
