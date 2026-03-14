import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import powersuiteaiicon from '../assets/powersuiteai.svg';
import spartaassisticon from '../assets/spartaassistai.svg';
import teams from '../assets/teams.svg';
import outlook from '../assets/outlook.svg';
import darkmode from '../assets/darkmode.svg';

export function SettingCard({ icon, title, description, isEnabled, onChange, isLoading }) {
  const isImageIcon = typeof icon === 'object' && icon?.src;
 
  return (
    <Card className="p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
            {isImageIcon ? (
              <img src={icon.src} alt="icon" className="w-10 h-10" />
            ) : (
              <div className="text-2xl">{icon}</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white leading-tight">
              {title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          </div>
        </div>
 
        <div className="flex items-center gap-3 flex-shrink-0">
          {isLoading ? (
            <span className="flex items-center justify-center h-6 w-11">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
            </span>
          ) : (
            <>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {isEnabled ? 'On' : 'Off'}
              </span>
              <Switch
                checked={!!isEnabled}
                onCheckedChange={(checked) => onChange(checked)}
              />
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

export function NotificationsSection({ localSettings, onToggle, loadingToggles = {}, isLoading = false }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Notifications</h2>
      <div className="space-y-4">
        <SettingCard
          icon={outlook}
          title="Microsoft Outlook Notification"
          description="This option will turn on or off email notifications for every kind of alert."
          isEnabled={!!localSettings.outlook}
          onChange={(checked) => onToggle('outlook', checked)}
          isLoading={isLoading || loadingToggles.outlook}
        />

        <SettingCard
          icon={teams}
          title="Microsoft Teams Notification"
          description="This option will turn on or off teams notifications for every kind of alert."
          isEnabled={!!localSettings.teams}
          onChange={(checked) => onToggle('teams', checked)}
          isLoading={isLoading || loadingToggles.teams}
        />
      </div>
    </div>
  );
}

export function AssistSection({ localSettings, onToggle, loadingToggles = {}, isLoading = false }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Assist</h2>
      <div className="space-y-4">
        <SettingCard
          icon={powersuiteaiicon}
          title="PowerSuite AI"
          description="Enable AI-powered features and intelligent recommendations."
          isEnabled={!!localSettings.powersuiteai}
          onChange={(checked) => onToggle('powersuiteai', checked)}
          isLoading={isLoading || loadingToggles.powersuiteai}
        />

        <SettingCard
          icon={spartaassisticon}
          title="Sparta Assist"
          description="Enable Sparta Assist for enhanced productivity."
          isEnabled={!!localSettings.spartaassist}
          onChange={(checked) => onToggle('spartaassist', checked)}
          isLoading={isLoading || loadingToggles.spartaassist}
        />
      </div>
    </div>
  );
}

export function DarkModeSection({ localSettings, onToggle, loadingToggles = {}, isLoading = false }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Dark Mode</h2>
      <div className="space-y-4">
        <SettingCard
          icon={darkmode}
          title="Dark Mode"
          description="Enable dark mode for a comfortable viewing experience."
          isEnabled={localSettings.darkmode}
          onChange={onToggle}
          isLoading={isLoading || loadingToggles.darkmode}
        />
      </div>
    </div>
  );
}