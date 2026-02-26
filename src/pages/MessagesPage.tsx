import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { SubAccountChat } from '@/components/admin/subaccount/SubAccountChat';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Building2, Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

interface CompanyThread {
  id: string;
  name: string;
  display_name: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const { isAdmin } = useUserRoles();
  const [companies, setCompanies] = useState<CompanyThread[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    fetchCompanies();
  }, [user, isAdmin]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);

      // Encore admins see all companies, sub-account users see only their own
      let companyIds: string[] = [];

      if (isAdmin) {
        // Get all companies that have messages
        const { data: msgCompanies } = await supabase
          .from('company_messages')
          .select('company_id')
          .order('created_at', { ascending: false });

        const uniqueIds = [...new Set(msgCompanies?.map(m => m.company_id) || [])];

        // Also get all companies for the list
        const { data: allCompanies } = await supabase
          .from('companies')
          .select('id, name, display_name')
          .order('display_name');

        const threads: CompanyThread[] = (allCompanies || []).map(c => ({
          id: c.id,
          name: c.name,
          display_name: c.display_name,
          unreadCount: 0,
        }));

        // Get last message for each company
        for (const thread of threads) {
          const { data: lastMsg } = await supabase
            .from('company_messages')
            .select('content, created_at, sender_id')
            .eq('company_id', thread.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (lastMsg) {
            thread.lastMessage = lastMsg.content;
            thread.lastMessageAt = lastMsg.created_at;
          }

          // Count unread
          const { data: unread } = await supabase
            .from('company_messages')
            .select('id', { count: 'exact' })
            .eq('company_id', thread.id)
            .not('read_by', 'cs', `{${user!.id}}`);

          thread.unreadCount = unread?.length || 0;
        }

        // Sort by last message time, companies with messages first
        threads.sort((a, b) => {
          if (a.lastMessageAt && !b.lastMessageAt) return -1;
          if (!a.lastMessageAt && b.lastMessageAt) return 1;
          if (a.lastMessageAt && b.lastMessageAt) {
            return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
          }
          return a.display_name.localeCompare(b.display_name);
        });

        setCompanies(threads);
        if (threads.length > 0 && !selectedCompany) {
          setSelectedCompany(threads[0]);
        }
      } else {
        // Non-admin: find their company memberships
        const { data: memberships } = await supabase
          .from('company_users')
          .select('company_id, companies(id, name, display_name)')
          .eq('user_id', user!.id)
          .eq('status', 'active');

        const threads: CompanyThread[] = (memberships || [])
          .filter(m => m.companies)
          .map(m => {
            const c = m.companies as any;
            return {
              id: c.id,
              name: c.name,
              display_name: c.display_name,
              unreadCount: 0,
            };
          });

        setCompanies(threads);
        if (threads.length > 0) {
          setSelectedCompany(threads[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching companies for messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = companies.filter(c =>
    c.display_name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
        <MessageCircle className="h-12 w-12 mb-3 opacity-40" />
        <p className="text-lg font-medium">No conversations</p>
        <p className="text-sm">You don't have any message threads yet.</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-140px)] gap-4">
      {/* Sidebar – conversation list */}
      <div className="w-80 shrink-0 flex flex-col border rounded-lg bg-card">
        <div className="p-3 border-b">
          <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <MessageCircle className="h-4 w-4" /> Messages
          </h2>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {filtered.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCompany(c)}
              className={`w-full text-left px-3 py-3 border-b transition-colors hover:bg-accent/50 ${
                selectedCompany?.id === c.id ? 'bg-accent' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm font-medium truncate">{c.display_name}</span>
                </div>
                {c.unreadCount > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-[20px] flex items-center justify-center text-xs px-1.5">
                    {c.unreadCount}
                  </Badge>
                )}
              </div>
              {c.lastMessage && (
                <p className="text-xs text-muted-foreground mt-1 truncate pl-6">
                  {c.lastMessage}
                </p>
              )}
              {c.lastMessageAt && (
                <p className="text-[10px] text-muted-foreground mt-0.5 pl-6">
                  {format(new Date(c.lastMessageAt), 'MMM d, h:mm a')}
                </p>
              )}
            </button>
          ))}
        </ScrollArea>
      </div>

      {/* Chat area */}
      <div className="flex-1 min-w-0">
        {selectedCompany ? (
          <SubAccountChat companyId={selectedCompany.id} companyName={selectedCompany.display_name} />
        ) : (
          <Card className="h-full flex items-center justify-center">
            <CardContent className="text-center text-muted-foreground">
              <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>Select a conversation to start messaging</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
