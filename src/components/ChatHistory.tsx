import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, Clock, Download, Plus, Copy, FileCode2, MessageSquare, Send, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  fileContext?: string;
  generatedCode?: {
    code: string;
    filename: string;
    fileType: string;
    explanation: string;
  };
  isReplyable?: boolean;
}

interface ChatHistoryProps {
  messages: ChatMessage[];
  onAddToProject?: (code: string, filename: string, fileType: string) => void;
  onReplyToMessage?: (messageId: string, reply: string) => void;
}

export function ChatHistory({ messages, onAddToProject, onReplyToMessage }: ChatHistoryProps) {
  const { toast } = useToast();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  console.log("💬 ChatHistory: Rendering", messages.length, "messages");

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Code copied",
      description: "Code has been copied to clipboard"
    });
  };

  const handleAddToProject = (code: string, filename: string, fileType: string) => {
    onAddToProject?.(code, filename, fileType);
    toast({
      title: "File added to project",
      description: `${filename} has been added to your project`
    });
  };

  const handleDragStart = (e: React.DragEvent, code: string, filename: string, fileType: string) => {
    console.log("🚀 Starting drag with data:", { filename, fileType });
    e.dataTransfer.setData('application/json', JSON.stringify({
      code,
      filename,
      fileType,
      action: 'add-file'
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleReply = (messageId: string) => {
    if (replyText.trim() && onReplyToMessage) {
      onReplyToMessage(messageId, replyText);
      setReplyText("");
      setReplyingTo(null);
      toast({
        title: "Reply sent",
        description: "Your feedback has been noted"
      });
    }
  };

  if (messages.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bot className="w-4 h-4" />
            Chat History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Start a conversation with the AI assistant</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bot className="w-4 h-4" />
          Chat History
          <Badge variant="outline" className="ml-auto">
            {messages.length} messages
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] p-3">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div className={`flex gap-2 max-w-[80%] ${
                  message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.type === 'user' 
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-accent text-accent-foreground'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>
                  
                  <div className={`space-y-1 ${
                    message.type === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    <div className={`p-3 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>

                    {/* Generated Code Section */}
                    {message.generatedCode && (
                      <div className="mt-3 border rounded-lg bg-card">
                        <div className="flex items-center justify-between p-3 border-b bg-muted/50">
                          <div className="flex items-center gap-2">
                            <FileCode2 className="w-4 h-4" />
                            <span className="font-medium text-sm">{message.generatedCode.filename}</span>
                            <Badge variant="secondary" className="text-xs">
                              {message.generatedCode.fileType}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleCopyCode(message.generatedCode!.code)}
                              className="h-8"
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => handleAddToProject(
                                message.generatedCode!.code, 
                                message.generatedCode!.filename, 
                                message.generatedCode!.fileType
                              )}
                              className="h-8"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Add to Project
                            </Button>
                          </div>
                        </div>
                        <div 
                          className="p-3 cursor-move"
                          draggable
                          onDragStart={(e) => handleDragStart(
                            e, 
                            message.generatedCode!.code, 
                            message.generatedCode!.filename, 
                            message.generatedCode!.fileType
                          )}
                          title="Drag this file to add it to your project"
                        >
                          <pre className="text-xs bg-muted/50 p-2 rounded overflow-x-auto">
                            <code>{message.generatedCode.code.substring(0, 200)}...</code>
                          </pre>
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            💡 Drag this code block to the file explorer to add it to your project
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {message.timestamp.toLocaleTimeString()}
                        {message.fileContext && (
                          <Badge variant="outline" className="text-xs">
                            {message.fileContext}
                          </Badge>
                        )}
                      </div>
                      {message.type === 'ai' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => setReplyingTo(message.id)}
                        >
                          <MessageSquare className="w-3 h-3 mr-1" />
                          Reply
                        </Button>
                      )}
                    </div>

                    {/* Reply Input */}
                    {replyingTo === message.id && (
                      <div className="mt-2 p-2 bg-muted/50 rounded-lg border">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Your feedback..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="h-8 text-xs"
                            onKeyPress={(e) => e.key === 'Enter' && handleReply(message.id)}
                          />
                          <Button
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => handleReply(message.id)}
                            disabled={!replyText.trim()}
                          >
                            <Send className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => setReplyingTo(null)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}