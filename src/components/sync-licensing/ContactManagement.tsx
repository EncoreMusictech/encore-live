import { useState } from "react";
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

  const handleLicensorSubmit = (data: ContactData) => {
    onLicensorChange(data);
  };

  const handleLicenseeSubmit = (data: ContactData) => {
    onLicenseeChange(data);
  };

  const ContactForm = ({ 
    form, 
    onSubmit, 
    title, 
    icon: Icon 
  }: { 
    form: any; 
    onSubmit: (data: ContactData) => void; 
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
          </form>
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
            onSubmit={handleLicensorSubmit}
            title="Licensor"
            icon={Building2}
          />
        </TabsContent>

        <TabsContent value="licensee" className="space-y-4">
          <ContactForm
            form={licenseeForm}
            onSubmit={handleLicenseeSubmit}
            title="Licensee"
            icon={User}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};