import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ContractFormBase, type ContractFormStep } from './forms/ContractFormBase';
import { ContractTypeSelection } from './forms/shared/ContractTypeSelection';
import { ContractBasicInfoAndParties } from './forms/shared/ContractBasicInfoAndParties';
import { ContractReview } from './forms/shared/ContractReview';

import { ContractInterestedParties } from './forms/shared/ContractInterestedParties';
import { ArtistForm } from './forms/ArtistForm';
import { useContracts } from '@/hooks/useContracts';
import { useToast } from '@/hooks/use-toast';
import { FileText, Users, Music, DollarSign, UserCheck, Eye, Briefcase } from 'lucide-react';

// Artist agreement types
const artistTypes = [
  {
    id: 'recording_artist',
    title: 'Recording Artist Agreement',
    description: 'Comprehensive recording contract with label services',
    features: ['Master recording rights', 'Distribution services', 'Marketing support', 'Advance payments'],
    icon: Music,
    demoId: 'demo_recording_artist'
  },
  {
    id: 'development_deal',
    title: 'Development Deal',
    description: 'Artist development with future recording options',
    features: ['Artist development', 'Demo funding', 'First option rights', 'Performance support'],
    icon: UserCheck,
    demoId: 'demo_development'
  },
  {
    id: 'distribution_only',
    title: 'Distribution Agreement',
    description: 'Distribution services without label involvement',
    features: ['Digital distribution', 'Physical distribution', 'Revenue sharing', 'Rights retention'],
    icon: Briefcase
  },
  {
    id: 'management',
    title: 'Management Agreement',
    description: 'Artist management and career guidance',
    features: ['Career management', 'Booking services', 'Business affairs', 'Commission structure'],
    icon: Users
  }
];

// Default form data
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
  artistAgreementType: '',
  
  // Artist Terms
  advanceAmount: '',
  royaltyRate: '',
  termLength: '',
  optionPeriods: '',
  deliverables: '',
  marketingCommitment: '',
  tourSupport: '',
  videoSupport: '',
  
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

interface StandardizedArtistFormProps {
  onCancel?: () => void;
  onSuccess?: () => void;
  onBack?: () => void;
  demoData?: any;
}

export const StandardizedArtistForm: React.FC<StandardizedArtistFormProps> = ({ 
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
      demo_recording_artist: {
        agreementTitle: 'Recording Artist Agreement - Demo Artist',
        counterparty: 'Demo Records Inc.',
        effectiveDate: new Date().toISOString().split('T')[0],
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 3).toISOString().split('T')[0], // 3 years
        royaltyRate: '15',
        advanceAmount: '50000',
        termLength: '3',
        optionPeriods: '2',
        deliverables: 'One full-length album per contract year',
        marketingCommitment: '$25,000 per album release',
        tourSupport: '$15,000 per tour',
        videoSupport: '$10,000 per music video',
        firstParty: {
          contactName: 'Demo Records Inc.',
          email: 'contracts@demorecords.com',
          phone: '(555) 123-4567',
          taxId: '12-3456789',
          address: '123 Music Row, Nashville, TN 37203'
        },
        secondParty: {
          contactName: 'Demo Artist',
          email: 'artist@demo.com',
          phone: '(555) 987-6543',
          taxId: '98-7654321',
          address: '456 Artist St, Los Angeles, CA 90210'
        }
      },
      demo_development: {
        agreementTitle: 'Artist Development Agreement - Emerging Talent',
        counterparty: 'Development Music Group',
        effectiveDate: new Date().toISOString().split('T')[0],
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 2).toISOString().split('T')[0], // 2 years
        royaltyRate: '12',
        advanceAmount: '25000',
        termLength: '2',
        optionPeriods: '1',
        deliverables: 'Demo recordings and live performances',
        marketingCommitment: '$10,000 development budget',
        firstParty: {
          contactName: 'Development Music Group',
          email: 'development@dmg.com',
          phone: '(555) 111-2222',
          taxId: '11-2233445',
          address: '789 Development Ave, Atlanta, GA 30309'
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
      id: 'type',
      title: 'Agreement Type',
      description: 'Select the type of artist agreement',
      icon: FileText,
      component: (props: any) => (
        <ContractTypeSelection
          {...props}
          contractTypes={artistTypes}
          selectedField="artistAgreementType"
          onDemoDataLoad={handleDemoDataLoad}
        />
      ),
      validation: () => !!formData.artistAgreementType
    },
    {
      id: 'basic_and_parties',
      title: 'Basic Info & Parties',
      description: 'Agreement details, timeline, and party information',
      icon: FileText,
      component: (props: any) => (
        <ContractBasicInfoAndParties
          {...props}
          contractType="artist agreement"
          partyLabels={{ firstParty: 'Label/Company', secondParty: 'Artist' }}
        />
      ),
      validation: () => !!(formData.agreementTitle && formData.counterparty && formData.effectiveDate)
    },
    {
      id: 'terms',
      title: 'Artist Terms',
      description: 'Compensation and performance terms',
      icon: DollarSign,
      component: ArtistForm,
      validation: () => !!(formData.royaltyRate && formData.termLength)
    },
    {
      id: 'interested_parties',
      title: 'Interested Parties',
      description: 'Manage ownership and interested parties',
      icon: UserCheck,
      component: (props: any) => (
        <ContractInterestedParties
          {...props}
          contractType="artist agreement"
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
          contractType="artist agreement"
          customValidation={[
            { label: 'Artist agreement type selected', isValid: !!props.data.artistAgreementType, required: true },
            { label: 'Royalty rate specified', isValid: !!props.data.royaltyRate, required: true },
            { label: 'Term length defined', isValid: !!props.data.termLength, required: true }
          ]}
        />
      ),
      validation: () => true
    }
  ];


  const handleSave = async () => {
    try {
      const contract = await createContract({
        contract_type: 'artist',
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
        description: "Your artist agreement has been saved as a draft.",
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
        contract_type: 'artist',
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
        description: "Your artist agreement has been submitted for review.",
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
      title="Create Artist Agreement"
      contractType="artist agreement"
      steps={steps}
      formData={formData}
      onFormDataChange={updateFormData}
      onSave={handleSave}
      onSubmit={handleSubmit}
      onBack={onBack}
    />
  );
};