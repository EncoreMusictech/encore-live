import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ContractFormBase, ContractFormStep } from "./forms/ContractFormBase";
import { ContractTypeSelection } from "./forms/shared/ContractTypeSelection";
import { ContractBasicInfoAndParties } from "./forms/shared/ContractBasicInfoAndParties";
import { ContractReview } from "./forms/shared/ContractReview";
import { ContractWorks } from "./forms/shared/ContractWorks";
import { ContractInterestedParties } from "./forms/shared/ContractInterestedParties";
import { DistributionForm } from "./forms/DistributionForm";
import { Truck, FileText, DollarSign, Users, Globe, CheckCircle, Music, UserCheck } from "lucide-react";
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
    demoId: "demo_distribution_only"
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
    demoId: "demo_label_services"
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
    demoId: "demo_full_label"
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
    icon: FileText
  }
];

// Default form data matching contract table structure
const defaultFormData = {
  // Basic Info
  agreementTitle: '',
  counterparty: '',
  effectiveDate: '',
  expirationDate: '',
  territory: 'worldwide',
  governingLaw: 'new_york',
  notes: '',
  
  // Type Selection
  distributionAgreementType: '',
  
  // Distribution Terms
  distributionType: '',
  artistRevenueShare: '',
  labelRevenueShare: '',
  contractTerm: '',
  releaseCommitment: '',
  marketingCommitment: '',
  
  // Parties
  firstParty: {
    contactName: '',
    email: '',
    phone: '',
    taxId: '',
    address: ''
  },
  secondParty: {
    contactName: '',
    email: '',
    phone: '',
    taxId: '',
    address: ''
  },
  
  // Works & Parties
  contractId: '',
  selectedWorks: [],
  
  // Metadata
  createdAt: new Date().toISOString(),
  status: 'draft'
};

interface StandardizedDistributionFormProps {
  onCancel?: () => void;
  onSuccess?: () => void;
  onBack?: () => void;
  demoData?: any;
}

export function StandardizedDistributionForm({ 
  onCancel, 
  onSuccess, 
  onBack,
  demoData 
}: StandardizedDistributionFormProps) {
  const [formData, setFormData] = useState(defaultFormData);
  const { createContract } = useContracts();
  const { toast } = useToast();
  const navigate = useNavigate();

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleDemoDataLoad = (demoId: string) => {
    const demoData = {
      demo_distribution_only: {
        agreementTitle: 'Distribution Agreement - Independent Artist',
        counterparty: 'Demo Distribution Co.',
        effectiveDate: new Date().toISOString().split('T')[0],
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 2).toISOString().split('T')[0], // 2 years
        artistRevenueShare: '85',
        labelRevenueShare: '15',
        contractTerm: '2',
        releaseCommitment: 'Minimum 1 release per year',
        marketingCommitment: 'Basic digital marketing support',
        firstParty: {
          contactName: 'Demo Distribution Co.',
          email: 'contracts@demodistribution.com',
          phone: '(555) 123-4567',
          taxId: '12-3456789',
          address: '123 Distribution Ave, Los Angeles, CA 90028'
        },
        secondParty: {
          contactName: 'Demo Artist',
          email: 'artist@demo.com',
          phone: '(555) 987-6543',
          taxId: '98-7654321',
          address: '456 Artist St, Nashville, TN 37203'
        }
      },
      demo_label_services: {
        agreementTitle: 'Label Services Agreement - Emerging Artist',
        counterparty: 'Demo Label Services',
        effectiveDate: new Date().toISOString().split('T')[0],
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 3).toISOString().split('T')[0], // 3 years
        artistRevenueShare: '70',
        labelRevenueShare: '30',
        contractTerm: '3',
        releaseCommitment: 'Minimum 2 releases per year',
        marketingCommitment: 'Full marketing and promotional support',
        firstParty: {
          contactName: 'Demo Label Services',
          email: 'services@demolabel.com',
          phone: '(555) 111-2222',
          taxId: '11-2233445',
          address: '789 Label Row, New York, NY 10001'
        }
      }
    };

    const selectedDemo = demoData[demoId as keyof typeof demoData];
    if (selectedDemo) {
      updateFormData(selectedDemo);
      toast({
        title: "Demo data loaded",
        description: "Form has been populated with sample data.",
      });
    }
  };

  // Form steps configuration (6-step workflow)
  const steps: ContractFormStep[] = [
    {
      id: "type",
      title: "Agreement Type",
      description: "Select the type of distribution agreement",
      icon: Truck,
      component: (props: any) => (
        <ContractTypeSelection
          {...props}
          contractTypes={distributionTypes}
          selectedField="distributionAgreementType"
          onDemoDataLoad={handleDemoDataLoad}
        />
      ),
      validation: () => !!formData.distributionAgreementType
    },
    {
      id: "basic_and_parties",
      title: "Basic Info & Parties",
      description: "Agreement details, timeline, and party information",
      icon: FileText,
      component: (props: any) => (
        <ContractBasicInfoAndParties
          {...props}
          contractType="distribution agreement"
          partyLabels={{ firstParty: 'Artist/Label', secondParty: 'Distributor' }}
        />
      ),
      validation: () => !!(formData.agreementTitle && formData.counterparty && formData.effectiveDate)
    },
    {
      id: "works",
      title: "Schedule of Works",
      description: "Select or add musical works covered by this agreement",
      icon: Music,
      component: (props: any) => (
        <ContractWorks
          {...props}
          contractType="distribution agreement"
        />
      ),
      validation: () => true // Optional - allow proceeding without works
    },
    {
      id: "terms",
      title: "Distribution Terms",
      description: "Revenue sharing and distribution details",
      icon: DollarSign,
      component: DistributionForm,
      validation: () => !!(formData.artistRevenueShare && formData.labelRevenueShare)
    },
    {
      id: "interested_parties",
      title: "Interested Parties",
      description: "Manage ownership and interested parties",
      icon: UserCheck,
      component: (props: any) => (
        <ContractInterestedParties
          {...props}
          contractType="distribution agreement"
        />
      )
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
            { label: 'Distribution agreement type selected', isValid: !!props.data.distributionAgreementType, required: true },
            { label: 'Revenue splits defined', isValid: !!(props.data.artistRevenueShare && props.data.labelRevenueShare), required: true }
          ]}
        />
      ),
      validation: () => true
    }
  ];

  const handleSave = async () => {
    try {
      const contract = await createContract({
        contract_type: 'distribution',
        title: formData.agreementTitle,
        counterparty_name: formData.counterparty,
        contract_status: 'draft',
        start_date: formData.effectiveDate,
        end_date: formData.expirationDate,
        notes: formData.notes,
        contract_data: formData
      });

      if (contract?.id) {
        updateFormData({ contractId: contract.id });
      }

      toast({
        title: "Draft saved",
        description: "Your distribution agreement has been saved as a draft.",
      });
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: "Error saving draft",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    try {
      const contract = await createContract({
        contract_type: 'distribution',
        title: formData.agreementTitle,
        counterparty_name: formData.counterparty,
        contract_status: 'signed',
        start_date: formData.effectiveDate,
        end_date: formData.expirationDate,
        notes: formData.notes,
        contract_data: formData
      });

      toast({
        title: "Agreement submitted",
        description: "Your distribution agreement has been submitted for review.",
      });

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/contract-management');
      }
    } catch (error) {
      console.error('Error submitting agreement:', error);
      toast({
        title: "Error submitting agreement",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <ContractFormBase
      title="Create Distribution Agreement"
      contractType="distribution agreement"
      steps={steps}
      formData={formData}
      onFormDataChange={updateFormData}
      onSave={handleSave}
      onSubmit={handleSubmit}
      onBack={onBack}
    />
  );
}