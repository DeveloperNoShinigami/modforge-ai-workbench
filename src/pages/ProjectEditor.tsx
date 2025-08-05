import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Play, Save, Zap, Download, Loader2, FileCode, Folder, FolderOpen, Plus, Upload, GitBranch, Package, BarChart3, Settings, ChevronRight, ChevronDown } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useProjectEditor } from "@/hooks/useProjectEditor";
import { useAIChat } from "@/hooks/useAIChat";
import { useBuildTest } from "@/hooks/useBuildTest";
import { usePerformanceAnalysis } from "@/hooks/usePerformanceAnalysis";
import { useDependencyManager } from "@/hooks/useDependencyManager";
import { useGitHubIntegration } from "@/hooks/useGitHubIntegration";
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
  
  // AI and Build Hooks (now using unified useAIChat)
  const { messages, loading: aiLoading, generateCodeWithAI, reviewCodeWithAI, clearChat, generateCode, reviewCode } = useAIChat();
  const { buildProject: buildProjectAPI, buildResult, loading: buildLoading } = useBuildTest();
  const { analyzeProject, analysis, loading: analysisLoading } = usePerformanceAnalysis();
  const { searchDependencies, addDependency, listDependencies, searchResults, loading: depLoading } = useDependencyManager();
  const { cloneRepository, pushToRepository, listRepositories, loading: gitLoading } = useGitHubIntegration();
  
  const project = projects.find(p => p.id === projectId);
  
  // Debug logging
  console.log("ProjectEditor Debug:", {
    projectId,
    projectsCount: projects.length,
    project: project ? `Found: ${project.name}` : "Not found",
    userExists: !!user
  });
  
  const {
    currentFile,
    files,
    folders,
    expandedFolders,
    loading,
    setCurrentFile,
    saveFile,
    updateFileContent,
    createNewFile,
    createNewFolder,
    uploadFile,
    buildProject,
    exportProject,
    toggleFolder,
    getFilesByFolder,
    getAllFolders
  } = useProjectEditor(project);

  const [currentTier] = useState<'free' | 'junior' | 'senior'>('free');

  useEffect(() => {
    console.log("ProjectEditor useEffect:", { user: !!user, project: !!project, loading });
    
    if (!user) {
      console.log("No user, redirecting to auth");
      navigate('/auth');
      return;
    }
    
    if (!project && !loading && projects.length > 0) {
      console.log("Project not found and projects loaded:", projects.length);
      toast({
        title: "Project not found",
        description: "The project you're looking for doesn't exist",
        variant: "destructive"
      });
      navigate('/');
    }
  }, [project, user, loading, navigate, toast, projects]);

  const handleSave = () => {
    if (currentFile) {
      saveFile(currentFile);
    }
  };

  const handleBuild = async () => {
    if (!project) return;
    
    const result = await buildProjectAPI(project.id, project.platform, 'compile');
    if (result?.success) {
      toast({
        title: "Build completed successfully!",
        description: `Build finished in ${(result.buildTime / 1000).toFixed(1)}s`
      });
    }
  };

  const handleTest = async () => {
    if (!project) return;
    
    const result = await buildProjectAPI(project.id, project.platform, 'test');
    if (result?.success) {
      toast({
        title: "Tests completed successfully!",
        description: "All tests passed"
      });
    }
  };

  const handlePerformanceAnalysis = async () => {
    const projectFiles = files.reduce((acc, file) => {
      acc[file.name] = file.content;
      return acc;
    }, {} as Record<string, string>);
    
    await analyzeProject(projectFiles);
  };

  const handleCodeReview = async () => {
    if (!currentFile) return;
    
    console.log("🔍 ProjectEditor: Starting code review for", currentFile.name);
    const review = await reviewCodeWithAI(currentFile);
    if (review) {
      toast({
        title: "Code Review Complete",
        description: "Check the AI chat for detailed feedback"
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

  const renderFileTree = () => {
    const allFolders = getAllFolders();
    const filesByFolder = getFilesByFolder();
    
    const renderFolder = (folderPath: string, depth: number = 0) => {
      const isExpanded = expandedFolders.has(folderPath);
      const folderName = folderPath.split('/').pop() || folderPath;
      const folderFiles = filesByFolder[folderPath] || [];
      
      // Get subfolders
      const subfolders = allFolders.filter(f => 
        f.startsWith(folderPath + '/') && 
        f.split('/').length === folderPath.split('/').length + 1
      );
      
      return (
        <div key={folderPath}>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-1 h-6 p-1"
            style={{ paddingLeft: `${8 + depth * 12}px` }}
            onClick={() => toggleFolder(folderPath)}
          >
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            {isExpanded ? <FolderOpen className="w-3 h-3" /> : <Folder className="w-3 h-3" />}
            <span className="text-xs truncate">{folderName}</span>
          </Button>
          
          {isExpanded && (
            <div>
              {/* Render subfolders first */}
              {subfolders.map(subfolder => renderFolder(subfolder, depth + 1))}
              
              {/* Render files in this folder */}
              {folderFiles.map((file) => (
                <Button
                  key={file.id}
                  variant={currentFile?.id === file.id ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-start gap-1 h-6 p-1"
                  style={{ paddingLeft: `${20 + depth * 12}px` }}
                  onClick={() => setCurrentFile(file)}
                >
                  <FileCode className="w-3 h-3" />
                  <span className="text-xs truncate">{file.name}</span>
                  {file.modified && (
                    <div className="w-2 h-2 bg-primary rounded-full ml-auto" />
                  )}
                </Button>
              ))}
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="space-y-0">
        {/* Root files */}
        {(filesByFolder[''] || []).map((file) => (
          <Button
            key={file.id}
            variant={currentFile?.id === file.id ? "secondary" : "ghost"}
            size="sm"
            className="w-full justify-start gap-1 h-6 p-1"
            onClick={() => setCurrentFile(file)}
          >
            <FileCode className="w-3 h-3" />
            <span className="text-xs truncate">{file.name}</span>
            {file.modified && (
              <div className="w-2 h-2 bg-primary rounded-full ml-auto" />
            )}
          </Button>
        ))}
        
        {/* Render folder tree starting with root folders */}
        {allFolders
          .filter(folder => !folder.includes('/')) // Only root folders
          .map(folder => renderFolder(folder, 0))}
      </div>
    );
  };

  if (loading || !project || !currentFile) {
    console.log("ProjectEditor loading state:", { loading, hasProject: !!project, hasCurrentFile: !!currentFile });
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">
            {!project ? "Loading project..." : "Setting up IDE..."}
          </p>
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
                onClick={handleBuild}
                disabled={buildLoading}
              >
                {buildLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
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
              <ScrollArea className="h-[500px]">
                <div className="p-2 space-y-1">
                  {renderFileTree()}
                  
                  <div className="pt-2 border-t border-border mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2 h-auto p-2"
                      onClick={() => createNewFile('NewClass.java', 'java')}
                    >
                      <Plus className="w-3 h-3" />
                      <span className="text-xs">New File</span>
                    </Button>
                    
                    <label className="w-full">
                      <input
                        type="file"
                        multiple
                        accept=".java,.json,.mcmeta,.properties,.toml,.gradle,.md,.sh,.bat"
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

          {/* Right Panel: AI Assistant & Tools */}
          <Card className="lg:col-span-2 overflow-hidden">
            <div className="h-full">
              <Tabs defaultValue="ai" className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="ai" className="text-xs">AI Chat</TabsTrigger>
                  <TabsTrigger value="build" className="text-xs">Build</TabsTrigger>
                  <TabsTrigger value="deps" className="text-xs">Deps</TabsTrigger>
                  <TabsTrigger value="analysis" className="text-xs">Analysis</TabsTrigger>
                  <TabsTrigger value="git" className="text-xs">Git</TabsTrigger>
                </TabsList>
                
                <TabsContent value="ai" className="flex-1 mt-0 p-0">
                  <AIAssistant 
                    currentTier={currentTier}
                    projectId={projectId}
                    currentFile={currentFile}
                    projectContext={`Project: ${project?.name}, Platform: ${project?.platform}, Minecraft: ${project?.minecraft_version}`}
                    onCodeGenerated={(code, filename, fileType) => {
                      if (currentFile && currentFile.name === filename) {
                        updateFileContent(currentFile.id, code);
                        toast({
                          title: "Code updated!",
                          description: `${filename} has been updated with AI-generated code`
                        });
                      } else {
                        const type = fileType as 'java' | 'json' | 'mcmeta' | 'properties' | 'toml' | 'bat' | 'sh' | 'md' | 'gitignore' | 'gradle';
                        createNewFile(filename, type, code);
                        toast({
                          title: "File created!",
                          description: `${filename} has been created with AI-generated code`
                        });
                      }
                    }}
                    onCodeReview={(review) => {
                      toast({
                        title: "Code Review Complete",
                        description: "Check the AI chat history for detailed feedback",
                        duration: 3000
                      });
                    }}
                  />
                </TabsContent>

                <TabsContent value="build" className="flex-1 mt-0 p-4">
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Button
                        onClick={handleBuild}
                        disabled={buildLoading}
                        className="flex-1"
                      >
                        {buildLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        Build
                      </Button>
                      <Button
                        onClick={handleTest}
                        disabled={buildLoading}
                        variant="outline"
                        className="flex-1"
                      >
                        Test
                      </Button>
                    </div>
                    
                    {buildResult && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Build Result</h4>
                        <div className="text-xs space-y-1">
                          <div className="flex justify-between">
                            <span>Status:</span>
                            <Badge variant={buildResult.success ? "default" : "destructive"}>
                              {buildResult.success ? "Success" : "Failed"}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Time:</span>
                            <span>{(buildResult.buildTime / 1000).toFixed(1)}s</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Warnings:</span>
                            <span>{buildResult.warnings.length}</span>
                          </div>
                        </div>
                        
                        {buildResult.warnings.length > 0 && (
                          <div>
                            <h5 className="font-medium text-xs mb-1">Warnings:</h5>
                            <ScrollArea className="h-20">
                              {buildResult.warnings.map((warning, i) => (
                                <div key={i} className="text-xs text-muted-foreground p-1">
                                  {warning}
                                </div>
                              ))}
                            </ScrollArea>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="deps" className="flex-1 mt-0 p-4">
                  <div className="space-y-4">
                    <Button
                      onClick={() => searchDependencies("jei", project?.platform || "forge", project?.minecraft_version || "1.20.1")}
                      disabled={depLoading}
                      className="w-full"
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Search Dependencies
                    </Button>
                    
                    {searchResults.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Search Results</h4>
                        <ScrollArea className="h-32">
                          {searchResults.map((dep, i) => (
                            <div key={i} className="border rounded p-2 mb-2">
                              <div className="font-medium text-xs">{dep.name}</div>
                              <div className="text-xs text-muted-foreground">{dep.description}</div>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-xs">v{dep.versions[0]}</span>
                                <Button
                                  size="sm"
                                  onClick={() => addDependency(dep, project?.platform || "forge", "build.gradle")}
                                  disabled={depLoading}
                                >
                                  Add
                                </Button>
                              </div>
                            </div>
                          ))}
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="analysis" className="flex-1 mt-0 p-4">
                  <div className="space-y-4">
                    <Button
                      onClick={handlePerformanceAnalysis}
                      disabled={analysisLoading}
                      className="w-full"
                    >
                      {analysisLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <BarChart3 className="w-4 h-4 mr-2" />}
                      Analyze Performance
                    </Button>
                    
                    {analysis && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Overall Score</span>
                          <Badge variant={analysis.summary.score >= 85 ? "default" : "destructive"}>
                            {analysis.summary.score}/100
                          </Badge>
                        </div>
                        
                        <div className="text-xs space-y-1">
                          <div className="flex justify-between">
                            <span>Issues:</span>
                            <span className="text-destructive">{analysis.summary.issues}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Warnings:</span>
                            <span className="text-warning">{analysis.summary.warnings}</span>
                          </div>
                        </div>
                        
                        {analysis.recommendations.length > 0 && (
                          <div>
                            <h5 className="font-medium text-xs mb-1">Recommendations:</h5>
                            <ScrollArea className="h-20">
                              {analysis.recommendations.map((rec, i) => (
                                <div key={i} className="text-xs p-1 border-l-2 border-primary/20 pl-2 mb-1">
                                  <div className="font-medium">{rec.category}</div>
                                  <div className="text-muted-foreground">{rec.message}</div>
                                </div>
                              ))}
                            </ScrollArea>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="git" className="flex-1 mt-0 p-4">
                  <div className="space-y-4">
                    <Button
                      onClick={() => listRepositories()}
                      disabled={gitLoading}
                      className="w-full"
                    >
                      <GitBranch className="w-4 h-4 mr-2" />
                      List Repositories
                    </Button>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        onClick={() => pushToRepository("example/repo", files, "Update from ModForge")}
                        disabled={gitLoading}
                        size="sm"
                      >
                        Push
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => cloneRepository("example/repo")}
                        disabled={gitLoading}
                        size="sm"
                      >
                        Clone
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}