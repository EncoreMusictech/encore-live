import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Music, Plus, Search, X } from "lucide-react";
import { ArtistAgreementFormData } from "../ArtistAgreementForm";

interface ArtistAgreementFormWorksProps {
  data: ArtistAgreementFormData;
  onChange: (updates: Partial<ArtistAgreementFormData>) => void;
}

// Mock data for available works
const mockWorks = [
  {
    id: "1",
    title: "Summer Nights",
    artist: "John Doe",
    album: "Debut Album",
    duration: "3:45",
    genre: "Pop",
    year: "2024"
  },
  {
    id: "2",
    title: "City Lights",
    artist: "John Doe",
    album: "Debut Album", 
    duration: "4:12",
    genre: "Pop",
    year: "2024"
  },
  {
    id: "3",
    title: "Midnight Drive",
    artist: "John Doe",
    album: "EP Release",
    duration: "3:33",
    genre: "Electronic",
    year: "2023"
  }
];

export const ArtistAgreementFormWorks: React.FC<ArtistAgreementFormWorksProps> = ({
  data,
  onChange
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [availableWorks] = useState(mockWorks);

  const filteredWorks = availableWorks.filter(work =>
    work.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    work.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
    work.album.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleWorkToggle = (work: any, checked: boolean) => {
    const selectedWorks = [...data.selectedWorks];
    
    if (checked) {
      selectedWorks.push(work);
    } else {
      const index = selectedWorks.findIndex(w => w.id === work.id);
      if (index > -1) {
        selectedWorks.splice(index, 1);
      }
    }
    
    onChange({ selectedWorks });
  };

  const removeWork = (workId: string) => {
    const selectedWorks = data.selectedWorks.filter(w => w.id !== workId);
    onChange({ selectedWorks });
  };

  const isWorkSelected = (workId: string) => {
    return data.selectedWorks.some(w => w.id === workId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Select Recording Works</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Choose the recordings that will be covered under this agreement.
        </p>
      </div>

      {/* Selected Works */}
      {data.selectedWorks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Music className="w-4 h-4" />
              Selected Works ({data.selectedWorks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.selectedWorks.map((work) => (
                <div
                  key={work.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <div className="font-medium">{work.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {work.artist} • {work.album} • {work.duration}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeWork(work.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Available Works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Available Works</CardTitle>
          <CardDescription>
            Search and select works to include in the agreement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, artist, or album..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Artist</TableHead>
                  <TableHead>Album</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Genre</TableHead>
                  <TableHead>Year</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6">
                      <div className="text-muted-foreground">
                        {searchTerm ? "No works found matching your search." : "No works available."}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWorks.map((work) => (
                    <TableRow key={work.id}>
                      <TableCell>
                        <Checkbox
                          checked={isWorkSelected(work.id)}
                          onCheckedChange={(checked) => handleWorkToggle(work, !!checked)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{work.title}</TableCell>
                      <TableCell>{work.artist}</TableCell>
                      <TableCell>{work.album}</TableCell>
                      <TableCell>{work.duration}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{work.genre}</Badge>
                      </TableCell>
                      <TableCell>{work.year}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {data.selectedWorks.length === 0 && (
        <Card className="bg-orange-50 dark:bg-orange-950/20">
          <CardHeader>
            <CardTitle className="text-sm">No Works Selected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Please select at least one recording work to include in the agreement.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};