import { Button } from "@/components/ui/button";

interface RoyaltyAllocationFormProps {
  onCancel: () => void;
}

export function RoyaltyAllocationForm({ onCancel }: RoyaltyAllocationFormProps) {
  return (
    <div className="p-4">
      <p>Royalty Allocation Form - Coming Soon</p>
      <Button onClick={onCancel} className="mt-4">Cancel</Button>
    </div>
  );
}