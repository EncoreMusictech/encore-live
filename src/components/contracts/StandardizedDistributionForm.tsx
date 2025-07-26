import { useState } from "react";
import { ContractFormBase, ContractFormStep } from "./forms/ContractFormBase";
import { ContractTypeSelection } from "./forms/shared/ContractTypeSelection";
import { ContractBasicInfo } from "./forms/shared/ContractBasicInfo";
import { ContractParties } from "./forms/shared/ContractParties";
import { ContractReview } from "./forms/shared/ContractReview";
import { DistributionForm } from "./forms/DistributionForm";
import { Truck, FileText, DollarSign, Users, Globe, CheckCircle } from "lucide-react";
import { getDemoContractData } from "@/data/demo-contract-types";
import { useContracts } from "@/hooks/useContracts";
import { useToast } from "@/hooks/use-toast";

const distributionTypes = [
  {
    id: "distribution_only",
    title: "Distribution Only",
    description: "Pure distribution services without additional support",
    features: [
      "Basic distribution to platforms",
      "Minimal service fees",
      "Artist retains control",
      "Simple revenue splits"
    ],
    icon: Truck,
    popular: false,
    demoId: "distribution-demo"
  },
  {
    id: "label_services",
    title: "Label Services",
    description: "Distribution plus marketing and promotional support",
    features: [
      "Distribution + marketing",
      "Promotional support",
      "Industry connections",
      "Professional guidance"
    ],
    icon: Globe,
    popular: true,
    demoId: "distribution-demo"
  },
  {
    id: "full_label",
    title: "Full Label Deal",
    description: "Comprehensive label partnership with full support",
    features: [
      "Complete label services",
      "A&R support",
      "Maximum investment",
      "Full industry backing"
    ],
    icon: DollarSign,
    popular: false,
    demoId: "distribution-demo"
  },
  {
    id: "licensing",
    title: "Licensing Deal",
    description: "License-based distribution arrangement",
    features: [
      "Flexible licensing terms",
      "Territorial control",
      "Revenue optimization",
      "Strategic partnerships"
    ],
    icon: FileText,
    popular: false,
    demoId: "distribution-demo"
  }
];

const defaultFormData = {
  agreement_type: "",
  contract_type: "distribution",
  status: "draft"
};

export function StandardizedDistributionForm() {
  const [formData, setFormData] = useState(defaultFormData);
  const { createContract } = useContracts();
  const { toast } = useToast();

  const handleDemoDataLoad = (demoId: string) => {
    const demoData = getDemoContractData("distribution", demoId);
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
      title: "Distribution Type",
      description: "Select the type of distribution agreement",
      icon: Truck,
      component: (props: any) => (
        <ContractTypeSelection
          {...props}
          contractTypes={distributionTypes}
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
        <ContractBasicInfo {...props} contractType="distribution agreement" />
      ),
      validation: (data) => !!(data.title && data.counterparty_name)
    },
    {
      id: "terms",
      title: "Distribution Terms",
      description: "Revenue sharing and distribution details",
      icon: DollarSign,
      component: DistributionForm,
      validation: (data) => !!(data.distribution_type && data.artist_revenue_share && data.label_revenue_share)
    },
    {
      id: "parties",
      title: "Party Information",
      description: "Contact details for all parties",
      icon: Users,
      component: (props: any) => (
        <ContractParties
          {...props}
          contractType="distribution agreement"
          partyLabels={{
            party1: "Artist/Label",
            party2: "Distributor"
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
          contractType="distribution agreement"
          customValidation={[
            {
              label: "Revenue splits defined",
              isValid: !!(props.data.artist_revenue_share && props.data.label_revenue_share),
              required: true
            },
            {
              label: "Contract term specified",
              isValid: !!props.data.contract_term,
              required: false
            },
            {
              label: "Release commitment defined",
              isValid: !!props.data.release_commitment,
              required: false
            },
            {
              label: "Territory coverage specified",
              isValid: !!props.data.territory,
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
        contract_type: "distribution",
        user_id: undefined // Will be set by the backend
      });
    } catch (error) {
      throw new Error("Failed to save distribution agreement");
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      await createContract({
        ...data,
        contract_type: "distribution",
        contract_status: "pending_review",
        user_id: undefined // Will be set by the backend
      });
      
      toast({
        title: "Distribution Agreement Submitted",
        description: "Your distribution agreement has been submitted for review.",
      });
    } catch (error) {
      throw new Error("Failed to submit distribution agreement");
    }
  };

  return (
    <ContractFormBase
      title="Distribution Agreement"
      contractType="contract-management"
      steps={steps}
      formData={formData}
      onFormDataChange={setFormData}
      onSave={handleSave}
      onSubmit={handleSubmit}
    />
  );
}