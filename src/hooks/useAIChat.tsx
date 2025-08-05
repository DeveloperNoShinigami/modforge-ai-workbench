import { useState } from 'react';
import { ChatMessage } from '@/components/ChatHistory';
import { ProjectFile } from '@/hooks/useFileAdapter';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface AICodeResponse {
  code: string;
  explanation: string;
  filename: string;
  fileType: 'java' | 'json' | 'mcmeta' | 'properties';
}

// Legacy interface for compatibility
export interface AIResponse {
  code: string;
  explanation: string;
  fileType: 'java' | 'json' | 'mcmeta';
  filename: string;
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
    console.log("🤖 useAIChat: Starting generateCodeWithAI");
    console.log("🤖 useAIChat: Generating code", { prompt: prompt.substring(0, 50), hasFile: !!currentFile, projectContext });
    
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

      console.log("🤖 useAIChat: Calling Supabase edge function...");
      
      // Call the new simple edge function that always returns 200
      const { data, error } = await supabase.functions.invoke('simple-generate', {
        body: {
          prompt: context.prompt,
          currentFile: context.currentFile,
          projectContext: context.projectContext
        }
      });
      
      console.log("🤖 useAIChat: Supabase function response:", { data, error });

      if (error) {
        console.error('🤖 useAIChat: Supabase function error:', error);
        console.error('🤖 useAIChat: Error details:', JSON.stringify(error, null, 2));
        throw new Error(error.message || 'Failed to generate code');
      }

      if (!data) {
        console.error("🤖 useAIChat: No data received from AI service");
        throw new Error('No response from AI service');
      }

      console.log("🤖 useAIChat: Received AI response:", data);
      console.log("🤖 useAIChat: Creating response object");

      const response: AICodeResponse = {
        code: data.code,
        explanation: data.explanation,
        filename: data.filename,
        fileType: data.fileType
      };
      
      console.log("🤖 useAIChat: Adding AI response to chat:", response.filename);
      addMessage('ai', response.explanation, response.filename);

      console.log("🤖 useAIChat: Showing success toast");
      toast({
        title: "Code generated successfully!",
        description: response.explanation
      });

      console.log("🤖 useAIChat: Returning successful response");
      return response;

    } catch (error) {
      console.error('🤖 useAIChat: Error generating code:', error);
      console.error('🤖 useAIChat: Error stack:', error instanceof Error ? error.stack : 'No stack');
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
      // Call the new simple review function that always returns 200
      const { data, error } = await supabase.functions.invoke('simple-review', {
        body: {
          code: file.content,
          filename: file.name,
          fileType: file.type
        }
      });

      if (error) {
        console.error('🤖 useAIChat: Code review error:', error);
        console.error('🤖 useAIChat: Review error details:', JSON.stringify(error, null, 2));
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

  // Legacy methods for compatibility
  const generateCode = async (prompt: string, projectId?: string): Promise<AIResponse | null> => {
    const currentFileForContext = undefined; // No current file context in legacy method
    const projectContext = projectId ? `Project ID: ${projectId}` : undefined;
    
    const result = await generateCodeWithAI(prompt, currentFileForContext, projectContext);
    if (result) {
      return {
        code: result.code,
        explanation: result.explanation,
        fileType: result.fileType as 'java' | 'json' | 'mcmeta',
        filename: result.filename
      };
    }
    return null;
  };

  const reviewCode = async (code: string): Promise<string | null> => {
    const mockFile: ProjectFile = {
      id: 'temp',
      name: 'temp.java',
      type: 'java',
      path: 'temp.java',
      content: code,
      modified: false,
      project_id: 'temp',
      file_path: 'temp.java',
      file_name: 'temp.java',
      file_content: code,
      file_type: 'java'
    };
    
    return await reviewCodeWithAI(mockFile);
  };

  return {
    messages,
    loading,
    generateCodeWithAI,
    reviewCodeWithAI,
    clearChat,
    addMessage,
    // Legacy compatibility
    generateCode,
    reviewCode
  };
}

// Real AI integration complete - removed mock response generators