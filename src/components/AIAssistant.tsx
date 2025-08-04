import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Zap, Send, Sparkles, Brain, MessageSquare } from "lucide-react";

interface AIAssistantProps {
  currentTier: 'free' | 'junior' | 'senior';
}

export function AIAssistant({ currentTier }: AIAssistantProps) {
  const getRequestsRemaining = () => {
    switch (currentTier) {
      case 'free': return '7 of 10';
      case 'junior': return '84 of 100';
      case 'senior': return 'Unlimited';
      default: return '0';
    }
  };

  const suggestions = [
    "Create a new block with custom properties",
    "Generate an entity that spawns in caves",
    "Add a crafting recipe for my item",
    "Create a dimension with custom biomes",
    "Generate unit tests for my mod"
  ];

  return (
    <Card className="bg-gradient-accent/5 border-accent/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-accent rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-accent-foreground" />
            </div>
            AI Code Assistant
          </CardTitle>
          <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
            {getRequestsRemaining()} requests
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input 
            placeholder="Describe what you want to create..." 
            className="flex-1"
          />
          <Button variant="tier" size="sm">
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Try these suggestions:
          </p>
          <div className="space-y-1">
            {suggestions.slice(0, currentTier === 'free' ? 2 : 5).map((suggestion, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-left h-auto p-2 text-xs hover:bg-accent/10"
              >
                <MessageSquare className="w-3 h-3 mr-2 flex-shrink-0 text-accent" />
                {suggestion}
              </Button>
            ))}
            {currentTier === 'free' && (
              <div className="text-center pt-2">
                <Button variant="outline" size="sm" className="text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  Upgrade for more suggestions
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}