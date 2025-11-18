// Settings logic
import * as repo from '../repositories/settings_repository';
import { createAuditLog } from "./audit_service";

// Get settings
export const getSettings = async () => {
  const result = await repo.getGlobalSettings();
  return result[0];
};

// Update settings
export const updateSettings = async (data: any, adminId: string) => {
  const [updated] = await repo.updateGlobalSettings(data);  // Destructure the array
  await createAuditLog({ 
    adminId, 
    action: 'UPDATE_SETTINGS', 
    targetType: 'settings', 
    targetId: 'global', 
    details: data 
  });
  return updated;  // Return the first element
};