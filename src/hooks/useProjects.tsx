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

  const createProject = async (projectData: {
    name: string;
    description?: string;
    platform: 'forge' | 'fabric' | 'quilt' | 'neoforge';
    minecraft_version: string;
  }) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create projects",
        variant: "destructive"
      });
      return null;
    }

    try {
      const mod_id = projectData.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
            ...projectData,
            mod_id,
            user_id: user.id,
            status: 'active'
          }
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newProject = data as Project;
      setProjects(prev => [newProject, ...prev]);
      
      toast({
        title: "Project created!",
        description: `${projectData.name} is ready for development`
      });

      return newProject;
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Failed to create project",
        description: "Please try again",
        variant: "destructive"
      });
      return null;
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
    createProject,
    updateProjectStatus,
    deleteProject
  };
}