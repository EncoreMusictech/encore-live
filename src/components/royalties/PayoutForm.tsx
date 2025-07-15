import { Button } from "@/components/ui/button";

interface PayoutFormProps {
  onCancel: () => void;
}

export function PayoutForm({ onCancel }: PayoutFormProps) {
  return (
    <div className="p-4">
      <p>Payout Form - Coming Soon</p>
      <Button onClick={onCancel} className="mt-4">Cancel</Button>
    </div>
  );
}