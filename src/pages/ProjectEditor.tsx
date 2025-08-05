import { useParams } from "react-router-dom";
import { useState } from "react";
import { useProjects } from "@/hooks/useProjects";
import { useFileManager, ProjectFile as FileManagerFile } from "@/hooks/useFileManager";
import { ProjectFile, adaptFromFileManager, adaptToFileManager } from "@/hooks/useFileAdapter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { FileExplorer } from "@/components/FileExplorer";
import { 
  ArrowLeft, 
  Play, 
  Save, 
  Download, 
  Settings,
  FileCode,
  Zap,
  GitBranch
} from "lucide-react";
import { AIAssistant } from "@/components/AIAssistant";

export default function ProjectEditor() {
  console.log("🎮 ProjectEditor: Loading project editor...");
  
  const { projectId } = useParams();
  const { projects } = useProjects();
  const [selectedFile, setSelectedFile] = useState<FileManagerFile | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  
  const { updateFile } = useFileManager(projectId);
  
  const project = projects.find(p => p.id === projectId);

  const handleFileSelect = (file: FileManagerFile) => {
    if (file.is_directory) return;
    
    setSelectedFile(file);
    setFileContent(file.file_content);
    setUnsavedChanges(false);
  };

  const handleContentChange = (content: string) => {
    setFileContent(content);
    setUnsavedChanges(content !== selectedFile?.file_content);
  };

  const handleSave = async () => {
    if (!selectedFile || !unsavedChanges) return;
    
    const success = await updateFile(selectedFile.id, fileContent);
    if (success) {
      setUnsavedChanges(false);
      setSelectedFile(prev => prev ? { ...prev, file_content: fileContent } : null);
    }
  };

  const handleBuild = () => {
    // TODO: Implement build functionality
    console.log("Building project...");
  };

  const handleCodeGenerated = (code: string, filename: string, fileType: string) => {
    // TODO: Create new file or update existing file with generated code
    console.log("Code generated:", { code, filename, fileType });
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Project Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The project you're looking for doesn't exist or has been removed.
            </p>
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getPlatformColor = (platform: string) => {
    const colors = {
      forge: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      fabric: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      quilt: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      neoforge: 'bg-green-500/10 text-green-400 border-green-500/20'
    };
    return colors[platform as keyof typeof colors] || 'bg-gray-500/10 text-gray-400';
  };

  console.log("🎮 ProjectEditor: Rendering project", project.name);

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              
              <div>
                <h1 className="text-xl font-bold">{project.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getPlatformColor(project.platform)}>
                    {project.platform}
                  </Badge>
                  <Badge variant="outline">
                    {project.minecraft_version}
                  </Badge>
                  <Badge variant="outline">
                    {project.status}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm">
                <GitBranch className="w-4 h-4" />
              </Button>
              <Button 
                variant="code" 
                size="sm" 
                onClick={handleSave}
                disabled={!unsavedChanges}
              >
                <Save className="w-4 h-4 mr-2" />
                Save {unsavedChanges && '*'}
              </Button>
              <Button variant="hero" size="sm" onClick={handleBuild}>
                <Play className="w-4 h-4 mr-2" />
                Build & Test
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          {/* File Explorer Sidebar */}
          <div className="col-span-3">
            <FileExplorer
              projectId={projectId!}
              modId={project.mod_id}
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
            />
          </div>
          
          {/* Code Editor */}
          <div className="col-span-6">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileCode className="w-5 h-5 text-primary" />
                    {selectedFile ? selectedFile.file_name : 'No file selected'}
                    {unsavedChanges && <span className="text-accent">*</span>}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="code" size="sm" disabled>
                      <Zap className="w-3 h-3 mr-1" />
                      AI Assist (See Sidebar)
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 h-[calc(100%-80px)]">
                {selectedFile ? (
                  <Textarea
                    value={fileContent}
                    onChange={(e) => handleContentChange(e.target.value)}
                    className="w-full h-full font-mono text-sm bg-code-bg border-0 rounded-none resize-none focus:ring-0"
                    placeholder="Edit your code here..."
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <FileCode className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Select a file from the sidebar to start editing</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Right Sidebar - Tools & AI */}
          <div className="col-span-3">
            <div className="space-y-6">
              {/* AI Assistant */}
              <AIAssistant
                currentTier="junior"
                projectId={projectId}
                currentFile={selectedFile ? adaptFromFileManager(selectedFile) : undefined}
                onCodeGenerated={handleCodeGenerated}
              />
              
              {/* Build Console */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Build Console</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-code-bg rounded-lg p-3 text-xs font-mono text-foreground max-h-40 overflow-y-auto">
                    <div className="text-accent">$ Ready to build...</div>
                    <div className="text-muted-foreground">
                      Build output will appear here when you run the project.
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* File Info */}
              {selectedFile && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">File Info</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Type:</span>{' '}
                        <Badge variant="outline">{selectedFile.file_type}</Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Path:</span>{' '}
                        <code className="text-xs">{selectedFile.file_path}</code>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Size:</span>{' '}
                        {selectedFile.file_content.length} chars
                      </div>
                      <div>
                        <span className="text-muted-foreground">Modified:</span>{' '}
                        {new Date(selectedFile.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}