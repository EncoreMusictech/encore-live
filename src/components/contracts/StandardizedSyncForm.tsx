import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ContractFormBase, ContractFormStep } from "./forms/ContractFormBase";
import { ContractTypeSelection } from "./forms/shared/ContractTypeSelection";
import { ContractBasicInfoAndParties } from "./forms/shared/ContractBasicInfoAndParties";
import { ContractReview } from "./forms/shared/ContractReview";
import { ContractWorks } from "./forms/shared/ContractWorks";
import { ContractInterestedParties } from "./forms/shared/ContractInterestedParties";
import { SyncForm } from "./forms/SyncForm";
import { Film, FileText, DollarSign, Users, Globe, CheckCircle, Music, UserCheck } from "lucide-react";
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
    demoId: "demo_one_time"
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
    demoId: "demo_mfn"
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
    demoId: "demo_perpetual"
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
  syncAgreementType: '',
  
  // Sync Terms
  syncType: '',
  licenseFee: '',
  productionTitle: '',
  productionCompany: '',
  mediaUsage: [],
  includesMaster: false,
  includesPublishing: false,
  
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

interface StandardizedSyncFormProps {
  onCancel?: () => void;
  onSuccess?: () => void;
  onBack?: () => void;
  demoData?: any;
}

export function StandardizedSyncForm({ 
  onCancel, 
  onSuccess, 
  onBack,
  demoData 
}: StandardizedSyncFormProps) {
  const [formData, setFormData] = useState(defaultFormData);
  const { createContract } = useContracts();
  const { toast } = useToast();
  const navigate = useNavigate();

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleDemoDataLoad = (demoId: string) => {
    const demoData = {
      demo_one_time: {
        agreementTitle: 'Sync License - TV Commercial',
        counterparty: 'Demo Productions Inc.',
        effectiveDate: new Date().toISOString().split('T')[0],
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year
        licenseFee: '15000',
        productionTitle: 'Demo Brand Commercial Campaign',
        productionCompany: 'Demo Productions Inc.',
        mediaUsage: ['TV', 'Online', 'Social Media'],
        includesMaster: true,
        includesPublishing: true,
        firstParty: {
          contactName: 'Demo Music Publisher',
          email: 'licensing@demomusic.com',
          phone: '(555) 123-4567',
          taxId: '12-3456789',
          address: '123 Music Row, Nashville, TN 37203'
        },
        secondParty: {
          contactName: 'Demo Productions Inc.',
          email: 'licensing@demoproductions.com',
          phone: '(555) 987-6543',
          taxId: '98-7654321',
          address: '456 Production Ave, Los Angeles, CA 90028'
        }
      },
      demo_mfn: {
        agreementTitle: 'Sync License - MFN Deal',
        counterparty: 'Major Film Studio',
        effectiveDate: new Date().toISOString().split('T')[0],
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 2).toISOString().split('T')[0], // 2 years
        licenseFee: '25000',
        productionTitle: 'Blockbuster Film Production',
        productionCompany: 'Major Film Studio',
        mediaUsage: ['Theatrical', 'Streaming', 'TV', 'Home Video'],
        includesMaster: true,
        includesPublishing: true,
        firstParty: {
          contactName: 'Major Film Studio',
          email: 'music@majorstudio.com',
          phone: '(555) 111-2222',
          taxId: '11-2233445',
          address: '789 Studio Blvd, Hollywood, CA 90028'
        }
      },
      demo_perpetual: {
        agreementTitle: 'Sync License - Perpetual Rights',
        counterparty: 'Streaming Platform',
        effectiveDate: new Date().toISOString().split('T')[0],
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 10).toISOString().split('T')[0], // 10 years
        licenseFee: '50000',
        productionTitle: 'Original Series Production',
        productionCompany: 'Streaming Platform',
        mediaUsage: ['Streaming', 'Digital', 'International'],
        includesMaster: true,
        includesPublishing: true,
        firstParty: {
          contactName: 'Streaming Platform',
          email: 'content@streamingco.com',
          phone: '(555) 333-4444',
          taxId: '33-4455667',
          address: '321 Tech Ave, San Francisco, CA 94105'
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
      title: "License Type",
      description: "Select the type of sync license",
      icon: Film,
      component: (props: any) => (
        <ContractTypeSelection
          {...props}
          contractTypes={syncTypes}
          selectedField="syncAgreementType"
          onDemoDataLoad={handleDemoDataLoad}
        />
      ),
      validation: () => !!formData.syncAgreementType
    },
    {
      id: "basic_and_parties",
      title: "Basic Info & Parties",
      description: "License details, timeline, and party information",
      icon: FileText,
      component: (props: any) => (
        <ContractBasicInfoAndParties
          {...props}
          contractType="sync license"
          partyLabels={{ firstParty: 'Rights Holder', secondParty: 'Production Company' }}
        />
      ),
      validation: () => !!(formData.agreementTitle && formData.counterparty && formData.effectiveDate)
    },
    {
      id: "terms",
      title: "Sync Terms",
      description: "Usage rights and compensation",
      icon: DollarSign,
      component: SyncForm,
      validation: () => !!(formData.licenseFee && formData.productionTitle)
    },
    {
      id: "works",
      title: "Schedule of Works",
      description: "Select musical works covered by this license",
      icon: Music,
      component: (props: any) => (
        <ContractWorks
          {...props}
          contractType="sync license"
        />
      ),
      validation: () => formData.selectedWorks && formData.selectedWorks.length > 0
    },
    {
      id: "interested_parties",
      title: "Interested Parties",
      description: "Manage ownership and interested parties",
      icon: UserCheck,
      component: (props: any) => (
        <ContractInterestedParties
          {...props}
          contractType="sync license"
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
          contractType="sync license"
          customValidation={[
            { label: 'Sync license type selected', isValid: !!props.data.syncAgreementType, required: true },
            { label: 'License fee specified', isValid: !!props.data.licenseFee, required: true },
            { label: 'Production details provided', isValid: !!(props.data.productionTitle && props.data.productionCompany), required: true },
            { label: 'Works selected', isValid: props.data.selectedWorks && props.data.selectedWorks.length > 0, required: true }
          ]}
        />
      ),
      validation: () => true // Custom validation in the review component
    }
  ];

  const handleSave = async () => {
    try {
      const contract = await createContract({
        contract_type: 'sync',
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
        description: "Your sync license has been saved as a draft.",
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
        contract_type: 'sync',
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
        description: "Your sync license has been submitted for review.",
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
      title="Create Sync License Agreement"
      contractType="sync license"
      steps={steps}
      formData={formData}
      onFormDataChange={updateFormData}
      onSave={handleSave}
      onSubmit={handleSubmit}
      onBack={onBack}
    />
  );
}