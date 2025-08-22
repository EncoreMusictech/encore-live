import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ContractFormBase, ContractFormStep } from "./forms/ContractFormBase";
import { ContractTypeSelection } from "./forms/shared/ContractTypeSelection";
import { ContractBasicInfoAndParties } from "./forms/shared/ContractBasicInfoAndParties";
import { ContractReview } from "./forms/shared/ContractReview";

import { ContractInterestedParties } from "./forms/shared/ContractInterestedParties";
import { ProducerForm } from "./forms/ProducerForm";
import { Music, FileText, DollarSign, Users, Clock, CheckCircle, UserCheck, ListMusic } from "lucide-react";
import { ContractWorks } from "./forms/shared/ContractWorks";
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
    demoId: "demo_flat_fee"
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
    demoId: "demo_points"
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
    demoId: "demo_hybrid"
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
  producerAgreementType: '',
  
  // Producer Terms
  producerType: '',
  upfrontFee: '',
  producerPoints: '',
  trackCount: '',
  producerCredit: '',
  masterOwnership: '',
  
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

interface StandardizedProducerFormProps {
  onCancel?: () => void;
  onSuccess?: () => void;
  onBack?: () => void;
  demoData?: any;
}

export function StandardizedProducerForm({ 
  onCancel, 
  onSuccess, 
  onBack,
  demoData 
}: StandardizedProducerFormProps) {
  const [formData, setFormData] = useState(defaultFormData);
  const { createContract } = useContracts();
  const { toast } = useToast();
  const navigate = useNavigate();

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleDemoDataLoad = (demoId: string) => {
    const demoData = {
      demo_flat_fee: {
        agreementTitle: 'Producer Agreement - Flat Fee',
        counterparty: 'Demo Producer',
        effectiveDate: new Date().toISOString().split('T')[0],
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year
        territory: 'worldwide',
        governingLaw: 'california',
        notes: 'Flat fee producer agreement with $5K upfront payment. Producer retains credit but no ongoing royalties.',
        upfrontFee: '5000',
        producerPoints: '0',
        trackCount: '10',
        producerCredit: 'Produced by Demo Producer',
        masterOwnership: 'Artist retains 100%',
        firstParty: {
          contactName: 'Demo Artist',
          email: 'artist@demo.com',
          phone: '(555) 123-4567',
          taxId: '12-3456789',
          address: '123 Artist St, Los Angeles, CA 90028'
        },
        secondParty: {
          contactName: 'Demo Producer',
          email: 'producer@demo.com',
          phone: '(555) 987-6543',
          taxId: '98-7654321',
          address: '456 Producer Ave, Nashville, TN 37203'
        }
      },
      demo_points: {
        agreementTitle: 'Producer Agreement - Points Only',
        counterparty: 'Demo Producer Co.',
        effectiveDate: new Date().toISOString().split('T')[0],
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 2).toISOString().split('T')[0], // 2 years
        territory: 'worldwide',
        governingLaw: 'new_york',
        notes: 'Points-only producer deal with 3% ongoing royalties. No upfront payment but long-term revenue participation.',
        upfrontFee: '0',
        producerPoints: '3',
        trackCount: '12',
        producerCredit: 'Produced by Demo Producer Co.',
        masterOwnership: 'Shared ownership structure',
        firstParty: {
          contactName: 'Demo Producer Co.',
          email: 'business@demoproducer.com',
          phone: '(555) 111-2222',
          taxId: '11-2233445',
          address: '789 Production Row, Atlanta, GA 30309'
        }
      },
      demo_hybrid: {
        agreementTitle: 'Producer Agreement - Hybrid Deal',
        counterparty: 'Premium Producer',
        effectiveDate: new Date().toISOString().split('T')[0],
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 3).toISOString().split('T')[0], // 3 years
        territory: 'worldwide',
        governingLaw: 'california',
        notes: 'Hybrid producer deal with $2.5K advance plus 2% points. Balanced approach with upfront payment and ongoing royalties.',
        upfrontFee: '2500',
        producerPoints: '2',
        trackCount: '8',
        producerCredit: 'Produced by Premium Producer',
        masterOwnership: 'Split ownership agreement',
        firstParty: {
          contactName: 'Premium Producer',
          email: 'info@premiumproducer.com',
          phone: '(555) 333-4444',
          taxId: '33-4455667',
          address: '321 Studio Blvd, New York, NY 10001'
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
      description: "Select the type of producer agreement",
      icon: Music,
      component: (props: any) => (
        <ContractTypeSelection
          {...props}
          contractTypes={producerTypes}
          selectedField="producerAgreementType"
          demoData={demoData}
          onDemoDataLoad={handleDemoDataLoad}
        />
      ),
      validation: () => !!formData.producerAgreementType
    },
    {
      id: "basic_and_parties",
      title: "Basic Info & Parties",
      description: "Agreement details, timeline, and party information",
      icon: FileText,
      component: (props: any) => (
        <ContractBasicInfoAndParties
          {...props}
          contractType="producer agreement"
          partyLabels={{ firstParty: 'Artist/Label', secondParty: 'Producer' }}
        />
      ),
      validation: () => !!(formData.agreementTitle && formData.counterparty && formData.effectiveDate)
    },
    {
      id: "terms",
      title: "Producer Terms",
      description: "Compensation and production details",
      icon: DollarSign,
      component: ProducerForm,
      validation: () => !!(formData.upfrontFee || formData.producerPoints)
    },
    {
      id: "works",
      title: "Schedule of Works",
      description: "Select and manage musical works for this agreement",
      icon: ListMusic,
      component: (props: any) => (
        <ContractWorks
          {...props}
          contractType="producer"
        />
      )
    },
    {
      id: "interested_parties",
      title: "Interested Parties",
      description: "Manage ownership and interested parties",
      icon: UserCheck,
      component: (props: any) => (
        <ContractInterestedParties
          {...props}
          contractType="producer agreement"
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
          contractType="producer agreement"
          customValidation={[
            { label: 'Producer agreement type selected', isValid: !!props.data.producerAgreementType, required: true },
            { label: 'Producer compensation defined', isValid: !!(props.data.upfrontFee || props.data.producerPoints), required: true }
          ]}
        />
      ),
      validation: () => true
    }
  ];

  const handleSave = async () => {
    try {
      const contract = await createContract({
        contract_type: 'producer',
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
        description: "Your producer agreement has been saved as a draft.",
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
        contract_type: 'producer',
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
        description: "Your producer agreement has been submitted for review.",
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
      title="Create Producer Agreement"
      contractType="producer agreement"
      steps={steps}
      formData={formData}
      onFormDataChange={updateFormData}
      onSave={handleSave}
      onSubmit={handleSubmit}
      onBack={onBack}
    />
  );
}