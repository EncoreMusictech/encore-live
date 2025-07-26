import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ContractFormBase, type ContractFormStep } from './forms/ContractFormBase';
import { ContractTypeSelection } from './forms/shared/ContractTypeSelection';
import { ContractBasicInfo } from './forms/shared/ContractBasicInfo';
import { ContractParties } from './forms/shared/ContractParties';
import { ContractReview } from './forms/shared/ContractReview';
import { ContractWorks } from './forms/shared/ContractWorks';
import { ContractInterestedParties } from './forms/shared/ContractInterestedParties';
import { PublishingForm } from './forms/PublishingForm';
import { useContracts } from '@/hooks/useContracts';
import { useToast } from '@/hooks/use-toast';
import { FileText, Users, Music, DollarSign, UserCheck, Eye, BookOpen } from 'lucide-react';

// Publishing agreement types
const publishingTypes = [
  {
    id: 'full_publishing',
    title: 'Full Publishing Agreement',
    description: 'Complete transfer of publishing rights',
    features: ['100% publishing ownership', 'Administration rights', 'Global territories', 'All income streams'],
    icon: BookOpen,
    demoId: 'demo_full_publishing'
  },
  {
    id: 'co_publishing',
    title: 'Co-Publishing Agreement',
    description: 'Shared publishing ownership and administration',
    features: ['50/50 ownership split', 'Shared administration', 'Revenue sharing', 'Joint decision making'],
    icon: Users,
    demoId: 'demo_co_publishing'
  }
];

// Default form data
const defaultFormData = {
  agreement_type: "",
  contract_type: "publishing",
  status: "draft"
};

export const StandardizedPublishingForm: React.FC = () => {
  const [formData, setFormData] = useState(defaultFormData);
  const { createContract } = useContracts();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDemoDataLoad = (demoId: string) => {
    // Demo data implementation
    toast({
      title: "Demo data loaded",
      description: "Form has been populated with sample data.",
    });
  };

  // Form steps configuration
  const steps: ContractFormStep[] = [
    {
      id: 'type',
      title: 'Agreement Type',
      description: 'Select the type of publishing agreement',
      icon: FileText,
      component: (props: any) => (
        <ContractTypeSelection
          {...props}
          contractTypes={publishingTypes}
          selectedField="agreement_type"
          onDemoDataLoad={handleDemoDataLoad}
        />
      ),
      validation: (data) => !!data.agreement_type
    },
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Agreement details and timeline',
      icon: FileText,
      component: (props: any) => (
        <ContractBasicInfo {...props} contractType="publishing agreement" />
      ),
      validation: (data) => !!(data.title && data.counterparty_name)
    },
    {
      id: 'terms',
      title: 'Publishing Terms',
      description: 'Ownership shares and financial terms',
      icon: DollarSign,
      component: PublishingForm,
      validation: (data) => !!(data.publisher_share && data.writer_share)
    },
    {
      id: 'parties',
      title: 'Parties',
      description: 'Contact information for all parties',
      icon: Users,
      component: (props: any) => (
        <ContractParties
          {...props}
          contractType="publishing agreement"
          partyLabels={{ party1: 'Publisher', party2: 'Writer/Songwriter' }}
        />
      ),
      validation: (data) => !!(data.party1_contact_name && data.party1_email)
    },
    {
      id: 'review',
      title: 'Review & Submit',
      description: 'Review all details before submission',
      icon: Eye,
      component: (props: any) => (
        <ContractReview
          {...props}
          contractType="publishing agreement"
        />
      ),
      validation: () => true
    }
  ];

  const handleSave = async (data: any) => {
    try {
      await createContract({
        ...data,
        contract_type: "publishing"
      });
    } catch (error) {
      throw new Error("Failed to save publishing agreement");
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      await createContract({
        ...data,
        contract_type: "publishing",
        contract_status: "pending_review"
      });
      
      toast({
        title: "Publishing Agreement Submitted",
        description: "Your publishing agreement has been submitted for review.",
      });
      
      navigate('/contract-management');
    } catch (error) {
      throw new Error("Failed to submit publishing agreement");
    }
  };

  return (
    <ContractFormBase
      title="Create Publishing Agreement"
      contractType="publishing agreement"
      steps={steps}
      formData={formData}
      onFormDataChange={setFormData}
      onSave={handleSave}
      onSubmit={handleSubmit}
    />
  );
};