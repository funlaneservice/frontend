import { SettingsContainer } from '@/containers/settings/SettingsContainer';
import { AdminLegalSettings } from '@/containers/settings/AdminLegalSettings';

export default function AdminSettingsPage() {
  return <SettingsContainer extraSections={<AdminLegalSettings />} />;
}
