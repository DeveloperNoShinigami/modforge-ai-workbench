import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Dependency {
  name: string;
  group: string;
  artifact: string;
  version: string;
  type: 'mod' | 'library';
}

export function useDependencyManager() {
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const { toast } = useToast();

  const searchDependencies = async (query: string, platform: string, minecraftVersion: string) => {
    console.log("📦 Searching dependencies:", query);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('dependency-manager', {
        body: { action: 'search', dependency: query, platform, minecraftVersion }
      });

      if (error) throw new Error(error.message);

      setSearchResults(data.results);
      return data.results;
    } catch (error) {
      console.error('Dependency search error:', error);
      toast({
        title: "Search failed",
        description: "Unable to search dependencies",
        variant: "destructive"
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const addDependency = async (dependency: any, platform: string, buildFile: string) => {
    console.log("📦 Adding dependency:", dependency.name);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('dependency-manager', {
        body: { action: 'add', dependency, platform, buildFile }
      });

      if (error) throw new Error(error.message);

      toast({
        title: "Dependency added",
        description: `${dependency.name} v${dependency.version} added successfully`
      });

      return data.updatedBuildFile;
    } catch (error) {
      console.error('Add dependency error:', error);
      toast({
        title: "Failed to add dependency",
        description: "Please try again",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const listDependencies = async (buildFile: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('dependency-manager', {
        body: { action: 'list', buildFile }
      });

      if (error) throw new Error(error.message);
      return data.dependencies;
    } catch (error) {
      console.error('List dependencies error:', error);
      return [];
    }
  };

  return {
    searchDependencies,
    addDependency,
    listDependencies,
    searchResults,
    loading
  };
}