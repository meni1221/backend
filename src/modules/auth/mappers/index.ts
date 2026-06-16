import { AdminRole } from '../../admin/schemas';

type SessionProfile = {
  fullName?: string;
  onboardingCompleted?: boolean;
  onboardingSkipped?: boolean;
  phoneNumber?: string;
  profileCompleted?: boolean;
};

type CreateAuthSessionPayload = {
  accessToken: string;
  email: string;
  hostId: string;
  profile?: SessionProfile;
  role: AdminRole;
};

export const toAuthSession = ({ accessToken, email, hostId, profile, role }: CreateAuthSessionPayload) => ({
  hostId,
  email,
  fullName: profile?.fullName ?? '',
  phoneNumber: profile?.phoneNumber ?? '',
  profileCompleted: profile?.profileCompleted ?? false,
  onboardingCompleted: profile?.onboardingCompleted ?? false,
  onboardingSkipped: profile?.onboardingSkipped ?? false,
  role,
  accessToken,
});
