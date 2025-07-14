import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Music, Users, Building2, Clock, Disc } from 'lucide-react';

// Mock copyright data to show what it would look like
const mockCopyrightData = {
  id: "1",
  work_title: "Sunset Boulevard Dreams",
  work_id: "W20240101-00123456",
  internal_id: "CR2024-000456",
  iswc: "T-123.456.789-0",
  duration_seconds: 240,
  writers: [
    { 
      writer_name: "John Smith", 
      ownership_percentage: 50, 
      writer_role: "Composer",
      pro_affiliation: "ASCAP"
    },
    { 
      writer_name: "Jane Doe", 
      ownership_percentage: 50, 
      writer_role: "Lyricist",
      pro_affiliation: "BMI"
    }
  ],
  publishers: [
    { 
      publisher_name: "Sunset Music Publishing", 
      ownership_percentage: 75,
      publisher_role: "Original Publisher",
      pro_affiliation: "ASCAP"
    },
    { 
      publisher_name: "Dream Songs LLC", 
      ownership_percentage: 25,
      publisher_role: "Co-Publisher",
      pro_affiliation: "BMI"
    }
  ],
  recordings: [
    {
      recording_title: "Sunset Boulevard Dreams (Original Mix)",
      artist_name: "The Midnight Collective",
      isrc: "USRC17607839",
      label_name: "Indie Records Inc"
    }
  ]
};

export const SyncLicenseFormPreview = () => {
  return (
    <div className="space-y-6 p-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Sync License Form - Copyright Integration Preview</h2>
        <p className="text-muted-foreground">
          This shows how the form would look with a song selected from the Copyright Module
        </p>
      </div>

      {/* Selected Copyright Work */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Selected Copyright Work</CardTitle>
            </div>
            <Button variant="outline" size="sm">
              Change Selection
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Title</Label>
              <p className="font-medium">{mockCopyrightData.work_title}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Work ID</Label>
              <p className="font-mono text-sm">{mockCopyrightData.work_id}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">ISWC</Label>
              <p className="font-mono text-sm">{mockCopyrightData.iswc}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Duration</Label>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <p className="text-sm">4:00</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Writers Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <Label className="font-medium">Writers & Ownership</Label>
            </div>
            <div className="grid gap-2">
              {mockCopyrightData.writers.map((writer, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-background rounded border">
                  <div>
                    <p className="font-medium text-sm">{writer.writer_name}</p>
                    <p className="text-xs text-muted-foreground">{writer.writer_role} • {writer.pro_affiliation}</p>
                  </div>
                  <Badge variant="secondary">{writer.ownership_percentage}%</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Publishers Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <Label className="font-medium">Publishers</Label>
            </div>
            <div className="grid gap-2">
              {mockCopyrightData.publishers.map((publisher, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-background rounded border">
                  <div>
                    <p className="font-medium text-sm">{publisher.publisher_name}</p>
                    <p className="text-xs text-muted-foreground">{publisher.publisher_role} • {publisher.pro_affiliation}</p>
                  </div>
                  <Badge variant="secondary">{publisher.ownership_percentage}%</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Recordings Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Disc className="h-4 w-4" />
              <Label className="font-medium">Associated Recordings</Label>
            </div>
            <div className="grid gap-2">
              {mockCopyrightData.recordings.map((recording, index) => (
                <div key={index} className="p-2 bg-background rounded border">
                  <p className="font-medium text-sm">{recording.recording_title}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                    <span>Artist: {recording.artist_name}</span>
                    <span>ISRC: {recording.isrc}</span>
                    <span>Label: {recording.label_name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auto-populated Fields Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Auto-Populated Sync License Fields</CardTitle>
          <p className="text-sm text-muted-foreground">
            These fields would be automatically filled based on the selected copyright
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Linked Copyright IDs</Label>
              <Input 
                value={mockCopyrightData.id} 
                disabled 
                className="bg-muted"
              />
            </div>
            <div>
              <Label>Work Title (Auto-filled)</Label>
              <Input 
                value={mockCopyrightData.work_title} 
                disabled 
                className="bg-muted"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="font-medium">Publisher Splits (Auto-populated)</Label>
            <div className="space-y-2">
              {mockCopyrightData.publishers.map((publisher, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input 
                    value={publisher.publisher_name}
                    disabled
                    className="bg-muted flex-1"
                  />
                  <Input 
                    value={`${publisher.ownership_percentage}%`}
                    disabled
                    className="bg-muted w-20"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="font-medium">Master Splits (Auto-populated from recordings)</Label>
            <div className="space-y-2">
              {mockCopyrightData.recordings.map((recording, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input 
                    value={recording.artist_name}
                    disabled
                    className="bg-muted flex-1"
                  />
                  <Input 
                    value="100%"
                    disabled
                    className="bg-muted w-20"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              ✓ All rights information automatically populated from copyright database
            </p>
            <p className="text-xs text-green-600 mt-1">
              Manual edits can be made if needed for this specific sync deal
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};