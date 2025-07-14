import { useState, useCallback, useEffect } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, AlertTriangle, CheckCircle, Clock, Music, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Copyright {
  id: string;
  songTitle: string;
  isrc: string;
  iswc: string;
  writers: Writer[];
  publishers: Publisher[];
  proStatus: "registered" | "pending" | "not_registered";
  duplicateWarning: boolean;
  createdAt: string;
}

interface Writer {
  name: string;
  ipi: string;
  share: number;
}

interface Publisher {
  name: string;
  share: number;
}

const CopyrightManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [copyrights, setCopyrights] = useState<Copyright[]>([
    {
      id: "1",
      songTitle: "Summer Nights",
      isrc: "USRC17607839",
      iswc: "T-070.600.001-1",
      writers: [
        { name: "John Smith", ipi: "00199123456", share: 50 },
        { name: "Jane Doe", ipi: "00299654321", share: 50 }
      ],
      publishers: [
        { name: "Music Publishing Co.", share: 100 }
      ],
      proStatus: "registered",
      duplicateWarning: false,
      createdAt: "2024-01-15"
    },
    {
      id: "2",
      songTitle: "Electric Dreams",
      isrc: "USRC17607840",
      iswc: "T-070.600.002-1",
      writers: [
        { name: "Mike Johnson", ipi: "00399789012", share: 100 }
      ],
      publishers: [
        { name: "Dream Music Ltd.", share: 100 }
      ],
      proStatus: "pending",
      duplicateWarning: true,
      createdAt: "2024-01-20"
    }
  ]);

  const [formData, setFormData] = useState<{
    songTitle: string;
    isrc: string;
    iswc: string;
    recordingArtist: string;
    duration: number | "";
    releaseDate: string;
    writers: Writer[];
    publishers: Publisher[];
    proStatus: Copyright["proStatus"];
  }>({
    songTitle: "",
    isrc: "",
    iswc: "",
    recordingArtist: "",
    duration: "",
    releaseDate: "",
    writers: [{ name: "", ipi: "", share: 0 }],
    publishers: [{ name: "", share: 0 }],
    proStatus: "not_registered"
  });

  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [spotifyMetadata, setSpotifyMetadata] = useState<any>(null);
  const [ascapLoading, setAscapLoading] = useState(false);
  const [searchWriter, setSearchWriter] = useState('');
  const [searchPublisher, setSearchPublisher] = useState('');

  // Debounced function to fetch Spotify metadata
  const fetchSpotifyMetadata = useCallback(async (workTitle: string) => {
    if (!workTitle.trim() || workTitle.length < 3) return;

    setIsLoadingMetadata(true);
    try {
      const { data, error } = await supabase.functions.invoke('spotify-track-metadata', {
        body: { workTitle }
      });

      if (error) {
        console.error('Error fetching Spotify metadata:', error);
        return;
      }

      if (data?.success && data?.bestMatch) {
        setSpotifyMetadata(data);
        
        // Auto-populate the form with best match data
        setFormData(prev => ({
          ...prev,
          isrc: data.bestMatch.isrc || prev.isrc,
          recordingArtist: data.bestMatch.artist || prev.recordingArtist,
          duration: data.bestMatch.duration || prev.duration,
          releaseDate: data.bestMatch.releaseDate || prev.releaseDate
        }));

        toast({
          title: "Metadata Found",
          description: `Auto-filled metadata for "${data.bestMatch.trackName}" by ${data.bestMatch.artist}`,
        });
      }
    } catch (error) {
      console.error('Error fetching metadata:', error);
    } finally {
      setIsLoadingMetadata(false);
    }
  }, [toast]);

  // Debounce the metadata fetching
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.songTitle) {
        fetchSpotifyMetadata(formData.songTitle);
      }
    }, 1000); // Wait 1 second after user stops typing

    return () => clearTimeout(timeoutId);
  }, [formData.songTitle, fetchSpotifyMetadata]);

  const filteredCopyrights = copyrights.filter(copyright =>
    copyright.songTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    copyright.isrc.toLowerCase().includes(searchTerm.toLowerCase()) ||
    copyright.iswc.toLowerCase().includes(searchTerm.toLowerCase()) ||
    copyright.writers.some(writer => 
      writer.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) ||
    copyright.publishers.some(publisher => 
      publisher.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const addWriter = () => {
    setFormData(prev => ({
      ...prev,
      writers: [...prev.writers, { name: "", ipi: "", share: 0 }]
    }));
  };

  const addPublisher = () => {
    setFormData(prev => ({
      ...prev,
      publishers: [...prev.publishers, { name: "", share: 0 }]
    }));
  };

  const updateWriter = (index: number, field: keyof Writer, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      writers: prev.writers.map((writer, i) => 
        i === index ? { ...writer, [field]: value } : writer
      )
    }));
  };

  const updatePublisher = (index: number, field: keyof Publisher, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      publishers: prev.publishers.map((publisher, i) => 
        i === index ? { ...publisher, [field]: value } : publisher
      )
    }));
  };

  const removeWriter = (index: number) => {
    if (formData.writers.length > 1) {
      setFormData(prev => ({
        ...prev,
        writers: prev.writers.filter((_, i) => i !== index)
      }));
    }
  };

  const removePublisher = (index: number) => {
    if (formData.publishers.length > 1) {
      setFormData(prev => ({
        ...prev,
        publishers: prev.publishers.filter((_, i) => i !== index)
      }));
    }
  };

  const validateShares = () => {
    const writerTotal = formData.writers.reduce((sum, writer) => sum + writer.share, 0);
    const publisherTotal = formData.publishers.reduce((sum, publisher) => sum + publisher.share, 0);
    
    if (writerTotal !== 100) {
      toast({
        title: "Invalid Writer Shares",
        description: `Writer shares must total 100%. Current total: ${writerTotal}%`,
        variant: "destructive"
      });
      return false;
    }
    
    if (publisherTotal !== 100) {
      toast({
        title: "Invalid Publisher Shares",
        description: `Publisher shares must total 100%. Current total: ${publisherTotal}%`,
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  const searchASCAP = async () => {
    if (!formData.songTitle && !searchWriter && !searchPublisher) {
      toast({
        title: "Missing search criteria",
        description: "Please provide at least a work title, writer name, or publisher name.",
        variant: "destructive"
      });
      return;
    }

    setAscapLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ascap-lookup', {
        body: {
          workTitle: formData.songTitle,
          writerName: searchWriter,
          publisherName: searchPublisher
        }
      });

      if (error) throw error;

      if (data.found) {
        // Auto-populate ISWC if found
        if (data.iswc && !formData.iswc) {
          setFormData(prev => ({ ...prev, iswc: data.iswc }));
        }

        // Auto-populate writers if found
        if (data.writers && data.writers.length > 0) {
          const ascapWriters = data.writers.map((w: any) => ({
            name: w.name || '',
            ipi: w.ipi || '',
            share: w.share || 0
          }));
          setFormData(prev => ({ ...prev, writers: ascapWriters }));
        }

        // Auto-populate publishers if found
        if (data.publishers && data.publishers.length > 0) {
          const ascapPublishers = data.publishers.map((p: any) => ({
            name: p.name || '',
            share: p.share || 0
          }));
          setFormData(prev => ({ ...prev, publishers: ascapPublishers }));
        }

        toast({
          title: "ASCAP data found",
          description: `Found ${data.writers?.length || 0} writers and ${data.publishers?.length || 0} publishers. Form auto-populated.`,
          variant: "default"
        });
      } else {
        toast({
          title: "No results found",
          description: "No matching records found in ASCAP Repertory database.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('ASCAP lookup error:', error);
      toast({
        title: "Search error",
        description: "Failed to search ASCAP database. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAscapLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateShares()) return;

    const newCopyright: Copyright = {
      id: Date.now().toString(),
      ...formData,
      duplicateWarning: copyrights.some(c => 
        c.isrc === formData.isrc || c.iswc === formData.iswc
      ),
      createdAt: new Date().toISOString().split('T')[0]
    };

    setCopyrights(prev => [newCopyright, ...prev]);
    setShowForm(false);
    setFormData({
      songTitle: "",
      isrc: "",
      iswc: "",
      recordingArtist: "",
      duration: "",
      releaseDate: "",
      writers: [{ name: "", ipi: "", share: 0 }],
      publishers: [{ name: "", share: 0 }],
      proStatus: "not_registered"
    });

    toast({
      title: "Copyright Registered",
      description: "Copyright metadata has been successfully saved."
    });
  };

  const getStatusBadge = (status: Copyright["proStatus"]) => {
    switch (status) {
      case "registered":
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Registered</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "not_registered":
        return <Badge variant="outline">Not Registered</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Copyright Management</h1>
          <p className="text-muted-foreground">
            Register and track copyrights with split assignments and metadata management
          </p>
        </div>

        <Tabs defaultValue="copyrights" className="space-y-6">
          <TabsList>
            <TabsTrigger value="copyrights">My Copyrights</TabsTrigger>
            <TabsTrigger value="register">Register New</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="copyrights" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by title, songwriter, publisher, ISRC, or ISWC..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Register Copyright
              </Button>
            </div>

            <div className="grid gap-4">
              {filteredCopyrights.map((copyright) => (
                <Card key={copyright.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Music className="w-5 h-5" />
                          {copyright.songTitle}
                          {copyright.duplicateWarning && (
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          )}
                        </CardTitle>
                        <CardDescription>
                          Registered on {new Date(copyright.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      {getStatusBadge(copyright.proStatus)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-2">Identifiers</h4>
                        <div className="space-y-1 text-sm">
                          <div><strong>ISRC:</strong> {copyright.isrc}</div>
                          <div><strong>ISWC:</strong> {copyright.iswc}</div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Writers</h4>
                        <div className="space-y-1 text-sm">
                          {copyright.writers.map((writer, index) => (
                            <div key={index}>
                              <strong>{writer.name}</strong> ({writer.share}%)
                              <br />
                              <span className="text-muted-foreground">IPI: {writer.ipi}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="md:col-span-2">
                        <h4 className="font-semibold mb-2">Publishers</h4>
                        <div className="flex flex-wrap gap-2">
                          {copyright.publishers.map((publisher, index) => (
                            <Badge key={index} variant="outline">
                              {publisher.name} ({publisher.share}%)
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Register New Copyright</CardTitle>
                <CardDescription>
                  Enter copyright metadata and ownership information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="relative">
                      <Label htmlFor="songTitle">Work Title *</Label>
                      <Input
                        id="songTitle"
                        value={formData.songTitle}
                        onChange={(e) => setFormData(prev => ({ ...prev, songTitle: e.target.value }))}
                        required
                      />
                      {isLoadingMetadata && (
                        <div className="absolute right-3 top-8 flex items-center">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="proStatus">PRO Registration Status</Label>
                      <Select 
                        value={formData.proStatus}
                        onValueChange={(value) => setFormData(prev => ({ 
                          ...prev, 
                          proStatus: value as Copyright["proStatus"]
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_registered">Not Registered</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="registered">Registered</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="isrc">ISRC</Label>
                      <Input
                        id="isrc"
                        value={formData.isrc}
                        onChange={(e) => setFormData(prev => ({ ...prev, isrc: e.target.value }))}
                        placeholder="e.g., USRC17607839"
                      />
                    </div>
                    <div>
                      <Label htmlFor="iswc">ISWC</Label>
                      <Input
                        id="iswc"
                        value={formData.iswc}
                        onChange={(e) => setFormData(prev => ({ ...prev, iswc: e.target.value }))}
                        placeholder="e.g., T-070.600.001-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="language">Language</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EN">English</SelectItem>
                          <SelectItem value="ES">Spanish</SelectItem>
                          <SelectItem value="FR">French</SelectItem>
                          <SelectItem value="DE">German</SelectItem>
                          <SelectItem value="IT">Italian</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* ASCAP Lookup Section */}
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Label className="text-base font-semibold">ASCAP Database Lookup</Label>
                      <Badge variant="secondary" className="text-xs">Auto-populate</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Search the ASCAP Repertory database to automatically populate writer and publisher information.
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="searchWriter">Writer Name (optional)</Label>
                        <Input
                          id="searchWriter"
                          value={searchWriter}
                          onChange={(e) => setSearchWriter(e.target.value)}
                          placeholder="Enter writer/composer name"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="searchPublisher">Publisher Name (optional)</Label>
                        <Input
                          id="searchPublisher"
                          value={searchPublisher}
                          onChange={(e) => setSearchPublisher(e.target.value)}
                          placeholder="Enter publisher name"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-start">
                      <Button 
                        type="button" 
                        onClick={searchASCAP}
                        disabled={ascapLoading || (!formData.songTitle && !searchWriter && !searchPublisher)}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Search className="h-4 w-4" />
                        {ascapLoading ? "Searching ASCAP..." : "Search ASCAP Database"}
                      </Button>
                    </div>
                    
                    {ascapLoading && (
                      <div className="text-sm text-muted-foreground">
                        Searching ASCAP Repertory database for matching records...
                      </div>
                    )}
                  </div>

                  {/* Recording Information */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Recording Information</Label>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="recordingArtist">Recording Artist</Label>
                        <Input
                          id="recordingArtist"
                          value={formData.recordingArtist}
                          onChange={(e) => setFormData(prev => ({ ...prev, recordingArtist: e.target.value }))}
                          placeholder="Artist name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="duration">Duration (seconds)</Label>
                        <Input
                          id="duration"
                          type="number"
                          value={formData.duration}
                          onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || "" }))}
                          placeholder="240"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="releaseDate">Release Date</Label>
                      <Input
                        id="releaseDate"
                        type="date"
                        value={formData.releaseDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, releaseDate: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Territory and Contract Information */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Territory & Contract Information</Label>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="territory">Territory</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select territory" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="US">United States</SelectItem>
                            <SelectItem value="CA">Canada</SelectItem>
                            <SelectItem value="UK">United Kingdom</SelectItem>
                            <SelectItem value="DE">Germany</SelectItem>
                            <SelectItem value="FR">France</SelectItem>
                            <SelectItem value="AU">Australia</SelectItem>
                            <SelectItem value="JP">Japan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="contractId">Contract ID</Label>
                        <Input
                          id="contractId"
                          placeholder="e.g., AGR-2024-001"
                        />
                      </div>
                      <div>
                        <Label htmlFor="contractStartDate">Contract Start Date</Label>
                        <Input
                          id="contractStartDate"
                          type="date"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="contractEndDate">Contract End Date</Label>
                      <Input
                        id="contractEndDate"
                        type="date"
                        className="max-w-md"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Label>Writers & Splits</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addWriter}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add Writer
                      </Button>
                    </div>
                    
                    {formData.writers.map((writer, index) => (
                      <div key={index} className="grid md:grid-cols-4 gap-2 mb-2">
                        <Input
                          placeholder="Writer name"
                          value={writer.name}
                          onChange={(e) => updateWriter(index, "name", e.target.value)}
                        />
                        <Input
                          placeholder="IPI number"
                          value={writer.ipi}
                          onChange={(e) => updateWriter(index, "ipi", e.target.value)}
                        />
                        <Input
                          type="number"
                          placeholder="Share %"
                          value={writer.share || ""}
                          onChange={(e) => updateWriter(index, "share", Number(e.target.value))}
                          min="0"
                          max="100"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeWriter(index)}
                          disabled={formData.writers.length === 1}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Label>Publishers & Splits</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addPublisher}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add Publisher
                      </Button>
                    </div>
                    
                    {formData.publishers.map((publisher, index) => (
                      <div key={index} className="grid md:grid-cols-3 gap-2 mb-2">
                        <Input
                          placeholder="Publisher name"
                          value={publisher.name}
                          onChange={(e) => updatePublisher(index, "name", e.target.value)}
                        />
                        <Input
                          type="number"
                          placeholder="Share %"
                          value={publisher.share || ""}
                          onChange={(e) => updatePublisher(index, "share", Number(e.target.value))}
                          min="0"
                          max="100"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removePublisher(index)}
                          disabled={formData.publishers.length === 1}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Button type="submit" className="w-full">
                    Register Copyright
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Total Copyrights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{copyrights.length}</div>
                  <p className="text-muted-foreground">Registered works</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>PRO Registered</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {copyrights.filter(c => c.proStatus === "registered").length}
                  </div>
                  <p className="text-muted-foreground">Active registrations</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Duplicate Warnings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600">
                    {copyrights.filter(c => c.duplicateWarning).length}
                  </div>
                  <p className="text-muted-foreground">Potential conflicts</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CopyrightManagement;