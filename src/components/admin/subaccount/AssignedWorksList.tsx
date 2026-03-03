import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Search, Music, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Work {
  id: string;
  title: string;
  artist: string;
  isrc: string | null;
  format: string | null;
  created_at: string;
  metadata: any;
}

interface AssignedWorksListProps {
  companyId: string;
}

export function AssignedWorksList({ companyId }: AssignedWorksListProps) {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchWorks();
  }, [companyId]);

  const fetchWorks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('catalog_items')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorks(data || []);
    } catch (error) {
      console.error('Error fetching works:', error);
      toast({
        title: 'Error',
        description: 'Failed to load works',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveWork = async (work: Work) => {
    try {
      // Remove the catalog item
      const { error } = await supabase
        .from('catalog_items')
        .delete()
        .eq('id', work.id);

      if (error) throw error;

      // Also remove matching copyright by title + company_id
      await supabase
        .from('copyrights')
        .delete()
        .eq('client_company_id', companyId)
        .eq('work_title', work.title);

      // Also remove from any contract schedules by title + company_id
      await supabase
        .from('contract_schedule_works')
        .delete()
        .eq('client_company_id', companyId)
        .eq('song_title', work.title);

      setWorks(prev => prev.filter(w => w.id !== work.id));
      toast({
        title: 'Work Removed',
        description: `Successfully removed "${work.title}".`,
      });
    } catch (error) {
      console.error('Error removing work:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove work',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveAll = async () => {
    try {
      setRemoving(true);

      // Collect titles for cross-deletion
      const titles = works.map(w => w.title);

      const { error } = await supabase
        .from('catalog_items')
        .delete()
        .eq('company_id', companyId);

      if (error) throw error;

      // Also remove matching copyrights
      if (titles.length > 0) {
        await supabase
          .from('copyrights')
          .delete()
          .eq('client_company_id', companyId)
          .in('work_title', titles);

        // Also remove from contract schedules
        await supabase
          .from('contract_schedule_works')
          .delete()
          .eq('client_company_id', companyId)
          .in('song_title', titles);
      }

      setWorks([]);
      toast({
        title: 'Works Removed',
        description: `Successfully removed all assigned works.`,
      });
    } catch (error) {
      console.error('Error removing works:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove works',
        variant: 'destructive',
      });
    } finally {
      setRemoving(false);
    }
  };

  const filteredWorks = works.filter(
    (work) =>
      work.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      work.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Assigned Works</CardTitle>
          <CardDescription>
            Works currently assigned to this sub-account ({works.length} total)
          </CardDescription>
        </div>
        {works.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={removing}>
                <Trash2 className="h-4 w-4 mr-2" />
                Remove All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove all assigned works?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove all {works.length} works from this sub-account's catalog. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRemoveAll}>
                  Remove All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or artist..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading works...</div>
        ) : filteredWorks.length === 0 ? (
          <div className="text-center py-8">
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? 'No works found matching your search' : 'No works assigned yet'}
            </p>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Artist</TableHead>
                  <TableHead>ISRC</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorks.map((work) => (
                  <TableRow key={work.id}>
                    <TableCell className="font-medium">{work.title}</TableCell>
                    <TableCell>{work.artist}</TableCell>
                    <TableCell className="font-mono text-xs">{work.isrc || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {work.format || 'Digital'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(work.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveWork(work)}
                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
