import { useState } from "react";
import { ContractFormBase, ContractFormStep } from "./forms/ContractFormBase";
import { ContractTypeSelection } from "./forms/shared/ContractTypeSelection";
import { ContractBasicInfo } from "./forms/shared/ContractBasicInfo";
import { ContractParties } from "./forms/shared/ContractParties";
import { ContractReview } from "./forms/shared/ContractReview";
import { SyncForm } from "./forms/SyncForm";
import { Film, FileText, DollarSign, Users, Globe, CheckCircle } from "lucide-react";
import { getDemoContractData } from "@/data/demo-contract-types";
import { useContracts } from "@/hooks/useContracts";
import { useToast } from "@/hooks/use-toast";

const syncTypes = [
  {
    id: "one_time",
    title: "One-Time Usage",
    description: "Single use license for specific production",
    features: [
      "Single production use",
      "Fixed license fee",
      "Clear usage terms",
      "Simple licensing"
    ],
    icon: Film,
    popular: true,
    demoId: "sync-demo"
  },
  {
    id: "mfn",
    title: "Most Favored Nations",
    description: "Competitive rate matching structure",
    features: [
      "Competitive rate protection",
      "Market-based pricing",
      "Equal treatment clause",
      "Industry standard terms"
    ],
    icon: Globe,
    popular: false,
    demoId: "sync-demo"
  },
  {
    id: "perpetual",
    title: "Perpetual License",
    description: "Permanent usage rights",
    features: [
      "Unlimited time usage",
      "Higher license fees",
      "Maximum value extraction",
      "Long-term revenue"
    ],
    icon: DollarSign,
    popular: false,
    demoId: "sync-demo"
  },
  {
    id: "term_limited",
    title: "Term Limited",
    description: "License with specific time period",
    features: [
      "Defined usage period",
      "Renewal opportunities",
      "Controlled licensing",
      "Flexible terms"
    ],
    icon: FileText,
    popular: false,
    demoId: "sync-demo"
  }
];

const defaultFormData = {
  agreement_type: "",
  contract_type: "sync",
  status: "draft"
};

export function StandardizedSyncForm() {
  const [formData, setFormData] = useState(defaultFormData);
  const { createContract } = useContracts();
  const { toast } = useToast();

  const handleDemoDataLoad = (demoId: string) => {
    const demoData = getDemoContractData("sync", demoId);
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
      title: "License Type",
      description: "Select the type of sync license",
      icon: Film,
      component: (props: any) => (
        <ContractTypeSelection
          {...props}
          contractTypes={syncTypes}
          selectedField="agreement_type"
          onDemoDataLoad={handleDemoDataLoad}
        />
      ),
      validation: (data) => !!data.agreement_type
    },
    {
      id: "basic",
      title: "Basic Information",
      description: "License details and timeline",
      icon: FileText,
      component: (props: any) => (
        <ContractBasicInfo {...props} contractType="sync license" />
      ),
      validation: (data) => !!(data.title && data.counterparty_name)
    },
    {
      id: "terms",
      title: "Sync Terms",
      description: "Usage rights and compensation",
      icon: DollarSign,
      component: SyncForm,
      validation: (data) => !!(data.sync_type && data.license_fee && data.production_title)
    },
    {
      id: "parties",
      title: "Party Information",
      description: "Contact details for all parties",
      icon: Users,
      component: (props: any) => (
        <ContractParties
          {...props}
          contractType="sync license"
          partyLabels={{
            party1: "Rights Holder",
            party2: "Production Company"
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
          contractType="sync license"
          customValidation={[
            {
              label: "License fee specified",
              isValid: !!props.data.license_fee,
              required: true
            },
            {
              label: "Production details provided",
              isValid: !!(props.data.production_title && props.data.production_company),
              required: true
            },
            {
              label: "Media usage rights defined",
              isValid: !!(props.data.media_usage && props.data.media_usage.length > 0),
              required: false
            },
            {
              label: "Rights coverage specified",
              isValid: !!(props.data.includes_master || props.data.includes_publishing),
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
        contract_type: "sync",
        user_id: undefined // Will be set by the backend
      });
    } catch (error) {
      throw new Error("Failed to save sync license");
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      await createContract({
        ...data,
        contract_type: "sync",
        contract_status: "pending_review",
        user_id: undefined // Will be set by the backend
      });
      
      toast({
        title: "Sync License Submitted",
        description: "Your sync license has been submitted for review.",
      });
    } catch (error) {
      throw new Error("Failed to submit sync license");
    }
  };

  return (
    <ContractFormBase
      title="Sync License Agreement"
      contractType="contract-management"
      steps={steps}
      formData={formData}
      onFormDataChange={setFormData}
      onSave={handleSave}
      onSubmit={handleSubmit}
    />
  );
}