import { useForm } from "react-hook-form";
import { Shield, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface RightsClearanceData {
  rights_cleared?: boolean;
  clearance_notes?: string;
  master_rights_cleared?: boolean;
  publishing_rights_cleared?: boolean;
  synchronization_rights_cleared?: boolean;
  performance_rights_cleared?: boolean;
  mechanical_rights_cleared?: boolean;
}

interface RightsClearanceFormProps {
  rightsData?: RightsClearanceData;
  onRightsChange: (data: RightsClearanceData) => void;
}

export const RightsClearanceForm = ({ rightsData, onRightsChange }: RightsClearanceFormProps) => {
  const form = useForm({
    defaultValues: {
      rights_cleared: rightsData?.rights_cleared || false,
      clearance_notes: rightsData?.clearance_notes || "",
      master_rights_cleared: rightsData?.master_rights_cleared || false,
      publishing_rights_cleared: rightsData?.publishing_rights_cleared || false,
      synchronization_rights_cleared: rightsData?.synchronization_rights_cleared || false,
      performance_rights_cleared: rightsData?.performance_rights_cleared || false,
      mechanical_rights_cleared: rightsData?.mechanical_rights_cleared || false,
    },
    mode: "onChange"
  });

  const handleFormChange = (data: RightsClearanceData) => {
    onRightsChange(data);
  };

  const rightsItems = [
    { 
      key: 'master_rights_cleared', 
      label: 'Master Rights', 
      description: 'Sound recording ownership and usage rights' 
    },
    { 
      key: 'publishing_rights_cleared', 
      label: 'Publishing Rights', 
      description: 'Musical composition publishing rights' 
    },
    { 
      key: 'synchronization_rights_cleared', 
      label: 'Synchronization Rights', 
      description: 'Rights to sync music with visual media' 
    },
    { 
      key: 'performance_rights_cleared', 
      label: 'Performance Rights', 
      description: 'Public performance and broadcast rights' 
    },
    { 
      key: 'mechanical_rights_cleared', 
      label: 'Mechanical Rights', 
      description: 'Rights to reproduce and distribute recordings' 
    },
  ];

  const allRightsCleared = rightsItems.every(item => form.watch(item.key as keyof RightsClearanceData));
  const clearedCount = rightsItems.filter(item => form.watch(item.key as keyof RightsClearanceData)).length;

  const getStatusIcon = (cleared: boolean) => {
    return cleared ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getOverallStatus = () => {
    if (allRightsCleared) {
      return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />All Rights Cleared</Badge>;
    }
    if (clearedCount > 0) {
      return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />Partial Clearance ({clearedCount}/{rightsItems.length})</Badge>;
    }
    return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />No Rights Cleared</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Rights Clearance Status
          </CardTitle>
          {getOverallStatus()}
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onChange={form.handleSubmit(handleFormChange)} className="space-y-6">
            
            {/* Overall Rights Status */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="rights_cleared"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-medium">
                        Overall Rights Cleared
                      </FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Mark as cleared when all necessary rights have been obtained
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Individual Rights */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-foreground border-b pb-2">Individual Rights Clearance</h4>
              
              <div className="space-y-3">
                {rightsItems.map((item) => (
                  <FormField
                    key={item.key}
                    control={form.control}
                    name={item.key as keyof RightsClearanceData}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start justify-between rounded-lg border p-4">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(field.value as boolean)}
                            <FormLabel className="text-sm font-medium">
                              {item.label}
                            </FormLabel>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.description}
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value as boolean}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Clearance Notes */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-foreground border-b pb-2">Clearance Notes</h4>
              
              <FormField
                control={form.control}
                name="clearance_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Notes about rights clearance process, outstanding issues, or special considerations..." 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

          </form>
        </Form>
      </CardContent>
    </Card>
  );
};