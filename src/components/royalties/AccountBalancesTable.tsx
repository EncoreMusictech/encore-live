import { QuarterlyBalanceReportsTable } from "./QuarterlyBalanceReportsTable";
import { BeginningBalancesManager } from "./BeginningBalancesManager";

export function AccountBalancesTable() {
  return (
    <div className="space-y-6">
      <BeginningBalancesManager />
      <QuarterlyBalanceReportsTable />
    </div>
  );
}