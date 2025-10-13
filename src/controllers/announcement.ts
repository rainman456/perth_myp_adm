// Controllers for site-wide announcements
/*
import { Request, Response } from 'express';
import * as announcementService from '../services/announcement_service';

// Get all announcements
export const getAnnouncements = async (req: Request, res: Response) => {
  // Fetch announcements
  const announcements = await announcementService.getAllAnnouncements();
  res.json(announcements);
};

// Create announcement
export const createAnnouncement = async (req: Request, res: Response) => {
  // Create new announcement
  const announcement = await announcementService.createAnnouncement(req.body, req.user.id);
  res.status(201).json(announcement);
};

// Delete announcement
export const deleteAnnouncement = async (req: Request, res: Response) => {
  // Delete announcement
  await announcementService.deleteAnnouncement(req.params.id);
  res.status(204).send();
};
*/