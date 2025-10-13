import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { db } from "../config/database.js"
import { admins } from "../models/admins.js"
import { eq } from "drizzle-orm"
import { config } from "../config/index.js"
import type { SignOptions } from "jsonwebtoken"
import type { AdminRole } from "../types/roles.js"

interface AdminLoginPayload {
  id: string
  role: string
  email: string
  username: string
}

export const adminLogin = async (email: string, password: string) => {
  const [admin] = await db.select().from(admins).where(eq(admins.email, email))
  if (!admin) {
    throw new Error("Invalid email")
  }

  const isValidPassword = await bcrypt.compare(password, admin.password)
  if (!isValidPassword) {
    throw new Error("Invalid password")
  }

  const payload: AdminLoginPayload = {
    id: admin.id,
    role: admin.role,
    email: admin.email,
    username: admin.username,
  }
  const options: SignOptions = { expiresIn: config.jwt.expiresIn }
  const token = jwt.sign(payload, config.jwt.secret as string, options)

  return {
    token,
    user: {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
    },
  }
}

export const createAdmin = async (data: {
  username: string
  email: string
  password: string
  role: AdminRole
  createdBy: string
}) => {
  // Hash password
  const hashedPassword = await bcrypt.hash(data.password, 10)

  // Create admin
  const [newAdmin] = await db
    .insert(admins)
    .values({
      username: data.username,
      email: data.email,
      password: hashedPassword,
      role: data.role,
    })
    .returning()

  return {
    id: newAdmin.id,
    username: newAdmin.username,
    email: newAdmin.email,
    role: newAdmin.role,
  }
}

export const updateAdminRole = async (adminId: string, newRole: AdminRole, updatedBy: string) => {
  const [updatedAdmin] = await db
    .update(admins)
    .set({ role: newRole, updatedAt: new Date() })
    .where(eq(admins.id, adminId))
    .returning()

  return {
    id: updatedAdmin.id,
    username: updatedAdmin.username,
    email: updatedAdmin.email,
    role: updatedAdmin.role,
  }
}

export const getAllAdmins = async () => {
  const allAdmins = await db.select().from(admins)
  return allAdmins.map((admin) => ({
    id: admin.id,
    username: admin.username,
    email: admin.email,
    role: admin.role,
    createdAt: admin.createdAt,
  }))
}
