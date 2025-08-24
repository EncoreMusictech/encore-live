import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen,
  Search,
  Plus,
  Edit,
  Eye,
  Archive,
  Star,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  User,
  Tag,
  TrendingUp,
  Globe,
  FileText,
  Video,
  HelpCircle,
  BarChart3
} from 'lucide-react';

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  subcategory: string;
  status: 'draft' | 'published' | 'archived';
  type: 'article' | 'faq' | 'tutorial' | 'video' | 'guide';
  author: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  views: number;
  likes: number;
  dislikes: number;
  comments: number;
  tags: string[];
  featured: boolean;
  helpfulness: number;
}

interface Category {
  id: string;
  name: string;
  description: string;
  articleCount: number;
  subcategories: string[];
  color: string;
}

export function KnowledgeBaseManager() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories: Category[] = [
    {
      id: 'getting_started',
      name: 'Getting Started',
      description: 'Basic setup and onboarding guides',
      articleCount: 12,
      subcategories: ['Account Setup', 'First Steps', 'Quick Tour'],
      color: 'bg-blue-500'
    },
    {
      id: 'catalog_valuation',
      name: 'Catalog Valuation',
      description: 'How to use catalog valuation tools and interpret results',
      articleCount: 8,
      subcategories: ['Valuation Basics', 'Advanced Features', 'Troubleshooting'],
      color: 'bg-purple-500'
    },
    {
      id: 'deal_simulator',
      name: 'Deal Simulator',
      description: 'Creating and analyzing deal scenarios',
      articleCount: 6,
      subcategories: ['Deal Setup', 'Analysis Tools', 'Best Practices'],
      color: 'bg-green-500'
    },
    {
      id: 'contracts',
      name: 'Contract Management',
      description: 'Managing contracts and legal documents',
      articleCount: 15,
      subcategories: ['Contract Types', 'Templates', 'Digital Signatures'],
      color: 'bg-orange-500'
    },
    {
      id: 'integrations',
      name: 'Integrations',
      description: 'Connecting third-party services and APIs',
      articleCount: 9,
      subcategories: ['Spotify API', 'Payment Systems', 'CRM Integration'],
      color: 'bg-teal-500'
    },
    {
      id: 'troubleshooting',
      name: 'Troubleshooting',
      description: 'Common issues and solutions',
      articleCount: 18,
      subcategories: ['Technical Issues', 'Account Problems', 'Data Issues'],
      color: 'bg-red-500'
    }
  ];

  const articles: Article[] = [
    {
      id: '1',
      title: 'Getting Started with Catalog Valuation',
      content: 'A comprehensive guide to using the catalog valuation feature...',
      category: 'catalog_valuation',
      subcategory: 'Valuation Basics',
      status: 'published',
      type: 'tutorial',
      author: 'sarah-writer',
      authorName: 'Sarah Wilson',
      createdAt: '2024-01-10',
      updatedAt: '2024-01-12',
      publishedAt: '2024-01-11',
      views: 1247,
      likes: 89,
      dislikes: 3,
      comments: 12,
      tags: ['beginner', 'valuation', 'tutorial'],
      featured: true,
      helpfulness: 94
    },
    {
      id: '2',
      title: 'How to Connect Your Spotify Artist Profile',
      content: 'Step-by-step instructions for connecting Spotify...',
      category: 'integrations',
      subcategory: 'Spotify API',
      status: 'published',
      type: 'guide',
      author: 'mike-tech',
      authorName: 'Mike Johnson',
      createdAt: '2024-01-08',
      updatedAt: '2024-01-08',
      publishedAt: '2024-01-08',
      views: 892,
      likes: 67,
      dislikes: 2,
      comments: 8,
      tags: ['integration', 'spotify', 'setup'],
      featured: false,
      helpfulness: 91
    },
    {
      id: '3',
      title: 'Understanding Deal ROI Calculations',
      content: 'Deep dive into how ROI is calculated in deal scenarios...',
      category: 'deal_simulator',
      subcategory: 'Analysis Tools',
      status: 'draft',
      type: 'article',
      author: 'jane-analyst',
      authorName: 'Jane Smith',
      createdAt: '2024-01-13',
      updatedAt: '2024-01-13',
      views: 0,
      likes: 0,
      dislikes: 0,
      comments: 0,
      tags: ['advanced', 'roi', 'calculations'],
      featured: false,
      helpfulness: 0
    },
    {
      id: '4',
      title: 'Frequently Asked Questions',
      content: 'Common questions and answers about platform usage...',
      category: 'getting_started',
      subcategory: 'Quick Tour',
      status: 'published',
      type: 'faq',
      author: 'support-team',
      authorName: 'Support Team',
      createdAt: '2024-01-05',
      updatedAt: '2024-01-12',
      publishedAt: '2024-01-06',
      views: 2156,
      likes: 145,
      dislikes: 8,
      comments: 23,
      tags: ['faq', 'common', 'support'],
      featured: true,
      helpfulness: 87
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article': return FileText;
      case 'faq': return HelpCircle;
      case 'tutorial': return BookOpen;
      case 'video': return Video;
      case 'guide': return BookOpen;
      default: return FileText;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500/10 text-green-600 border-green-200';
      case 'draft': return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
      case 'archived': return 'bg-gray-500/10 text-gray-600 border-gray-200';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-200';
    }
  };

  const filteredArticles = articles.filter(article => {
    const categoryMatch = selectedCategory === 'all' || article.category === selectedCategory;
    const statusMatch = selectedStatus === 'all' || article.status === selectedStatus;
    const searchMatch = searchTerm === '' || 
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return categoryMatch && statusMatch && searchMatch;
  });

  const totalArticles = articles.length;
  const publishedArticles = articles.filter(a => a.status === 'published').length;
  const draftArticles = articles.filter(a => a.status === 'draft').length;
  const totalViews = articles.reduce((sum, a) => sum + a.views, 0);
  const avgHelpfulness = articles.filter(a => a.helpfulness > 0).reduce((sum, a) => sum + a.helpfulness, 0) / articles.filter(a => a.helpfulness > 0).length;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Knowledge Base Manager</CardTitle>
              <CardDescription>
                Create, organize, and maintain help documentation and user guides
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Article
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Knowledge Base Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{totalArticles}</div>
              <div className="text-sm text-muted-foreground">Total Articles</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{publishedArticles}</div>
              <div className="text-sm text-muted-foreground">Published</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{totalViews.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Views</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{avgHelpfulness.toFixed(0)}%</div>
              <div className="text-sm text-muted-foreground">Avg Helpfulness</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="articles" className="w-full">
          <TabsList>
            <TabsTrigger value="articles">All Articles</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
            <TabsTrigger value="feedback">User Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="articles" className="space-y-4">
            {/* Filters */}
            <div className="flex gap-4 items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Articles List */}
            <div className="space-y-3">
              {filteredArticles.map(article => {
                const TypeIcon = getTypeIcon(article.type);

                return (
                  <Card key={article.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <TypeIcon className="h-5 w-5 text-primary mt-1" />
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-lg">{article.title}</h4>
                              {article.featured && (
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              )}
                              <Badge variant="outline" className={getStatusColor(article.status)}>
                                {article.status}
                              </Badge>
                              <Badge variant="secondary">{article.type}</Badge>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                <span>{article.authorName}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>Updated {article.updatedAt}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                <span>{article.views.toLocaleString()} views</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-4 w-4" />
                                <span>{article.comments} comments</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-sm mb-3">
                              <div className="flex items-center gap-1">
                                <ThumbsUp className="h-4 w-4 text-green-600" />
                                <span>{article.likes}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <ThumbsDown className="h-4 w-4 text-red-600" />
                                <span>{article.dislikes}</span>
                              </div>
                              {article.helpfulness > 0 && (
                                <div className="flex items-center gap-1">
                                  <TrendingUp className="h-4 w-4 text-blue-600" />
                                  <span>{article.helpfulness}% helpful</span>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {article.tags.map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  <Tag className="h-3 w-3 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          {article.status === 'published' && (
                            <Button variant="outline" size="sm">
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <div className="grid gap-4">
              {categories.map(category => (
                <Card key={category.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-4 h-12 rounded ${category.color}`} />
                        <div>
                          <h4 className="font-medium text-lg">{category.name}</h4>
                          <p className="text-muted-foreground mb-2">{category.description}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{category.articleCount} articles</span>
                            <span>{category.subcategories.length} subcategories</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Article
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Performance Analytics</h3>
              <p className="text-muted-foreground mb-4">
                Track article performance, user engagement, and content effectiveness
              </p>
              <Button>
                <BarChart3 className="h-4 w-4 mr-2" />
                View Detailed Analytics
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="feedback">
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">User Feedback</h3>
              <p className="text-muted-foreground mb-4">
                Monitor user feedback, ratings, and suggestions for content improvement
              </p>
              <Button>
                <ThumbsUp className="h-4 w-4 mr-2" />
                View Feedback
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}