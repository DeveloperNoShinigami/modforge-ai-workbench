import { useState } from 'react';
import { ChatMessage } from '@/components/ChatHistory';
import { ProjectFile } from '@/hooks/useProjectEditor';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface AICodeResponse {
  code: string;
  explanation: string;
  filename: string;
  fileType: 'java' | 'json' | 'mcmeta' | 'properties';
}

export function useAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const addMessage = (type: 'user' | 'ai', content: string, fileContext?: string) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      fileContext
    };
    setMessages(prev => [...prev, message]);
    return message;
  };

  const generateCodeWithAI = async (
    prompt: string, 
    currentFile?: ProjectFile,
    projectContext?: string
  ): Promise<AICodeResponse | null> => {
    console.log("🤖 useAIChat: Generating code", { prompt: prompt.substring(0, 50), hasFile: !!currentFile });
    
    setLoading(true);
    addMessage('user', prompt, currentFile?.name);

    try {
      // Create context for the AI
      const context = {
        currentFile: currentFile ? {
          name: currentFile.name,
          type: currentFile.type,
          content: currentFile.content
        } : null,
        projectContext,
        prompt
      };

      console.log("🤖 useAIChat: Sending context to AI", context);

      // Call the real Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('generate-code', {
        body: {
          prompt: context.prompt,
          currentFile: context.currentFile,
          projectContext: context.projectContext
        }
      });

      if (error) {
        console.error('🤖 useAIChat: Supabase function error:', error);
        throw new Error(error.message || 'Failed to generate code');
      }

      if (!data) {
        throw new Error('No response from AI service');
      }

      console.log("🤖 useAIChat: Received AI response:", data);

      const response: AICodeResponse = {
        code: data.code,
        explanation: data.explanation,
        filename: data.filename,
        fileType: data.fileType
      };
      
      addMessage('ai', response.explanation, response.filename);

      toast({
        title: "Code generated successfully!",
        description: response.explanation
      });

      return response;

    } catch (error) {
      console.error('🤖 useAIChat: Error generating code:', error);
      addMessage('ai', 'Sorry, I encountered an error generating code. Please try again.');
      
      toast({
        title: "Failed to generate code",
        description: "Please try again later",
        variant: "destructive"
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  const reviewCodeWithAI = async (file: ProjectFile): Promise<string | null> => {
    console.log("🤖 useAIChat: Reviewing code for", file.name);
    
    setLoading(true);
    addMessage('user', `Please review my ${file.name} file`, file.name);

    try {
      // Call the real Supabase Edge Function for code review
      const { data, error } = await supabase.functions.invoke('review-code', {
        body: {
          code: file.content,
          filename: file.name,
          fileType: file.type
        }
      });

      if (error) {
        console.error('🤖 useAIChat: Code review error:', error);
        throw new Error(error.message || 'Failed to review code');
      }

      const review = data?.review || 'Code review completed successfully.';
      addMessage('ai', review, file.name);

      toast({
        title: "Code review completed",
        description: "AI has analyzed your code"
      });

      return review;

    } catch (error) {
      console.error('🤖 useAIChat: Error reviewing code:', error);
      addMessage('ai', 'Sorry, I encountered an error reviewing your code. Please try again.');
      
      toast({
        title: "Failed to review code",
        description: "Please try again later",
        variant: "destructive"
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return {
    messages,
    loading,
    generateCodeWithAI,
    reviewCodeWithAI,
    clearChat,
    addMessage
  };
}

// Real AI integration complete - removed mock response generators