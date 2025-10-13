// Settings logic
import * as repo from '../repositories/settings_repository';
import { createAdminLog } from '../repositories/merchant_repository';

// Get settings
export const getSettings = async () => (await repo.getGlobalSettings())[0];

// Update settings
export const updateSettings = async (data: any, adminId: string) => {
  const updated = await repo.updateGlobalSettings(data);
  await createAdminLog({ adminId, action: 'UPDATE_SETTINGS', targetType: 'settings', targetId: 'global', details: data });
  return updated;
};
