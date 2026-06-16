import { Types } from 'mongoose';
import { Admin, AdminAccountStatus, AdminRole, WhatsappStatus } from '../schemas';

export type AdminOverviewRecord = Admin & {
  _id: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
};

export const toAdminProfile = (admin: AdminOverviewRecord) => ({
  hostId: String(admin._id),
  email: admin.email,
  fullName: admin.fullName,
  phoneNumber: admin.phoneNumber,
  profileCompleted: admin.profileCompleted,
  role: admin.role,
  accountStatus: admin.accountStatus,
});

export const toOwnerUser = (admin: AdminOverviewRecord) => ({
  id: String(admin._id),
  email: admin.email,
  fullName: admin.fullName,
  phoneNumber: admin.phoneNumber,
  profileCompleted: admin.profileCompleted,
  role: admin.role,
  accountStatus: admin.accountStatus,
  whatsappStatus: admin.whatsappStatus,
  createdAt: admin.createdAt,
  updatedAt: admin.updatedAt,
});

export const toApprovedOwnerUser = (admin: AdminOverviewRecord) => ({
  id: String(admin._id),
  email: admin.email,
  fullName: admin.fullName,
  onboardingCompleted: admin.onboardingCompleted ?? false,
  onboardingSkipped: admin.onboardingSkipped ?? false,
  phoneNumber: admin.phoneNumber,
  profileCompleted: admin.profileCompleted,
  role: admin.role as AdminRole,
  accountStatus: admin.accountStatus as AdminAccountStatus,
  whatsappStatus: admin.whatsappStatus as WhatsappStatus,
  updatedAt: admin.updatedAt,
});
