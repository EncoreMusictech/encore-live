import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Search, Star, Download, Eye, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Template {
  id: string;
  template_name: string;
  contract_type: string;
  is_public: boolean;
  created_at: string;
  template_data: any;
}

interface TemplateLibraryProps {
  selectionMode?: boolean;
  onTemplateSelect?: (template: any) => void;
}

export function TemplateLibrary({ selectionMode = false, onTemplateSelect }: TemplateLibraryProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching templates:', error);
        toast({
          title: "Error",
          description: "Failed to load templates",
          variant: "destructive",
        });
        return;
      }

      setTemplates(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.template_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.contract_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatContractType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'publishing':
        return 'bg-blue-100 text-blue-800';
      case 'artist':
        return 'bg-purple-100 text-purple-800';
      case 'producer':
        return 'bg-green-100 text-green-800';
      case 'sync':
        return 'bg-orange-100 text-orange-800';
      case 'distribution':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Sample templates for demonstration
  const sampleTemplates = [
    {
      id: 'sample-1',
      template_name: 'Standard Publishing Agreement',
      contract_type: 'publishing',
      is_public: true,
      description: 'Industry standard publishing agreement template with standard splits',
      popularity: 'High'
    },
    {
      id: 'sample-2', 
      template_name: 'Indie Artist Deal',
      contract_type: 'artist',
      is_public: true,
      description: 'Independent artist agreement template with fair terms',
      popularity: 'Medium'
    },
    {
      id: 'sample-3',
      template_name: 'Producer Points Deal',
      contract_type: 'producer',
      is_public: true,
      description: 'Producer agreement with backend points and royalties',
      popularity: 'High'
    },
    {
      id: 'sample-4',
      template_name: 'TV Sync License',
      contract_type: 'sync',
      is_public: true,
      description: 'Television synchronization license template',
      popularity: 'Medium'
    }
  ];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading templates...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Search templates by name or type..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Template
        </Button>
      </div>

      {/* Popular Templates Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Popular Templates</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sampleTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="bg-gradient-primary rounded-lg p-2 w-fit">
                    <FileText className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm text-muted-foreground">{template.popularity}</span>
                  </div>
                </div>
                <CardTitle className="text-lg">{template.template_name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={getTypeColor(template.contract_type)}>
                    {formatContractType(template.contract_type)}
                  </Badge>
                  {template.is_public && (
                    <Badge variant="outline">Public</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-4">
                  {template.description}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-2">
                    <Eye className="h-4 w-4" />
                    Preview
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1 gap-2"
                    onClick={() => selectionMode && onTemplateSelect ? onTemplateSelect(template) : undefined}
                  >
                    <Download className="h-4 w-4" />
                    {selectionMode ? 'Select' : 'Use Template'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* User Templates Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Your Templates</h3>
        {filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="text-lg font-semibold mb-2">No custom templates yet</h4>
                <p className="text-muted-foreground mb-4">
                  Create reusable contract templates to streamline your workflow.
                </p>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Template
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="bg-gradient-primary rounded-lg p-2 w-fit">
                    <FileText className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-lg">{template.template_name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={getTypeColor(template.contract_type)}>
                      {formatContractType(template.contract_type)}
                    </Badge>
                    {template.is_public && (
                      <Badge variant="outline">Public</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-2">
                      <Eye className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button size="sm" className="flex-1 gap-2">
                      <Download className="h-4 w-4" />
                      Use
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}