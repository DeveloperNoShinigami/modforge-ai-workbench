import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Send, Sparkles, Brain, MessageSquare, Loader2, History, FileSearch } from "lucide-react";
import { useAIChat } from "@/hooks/useAIChat";
import { ChatHistory } from "@/components/ChatHistory";
import { ProjectFile } from "@/hooks/useFileAdapter";

interface AIAssistantProps {
  currentTier: 'free' | 'junior' | 'senior';
  onCodeGenerated?: (code: string, filename: string, fileType: string) => void;
  projectId?: string;
  currentFile?: ProjectFile;
  projectContext?: string;
  onCodeReview?: (review: string) => void;
}

export function AIAssistant({ 
  currentTier, 
  onCodeGenerated, 
  projectId, 
  currentFile,
  projectContext,
  onCodeReview 
}: AIAssistantProps) {
  const [prompt, setPrompt] = useState("");
  const { messages, loading, generateCodeWithAI, reviewCodeWithAI, clearChat } = useAIChat();
  
  const handleSubmit = async (promptText?: string) => {
    const textToUse = promptText || prompt;
    if (!textToUse.trim()) return;
    
    if (!projectId) {
      return;
    }
    
    console.log("🤖 AIAssistant: Generating code for project:", projectId);
    console.log("🤖 AIAssistant: Using prompt:", textToUse);
    console.log("🤖 AIAssistant: Current file context:", currentFile?.name);
    console.log("🤖 AIAssistant: Project context:", projectContext);
    
    const result = await generateCodeWithAI(textToUse, currentFile, projectContext);
    console.log("🤖 AIAssistant: Received result:", result);
    
    if (result) {
      console.log("🤖 AIAssistant: Code generated successfully:", result.filename);
      onCodeGenerated?.(result.code, result.filename, result.fileType);
      setPrompt("");
    } else {
      console.log("🤖 AIAssistant: No result received");
    }
  };

  const handleCodeReview = async () => {
    if (!currentFile) return;
    
    console.log("🤖 AIAssistant: Reviewing code for:", currentFile.name);
    const review = await reviewCodeWithAI(currentFile);
    if (review) {
      onCodeReview?.(review);
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

  const getSuggestions = () => {
    if (currentFile?.type === 'java') {
      return [
        "Add a new method to this class",
        "Create a custom block that heals players",
        "Generate an item with special abilities",
        "Add event handling to this class",
        "Create unit tests for this code"
      ];
    }
    return [
      "Create a new block with custom properties",
      "Generate an entity that spawns in caves", 
      "Add a crafting recipe for my item",
      "Create a dimension with custom biomes",
      "Generate utility helper methods"
    ];
  };

  if (!projectId) {
    return (
      <Card className="bg-gradient-accent/5 border-accent/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="w-5 h-5 text-accent" />
            AI Code Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Open a project to access the full AI assistant with real-time code generation, 
            chat history, and file understanding capabilities.
          </p>
          <Button variant="outline" className="w-full" disabled>
            <Brain className="w-4 h-4 mr-2" />
            Available in Project Editor
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full">
      <Card className="h-full border-0 shadow-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-accent rounded-lg flex items-center justify-center">
                <Brain className="w-4 h-4 text-accent-foreground" />
              </div>
              AI Assistant
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                {getRequestsRemaining()} requests
              </Badge>
              {currentFile && (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  <FileSearch className="w-3 h-3 mr-1" />
                  {currentFile.name}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 flex-1 flex flex-col">
          <Tabs defaultValue="generate" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="generate">Generate</TabsTrigger>
              <TabsTrigger value="history">
                <History className="w-3 h-3 mr-1" />
                Chat ({messages.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="flex-1 space-y-4">
              <div className="flex gap-2">
                <Input 
                  placeholder={currentFile ? `Modify ${currentFile.name}...` : "Describe what you want to create..."} 
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

              {currentFile && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCodeReview}
                    disabled={loading}
                    className="flex-1"
                  >
                    <FileSearch className="w-3 h-3 mr-1" />
                    Review Current File
                  </Button>
                </div>
              )}
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {currentFile ? `Suggestions for ${currentFile.name}:` : "Try these suggestions:"}
                </p>
                <div className="space-y-1">
                  {getSuggestions().slice(0, currentTier === 'free' ? 2 : 5).map((suggestion, index) => (
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
            </TabsContent>

            <TabsContent value="history" className="flex-1">
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-muted-foreground">AI conversation history</p>
                  {messages.length > 0 && (
                    <Button variant="outline" size="sm" onClick={clearChat}>
                      Clear History
                    </Button>
                  )}
                </div>
                <div className="flex-1">
                  <ChatHistory messages={messages} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}