import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Project } from '@/hooks/useProjects';

export interface ProjectFile {
  id: string;
  name: string;
  path: string;
  content: string;
  type: 'java' | 'json' | 'mcmeta' | 'properties';
  modified: boolean;
}

export function useProjectEditor(project?: Project) {
  const [currentFile, setCurrentFile] = useState<ProjectFile | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log("useProjectEditor: Project changed:", project?.name || 'No project');
    if (project) {
      loadProjectFiles(project);
    }
  }, [project]);

  const loadProjectFiles = async (project: Project) => {
    console.log("useProjectEditor: Loading files for project:", project.name);
    setLoading(true);
    try {
      // Simulate loading project files
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockFiles: ProjectFile[] = [
        {
          id: '1',
          name: `${project.name.replace(/[^a-zA-Z0-9]/g, '')}Mod.java`,
          path: `src/main/java/com/example/${project.mod_id}`,
          content: `@Mod("${project.mod_id}")
public class ${project.name.replace(/[^a-zA-Z0-9]/g, '')}Mod {
    public static final String MODID = "${project.mod_id}";
    private static final Logger LOGGER = LogUtils.getLogger();

    public ${project.name.replace(/[^a-zA-Z0-9]/g, '')}Mod() {
        IEventBus modEventBus = FMLJavaModLoadingContext.get().getModEventBus();
        modEventBus.addListener(this::commonSetup);
        
        MinecraftForge.EVENT_BUS.register(this);
    }

    private void commonSetup(final FMLCommonSetupEvent event) {
        LOGGER.info("Hello from ${project.name}!");
    }
}`,
          type: 'java',
          modified: false
        },
        {
          id: '2',
          name: 'mods.toml',
          path: 'src/main/resources/META-INF',
          content: `modLoader="javafml"
loaderVersion="[47,)"
license="MIT"

[[mods]]
modId="${project.mod_id}"
version="1.0.0"
displayName="${project.name}"
description="${project.description || 'An awesome Minecraft mod'}"

[[dependencies.${project.mod_id}]]
modId="forge"
mandatory=true
versionRange="[${project.platform === 'forge' ? '47.2.0' : '0.14.0'},)"
ordering="NONE"
side="BOTH"

[[dependencies.${project.mod_id}]]
modId="minecraft"
mandatory=true
versionRange="[${project.minecraft_version}]"
ordering="NONE"
side="BOTH"`,
          type: 'properties',
          modified: false
        },
        {
          id: '3',
          name: 'pack.mcmeta',
          path: 'src/main/resources',
          content: `{
  "pack": {
    "description": "${project.name} resources",
    "pack_format": 15,
    "forge:resource_pack_format": 15,
    "forge:data_pack_format": 12
  }
}`,
          type: 'mcmeta',
          modified: false
        }
      ];
      
      setFiles(mockFiles);
      setCurrentFile(mockFiles[0]);
      console.log("useProjectEditor: Loaded", mockFiles.length, "files");
      
    } catch (error) {
      console.error('Error loading project files:', error);
      toast({
        title: "Failed to load project files",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveFile = async (file: ProjectFile) => {
    try {
      setLoading(true);
      // Simulate saving file
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setFiles(prev => prev.map(f => 
        f.id === file.id 
          ? { ...file, modified: false }
          : f
      ));
      
      if (currentFile?.id === file.id) {
        setCurrentFile({ ...file, modified: false });
      }
      
      toast({
        title: "File saved",
        description: `${file.name} has been saved successfully`
      });
      
    } catch (error) {
      console.error('Error saving file:', error);
      toast({
        title: "Failed to save file",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFileContent = (fileId: string, content: string) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, content, modified: true }
        : f
    ));
    
    if (currentFile?.id === fileId) {
      setCurrentFile(prev => prev ? { ...prev, content, modified: true } : null);
    }
  };

  const createNewFile = (name: string, type: ProjectFile['type'], content: string = '') => {
    const newFile: ProjectFile = {
      id: Date.now().toString(),
      name,
      path: type === 'java' ? `src/main/java/com/example/${project?.mod_id}` : 'src/main/resources',
      content,
      type,
      modified: true
    };
    
    setFiles(prev => [...prev, newFile]);
    setCurrentFile(newFile);
    
    toast({
      title: "New file created",
      description: `${name} is ready for editing`
    });
  };

  const uploadFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const fileType = getFileType(file.name);
      
      if (fileType) {
        createNewFile(file.name, fileType, content);
        toast({
          title: "File uploaded",
          description: `${file.name} has been uploaded successfully`
        });
      } else {
        toast({
          title: "Unsupported file type",
          description: "Only .java, .json, .mcmeta, and .properties files are supported",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  const getFileType = (filename: string): ProjectFile['type'] | null => {
    const ext = filename.toLowerCase().split('.').pop();
    switch (ext) {
      case 'java': return 'java';
      case 'json': return 'json';
      case 'mcmeta': return 'mcmeta';
      case 'properties': return 'properties';
      default: return null;
    }
  };

  const buildProject = async () => {
    if (!project) return false;
    
    setLoading(true);
    try {
      // Simulate build process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast({
        title: "Build completed successfully!",
        description: `${project.name} compiled without errors`
      });
      
      return true;
      
    } catch (error) {
      toast({
        title: "Build failed",
        description: "Check console for errors",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const exportProject = async () => {
    if (!project) return;
    
    try {
      setLoading(true);
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create a mock download
      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent('Mock mod file'));
      element.setAttribute('download', `${project.name}-1.0.0.jar`);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      toast({
        title: "Export completed!",
        description: `${project.name} mod has been downloaded`
      });
      
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    currentFile,
    files,
    loading,
    setCurrentFile,
    saveFile,
    updateFileContent,
    createNewFile,
    uploadFile,
    buildProject,
    exportProject
  };
}