import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, DollarSign, CreditCard } from "lucide-react";

const modules = [
  {
    title: "Reconciliation",
    path: "/dashboard/royalties?tab=statements",
    icon: FileText,
    description: "Statement ingestion & mapping"
  },
  {
    title: "Royalties",
    path: "/dashboard/royalties?tab=allocations", 
    icon: DollarSign,
    description: "Royalties & tracking"
  },
  {
    title: "Payouts",
    path: "/dashboard/royalties?tab=payouts",
    icon: CreditCard,
    description: "Client accounting"
  }
];

export function RoyaltiesModuleNav() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'statements';

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Royalties Processing</h2>
            <p className="text-sm text-muted-foreground">Navigate between modules</p>
          </div>
          <Badge variant="secondary">3 Modules</Badge>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          {modules.map((module) => {
            const IconComponent = module.icon;
            const isActive = (module.title === "Reconciliation" && currentTab === "statements") ||
                            (module.title === "Royalties" && currentTab === "allocations") ||
                            (module.title === "Payouts" && currentTab === "payouts");
            
            return (
              <Button
                key={module.path}
                asChild
                variant={isActive ? "default" : "outline"}
                className="h-auto p-3 flex-col gap-2"
              >
                <Link to={module.path}>
                  <IconComponent className="h-5 w-5" />
                  <div className="text-center">
                    <div className="font-medium text-sm">{module.title}</div>
                    <div className="text-xs opacity-70">{module.description}</div>
                  </div>
                </Link>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}