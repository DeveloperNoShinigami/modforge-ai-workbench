import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  platform: 'forge' | 'fabric' | 'quilt' | 'neoforge';
  minecraft_version: string;
  mod_id: string;
  status: 'active' | 'building' | 'error' | 'completed';
  created_at: string;
  updated_at: string;
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchProjects = async () => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      setProjects((data || []) as Project[]);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Failed to load projects",
        description: "Please try refreshing the page",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProjectStatus = async (projectId: string, status: Project['status']) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status })
        .eq('id', projectId);

      if (error) {
        throw error;
      }

      setProjects(prev => 
        prev.map(project => 
          project.id === projectId 
            ? { ...project, status, updated_at: new Date().toISOString() }
            : project
        )
      );
      
      toast({
        title: "Project updated",
        description: `Status changed to ${status}`
      });
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: "Failed to update project",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) {
        throw error;
      }

      setProjects(prev => prev.filter(project => project.id !== projectId));
      
      toast({
        title: "Project deleted",
        description: "The project has been removed"
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Failed to delete project",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  return {
    projects,
    loading,
    fetchProjects,
    updateProjectStatus,
    deleteProject
  };
}