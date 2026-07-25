export type NotificationPreference = {
  user_id: string;
  email_important_alerts: boolean;
  email_daily_digest: boolean;
};

// ### only owners and current collaborators remain eligible for cat-health emails
export function filterPreferencesForCurrentAccess(
  ownerUserId: string,
  collaboratorUserIds: string[],
  preferences: NotificationPreference[],
): NotificationPreference[] {
  const allowedUserIds = new Set<string>([ownerUserId, ...collaboratorUserIds]);

  return preferences.filter((preference) => allowedUserIds.has(preference.user_id));
}
