import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Smartphone,
  Settings,
  Volume2,
  VolumeX
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NotificationPreferences {
  email_alerts: boolean;
  sms_alerts: boolean;
  push_notifications: boolean;
  system_alerts: boolean;
  severity_threshold: string;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

export function EnhancedNotificationSystem() {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_alerts: true,
    sms_alerts: false,
    push_notifications: true,
    system_alerts: true,
    severity_threshold: 'medium',
    quiet_hours_enabled: false,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Use existing notification preferences structure
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id);

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading preferences:', error);
        return;
      }

      // Convert existing preferences to our interface format
      if (data && data.length > 0) {
        const existingPrefs = data.reduce((acc, pref) => {
          switch (pref.notification_type) {
            case 'contract_signed':
              acc.email_alerts = pref.email_enabled;
              acc.push_notifications = pref.push_enabled;
              break;
            case 'system_alert':
              acc.system_alerts = pref.enabled;
              break;
          }
          return acc;
        }, preferences);
        
        setPreferences(existingPrefs);
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create notification preference records for different types
      const prefTypes = [
        {
          notification_type: 'system_alert' as const,
          enabled: preferences.system_alerts,
          email_enabled: preferences.email_alerts,
          push_enabled: preferences.push_notifications
        },
        {
          notification_type: 'contract_signed' as const,
          enabled: true,
          email_enabled: preferences.email_alerts,
          push_enabled: preferences.push_notifications
        }
      ];

      for (const prefType of prefTypes) {
        const { error } = await supabase
          .from('notification_preferences')
          .upsert({
            user_id: user.id,
            ...prefType,
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.error('Error saving preferences:', error);
          throw error;
        }
      }

      toast({
        title: "Success",
        description: "Notification preferences saved successfully",
      });
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save notification preferences",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: boolean | string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 bg-muted rounded w-32"></div>
                <div className="h-6 bg-muted rounded w-12"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Notification Channels */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Notification Channels</h3>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4" />
              <Label htmlFor="email-alerts">Email Alerts</Label>
            </div>
            <Switch
              id="email-alerts"
              checked={preferences.email_alerts}
              onCheckedChange={(checked) => updatePreference('email_alerts', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-4 w-4" />
              <Label htmlFor="sms-alerts">SMS Alerts</Label>
            </div>
            <Switch
              id="sms-alerts"
              checked={preferences.sms_alerts}
              onCheckedChange={(checked) => updatePreference('sms_alerts', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-4 w-4" />
              <Label htmlFor="push-notifications">Push Notifications</Label>
            </div>
            <Switch
              id="push-notifications"
              checked={preferences.push_notifications}
              onCheckedChange={(checked) => updatePreference('push_notifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="h-4 w-4" />
              <Label htmlFor="system-alerts">System Alerts</Label>
            </div>
            <Switch
              id="system-alerts"
              checked={preferences.system_alerts}
              onCheckedChange={(checked) => updatePreference('system_alerts', checked)}
            />
          </div>
        </div>

        <Separator />

        {/* Severity Threshold */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Alert Severity</h3>
          <div className="space-y-3">
            <Label>Minimum severity level for notifications</Label>
            <div className="flex gap-2">
              {['low', 'medium', 'high', 'critical'].map((severity) => (
                <Button
                  key={severity}
                  variant={preferences.severity_threshold === severity ? "default" : "outline"}
                  size="sm"
                  onClick={() => updatePreference('severity_threshold', severity)}
                  className="capitalize"
                >
                  {severity}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <Separator />

        {/* Quiet Hours */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {preferences.quiet_hours_enabled ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
              <Label htmlFor="quiet-hours">Quiet Hours</Label>
            </div>
            <Switch
              id="quiet-hours"
              checked={preferences.quiet_hours_enabled}
              onCheckedChange={(checked) => updatePreference('quiet_hours_enabled', checked)}
            />
          </div>

          {preferences.quiet_hours_enabled && (
            <div className="ml-7 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quiet-start">Start Time</Label>
                  <input
                    id="quiet-start"
                    type="time"
                    value={preferences.quiet_hours_start}
                    onChange={(e) => updatePreference('quiet_hours_start', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <Label htmlFor="quiet-end">End Time</Label>
                  <input
                    id="quiet-end"
                    type="time"
                    value={preferences.quiet_hours_end}
                    onChange={(e) => updatePreference('quiet_hours_end', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Notifications will be suppressed during these hours (except critical alerts)
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={savePreferences}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
          <div className="text-center">
            <Badge variant={preferences.email_alerts ? "default" : "secondary"}>
              Email {preferences.email_alerts ? "ON" : "OFF"}
            </Badge>
          </div>
          <div className="text-center">
            <Badge variant={preferences.sms_alerts ? "default" : "secondary"}>
              SMS {preferences.sms_alerts ? "ON" : "OFF"}
            </Badge>
          </div>
          <div className="text-center">
            <Badge variant={preferences.push_notifications ? "default" : "secondary"}>
              Push {preferences.push_notifications ? "ON" : "OFF"}
            </Badge>
          </div>
          <div className="text-center">
            <Badge variant={preferences.quiet_hours_enabled ? "default" : "secondary"}>
              Quiet {preferences.quiet_hours_enabled ? "ON" : "OFF"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}