import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface TerritoryData {
  name: string;
  value: number;
}

interface TerritoryWorldMapProps {
  territoryData: TerritoryData[];
}

const TerritoryWorldMap: React.FC<TerritoryWorldMapProps> = ({ territoryData }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [mapInitialized, setMapInitialized] = useState(false);
  const [tokenInput, setTokenInput] = useState<string>('');

  // Territory coordinates mapping
  const territoryCoordinates: Record<string, [number, number]> = {
    'United States': [-95.7129, 37.0902],
    'Canada': [-106.3468, 56.1304],
    'Mexico': [-102.5528, 23.6345],
    'Brazil': [-51.9253, -14.2350],
    'Argentina': [-63.6167, -38.4161],
    'United Kingdom': [-3.4360, 55.3781],
    'Germany': [10.4515, 51.1657],
    'France': [2.2137, 46.2276],
    'Spain': [-3.7492, 40.4637],
    'Italy': [12.5674, 41.8719],
    'Russia': [105.3188, 61.5240],
    'China': [104.1954, 35.8617],
    'Japan': [138.2529, 36.2048],
    'India': [78.9629, 20.5937],
    'South Korea': [127.7669, 35.9078],
    'Australia': [133.7751, -25.2744],
    'New Zealand': [174.8860, -40.9006],
    'South Africa': [22.9375, -30.5595],
    'Nigeria': [8.6753, 9.0820],
    'Kenya': [37.9062, -0.0236],
  };

  const continentColors: Record<string, string> = {
    'United States': '#FF7F00',
    'Canada': '#FF7F00',
    'Mexico': '#FF7F00',
    'Brazil': '#FF4500',
    'Argentina': '#FF4500',
    'United Kingdom': '#3B82F6',
    'Germany': '#3B82F6',
    'France': '#3B82F6',
    'Spain': '#3B82F6',
    'Italy': '#3B82F6',
    'Russia': '#3B82F6',
    'China': '#06B6D4',
    'Japan': '#06B6D4',
    'India': '#06B6D4',
    'South Korea': '#06B6D4',
    'Australia': '#10B981',
    'New Zealand': '#10B981',
    'South Africa': '#EC4899',
    'Nigeria': '#EC4899',
    'Kenya': '#EC4899',
  };

  // Fetch Mapbox token from Supabase secrets
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (data?.token) {
          setMapboxToken(data.token);
          initializeMap(data.token);
        }
      } catch (error) {
        console.log('No Mapbox token found in secrets');
      }
    };

    fetchMapboxToken();
  }, []);

  const initializeMap = (token: string) => {
    if (!mapContainer.current || mapInitialized) return;

    mapboxgl.accessToken = token;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      projection: 'globe' as any,
      zoom: 1.5,
      center: [30, 15],
      pitch: 0,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    map.current.on('style.load', () => {
      map.current?.setFog({
        color: 'rgb(30, 30, 30)',
        'high-color': 'rgb(50, 50, 70)',
        'horizon-blend': 0.2,
      });

      addTerritoryMarkers();
    });

    setMapInitialized(true);
  };

  const addTerritoryMarkers = () => {
    if (!map.current) return;

    const maxValue = Math.max(...territoryData.map(t => t.value));

    territoryData.forEach((territory) => {
      const coordinates = territoryCoordinates[territory.name];
      if (!coordinates) return;

      const normalizedValue = maxValue > 0 ? territory.value / maxValue : 0;
      const size = Math.max(10, normalizedValue * 50);
      const color = continentColors[territory.name] || '#8B5CF6';

      // Create marker element
      const markerElement = document.createElement('div');
      markerElement.style.width = `${size}px`;
      markerElement.style.height = `${size}px`;
      markerElement.style.backgroundColor = color;
      markerElement.style.border = '3px solid rgba(255, 255, 255, 0.8)';
      markerElement.style.borderRadius = '50%';
      markerElement.style.cursor = 'pointer';
      markerElement.style.opacity = '0.8';
      markerElement.style.transition = 'all 0.3s ease';

      // Add hover effects
      markerElement.addEventListener('mouseenter', () => {
        markerElement.style.transform = 'scale(1.2)';
        markerElement.style.opacity = '1';
      });

      markerElement.addEventListener('mouseleave', () => {
        markerElement.style.transform = 'scale(1)';
        markerElement.style.opacity = '0.8';
      });

      // Create popup
      const popup = new mapboxgl.Popup({
        offset: 25,
        className: 'territory-popup',
      }).setHTML(`
        <div style="padding: 8px; font-size: 14px;">
          <div style="font-weight: bold; margin-bottom: 4px;">${territory.name}</div>
          <div style="color: #888;">$${territory.value.toLocaleString()}</div>
        </div>
      `);

      // Add marker to map
      new mapboxgl.Marker(markerElement)
        .setLngLat(coordinates)
        .setPopup(popup)
        .addTo(map.current!);
    });
  };

  const handleTokenSubmit = () => {
    if (tokenInput.trim()) {
      setMapboxToken(tokenInput.trim());
      initializeMap(tokenInput.trim());
    }
  };

  if (!mapboxToken) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Royalties x Territory</CardTitle>
          <CardDescription>Revenue distribution by territory (world map)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-muted/50 p-6 rounded-lg text-center">
              <h3 className="font-semibold mb-2">Mapbox Token Required</h3>
              <p className="text-sm text-muted-foreground mb-4">
                To display the interactive world map, please add your Mapbox public token to the Supabase Edge Function Secrets, 
                or enter it temporarily below.
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Get your token from <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">mapbox.com</a> → Account → Tokens
              </p>
              <div className="flex gap-2 max-w-md mx-auto">
                <div className="flex-1">
                  <Label htmlFor="mapbox-token" className="sr-only">Mapbox Token</Label>
                  <Input
                    id="mapbox-token"
                    type="password"
                    placeholder="pk.ey..."
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                  />
                </div>
                <Button onClick={handleTokenSubmit} disabled={!tokenInput.trim()}>
                  Load Map
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Royalties x Territory</CardTitle>
        <CardDescription>Revenue distribution by territory (world map)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div ref={mapContainer} className="h-80 w-full rounded-lg overflow-hidden" />
          
          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 border text-xs max-w-xs">
            <div className="font-medium mb-2">Continents</div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Europe</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                <span>Asia</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span>N. America</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>S. America</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                <span>Africa</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Oceania</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TerritoryWorldMap;