import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useClientPortal } from "@/hooks/useClientPortal";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, LinkIcon } from "lucide-react";

interface MatchItem {
  id: string;
  data_type: "copyright" | "contract" | "royalty_allocation" | "sync_license";
  label: string;
  meta?: Record<string, any>;
}

export function NameLinker() {
  const { clientAccess, createDataAssociation } = useClientPortal();
  const { toast } = useToast();

  const [clientUserId, setClientUserId] = useState("");
  const [nameQuery, setNameQuery] = useState("");
  const [searchTypes, setSearchTypes] = useState({
    copyrights: true,
    contracts: true,
    royalties: true,
    sync_licenses: true,
  });
  const [scopes, setScopes] = useState({
    writer: true,
    publisher: true,
    interested_party: true,
    payee: true, // reserved for future (payees table)
    artist: true,
  });

  const [results, setResults] = useState<MatchItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const toggleSearchType = (key: keyof typeof searchTypes, checked: boolean | "indeterminate") => {
    setSearchTypes((prev) => ({ ...prev, [key]: !!checked }));
  };
  const toggleScope = (key: keyof typeof scopes, checked: boolean | "indeterminate") => {
    setScopes((prev) => ({ ...prev, [key]: !!checked }));
  };

  const handleSearch = async () => {
    if (!nameQuery.trim()) {
      toast({ title: "Enter a name", description: "Type a name to search.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResults([]);
    setSelectedIds({});

    const term = `%${nameQuery.trim()}%`;

    try {
      const queries: Promise<MatchItem[]>[] = [];

      if (searchTypes.copyrights) {
        // Match by writer, publisher, artist on recordings, and work_title
        queries.push((async () => {
          const items: MatchItem[] = [];
          // Writers
          if (scopes.writer) {
            const { data } = await supabase
              .from("copyright_writers")
              .select("copyright_id, writer_name")
              .ilike("writer_name", term);
            (data || []).forEach((row: any) =>
              items.push({ id: row.copyright_id, data_type: "copyright", label: `Copyright by writer: ${row.writer_name}` })
            );
          }
          // Publishers
          if (scopes.publisher) {
            const { data } = await supabase
              .from("copyright_publishers")
              .select("copyright_id, publisher_name")
              .ilike("publisher_name", term);
            (data || []).forEach((row: any) =>
              items.push({ id: row.copyright_id, data_type: "copyright", label: `Copyright by publisher: ${row.publisher_name}` })
            );
          }
          // Artists on recordings
          if (scopes.artist) {
            const { data } = await supabase
              .from("copyright_recordings")
              .select("copyright_id, artist_name, recording_title")
              .ilike("artist_name", term);
            (data || []).forEach((row: any) =>
              items.push({ id: row.copyright_id, data_type: "copyright", label: `Copyright by artist: ${row.artist_name} (${row.recording_title || "recording"})` })
            );
          }
          // Work title direct match (useful when only title is known)
          const { data: works } = await supabase
            .from("copyrights")
            .select("id, work_title")
            .ilike("work_title", term);
          (works || []).forEach((row: any) =>
            items.push({ id: row.id, data_type: "copyright", label: `Copyright work: ${row.work_title}` })
          );
          return items;
        })());
      }

      if (searchTypes.contracts) {
        queries.push((async () => {
          const items: MatchItem[] = [];
          // Interested parties
          if (scopes.interested_party || scopes.writer || scopes.publisher) {
            const { data } = await supabase
              .from("contract_interested_parties")
              .select("contract_id, name, party_type")
              .ilike("name", term);
            (data || []).forEach((row: any) =>
              items.push({ id: row.contract_id, data_type: "contract", label: `Contract party: ${row.name} (${row.party_type})` })
            );
          }
          // Counterparty name on contract
          const { data: ctr } = await supabase
            .from("contracts")
            .select("id, title, counterparty_name")
            .or(`counterparty_name.ilike.${term},title.ilike.${term}`);
          (ctr || []).forEach((row: any) =>
            items.push({ id: row.id, data_type: "contract", label: `Contract: ${row.title || "Untitled"}${row.counterparty_name ? ` (with ${row.counterparty_name})` : ""}` })
          );
          return items;
        })());
      }

      if (searchTypes.royalties) {
        queries.push((async () => {
          const items: MatchItem[] = [];
          const { data } = await supabase
            .from("royalty_allocations")
            .select("id, song_title, artist, work_writers")
            .or(`artist.ilike.${term},work_writers.ilike.${term},song_title.ilike.${term}`);
          (data || []).forEach((row: any) =>
            items.push({ id: row.id, data_type: "royalty_allocation", label: `Royalty: ${row.song_title} ${row.artist ? `by ${row.artist}` : ""}` })
          );
          return items;
        })());
      }

      if (searchTypes.sync_licenses) {
        queries.push((async () => {
          const items: MatchItem[] = [];
          const { data } = await supabase
            .from("sync_licenses")
            .select("id, project_title, licensor_name, licensee_name, master_owner, publishing_administrator")
            .or(
              [
                `project_title.ilike.${term}`,
                `licensor_name.ilike.${term}`,
                `licensee_name.ilike.${term}`,
                `master_owner.ilike.${term}`,
                `publishing_administrator.ilike.${term}`,
              ].join(",")
            );
          (data || []).forEach((row: any) =>
            items.push({ id: row.id, data_type: "sync_license", label: `Sync: ${row.project_title} ${row.licensor_name ? `(${row.licensor_name})` : ""}` })
          );
          return items;
        })());
      }

      const settled = await Promise.all(queries);
      // Deduplicate by data_type+id
      const map = new Map<string, MatchItem>();
      settled.flat().forEach((item) => {
        const key = `${item.data_type}:${item.id}`;
        if (!map.has(key)) map.set(key, item);
      });
      const final = Array.from(map.values());
      setResults(final);
      setSelectedIds(Object.fromEntries(final.map((r) => [r.data_type + ":" + r.id, true])));

      toast({ title: "Search complete", description: `${final.length} matches found` });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Search failed", description: e.message || "Could not perform search", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (key: string, checked: boolean | "indeterminate") => {
    setSelectedIds((prev) => ({ ...prev, [key]: !!checked }));
  };

  const selectAll = (checked: boolean) => {
    const next: Record<string, boolean> = {};
    results.forEach((r) => (next[r.data_type + ":" + r.id] = checked));
    setSelectedIds(next);
  };

  const createLinks = async () => {
    if (!clientUserId) {
      toast({ title: "Choose a client", description: "Select a client to link to.", variant: "destructive" });
      return;
    }
    const selected = results.filter((r) => selectedIds[r.data_type + ":" + r.id]);
    if (selected.length === 0) {
      toast({ title: "No items selected", description: "Pick at least one match.", variant: "destructive" });
      return;
    }

    try {
      let success = 0;
      for (const item of selected) {
        const res = await createDataAssociation(clientUserId, item.data_type, item.id);
        if (res) success += 1;
      }
      toast({ title: "Associations created", description: `${success}/${selected.length} linked to client` });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Linking failed", description: e.message || "Could not create associations", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5" />
          Link by Name (No UUIDs)
        </CardTitle>
        <CardDescription>
          Search by writer, publisher, artist, or interested party, then link matching contracts, works, royalties, and licenses to a client.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label>Client</Label>
            <Select value={clientUserId} onValueChange={setClientUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-popover">
                {clientAccess.map((a) => (
                  <SelectItem key={a.id} value={a.client_user_id}>
                    {a.client_user_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">Shows clients with active access.</p>
          </div>
          <div>
            <Label>Search name</Label>
            <div className="flex gap-2">
              <Input placeholder="e.g., Taylor Swift" value={nameQuery} onChange={(e) => setNameQuery(e.target.value)} />
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="h-4 w-4 mr-1" /> Search
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Data types</Label>
            <div className="mt-2 space-y-2">
              {Object.entries(searchTypes).map(([key, val]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox id={`type-${key}`} checked={val} onCheckedChange={(c) => toggleSearchType(key as any, c)} />
                  <Label htmlFor={`type-${key}`} className="capitalize">{key.replace("_", " ")}</Label>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label>Name scopes</Label>
            <div className="mt-2 space-y-2">
              {Object.entries(scopes).map(([key, val]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox id={`scope-${key}`} checked={val} onCheckedChange={(c) => toggleScope(key as any, c)} />
                  <Label htmlFor={`scope-${key}`} className="capitalize">{key.replace("_", " ")}</Label>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">We match across writers, publishers, interested parties, artists, project titles, and work titles.</p>
            </div>
          </div>
        </div>

        {results.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{results.length} matches</Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => selectAll(true)}>Select all</Button>
                <Button variant="outline" size="sm" onClick={() => selectAll(false)}>Clear</Button>
              </div>
            </div>
            <div className="max-h-64 overflow-auto rounded border divide-y">
              {results.map((r) => {
                const key = r.data_type + ":" + r.id;
                return (
                  <label key={key} className="flex items-center gap-2 p-2 hover:bg-accent cursor-pointer">
                    <Checkbox checked={!!selectedIds[key]} onCheckedChange={(c) => toggleSelect(key, c)} />
                    <span className="flex-1 text-sm">
                      <span className="font-medium capitalize">{r.data_type.replace("_", " ")}</span>: {r.label}
                    </span>
                  </label>
                );
              })}
            </div>
            <Button className="w-full" onClick={createLinks}>
              <LinkIcon className="h-4 w-4 mr-2" /> Create Associations
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
