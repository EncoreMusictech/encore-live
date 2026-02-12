import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bot, 
  Send, 
  Lightbulb, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Sparkles
} from "lucide-react";

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

export function AIOperationsAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hello! I'm your AI Operations Assistant. I can help you analyze performance metrics, identify issues, and suggest optimizations. How can I assist you today?",
      timestamp: new Date(),
      suggestions: [
        "Analyze current system performance",
        "Review customer health metrics", 
        "Check for automation opportunities",
        "Generate executive summary"
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const insights = [
    {
      type: 'optimization',
      title: 'Process Automation Opportunity',
      description: 'Customer onboarding could be 40% faster with automated workflows',
      impact: 'High',
      icon: Sparkles
    },
    {
      type: 'alert',
      title: 'Resource Utilization',
      description: 'Database connections approaching 85% capacity',
      impact: 'Medium', 
      icon: AlertTriangle
    },
    {
      type: 'success',
      title: 'Performance Improvement',
      description: 'API response times improved by 23% this week',
      impact: 'Positive',
      icon: TrendingUp
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const initialRender = useRef(true);
  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantResponse = generateAIResponse(inputValue);
      setMessages(prev => [...prev, assistantResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const generateAIResponse = (userInput: string): ChatMessage => {
    const responses = {
      'performance': {
        content: "Based on current metrics, your system performance is strong with 98.7% uptime. However, I notice memory usage has increased 15% over the past week. I recommend implementing caching optimizations for the catalog valuation module.",
        suggestions: ["Implement Redis caching", "Optimize database queries", "Scale server resources"]
      },
      'customer': {
        content: "Customer health analysis shows 87% of your users are in good standing. 3 customers are at risk of churn - I recommend immediate outreach to accounts #1247, #1156, and #892. Their engagement dropped 40% in the last 30 days.",
        suggestions: ["Schedule customer check-ins", "Analyze usage patterns", "Create retention campaign"]
      },
      'automation': {
        content: "I've identified 7 processes that could benefit from automation: customer onboarding (40% time savings), support ticket routing (60% faster), and report generation (80% reduction in manual work). Shall I create implementation plans?",
        suggestions: ["Create automation roadmap", "Estimate ROI", "Start with quick wins"]
      },
      'default': {
        content: "I understand you're asking about operations optimization. Could you be more specific? I can help with performance analysis, customer insights, process automation, or system monitoring.",
        suggestions: ["Analyze system performance", "Review customer metrics", "Find automation opportunities"]
      }
    };

    const responseKey = userInput.toLowerCase().includes('performance') ? 'performance' :
                       userInput.toLowerCase().includes('customer') ? 'customer' :
                       userInput.toLowerCase().includes('automation') ? 'automation' : 'default';

    return {
      id: Date.now().toString(),
      type: 'assistant',
      content: responses[responseKey].content,
      timestamp: new Date(),
      suggestions: responses[responseKey].suggestions
    };
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* AI Chat Interface */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Operations Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScrollArea className="h-96 pr-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-accent'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                    {message.suggestions && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {message.suggestions.map((suggestion, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="text-xs h-6"
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-accent p-3 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-100"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-200"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="flex gap-2">
            <Input
              placeholder="Ask about operations, performance, or get insights..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <Button onClick={handleSendMessage} disabled={!inputValue.trim() || isTyping}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {insights.map((insight, index) => {
            const IconComponent = insight.icon;
            return (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-start gap-3">
                  <IconComponent className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-sm">{insight.title}</h4>
                      <Badge variant={
                        insight.impact === 'High' ? 'destructive' :
                        insight.impact === 'Medium' ? 'default' : 
                        insight.impact === 'Positive' ? 'default' : 'secondary'
                      }>
                        {insight.impact}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{insight.description}</p>
                    <Button variant="outline" size="sm" className="w-full">
                      <MessageSquare className="mr-2 h-3 w-3" />
                      Ask AI about this
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          <Button className="w-full" variant="outline">
            <Sparkles className="mr-2 h-4 w-4" />
            Generate More Insights
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}