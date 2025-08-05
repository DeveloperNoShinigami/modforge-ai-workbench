-- Create project files table (projects table already exists)
CREATE TABLE IF NOT EXISTS public.project_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_content TEXT NOT NULL DEFAULT '',
  file_type TEXT NOT NULL DEFAULT 'text',
  is_directory BOOLEAN DEFAULT false,
  parent_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, file_path)
);

-- Enable Row Level Security
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

-- Create policies for project files
CREATE POLICY "Users can view files in their projects" 
ON public.project_files 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.projects 
  WHERE public.projects.id = project_files.project_id 
  AND public.projects.user_id = auth.uid()
));

CREATE POLICY "Users can create files in their projects" 
ON public.project_files 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.projects 
  WHERE public.projects.id = project_files.project_id 
  AND public.projects.user_id = auth.uid()
));

CREATE POLICY "Users can update files in their projects" 
ON public.project_files 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.projects 
  WHERE public.projects.id = project_files.project_id 
  AND public.projects.user_id = auth.uid()
));

CREATE POLICY "Users can delete files in their projects" 
ON public.project_files 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.projects 
  WHERE public.projects.id = project_files.project_id 
  AND public.projects.user_id = auth.uid()
));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON public.project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_parent_path ON public.project_files(parent_path);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_project_files_updated_at
BEFORE UPDATE ON public.project_files
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();