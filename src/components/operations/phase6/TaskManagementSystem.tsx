import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  CheckSquare,
  Clock,
  AlertTriangle,
  Plus,
  Filter,
  Calendar,
  User,
  Flag,
  MessageSquare,
  Paperclip
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee: string;
  assigneeName: string;
  dueDate: string;
  createdAt: string;
  category: string;
  progress: number;
  comments: number;
  attachments: number;
  tags: string[];
}

export function TaskManagementSystem() {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');

  const tasks: Task[] = [
    {
      id: '1',
      title: 'Customer Health Score Optimization',
      description: 'Refine the algorithm for calculating customer health scores based on new engagement metrics',
      status: 'in_progress',
      priority: 'high',
      assignee: 'john-doe',
      assigneeName: 'John Doe',
      dueDate: '2024-01-15',
      createdAt: '2024-01-10',
      category: 'Customer Success',
      progress: 65,
      comments: 3,
      attachments: 2,
      tags: ['analytics', 'customer-success']
    },
    {
      id: '2',
      title: 'Revenue Dashboard Performance Issues',
      description: 'Investigate and resolve slow loading times in the revenue analytics dashboard',
      status: 'pending',
      priority: 'urgent',
      assignee: 'jane-smith',
      assigneeName: 'Jane Smith',
      dueDate: '2024-01-12',
      createdAt: '2024-01-11',
      category: 'Technical',
      progress: 0,
      comments: 1,
      attachments: 0,
      tags: ['performance', 'dashboard']
    },
    {
      id: '3',
      title: 'Onboarding Email Sequence Update',
      description: 'Update the automated email sequence for new customer onboarding based on user feedback',
      status: 'completed',
      priority: 'medium',
      assignee: 'mike-johnson',
      assigneeName: 'Mike Johnson',
      dueDate: '2024-01-10',
      createdAt: '2024-01-08',
      category: 'Marketing',
      progress: 100,
      comments: 5,
      attachments: 3,
      tags: ['email', 'onboarding']
    },
    {
      id: '4',
      title: 'Support Ticket Escalation Rules',
      description: 'Define and implement new escalation rules for high-priority support tickets',
      status: 'blocked',
      priority: 'high',
      assignee: 'sarah-wilson',
      assigneeName: 'Sarah Wilson',
      dueDate: '2024-01-14',
      createdAt: '2024-01-09',
      category: 'Support',
      progress: 30,
      comments: 7,
      attachments: 1,
      tags: ['support', 'escalation']
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckSquare className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'blocked': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'blocked': return 'destructive';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const filteredTasks = tasks.filter(task => {
    const statusMatch = selectedStatus === 'all' || task.status === selectedStatus;
    const assigneeMatch = selectedAssignee === 'all' || task.assignee === selectedAssignee;
    return statusMatch && assigneeMatch;
  });

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
    overdue: tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'completed').length
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Task Management System</CardTitle>
              <CardDescription>
                Manage internal team tasks, assignments, and project workflows
              </CardDescription>
            </div>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Task Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{taskStats.total}</div>
              <div className="text-sm text-muted-foreground">Total Tasks</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{taskStats.blocked}</div>
              <div className="text-sm text-muted-foreground">Blocked</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{taskStats.overdue}</div>
              <div className="text-sm text-muted-foreground">Overdue</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="list" className="w-full">
          <TabsList>
            <TabsTrigger value="list">Task List</TabsTrigger>
            <TabsTrigger value="board">Kanban Board</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            {/* Filters */}
            <div className="flex gap-4 items-center">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Assignees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  <SelectItem value="john-doe">John Doe</SelectItem>
                  <SelectItem value="jane-smith">Jane Smith</SelectItem>
                  <SelectItem value="mike-johnson">Mike Johnson</SelectItem>
                  <SelectItem value="sarah-wilson">Sarah Wilson</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>

            {/* Task List */}
            <div className="space-y-3">
              {filteredTasks.map(task => (
                <Card key={task.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(task.status)}
                          <h4 className="font-medium">{task.title}</h4>
                          <Badge variant={getStatusVariant(task.status)}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline" className={getPriorityColor(task.priority)}>
                            <Flag className="h-3 w-3 mr-1" />
                            {task.priority}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                        
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {task.assigneeName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span>{task.assigneeName}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Due {task.dueDate}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            <span>{task.comments}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Paperclip className="h-4 w-4" />
                            <span>{task.attachments}</span>
                          </div>
                        </div>

                        {task.status === 'in_progress' && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>{task.progress}%</span>
                            </div>
                            <Progress value={task.progress} className="h-2" />
                          </div>
                        )}

                        <div className="flex gap-2 mt-3">
                          {task.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="board">
            <div className="text-center py-8">
              <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Kanban Board View</h3>
              <p className="text-muted-foreground">
                Drag and drop tasks between different status columns
              </p>
            </div>
          </TabsContent>

          <TabsContent value="calendar">
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Calendar View</h3>
              <p className="text-muted-foreground">
                View tasks organized by due dates in a calendar format
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}