import { useState } from "react";
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
import { Plus, Search, AlertTriangle, CheckCircle, Clock, Music } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
    writers: Writer[];
    publishers: Publisher[];
    proStatus: Copyright["proStatus"];
  }>({
    songTitle: "",
    isrc: "",
    iswc: "",
    writers: [{ name: "", ipi: "", share: 0 }],
    publishers: [{ name: "", share: 0 }],
    proStatus: "not_registered"
  });

  const filteredCopyrights = copyrights.filter(copyright =>
    copyright.songTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    copyright.isrc.toLowerCase().includes(searchTerm.toLowerCase()) ||
    copyright.iswc.toLowerCase().includes(searchTerm.toLowerCase())
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
                  placeholder="Search by title, ISRC, or ISWC..."
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
                    <div>
                      <Label htmlFor="songTitle">Song Title *</Label>
                      <Input
                        id="songTitle"
                        value={formData.songTitle}
                        onChange={(e) => setFormData(prev => ({ ...prev, songTitle: e.target.value }))}
                        required
                      />
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

                  <div className="grid md:grid-cols-2 gap-4">
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