import React, { useCallback, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  MarkerType,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, CheckCircle, Circle, Target, TrendingUp, DollarSign, Save } from 'lucide-react';

interface WorkflowStepData {
  title: string;
  description: string;
  status: 'pending' | 'current' | 'completed';
  icon: React.ReactNode;
  details: string[];
}

const WorkflowStepNode = ({ data }: { data: WorkflowStepData }) => {
  const getStatusColor = () => {
    switch (data.status) {
      case 'completed': return 'bg-green-500/20 border-green-500';
      case 'current': return 'bg-blue-500/20 border-blue-500 ring-2 ring-blue-500/50';
      default: return 'bg-muted border-border';
    }
  };

  const getStatusIcon = () => {
    switch (data.status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'current': return <Play className="h-4 w-4 text-blue-500" />;
      default: return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className={`w-64 transition-all duration-300 ${getStatusColor()}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {data.icon}
          {getStatusIcon()}
        </div>
        <CardTitle className="text-sm">{data.title}</CardTitle>
        <CardDescription className="text-xs">{data.description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {data.details.map((detail, index) => (
            <div key={index} className="text-xs text-muted-foreground">
              • {detail}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'workflowStep',
    position: { x: 50, y: 50 },
    data: {
      title: 'Artist Discovery',
      description: 'Search and analyze target artists',
      status: 'current',
      icon: <Target className="h-4 w-4 text-blue-500" />,
      details: [
        'Search Spotify database',
        'Load complete discography',
        'Analyze popularity scores',
        'Review streaming metrics'
      ]
    }
  },
  {
    id: '2',
    type: 'workflowStep',
    position: { x: 400, y: 50 },
    data: {
      title: 'Asset Selection',
      description: 'Choose specific tracks and albums',
      status: 'pending',
      icon: <Circle className="h-4 w-4 text-muted-foreground" />,
      details: [
        'Select albums vs singles',
        'Calculate estimated streams',
        'Build asset portfolio',
        'Assess catalog composition'
      ]
    }
  },
  {
    id: '3',
    type: 'workflowStep',
    position: { x: 750, y: 50 },
    data: {
      title: 'Deal Configuration',
      description: 'Set financial terms and structure',
      status: 'pending',
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
      details: [
        'Choose deal type',
        'Set upfront advance',
        'Configure recoupment rate',
        'Define ownership percentage'
      ]
    }
  },
  {
    id: '4',
    type: 'workflowStep',
    position: { x: 400, y: 350 },
    data: {
      title: 'Financial Projections',
      description: 'Calculate ROI and cash flows',
      status: 'pending',
      icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
      details: [
        'Run 5-year projections',
        'Apply decay models',
        'Calculate payback period',
        'Assess risk factors'
      ]
    }
  },
  {
    id: '5',
    type: 'workflowStep',
    position: { x: 750, y: 350 },
    data: {
      title: 'Scenario Management',
      description: 'Save and compare deal scenarios',
      status: 'pending',
      icon: <Save className="h-4 w-4 text-muted-foreground" />,
      details: [
        'Save deal scenarios',
        'Compare multiple deals',
        'Export reports',
        'Present to stakeholders'
      ]
    }
  }
];

const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    type: 'smoothstep',
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
  {
    id: 'e3-4',
    source: '3',
    target: '4',
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
  {
    id: 'e4-5',
    source: '4',
    target: '5',
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  }
];

const nodeTypes = {
  workflowStep: WorkflowStepNode,
};

interface InteractiveWorkflowGuideProps {
  onStepClick?: (stepId: string) => void;
  currentStep?: string;
}

export function InteractiveWorkflowGuide({ onStepClick, currentStep = '1' }: InteractiveWorkflowGuideProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (onStepClick) {
      onStepClick(node.id);
    }
    
    // Update node status based on current step
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === node.id) {
          return {
            ...n,
            data: {
              ...n.data,
              status: 'current'
            }
          };
        } else if (parseInt(n.id) < parseInt(node.id)) {
          return {
            ...n,
            data: {
              ...n.data,
              status: 'completed'
            }
          };
        } else {
          return {
            ...n,
            data: {
              ...n.data,
              status: 'pending'
            }
          };
        }
      })
    );
  }, [onStepClick, setNodes]);

  return (
    <div className="h-[600px] w-full bg-background border rounded-lg overflow-hidden">
      <div className="h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.5}
          maxZoom={1.5}
          attributionPosition="bottom-left"
          className="bg-background"
        >
          <MiniMap 
            nodeColor={(node) => {
              switch (node.data.status) {
                case 'completed': return '#10b981';
                case 'current': return '#3b82f6';
                default: return '#64748b';
              }
            }}
            className="!bg-background border"
          />
          <Controls className="!bg-background border" />
          <Background gap={12} size={1} className="opacity-30" />
        </ReactFlow>
      </div>
      
      <div className="absolute top-4 left-4 z-10">
        <Card className="w-80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Catalog Valuation Workflow</CardTitle>
            <CardDescription className="text-sm">
              Click on each step to navigate through the complete process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs">
                <Circle className="h-3 w-3 mr-1" />
                Pending
              </Badge>
              <Badge variant="default" className="text-xs bg-blue-500">
                <Play className="h-3 w-3 mr-1" />
                Current
              </Badge>
              <Badge variant="default" className="text-xs bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}