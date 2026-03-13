import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import powersuiteaiicon from '../assets/powersuiteaiicon.svg';
import spartaassisticon from '../assets/spartaassisticon.svg';
import teams from '../assets/teams.svg';
import outlook from '../assets/outlook.svg';
 
export function SettingCard({ icon, title, description, isEnabled, onChange, isLoading }) {
  const isImageIcon = typeof icon === 'object' && icon?.src;
 
  return (
    <Card className="p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
            {isImageIcon ? (
              <img src={icon.src} alt="icon" className="w-8 h-8" />
            ) : (
              <div className="text-2xl">{icon}</div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {description}
            </p>
          </div>
        </div>
 
        {isLoading ? (
          <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse flex-shrink-0" />
        ) : (
          <Switch
            checked={isEnabled ?? false}
            onCheckedChange={onChange}
            disabled={isLoading}
          />
        )}
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
          isEnabled={localSettings?.outlook}
          onChange={() => onToggle('outlook')}
          isLoading={isLoading || loadingToggles.outlook}
        />
        <SettingCard
          icon={teams}
          title="Microsoft Teams Notification"
          description="This option will turn on or off teams notifications for every kind of alert."
          isEnabled={localSettings?.teams}
          onChange={() => onToggle('teams')}
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
          isEnabled={localSettings?.powersuiteai}
          onChange={() => onToggle('powersuiteai')}
          isLoading={isLoading || loadingToggles.powersuiteai}
        />
        <SettingCard
          icon={spartaassisticon}
          title="Copilot"
          description="Enable Copilot for enhanced productivity."
          isEnabled={localSettings?.spartaassist}
          onChange={() => onToggle('spartaassist')}
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
          icon="🌙"
          title="Dark Mode"
          description="Enable dark mode for a comfortable viewing experience."
          isEnabled={localSettings?.darkmode}
          onChange={() => onToggle('darkmode')}
          isLoading={isLoading || loadingToggles.darkmode}
        />
      </div>
    </div>
  );
}