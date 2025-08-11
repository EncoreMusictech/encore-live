
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FileText, Search, Star, Eye, Download, Edit, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TemplateBuilder } from "./TemplateBuilder";
import { useNavigate } from "react-router-dom";

interface TemplateLibraryProps {
  onTemplateSelect?: (template: any) => void;
  selectionMode?: boolean;
}

const TemplateLibrary = ({ onTemplateSelect, selectionMode = false }: TemplateLibraryProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentView, setCurrentView] = useState<'library' | 'builder'>('library');
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  // Your Templates (Custom templates)
  const [yourTemplates, setYourTemplates] = useState([
    {
      id: "custom-1",
      title: "So Saucy Records Distribution Agreement",
      type: "Distribution",
      category: "Distribution",
      description: "Custom distribution agreement for So Saucy Records",
      rating: null,
      isCustom: true,
      keyFeatures: [],
      contract_type: "distribution",
      template_data: {
        fields: [
          { id: 'effective_date', type: 'date', label: 'Effective Date', required: true, category: 'header' },
          { id: 'artist_label', type: 'text', label: 'Artist/Label Name', required: true, category: 'parties' },
          { id: 'distributor_name', type: 'text', label: 'Distributor Name', required: true, category: 'parties' },
          { id: 'product_title', type: 'text', label: 'Product Title', required: true, category: 'work' },
          { id: 'distribution_fee', type: 'select', label: 'Distribution Fee', required: true, options: ['15%', '20%', '25%', '30%'], category: 'financial' },
          { id: 'platforms', type: 'select', label: 'Distribution Platforms', required: true, options: ['All Digital', 'Spotify/Apple Only', 'Physical Only', 'Custom Selection'], category: 'terms' },
          { id: 'territory_dist', type: 'select', label: 'Distribution Territory', required: true, options: ['Worldwide', 'Digital Worldwide', 'North America Only'], category: 'terms' },
          { id: 'term_years', type: 'select', label: 'Agreement Term', required: true, options: ['2 Years', '3 Years', '5 Years', 'Indefinite'], category: 'terms' },
          { id: 'signature_date', type: 'date', label: 'Signature Date', required: false, category: 'signatures' },
        ]
      }
    },
  ]);

  // Popular Templates (Pre-built templates)
  const popularTemplates = [
    {
      id: "pub-1",
      title: "Standard Publishing Agreement",
      type: "Publishing",
      category: "Publishing",
      description: "Industry standard publishing agreement template with 50/50 splits and standard terms",
      rating: "High",
      isCustom: false,
      keyFeatures: ["50/50 songwriter/publisher split", "Worldwide territory"],
      contract_type: "publishing",
    },
    {
      id: "artist-1", 
      title: "Independent Artist Deal",
      type: "Artist",
      category: "Artist",
      description: "Fair and balanced recording agreement for independent artists with advance structure",
      rating: "High",
      isCustom: false,
      keyFeatures: ["$25K advance example", "18% royalty rate"],
      contract_type: "artist",
    },
    {
      id: "producer-1",
      title: "Producer Points Agreement", 
      type: "Producer",
      category: "Producer",
      description: "Producer agreement with upfront fee plus backend points for ongoing revenue",
      rating: "Medium",
      isCustom: false,
      keyFeatures: ["$3K per track fee", "3% producer points"],
      contract_type: "producer",
    },
    {
      id: "sync-1",
      title: "TV Sync License",
      type: "Sync",
      category: "Sync", 
      description: "Television synchronization license with standard terms and usage restrictions",
      rating: "Medium",
      isCustom: false,
      keyFeatures: ["$8K license fee example", "3-year term"],
      contract_type: "sync",
    },
    {
      id: "dist-1",
      title: "Digital Distribution Deal",
      type: "Distribution",
      category: "Distribution",
      description: "Modern digital distribution agreement for streaming platforms and downloads", 
      rating: "High",
      isCustom: false,
      keyFeatures: ["85/15 revenue split", "100+ platforms"],
      contract_type: "distribution",
    },
  ];

  const allTemplates = [...yourTemplates, ...popularTemplates];

  const filteredTemplates = allTemplates.filter(template =>
    template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTemplateSelect = (template: any) => {
    if (onTemplateSelect) {
      onTemplateSelect(template);
    } else {
      // Navigate to contract creation with template data
      navigate('/contract-management', { 
        state: { 
          selectedTemplate: template,
          mode: 'create',
          templateFields: template.template_data?.fields || []
        } 
      });
      toast({
        title: "Template Selected",
        description: `Creating new contract from template: ${template.title}`,
      });
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    setYourTemplates(prev => prev.filter(template => template.id !== templateId));
    toast({
      title: "Template Deleted",
      description: "Template has been successfully deleted",
    });
  };

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setCurrentView('builder');
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setCurrentView('builder');
  };

  const handleBackToLibrary = () => {
    setCurrentView('library');
    setEditingTemplate(null);
  };

  const handleTemplateSaved = (savedTemplate: any) => {
    if (editingTemplate) {
      // Update existing template
      setYourTemplates(prev => 
        prev.map(t => t.id === editingTemplate.id ? { ...savedTemplate, id: editingTemplate.id, isCustom: true } : t)
      );
      toast({
        title: "Template Updated",
        description: "Your template has been successfully updated",
      });
    } else {
      // Add new template
      const newTemplate = {
        ...savedTemplate,
        id: `custom-${Date.now()}`,
        isCustom: true,
        rating: null,
        keyFeatures: []
      };
      setYourTemplates(prev => [...prev, newTemplate]);
      toast({
        title: "Template Created",
        description: "Your new template has been successfully created",
      });
    }
    setCurrentView('library');
    setEditingTemplate(null);
  };

  const getRatingColor = (rating: string | null) => {
    switch (rating) {
      case "High":
        return "text-yellow-500";
      case "Medium":
        return "text-blue-500";
      default:
        return "text-gray-400";
    }
  };

  // Show Template Builder if in builder view
  if (currentView === 'builder') {
    return (
      <TemplateBuilder
        onBack={handleBackToLibrary}
        contractType={editingTemplate?.contract_type || 'artist_recording'}
        existingTemplate={editingTemplate}
        onTemplateSaved={handleTemplateSaved}
      />
    );
  }

  const renderTemplateCard = (template: any) => (
    <Card key={template.id} className="group hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="bg-gradient-primary rounded-lg p-2 w-fit mb-2">
            <FileText className="h-4 w-4 text-primary-foreground" />
          </div>
          {template.rating && (
            <div className="flex items-center gap-1">
              <Star className={`h-4 w-4 ${getRatingColor(template.rating)}`} />
              <span className={`text-sm font-medium ${getRatingColor(template.rating)}`}>
                {template.rating}
              </span>
            </div>
          )}
        </div>
        <CardTitle className="text-lg group-hover:text-primary transition-colors">
          {template.title}
        </CardTitle>
        <div className="flex gap-2">
          <Badge variant={template.isCustom ? "secondary" : "outline"}>
            {template.category}
          </Badge>
          {template.isCustom && <Badge variant="outline">Custom</Badge>}
          {!template.isCustom && <Badge variant="outline">Public</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <CardDescription className="text-sm">
          {template.description}
        </CardDescription>
        
        {template.keyFeatures.length > 0 && (
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Key Features:</p>
            <div className="flex flex-wrap gap-2">
              {template.keyFeatures.map((feature: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {template.isCustom ? (
            // Custom template buttons
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleEditTemplate(template)}
                className="flex-1 gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button 
                size="sm" 
                className="flex-1 gap-2"
                onClick={() => handleTemplateSelect(template)}
              >
                <Download className="h-4 w-4" />
                Use
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Template</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{template.title}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            // Public template buttons
            <>
              <Button variant="outline" size="sm" className="flex-1">
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <Download className="h-4 w-4 mr-1" />
                PDF
              </Button>
              <Button 
                size="sm" 
                className="flex-1"
                onClick={() => handleTemplateSelect(template)}
              >
                <Download className="h-4 w-4 mr-1" />
                Use
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header with Create Template Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Contract Templates</h2>
          <p className="text-muted-foreground">Create and manage your contract templates</p>
        </div>
        <Button onClick={handleCreateTemplate} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Template
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Your Templates Section (Now appears first) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Your Templates</h3>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates
            .filter(t => t.isCustom)
            .map(template => renderTemplateCard(template))}
        </div>
        {filteredTemplates.filter(t => t.isCustom).length === 0 && (
          <Card className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Custom Templates Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first custom template to see it here
            </p>
            <Button onClick={handleCreateTemplate}>Create Template</Button>
          </Card>
        )}
      </div>

      {/* Popular Templates Section (Now appears second) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Popular Templates</h3>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates
            .filter(t => !t.isCustom)
            .map(template => renderTemplateCard(template))}
        </div>
      </div>
    </div>
  );
};

export default TemplateLibrary;
