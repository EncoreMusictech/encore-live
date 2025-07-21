import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export function CopyrightWritersDebug() {
  const [copyrightId, setCopyrightId] = useState("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkCopyrightWriters = async () => {
    if (!copyrightId.trim()) return;
    
    setLoading(true);
    try {
      // Get copyright info
      const { data: copyright, error: copyrightError } = await supabase
        .from('copyrights')
        .select('*')
        .eq('id', copyrightId)
        .single();

      // Get writers for this copyright
      const { data: writers, error: writersError } = await supabase
        .from('copyright_writers')
        .select('*')
        .eq('copyright_id', copyrightId);

      setResults({
        copyright,
        copyrightError,
        writers,
        writersError,
        writersCount: writers?.length || 0
      });
    } catch (error) {
      console.error('Debug error:', error);
      setResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Copyright Writers Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter copyright ID to check..."
            value={copyrightId}
            onChange={(e) => setCopyrightId(e.target.value)}
          />
          <Button onClick={checkCopyrightWriters} disabled={loading}>
            {loading ? "Checking..." : "Check Writers"}
          </Button>
        </div>

        {results && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Copyright Info:</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                {JSON.stringify({
                  id: results.copyright?.id,
                  title: results.copyright?.work_title,
                  error: results.copyrightError?.message
                }, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold">Writers ({results.writersCount}):</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                {JSON.stringify(results.writers || results.writersError, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}