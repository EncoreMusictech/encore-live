import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { GripVertical, ArrowRight, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ENCORE_STANDARD_FIELDS } from "@/lib/encore-mapper";

interface FieldMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unmappedFields: string[];
  validationErrors: string[];
  requiredFields: string[];
  onSaveMapping: (mapping: { [key: string]: string }) => void;
}

interface MappingTarget {
  id: string;
  name: string;
  type: 'required' | 'optional';
  description?: string;
}

export function FieldMappingDialog({ 
  open, 
  onOpenChange, 
  unmappedFields, 
  validationErrors,
  requiredFields,
  onSaveMapping 
}: FieldMappingDialogProps) {
  // Required ENCORE fields
  const requiredEncoreFields = ['WORK TITLE', 'WORK WRITERS', 'GROSS'];
  
  // Create mapping targets from ENCORE standard fields
  const mappingTargets: MappingTarget[] = ENCORE_STANDARD_FIELDS.map(field => ({
    id: field,
    name: field,
    type: requiredEncoreFields.includes(field) ? 'required' as const : 'optional' as const,
    description: requiredEncoreFields.includes(field) 
      ? 'Required field for proper processing' 
      : 'Optional ENCORE standard field'
  }));

  const [fieldMapping, setFieldMapping] = useState<{ [key: string]: string }>({});
  const [availableFields, setAvailableFields] = useState(unmappedFields);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    
    if (!destination) return;

    // Handle drag from available fields to mapping targets
    if (source.droppableId === 'available-fields' && destination.droppableId.startsWith('target-')) {
      const field = availableFields[source.index];
      const targetId = destination.droppableId.replace('target-', '');
      
      // Update mapping
      const newMapping = { ...fieldMapping };
      
      // Remove field from any existing mappings
      Object.keys(newMapping).forEach(key => {
        if (newMapping[key] === field) {
          delete newMapping[key];
        }
      });
      
      // Add new mapping
      newMapping[targetId] = field;
      setFieldMapping(newMapping);
      
      // Remove field from available fields if it's now mapped
      const newAvailableFields = [...availableFields];
      newAvailableFields.splice(source.index, 1);
      setAvailableFields(newAvailableFields);
      
      toast({
        title: "Field Mapped",
        description: `"${field}" mapped to "${mappingTargets.find(t => t.id === targetId)?.name}"`,
      });
    }
    
    // Handle drag back to available fields (unmapping)
    if (source.droppableId.startsWith('target-') && destination.droppableId === 'available-fields') {
      const targetId = source.droppableId.replace('target-', '');
      const field = fieldMapping[targetId];
      
      if (field) {
        // Remove from mapping
        const newMapping = { ...fieldMapping };
        delete newMapping[targetId];
        setFieldMapping(newMapping);
        
        // Add back to available fields
        const newAvailableFields = [...availableFields];
        newAvailableFields.splice(destination.index, 0, field);
        setAvailableFields(newAvailableFields);
        
        toast({
          title: "Field Unmapped",
          description: `"${field}" removed from mapping`,
        });
      }
    }
  };

  const handleSave = () => {
    onSaveMapping(fieldMapping);
    onOpenChange(false);
    toast({
      title: "Mapping Saved",
      description: `${Object.keys(fieldMapping).length} field mappings applied`,
    });
  };

  const mappedCount = Object.keys(fieldMapping).length;
  const totalTargets = mappingTargets.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GripVertical className="h-5 w-5" />
            Field Mapping
          </DialogTitle>
          <DialogDescription>
            Drag and drop fields from the left to map them to ENCORE standard fields. 
            Required fields must be mapped for successful processing.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">{mappedCount} / {totalTargets} Mapped</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm">{availableFields.length} Unmapped Fields</span>
          </div>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-2 gap-6">
            {/* Available Fields */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Available Fields</CardTitle>
              </CardHeader>
              <CardContent>
                <Droppable droppableId="available-fields">
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`min-h-32 p-4 rounded-lg border-2 border-dashed transition-colors ${
                        snapshot.isDraggingOver ? 'border-blue-500 bg-blue-50' : 'border-muted-foreground/25'
                      }`}
                    >
                      {availableFields.map((field, index) => (
                        <Draggable key={field} draggableId={`field-${field}`} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`mb-2 p-3 bg-card border border-border rounded-lg shadow-sm cursor-move transition-all duration-200 ${
                                snapshot.isDragging ? 'rotate-2 shadow-lg scale-105' : 'hover:shadow-md hover:border-primary/50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="text-sm font-medium text-foreground">{field}</span>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {availableFields.length === 0 && (
                        <div className="text-center text-muted-foreground text-sm py-8 border border-dashed border-muted-foreground/25 rounded-lg bg-muted/30">
                          <div className="font-medium">All fields mapped!</div>
                          <div className="text-xs mt-1">Drag fields back here to unmap them</div>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </CardContent>
            </Card>

            {/* Mapping Targets */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <GripVertical className="h-5 w-5" />
                  Mapping Targets
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mappingTargets.map((target) => (
                  <Droppable key={target.id} droppableId={`target-${target.id}`}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`p-3 rounded-lg border-2 transition-colors ${
                          fieldMapping[target.id] 
                            ? 'border-green-500 bg-green-50' 
                            : snapshot.isDraggingOver 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-dashed border-muted-foreground/25'
                        }`}
                      >
                         <div className="flex items-center justify-between mb-2">
                           <div className="flex items-center gap-2">
                             <Badge variant={target.type === 'required' ? 'destructive' : 'secondary'}>
                               {target.type}
                             </Badge>
                             <span className="font-medium text-sm text-foreground">{target.name}</span>
                           </div>
                           {fieldMapping[target.id] && (
                             <CheckCircle className="h-4 w-4 text-green-600" />
                           )}
                         </div>
                        
                        {target.description && (
                          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{target.description}</p>
                        )}

                        {fieldMapping[target.id] ? (
                          <Draggable 
                            draggableId={`mapped-${target.id}`} 
                            index={0}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-3 bg-card border border-green-200 rounded shadow-sm cursor-move transition-all duration-200 ${
                                  snapshot.isDragging ? 'rotate-2 shadow-lg scale-105' : 'hover:shadow-md'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <ArrowRight className="h-3 w-3 text-green-600 flex-shrink-0" />
                                  <span className="text-sm font-medium text-foreground">{fieldMapping[target.id]}</span>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ) : (
                          <div className="text-center text-muted-foreground text-xs py-3 border-2 border-dashed border-muted-foreground/25 rounded bg-muted/20">
                            <div>Drop field here</div>
                          </div>
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                ))}
              </CardContent>
            </Card>
          </div>
        </DragDropContext>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={mappedCount === 0}>
            Save Mapping ({mappedCount})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}