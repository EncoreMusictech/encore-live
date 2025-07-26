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
    id: 'admin',
    title: 'Administration Agreement',
    description: 'Administration services without ownership transfer',
    features: ['Administration only', 'Writer retains ownership', 'Collection services', 'Territorial flexibility'],
    icon: FileText,
    demoId: 'demo_admin'
  },
  {
    id: 'copub',
    title: 'Co-Publishing Agreement',
    description: 'Shared publishing ownership and administration',
    features: ['50/50 ownership split', 'Shared administration', 'Revenue sharing', 'Joint decision making'],
    icon: Users,
    demoId: 'demo_copub'
  },
  {
    id: 'full_pub',
    title: 'Full Publishing Agreement',
    description: 'Complete transfer of publishing rights',
    features: ['100% publishing ownership', 'Full administration rights', 'Global territories', 'All income streams'],
    icon: BookOpen,
    demoId: 'demo_full_pub'
  },
  {
    id: 'jv',
    title: 'Joint Venture',
    description: 'Partnership-based publishing arrangement',
    features: ['Shared investment', 'Profit sharing', 'Joint ownership', 'Strategic partnership'],
    icon: DollarSign,
    demoId: 'demo_jv'
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
  publishingAgreementType: '',
  
  // Publishing Terms
  publisherShare: '',
  writerShare: '',
  advanceAmount: '',
  royaltyRate: '',
  administrationFee: '',
  termLength: '',
  
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

interface StandardizedPublishingFormProps {
  onCancel?: () => void;
  onSuccess?: () => void;
  onBack?: () => void;
  demoData?: any;
}

export const StandardizedPublishingForm: React.FC<StandardizedPublishingFormProps> = ({ 
  onCancel, 
  onSuccess, 
  onBack,
  demoData 
}) => {
  const [formData, setFormData] = useState(defaultFormData);
  const { createContract } = useContracts();
  const { toast } = useToast();
  const navigate = useNavigate();

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleDemoDataLoad = (demoId: string) => {
    const demoData = {
      demo_admin: {
        agreementTitle: 'Publishing Administration Agreement',
        counterparty: 'Demo Music Publishing',
        effectiveDate: new Date().toISOString().split('T')[0],
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 3).toISOString().split('T')[0], // 3 years
        publisherShare: '0',
        writerShare: '100',
        administrationFee: '15',
        termLength: '3',
        firstParty: {
          contactName: 'Demo Music Publishing',
          email: 'admin@demomusic.com',
          phone: '(555) 123-4567',
          taxId: '12-3456789',
          address: '123 Music Row, Nashville, TN 37203'
        },
        secondParty: {
          contactName: 'Demo Songwriter',
          email: 'writer@demo.com',
          phone: '(555) 987-6543',
          taxId: '98-7654321',
          address: '456 Writer St, Los Angeles, CA 90028'
        }
      },
      demo_copub: {
        agreementTitle: 'Co-Publishing Agreement',
        counterparty: 'Demo Co-Publisher',
        effectiveDate: new Date().toISOString().split('T')[0],
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 5).toISOString().split('T')[0], // 5 years
        publisherShare: '50',
        writerShare: '50',
        advanceAmount: '25000',
        royaltyRate: '50',
        termLength: '5',
        firstParty: {
          contactName: 'Demo Co-Publisher',
          email: 'copub@democopub.com',
          phone: '(555) 111-2222',
          taxId: '11-2233445',
          address: '789 Publishing Ave, New York, NY 10001'
        }
      },
      demo_full_pub: {
        agreementTitle: 'Full Publishing Agreement',
        counterparty: 'Major Music Publisher',
        effectiveDate: new Date().toISOString().split('T')[0],
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 7).toISOString().split('T')[0], // 7 years
        publisherShare: '100',
        writerShare: '0',
        advanceAmount: '100000',
        royaltyRate: '75',
        termLength: '7',
        firstParty: {
          contactName: 'Major Music Publisher',
          email: 'contracts@majorpub.com',
          phone: '(555) 333-4444',
          taxId: '33-4455667',
          address: '321 Publisher Blvd, Beverly Hills, CA 90210'
        }
      },
      demo_jv: {
        agreementTitle: 'Joint Venture Publishing Agreement',
        counterparty: 'Strategic Publishing Partner',
        effectiveDate: new Date().toISOString().split('T')[0],
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 10).toISOString().split('T')[0], // 10 years
        publisherShare: '50',
        writerShare: '50',
        advanceAmount: '75000',
        royaltyRate: '50',
        termLength: '10',
        firstParty: {
          contactName: 'Strategic Publishing Partner',
          email: 'partnerships@strategicpub.com',
          phone: '(555) 555-6666',
          taxId: '55-6677889',
          address: '654 Strategic Ave, Austin, TX 78701'
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
          selectedField="publishingAgreementType"
          onDemoDataLoad={handleDemoDataLoad}
        />
      ),
      validation: () => !!formData.publishingAgreementType
    },
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Agreement details and timeline',
      icon: FileText,
      component: (props: any) => (
        <ContractBasicInfo
          {...props}
          contractType="publishing agreement"
        />
      ),
      validation: () => !!(formData.agreementTitle && formData.counterparty && formData.effectiveDate)
    },
    {
      id: 'terms',
      title: 'Publishing Terms',
      description: 'Ownership shares and financial terms',
      icon: DollarSign,
      component: PublishingForm,
      validation: () => !!(formData.publisherShare && formData.writerShare)
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
          partyLabels={{ firstParty: 'Publisher', secondParty: 'Writer/Songwriter' }}
        />
      ),
      validation: () => true
    },
    {
      id: 'works',
      title: 'Schedule of Works',
      description: 'Select musical works covered by this agreement',
      icon: Music,
      component: (props: any) => (
        <ContractWorks
          {...props}
          contractType="publishing agreement"
        />
      ),
      validation: () => formData.selectedWorks && formData.selectedWorks.length > 0
    },
    {
      id: 'interested_parties',
      title: 'Interested Parties',
      description: 'Manage ownership and interested parties',
      icon: UserCheck,
      component: (props: any) => (
        <ContractInterestedParties
          {...props}
          contractType="publishing agreement"
        />
      )
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
          customValidation={[
            { label: 'Publishing agreement type selected', isValid: !!props.data.publishingAgreementType, required: true },
            { label: 'Publisher and writer shares defined', isValid: !!(props.data.publisherShare && props.data.writerShare), required: true },
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
        contract_type: 'publishing',
        title: formData.agreementTitle,
        counterparty_name: formData.counterparty,
        advance_amount: formData.advanceAmount ? parseFloat(formData.advanceAmount) : undefined,
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
        description: "Your publishing agreement has been saved as a draft.",
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
        contract_type: 'publishing',
        title: formData.agreementTitle,
        counterparty_name: formData.counterparty,
        advance_amount: formData.advanceAmount ? parseFloat(formData.advanceAmount) : undefined,
        contract_status: 'signed',
        start_date: formData.effectiveDate,
        end_date: formData.expirationDate,
        notes: formData.notes,
        contract_data: formData
      });

      toast({
        title: "Agreement submitted",
        description: "Your publishing agreement has been submitted for review.",
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
      title="Create Publishing Agreement"
      contractType="publishing agreement"
      steps={steps}
      formData={formData}
      onFormDataChange={updateFormData}
      onSave={handleSave}
      onSubmit={handleSubmit}
      onBack={onBack}
    />
  );
};