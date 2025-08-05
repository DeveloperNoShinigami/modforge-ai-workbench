import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProjectStructure {
  success: boolean;
  projectName: string;
  platform: string;
  minecraftVersion: string;
  files: string[];
  projectStructure: Record<string, string>;
  nextSteps: string[];
}

export function useProjectScaffolding() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createProject = async (
    projectName: string,
    platform: string,
    minecraftVersion: string,
    description?: string,
    projectId?: string
  ): Promise<ProjectStructure | null> => {
    console.log("🏗️ Creating project:", { projectName, platform, minecraftVersion });
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('project-scaffolding', {
        body: { projectName, platform, minecraftVersion, description, projectId }
      });

      if (error) throw new Error(error.message);

      toast({
        title: "Project scaffolded successfully!",
        description: `${projectName} scaffolded with ${data.files.length} files`
      });

      return data;
    } catch (error) {
      console.error('Project scaffolding error:', error);
      toast({
        title: "Failed to scaffold project",
        description: "Please check your project configuration",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    createProject,
    loading
  };
}