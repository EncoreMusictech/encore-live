import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { SafeExternalLink } from './safe-external-link';

export const DataLossProtectionDemo: React.FC = () => {
  const [demoFormData, setDemoFormData] = useState('');

  const protectionFeatures = [
    {
      name: "Auto-Save",
      description: "Saves form data every 3 seconds of inactivity",
      status: "active",
      icon: CheckCircle
    },
    {
      name: "Session Persistence", 
      description: "Maintains state when switching tabs or windows",
      status: "active",
      icon: Shield
    },
    {
      name: "Before Unload Warning",
      description: "Warns before navigating away from unsaved changes",
      status: "active", 
      icon: Shield
    },
    {
      name: "Safe External Links",
      description: "Opens external links without affecting current session",
      status: "active",
      icon: ExternalLink
    },
    {
      name: "Draft Recovery",
      description: "Offers to restore unsaved work on return",
      status: "active",
      icon: Clock
    }
  ];

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          CRM Data Loss Protection Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            All data loss protection features are now active. Your work is automatically
            saved and protected when accessing external windows.
          </AlertDescription>
        </Alert>

        <div className="grid gap-3">
          {protectionFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="font-medium">{feature.name}</p>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Active
                </Badge>
              </div>
            );
          })}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Test External Link Protection:</p>
          <div className="flex gap-2">
            <SafeExternalLink
              href="https://www.ascap.com/repertory"
              variant="outline"
              onBeforeNavigate={() => console.log('Auto-saving before external navigation...')}
            >
              Test ASCAP Link
            </SafeExternalLink>
            <SafeExternalLink
              href="https://open.spotify.com"
              variant="outline"
              onBeforeNavigate={() => console.log('Auto-saving before external navigation...')}
            >
              Test Spotify Link
            </SafeExternalLink>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};