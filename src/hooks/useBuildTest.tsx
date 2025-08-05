import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BuildResult {
  success: boolean;
  buildSteps: Array<{
    step: string;
    status: string;
    duration: number;
  }>;
  warnings: string[];
  artifacts: string[];
  buildTime: number;
  platform: string;
  buildType: string;
}

export function useBuildTest() {
  const [loading, setLoading] = useState(false);
  const [buildResult, setBuildResult] = useState<BuildResult | null>(null);
  const { toast } = useToast();

  const buildProject = async (projectId: string, platform: string, buildType: 'compile' | 'test' = 'compile') => {
    console.log("🔨 Building project:", { projectId, platform, buildType });
    setLoading(true);
    setBuildResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('build-test', {
        body: { projectId, platform, buildType }
      });

      if (error) throw new Error(error.message);

      setBuildResult(data);
      
      if (data.success) {
        toast({
          title: "Build completed successfully!",
          description: `Built in ${(data.buildTime / 1000).toFixed(1)}s with ${data.warnings.length} warnings`
        });
      } else {
        toast({
          title: "Build failed",
          description: data.error || "Unknown build error",
          variant: "destructive"
        });
      }

      return data;
    } catch (error) {
      console.error('Build error:', error);
      toast({
        title: "Build failed", 
        description: "Please check your project configuration",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    buildProject,
    buildResult,
    loading
  };
}