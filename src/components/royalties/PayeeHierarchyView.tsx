import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Users, FileText, Building2, User, ChevronRight } from "lucide-react";
import { usePayeeHierarchy } from "@/hooks/usePayeeHierarchy";
import { usePayees } from "@/hooks/usePayees";
import { AutoBuildPayeesDialog } from "./AutoBuildPayeesDialog";

export function PayeeHierarchyView() {
  const { agreements, originalPublishers, writers, fetchAgreements, fetchOriginalPublishers, fetchWriters } = usePayeeHierarchy();
  const { payees, refetch: refetchPayees } = usePayees();
  const [openAutoBuild, setOpenAutoBuild] = useState(false);

  useEffect(() => {
    // Initial fetch to populate hierarchy
    fetchAgreements();
    fetchOriginalPublishers();
    fetchWriters();
  }, []);

  const countsByAgreement = useMemo(() => {
    const map: Record<string, { publishers: number; writers: number; payees: number }> = {};
    agreements.forEach((a: any) => {
      const pubs = originalPublishers.filter((op: any) => op.agreement_id === a.id);
      const wrs = writers.filter((w: any) => pubs.some((op: any) => op.id === w.original_publisher_id));
      const pys = payees.filter((p: any) => wrs.some((w: any) => w.id === p.writer_id));
      map[a.id] = { publishers: pubs.length, writers: wrs.length, payees: pys.length };
    });
    return map;
  }, [agreements, originalPublishers, writers, payees]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Agreement → Publisher → Writer → Payees
          </CardTitle>
          <CardDescription>Visualize your hierarchy. Use “Build from Agreement” to auto-create payees with default splits.</CardDescription>
        </div>
        <Button variant="outline" onClick={() => setOpenAutoBuild(true)}>Build from Agreement</Button>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {agreements.map((a: any) => {
            const pubs = originalPublishers.filter((op: any) => op.agreement_id === a.id);
            return (
              <AccordionItem key={a.id} value={a.id} className="border-b">
                <AccordionTrigger className="justify-between">
                  <div className="flex items-center gap-3 text-left">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{a.agreement_id ? `${a.agreement_id} — ${a.title}` : a.title}</div>
                      <div className="text-sm text-muted-foreground">Counterparty: {a.counterparty_name || '—'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{countsByAgreement[a.id]?.publishers || 0} publishers</Badge>
                    <Badge variant="secondary">{countsByAgreement[a.id]?.writers || 0} writers</Badge>
                    <Badge>{countsByAgreement[a.id]?.payees || 0} payees</Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-6 py-3 space-y-4">
                    {pubs.length === 0 && (
                      <div className="text-sm text-muted-foreground">No publishers yet. Use “Build from Agreement”.</div>
                    )}
                    {pubs.map((op: any) => {
                      const wrs = writers.filter((w: any) => w.original_publisher_id === op.id);
                      return (
                        <div key={op.id} className="border rounded-md p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <div className="font-medium">{op.publisher_name || op.op_id || 'Original Publisher'}</div>
                            <Badge variant="outline">{wrs.length} writers</Badge>
                          </div>
                          <Separator className="my-3" />
                          <div className="space-y-3">
                            {wrs.length === 0 && (
                              <div className="text-sm text-muted-foreground">No writers under this publisher.</div>
                            )}
                            {wrs.map((w: any) => {
                              const writerPayees = payees.filter((p: any) => p.writer_id === w.id);
                              return (
                                <div key={w.id} className="rounded-md border p-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <div className="font-medium">{w.writer_name || w.writer_id}</div>
                                    <Badge variant="secondary">{writerPayees.length} payees</Badge>
                                  </div>
                                  {writerPayees.length > 0 ? (
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-sm">
                                        <thead>
                                          <tr className="text-muted-foreground">
                                            <th className="text-left py-2 pr-4">Payee ID</th>
                                            <th className="text-left py-2 pr-4">Name</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {writerPayees.map((p: any) => (
                                            <tr key={p.id} className="border-t">
                                              <td className="py-2 pr-4 font-mono">{p.payee_id || '—'}</td>
                                              <td className="py-2 pr-4">{p.payee_name}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    <div className="text-sm text-muted-foreground">No payees for this writer yet.</div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        <AutoBuildPayeesDialog
          open={openAutoBuild}
          onOpenChange={(o) => {
            setOpenAutoBuild(o);
            if (!o) refetchPayees();
          }}
          onCompleted={() => refetchPayees()}
        />
      </CardContent>
    </Card>
  );
}
