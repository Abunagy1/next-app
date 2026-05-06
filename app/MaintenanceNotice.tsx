import { getOneDoc } from '@/app/lib/db/getOperationDB';
import { cookies } from 'next/headers';
import { formatDistanceToNowStrict } from 'date-fns';

export default async function MaintenanceNotice() {
  // Fetch website config from DB (dual‑db handled inside getOneDoc)
  const config = await getOneDoc('WebsiteConfig', {}, ['websiteConfig'], 60);
  const maintenanceMode = config?.maintenanceMode || { enabled: false, startsAt: null };

  if (maintenanceMode.enabled) {
    return (
      <div className="bg-secondary p-2 text-center text-xl font-semibold !text-tertiary text-white">
        <div>Server is in maintenance</div>
      </div>
    );
  }

  const startsAt = maintenanceMode.startsAt ? new Date(maintenanceMode.startsAt) : null;
  if (startsAt && startsAt > new Date()) {
    const timeLeft = formatDistanceToNowStrict(startsAt, { addSuffix: false });
    return (
      <div className="bg-secondary p-2 text-center text-xl font-semibold !text-tertiary text-white">
        <div>Maintenance is starting in {timeLeft}</div>
        <p className="text-sm text-secondary-foreground">The website will be down soon</p>
      </div>
    );
  }

  return null;
}