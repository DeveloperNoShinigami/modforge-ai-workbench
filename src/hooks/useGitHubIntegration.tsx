import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useGitHubIntegration() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const cloneRepository = async (repository: string, githubToken?: string) => {
    console.log("🐙 Cloning repository:", repository);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('github-integration', {
        body: { action: 'clone', repository, githubToken }
      });

      if (error) throw new Error(error.message);

      toast({
        title: "Repository cloned",
        description: `${repository} cloned successfully`
      });

      return data;
    } catch (error) {
      console.error('Clone error:', error);
      toast({
        title: "Clone failed",
        description: "Please check repository permissions",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const pushToRepository = async (repository: string, projectFiles: any, commitMessage: string, githubToken?: string) => {
    console.log("🐙 Pushing to repository:", repository);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('github-integration', {
        body: { action: 'push', repository, projectFiles, commitMessage, githubToken }
      });

      if (error) throw new Error(error.message);

      toast({
        title: "Changes pushed",
        description: `Pushed to ${repository} successfully`
      });

      return data;
    } catch (error) {
      console.error('Push error:', error);
      toast({
        title: "Push failed",
        description: "Please check repository permissions",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const listRepositories = async (githubToken?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('github-integration', {
        body: { action: 'list_repos', githubToken }
      });

      if (error) throw new Error(error.message);
      return data.repositories;
    } catch (error) {
      console.error('List repositories error:', error);
      return [];
    }
  };

  return {
    cloneRepository,
    pushToRepository,
    listRepositories,
    loading
  };
}