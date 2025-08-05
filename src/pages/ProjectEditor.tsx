import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Play, Save, Zap, Download, Loader2, FileCode, Folder, Plus, Upload } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useProjectEditor } from "@/hooks/useProjectEditor";
import { useAI } from "@/hooks/useAI";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { BuildConsole } from "@/components/BuildConsole";
import { AIAssistant } from "@/components/AIAssistant";

export default function ProjectEditor() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { projects } = useProjects();
  const { user } = useAuth();
  const { toast } = useToast();
  const { generateCode, reviewCode, loading: aiLoading } = useAI();
  
  const project = projects.find(p => p.id === projectId);
  const {
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
  } = useProjectEditor(project);

  const [currentTier] = useState<'free' | 'junior' | 'senior'>('free');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (!project && !loading) {
      toast({
        title: "Project not found",
        description: "The project you're looking for doesn't exist",
        variant: "destructive"
      });
      navigate('/');
    }
  }, [project, user, loading, navigate, toast]);

  const handleSave = () => {
    if (currentFile) {
      saveFile(currentFile);
    }
  };

  const handleCodeReview = async () => {
    if (!currentFile) return;
    
    const review = await reviewCode(currentFile.content);
    if (review) {
      toast({
        title: "Code Review",
        description: review
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        uploadFile(file);
      });
      // Reset the input
      event.target.value = '';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'forge': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'fabric': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'quilt': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'neoforge': return 'bg-green-500/10 text-green-400 border-green-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading || !project || !currentFile) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
              
              <Separator orientation="vertical" className="h-6" />
              
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{project.name}</h1>
                <Badge variant="outline" className={getPlatformColor(project.platform)}>
                  {project.platform.charAt(0).toUpperCase() + project.platform.slice(1)}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  MC {project.minecraft_version}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={!currentFile?.modified || loading}
              >
                <Save className="w-4 h-4" />
                Save
              </Button>
              <Button
                variant="tier"
                size="sm"
                onClick={buildProject}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Build & Test
              </Button>
              <Button
                variant="hero"
                size="sm"
                onClick={exportProject}
                disabled={loading}
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[calc(100vh-200px)]">
          {/* File Explorer */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Folder className="w-4 h-4" />
                Project Files
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <div className="p-3 space-y-1">
                  {files.map((file) => (
                    <Button
                      key={file.id}
                      variant={currentFile?.id === file.id ? "secondary" : "ghost"}
                      size="sm"
                      className="w-full justify-start gap-2 h-auto p-2"
                      onClick={() => setCurrentFile(file)}
                    >
                      <FileCode className="w-3 h-3" />
                      <span className="text-xs">{file.name}</span>
                      {file.modified && (
                        <div className="w-2 h-2 bg-primary rounded-full ml-auto" />
                      )}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2 h-auto p-2 mt-2"
                    onClick={() => createNewFile('NewClass.java', 'java')}
                  >
                    <Plus className="w-3 h-3" />
                    <span className="text-xs">New File</span>
                  </Button>
                  
                  <label className="w-full">
                    <input
                      type="file"
                      multiple
                      accept=".java,.json,.mcmeta,.properties"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2 h-auto p-2 mt-1"
                      type="button"
                    >
                      <Upload className="w-3 h-3" />
                      <span className="text-xs">Upload Files</span>
                    </Button>
                  </label>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Code Editor */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileCode className="w-4 h-4" />
                  {currentFile.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {currentFile.modified && (
                    <Badge variant="outline" className="text-xs bg-primary/10 text-primary">
                      Modified
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCodeReview}
                    disabled={aiLoading}
                  >
                    <Zap className="w-3 h-3" />
                    Review
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[500px] border-t border-border">
                <Textarea
                  value={currentFile.content}
                  onChange={(e) => updateFileContent(currentFile.id, e.target.value)}
                  className="h-full resize-none border-0 rounded-none font-mono text-sm"
                  placeholder="Start coding your mod..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Right Panel: AI Assistant & Build Console */}
          <Card className="lg:col-span-2 overflow-hidden">
            <div className="h-full flex flex-col">
              {/* AI Assistant Panel */}
              <div className="flex-1 border-b border-border p-0">
                <AIAssistant 
                  currentTier={currentTier}
                  projectId={projectId}
                  onCodeGenerated={(code, filename) => {
                    if (currentFile) {
                      updateFileContent(currentFile.id, code);
                      toast({
                        title: "Code generated!",
                        description: `Generated code has been added to ${currentFile.name}`
                      });
                    } else {
                      // Create a new file if no current file
                      const fileType = filename.endsWith('.java') ? 'java' : 
                                     filename.endsWith('.json') ? 'json' : 
                                     filename.endsWith('.mcmeta') ? 'mcmeta' : 'properties';
                      createNewFile(filename, fileType, code);
                    }
                  }}
                />
              </div>
              
              {/* Build Console */}
              <div className="flex-1">
                <BuildConsole 
                  isBuilding={loading}
                  onBuild={buildProject}
                  onTest={async () => {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    return true;
                  }}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}