import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Zap, Send, Sparkles, Brain, MessageSquare, Loader2 } from "lucide-react";
import { useAI } from "@/hooks/useAI";

interface AIAssistantProps {
  currentTier: 'free' | 'junior' | 'senior';
  onCodeGenerated?: (code: string, filename: string) => void;
  projectId?: string;
}

export function AIAssistant({ currentTier, onCodeGenerated, projectId }: AIAssistantProps) {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const { generateCode, loading } = useAI();
  
  const handleSubmit = async (promptText?: string) => {
    const textToUse = promptText || prompt;
    if (!textToUse.trim()) return;
    
    if (!projectId) {
      setResponse("Please create a project first, then open it to use AI code generation!");
      return;
    }
    
    const result = await generateCode(textToUse, projectId);
    if (result) {
      setResponse(result.explanation);
      onCodeGenerated?.(result.code, result.filename);
      setPrompt("");
    }
  };
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
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !loading && handleSubmit()}
            disabled={loading}
          />
          <Button 
            variant="tier" 
            size="sm" 
            onClick={() => handleSubmit()}
            disabled={loading || !prompt.trim()}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
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
                onClick={() => handleSubmit(suggestion)}
                disabled={loading}
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
        
        {response && (
          <div className="bg-accent/5 border border-accent/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-accent">AI Response</span>
            </div>
            <p className="text-sm text-foreground">{response}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}