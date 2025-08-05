import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProjectFile {
  id: string;
  project_id: string;
  file_path: string;
  file_name: string;
  file_content: string;
  file_type: string;
  is_directory: boolean;
  parent_path?: string;
  created_at: string;
  updated_at: string;
  // Compatibility with useProjectEditor
  name?: string;
  path?: string;
  content?: string;
  type?: 'java' | 'json' | 'mcmeta' | 'properties' | 'toml' | 'bat' | 'sh' | 'md' | 'gitignore' | 'gradle';
  modified?: boolean;
  isFolder?: boolean;
  parentPath?: string;
}

export interface ForgeFileType {
  name: string;
  extension: string;
  template: string;
  icon: string;
  category: 'java' | 'resource' | 'data' | 'config';
}

export const forgeFileTypes: ForgeFileType[] = [
  // Java files
  { name: 'Main Mod Class', extension: '.java', template: 'mainMod', icon: '☕', category: 'java' },
  { name: 'Block Class', extension: '.java', template: 'block', icon: '🧱', category: 'java' },
  { name: 'Item Class', extension: '.java', template: 'item', icon: '⚔️', category: 'java' },
  { name: 'Entity Class', extension: '.java', template: 'entity', icon: '👾', category: 'java' },
  { name: 'Event Handler', extension: '.java', template: 'eventHandler', icon: '⚡', category: 'java' },
  { name: 'Config Class', extension: '.java', template: 'config', icon: '⚙️', category: 'java' },
  
  // Resource files
  { name: 'Block Model', extension: '.json', template: 'blockModel', icon: '📐', category: 'resource' },
  { name: 'Item Model', extension: '.json', template: 'itemModel', icon: '🎯', category: 'resource' },
  { name: 'Blockstate', extension: '.json', template: 'blockstate', icon: '🎛️', category: 'resource' },
  { name: 'Language File', extension: '.json', template: 'lang', icon: '🌐', category: 'resource' },
  
  // Data files
  { name: 'Recipe', extension: '.json', template: 'recipe', icon: '🔧', category: 'data' },
  { name: 'Loot Table', extension: '.json', template: 'lootTable', icon: '💎', category: 'data' },
  { name: 'Advancement', extension: '.json', template: 'advancement', icon: '🏆', category: 'data' },
  { name: 'Tag', extension: '.json', template: 'tag', icon: '🏷️', category: 'data' },
  
  // Config files
  { name: 'Gradle Build', extension: '.gradle', template: 'buildGradle', icon: '🏗️', category: 'config' },
  { name: 'Mod Metadata', extension: '.toml', template: 'modsToml', icon: '📄', category: 'config' },
  { name: 'Properties', extension: '.properties', template: 'properties', icon: '📋', category: 'config' }
];

export function useFileManager(projectId?: string) {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentFile, setCurrentFile] = useState<ProjectFile | null>(null);
  const { toast } = useToast();

  const fetchFiles = async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', projectId)
        .order('file_path');

      if (error) throw error;
      
      setFiles(data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast({
        title: "Failed to load files",
        description: "Please try refreshing the project",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createFile = async (
    fileName: string, 
    filePath: string, 
    content: string = '', 
    fileType: string = 'text',
    isDirectory: boolean = false,
    parentPath?: string
  ): Promise<ProjectFile | null> => {
    if (!projectId) return null;

    try {
      const { data, error } = await supabase
        .from('project_files')
        .insert([{
          project_id: projectId,
          file_name: fileName,
          file_path: filePath,
          file_content: content,
          file_type: fileType,
          is_directory: isDirectory,
          parent_path: parentPath
        }])
        .select()
        .single();

      if (error) throw error;

      const newFile = data as ProjectFile;
      setFiles(prev => [...prev, newFile]);
      
      toast({
        title: "File created",
        description: `${fileName} has been created`
      });

      return newFile;
    } catch (error) {
      console.error('Error creating file:', error);
      toast({
        title: "Failed to create file",
        description: "Please try again",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateFile = async (fileId: string, content: string, newPath?: string): Promise<boolean> => {
    try {
      const updateData: any = { file_content: content };
      if (newPath) {
        updateData.file_path = newPath;
      }

      const { error } = await supabase
        .from('project_files')
        .update(updateData)
        .eq('id', fileId);

      if (error) throw error;

      setFiles(prev => 
        prev.map(file => 
          file.id === fileId 
            ? { ...file, file_content: content, file_path: newPath || file.file_path, updated_at: new Date().toISOString() }
            : file
        )
      );

      if (currentFile?.id === fileId) {
        setCurrentFile(prev => prev ? { ...prev, file_content: content, file_path: newPath || prev.file_path } : null);
      }

      return true;
    } catch (error) {
      console.error('Error updating file:', error);
      toast({
        title: "Failed to save file",
        description: "Please try again",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteFile = async (fileId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('project_files')
        .delete()
        .eq('id', fileId);

      if (error) throw error;

      setFiles(prev => prev.filter(file => file.id !== fileId));
      
      if (currentFile?.id === fileId) {
        setCurrentFile(null);
      }

      toast({
        title: "File deleted",
        description: "The file has been removed"
      });

      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Failed to delete file",
        description: "Please try again",
        variant: "destructive"
      });
      return false;
    }
  };

  const createFolder = async (folderName: string, parentPath?: string): Promise<boolean> => {
    const folderPath = parentPath ? `${parentPath}/${folderName}` : folderName;
    const result = await createFile(folderName, folderPath, '', 'folder', true, parentPath);
    return result !== null;
  };

  const getFileTemplate = (templateType: string, fileName: string, modId: string): string => {
    const templates: Record<string, string> = {
      mainMod: `@Mod("${modId}")
public class ${fileName.replace('.java', '')} {
    public static final String MODID = "${modId}";
    
    public ${fileName.replace('.java', '')}() {
        // Register the setup method for modloading
        FMLJavaModLoadingContext.get().getModEventBus()
            .addListener(this::setup);
    }
    
    private void setup(final FMLCommonSetupEvent event) {
        // Pre-init code here
        LOGGER.info("Hello from ${fileName.replace('.java', '')}!");
    }
}`,
      block: `public class ${fileName.replace('.java', '')} extends Block {
    public ${fileName.replace('.java', '')}(Properties properties) {
        super(properties);
    }
    
    // Add custom block behavior here
}`,
      item: `public class ${fileName.replace('.java', '')} extends Item {
    public ${fileName.replace('.java', '')}(Properties properties) {
        super(properties);
    }
    
    // Add custom item behavior here
}`,
      blockModel: `{
  "parent": "block/cube_all",
  "textures": {
    "all": "${modId}:block/${fileName.replace('.json', '')}"
  }
}`,
      itemModel: `{
  "parent": "item/generated",
  "textures": {
    "layer0": "${modId}:item/${fileName.replace('.json', '')}"
  }
}`,
      recipe: `{
  "type": "minecraft:crafting_shaped",
  "pattern": [
    "###",
    "###",
    "###"
  ],
  "key": {
    "#": {
      "item": "minecraft:iron_ingot"
    }
  },
  "result": {
    "item": "${modId}:${fileName.replace('.json', '')}",
    "count": 1
  }
}`
    };

    return templates[templateType] || '';
  };

  const createFileFromTemplate = async (
    fileType: ForgeFileType, 
    fileName: string, 
    parentPath?: string,
    modId: string = 'mymod'
  ): Promise<ProjectFile | null> => {
    const fullFileName = fileName.endsWith(fileType.extension) ? fileName : fileName + fileType.extension;
    const filePath = parentPath ? `${parentPath}/${fullFileName}` : fullFileName;
    const content = getFileTemplate(fileType.template, fullFileName, modId);
    
    return await createFile(fullFileName, filePath, content, fileType.category, false, parentPath);
  };

  useEffect(() => {
    if (projectId) {
      fetchFiles();
    }
  }, [projectId]);

  return {
    files,
    loading,
    currentFile,
    setCurrentFile,
    fetchFiles,
    createFile,
    updateFile,
    deleteFile,
    createFolder,
    createFileFromTemplate,
    forgeFileTypes
  };
}