import type { Request, Response } from "express";
import * as adminService from "../services/admin_service.js";
import { AdminRole } from "../types/roles.js";

/**
 * @swagger
 * /adminv/login:
 *   post:
 *     summary: Admin sign-in
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@mail.com
 *               password:
 *                 type: string
 *                 example: adminpass
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
export const adminSignIn = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const { token, user } = await adminService.adminLogin(email, password);
    res.json({ token, user });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
};

export const getAllAdmins = async (req: Request, res: Response) => {
  try {
    const admins = await adminService.getAllAdmins();
    res.json({ admins });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createAdmin = async (req: Request, res: Response) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (!Object.values(AdminRole).includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const admin = await adminService.createAdmin({
      username,
      email,
      password,
      role,
      createdBy: req.user!.id,
    });

    res.status(201).json({ admin });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateAdminRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !Object.values(AdminRole).includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const admin = await adminService.updateAdminRole(id, role, req.user!.id);
    res.json({ admin });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
