import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PerformanceAnalysis {
  success: boolean;
  analysisType: string;
  timestamp: string;
  metrics: {
    codeQuality: any;
    performance: any;
    memory: any;
    compatibility: any;
  };
  recommendations: Array<{
    priority: string;
    category: string;
    message: string;
    actions: string[];
  }>;
  summary: {
    overall: string;
    score: number;
    issues: number;
    warnings: number;
  };
}

export function usePerformanceAnalysis() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<PerformanceAnalysis | null>(null);
  const { toast } = useToast();

  const analyzeProject = async (projectFiles: Record<string, string>, analysisType: string = 'full') => {
    console.log("📊 Analyzing project performance");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('performance-analysis', {
        body: { projectFiles, analysisType }
      });

      if (error) throw new Error(error.message);

      setAnalysis(data);
      
      toast({
        title: "Performance analysis completed",
        description: `Overall score: ${data.summary.score}/100 (${data.summary.overall})`
      });

      return data;
    } catch (error) {
      console.error('Performance analysis error:', error);
      toast({
        title: "Analysis failed",
        description: "Please try again later",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    analyzeProject,
    analysis,
    loading
  };
}