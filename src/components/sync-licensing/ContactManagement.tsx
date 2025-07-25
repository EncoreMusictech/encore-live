import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { Plus, Trash2, User, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ContactData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
}

interface ContactManagementProps {
  licensorData?: ContactData;
  licenseeData?: ContactData;
  onLicensorChange: (data: ContactData) => void;
  onLicenseeChange: (data: ContactData) => void;
}

export const ContactManagement = ({ 
  licensorData, 
  licenseeData, 
  onLicensorChange, 
  onLicenseeChange 
}: ContactManagementProps) => {
  const [activeTab, setActiveTab] = useState<string>("licensor");

  const licensorForm = useForm({
    defaultValues: licensorData || {},
    mode: "onChange"
  });

  const licenseeForm = useForm({
    defaultValues: licenseeData || {},
    mode: "onChange"
  });

  // Debug logging
  console.log('ContactManagement render - licensorData:', licensorData);
  console.log('ContactManagement render - licenseeData:', licenseeData);

  // Update form values when props change (without form deps to prevent resets)
  useEffect(() => {
    if (licensorData && Object.keys(licensorData).length > 0) {
      // Only reset if there's actual data and form is empty
      const currentValues = licensorForm.getValues();
      const isEmpty = Object.values(currentValues).every(val => !val);
      if (isEmpty) {
        licensorForm.reset(licensorData);
      }
    }
  }, [licensorData]);

  useEffect(() => {
    if (licenseeData && Object.keys(licenseeData).length > 0) {
      // Only reset if there's actual data and form is empty
      const currentValues = licenseeForm.getValues();
      const isEmpty = Object.values(currentValues).every(val => !val);
      if (isEmpty) {
        licenseeForm.reset(licenseeData);
      }
    }
  }, [licenseeData]);

  // Remove debouncing and use direct callbacks
  const handleLicensorChange = useCallback((data: ContactData) => {
    onLicensorChange(data);
  }, [onLicensorChange]);

  const handleLicenseeChange = useCallback((data: ContactData) => {
    onLicenseeChange(data);
  }, [onLicenseeChange]);

  // Auto-update parent form when licensor data changes
  useEffect(() => {
    const subscription = licensorForm.watch(handleLicensorChange);
    return () => subscription.unsubscribe();
  }, [licensorForm, handleLicensorChange]);

  // Auto-update parent form when licensee data changes
  useEffect(() => {
    const subscription = licenseeForm.watch(handleLicenseeChange);
    return () => subscription.unsubscribe();
  }, [licenseeForm, handleLicenseeChange]);

  const ContactForm = ({ 
    form, 
    title, 
    icon: Icon 
  }: { 
    form: any; 
    title: string;
    icon: React.ComponentType<any>;
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title} Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                rules={{ 
                  required: `${title} name is required`,
                  minLength: { value: 2, message: "Name must be at least 2 characters" }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground after:content-['*'] after:ml-0.5 after:text-destructive">
                      Full Name
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company/Organization</FormLabel>
                    <FormControl>
                      <Input placeholder="Company Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                rules={{ 
                  required: "Email is required",
                  pattern: {
                    value: /\S+@\S+\.\S+/,
                    message: "Please enter a valid email address"
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground after:content-['*'] after:ml-0.5 after:text-destructive">
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@company.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="123 Main St, City, State, ZIP" 
                      className="min-h-[80px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Form>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <User className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Contact Management</h3>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="licensor" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Licensor
          </TabsTrigger>
          <TabsTrigger value="licensee" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Licensee
          </TabsTrigger>
        </TabsList>

        <TabsContent value="licensor" className="space-y-4">
          <ContactForm
            form={licensorForm}
            title="Licensor"
            icon={Building2}
          />
        </TabsContent>

        <TabsContent value="licensee" className="space-y-4">
          <ContactForm
            form={licenseeForm}
            title="Licensee"
            icon={User}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};