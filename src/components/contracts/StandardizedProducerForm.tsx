import { useState } from "react";
import { ContractFormBase, ContractFormStep } from "./forms/ContractFormBase";
import { ContractTypeSelection } from "./forms/shared/ContractTypeSelection";
import { ContractBasicInfo } from "./forms/shared/ContractBasicInfo";
import { ContractParties } from "./forms/shared/ContractParties";
import { ContractReview } from "./forms/shared/ContractReview";
import { ProducerForm } from "./forms/ProducerForm";
import { Music, FileText, DollarSign, Users, Clock, CheckCircle } from "lucide-react";
import { getDemoContractData } from "@/data/demo-contract-types";
import { useContracts } from "@/hooks/useContracts";
import { useToast } from "@/hooks/use-toast";

const producerTypes = [
  {
    id: "flat_fee",
    title: "Flat Fee Producer",
    description: "One-time payment for production services",
    features: [
      "Fixed upfront payment",
      "No ongoing royalties",
      "Clear project scope",
      "Quick turnaround"
    ],
    icon: DollarSign,
    popular: false,
    demoId: "producer-demo"
  },
  {
    id: "points",
    title: "Points Only",
    description: "Royalty-based compensation structure",
    features: [
      "Percentage of revenues",
      "Long-term income potential",
      "Artist-friendly upfront",
      "Performance-based earnings"
    ],
    icon: Clock,
    popular: false,
    demoId: "producer-demo"
  },
  {
    id: "hybrid",
    title: "Hybrid Deal",
    description: "Combination of upfront fee and points",
    features: [
      "Immediate payment security",
      "Future earning potential",
      "Balanced risk sharing",
      "Industry standard approach"
    ],
    icon: Music,
    popular: true,
    demoId: "producer-demo"
  }
];

const defaultFormData = {
  agreement_type: "",
  contract_type: "producer",
  status: "draft"
};

export function StandardizedProducerForm() {
  const [formData, setFormData] = useState(defaultFormData);
  const { createContract } = useContracts();
  const { toast } = useToast();

  const handleDemoDataLoad = (demoId: string) => {
    const demoData = getDemoContractData("producer", demoId);
    if (demoData) {
      setFormData({
        ...formData,
        ...demoData.basicInfo,
        ...demoData.terms,
        ...demoData.parties,
        agreement_type: formData.agreement_type
      });
    }
  };

  const steps: ContractFormStep[] = [
    {
      id: "type",
      title: "Producer Type",
      description: "Select the type of producer agreement",
      icon: Music,
      component: (props: any) => (
        <ContractTypeSelection
          {...props}
          contractTypes={producerTypes}
          selectedField="agreement_type"
          onDemoDataLoad={handleDemoDataLoad}
        />
      ),
      validation: (data) => !!data.agreement_type
    },
    {
      id: "basic",
      title: "Basic Information",
      description: "Agreement details and timeline",
      icon: FileText,
      component: (props: any) => (
        <ContractBasicInfo {...props} contractType="producer agreement" />
      ),
      validation: (data) => !!(data.title && data.counterparty_name)
    },
    {
      id: "terms",
      title: "Producer Terms",
      description: "Compensation and production details",
      icon: DollarSign,
      component: ProducerForm,
      validation: (data) => !!(data.producer_type && (data.upfront_fee || data.producer_points))
    },
    {
      id: "parties",
      title: "Party Information",
      description: "Contact details for all parties",
      icon: Users,
      component: (props: any) => (
        <ContractParties
          {...props}
          contractType="producer agreement"
          partyLabels={{
            party1: "Artist/Label",
            party2: "Producer"
          }}
        />
      ),
      validation: (data) => !!(data.party1_contact_name && data.party1_email)
    },
    {
      id: "review",
      title: "Review & Submit",
      description: "Final review before submission",
      icon: CheckCircle,
      component: (props: any) => (
        <ContractReview
          {...props}
          contractType="producer agreement"
          customValidation={[
            {
              label: "Producer compensation defined",
              isValid: !!(props.data.upfront_fee || props.data.producer_points),
              required: true
            },
            {
              label: "Track count specified",
              isValid: !!props.data.track_count,
              required: false
            },
            {
              label: "Credit terms defined",
              isValid: !!props.data.producer_credit,
              required: false
            }
          ]}
        />
      )
    }
  ];

  const handleSave = async (data: any) => {
    try {
      await createContract({
        ...data,
        contract_type: "producer",
        user_id: undefined // Will be set by the backend
      });
    } catch (error) {
      throw new Error("Failed to save producer agreement");
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      await createContract({
        ...data,
        contract_type: "producer",
        contract_status: "pending_review",
        user_id: undefined // Will be set by the backend
      });
      
      toast({
        title: "Producer Agreement Submitted",
        description: "Your producer agreement has been submitted for review.",
      });
    } catch (error) {
      throw new Error("Failed to submit producer agreement");
    }
  };

  return (
    <ContractFormBase
      title="Producer Agreement"
      contractType="contract-management"
      steps={steps}
      formData={formData}
      onFormDataChange={setFormData}
      onSave={handleSave}
      onSubmit={handleSubmit}
    />
  );
}