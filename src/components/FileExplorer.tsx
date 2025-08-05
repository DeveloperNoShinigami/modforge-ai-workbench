import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Folder, 
  File, 
  Plus, 
  FolderPlus, 
  Trash2, 
  FileCode,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { useFileManager, ProjectFile, ForgeFileType } from '@/hooks/useFileManager';

interface FileExplorerProps {
  projectId: string;
  modId: string;
  onFileSelect: (file: ProjectFile) => void;
  selectedFile?: ProjectFile;
}

export function FileExplorer({ projectId, modId, onFileSelect, selectedFile }: FileExplorerProps) {
  const { 
    files, 
    loading, 
    createFile, 
    createFolder, 
    deleteFile, 
    createFileFromTemplate, 
    forgeFileTypes 
  } = useFileManager(projectId);
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createType, setCreateType] = useState<'file' | 'folder' | 'template'>('file');
  const [newFileName, setNewFileName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ForgeFileType | null>(null);
  const [selectedParent, setSelectedParent] = useState<string>('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src']));

  const buildFileTree = (files: ProjectFile[]) => {
    const tree: Record<string, any> = {};
    
    files.forEach(file => {
      const parts = file.file_path.split('/');
      let current = tree;
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!current[part]) {
          current[part] = {
            type: i === parts.length - 1 ? (file.is_directory ? 'folder' : 'file') : 'folder',
            file: i === parts.length - 1 ? file : null,
            children: {}
          };
        }
        current = current[part].children;
      }
    });
    
    return tree;
  };

  const renderTreeNode = (name: string, node: any, path: string = '', level: number = 0) => {
    const fullPath = path ? `${path}/${name}` : name;
    const isExpanded = expandedFolders.has(fullPath);
    const isSelected = selectedFile?.id === node.file?.id;

    const toggleExpanded = () => {
      const newExpanded = new Set(expandedFolders);
      if (isExpanded) {
        newExpanded.delete(fullPath);
      } else {
        newExpanded.add(fullPath);
      }
      setExpandedFolders(newExpanded);
    };

    return (
      <div key={fullPath} className="space-y-1">
        <div 
          className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted transition-colors ${
            isSelected ? 'bg-primary/10 text-primary' : ''
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => {
            if (node.type === 'folder') {
              toggleExpanded();
            } else if (node.file) {
              onFileSelect(node.file);
            }
          }}
        >
          {node.type === 'folder' && (
            <>
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <Folder className="w-4 h-4 text-blue-400" />
            </>
          )}
          {node.type === 'file' && (
            <>
              <div className="w-4"></div>
              <FileCode className="w-4 h-4 text-green-400" />
            </>
          )}
          <span className="text-sm font-mono">{name}</span>
          {node.file && !node.file.is_directory && (
            <Badge variant="outline" className="ml-auto text-xs">
              {node.file.file_type}
            </Badge>
          )}
        </div>
        
        {node.type === 'folder' && isExpanded && Object.keys(node.children).length > 0 && (
          <div>
            {Object.entries(node.children).map(([childName, childNode]) =>
              renderTreeNode(childName, childNode, fullPath, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  const handleCreate = async () => {
    if (!newFileName.trim()) return;

    try {
      const parentPath = selectedParent === 'root' ? undefined : selectedParent || undefined;
      
      if (createType === 'folder') {
        await createFolder(newFileName, parentPath);
      } else if (createType === 'template' && selectedTemplate) {
        await createFileFromTemplate(selectedTemplate, newFileName, parentPath, modId);
      } else {
        const filePath = parentPath ? `${parentPath}/${newFileName}` : newFileName;
        await createFile(newFileName, filePath);
      }
      
      setShowCreateDialog(false);
      setNewFileName('');
      setSelectedTemplate(null);
      setSelectedParent('');
    } catch (error) {
      console.error('Error creating file/folder:', error);
    }
  };

  const fileTree = buildFileTree(files);
  
  const getFolderOptions = (files: ProjectFile[]) => {
    return files
      .filter(f => f.is_directory)
      .map(f => ({ value: f.file_path, label: f.file_path }));
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Folder className="w-5 h-5 text-primary" />
            Project Files
          </CardTitle>
          <div className="flex gap-1">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setCreateType('template');
                setShowCreateDialog(true);
              }}
            >
              <Plus className="w-3 h-3" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setCreateType('folder');
                setShowCreateDialog(true);
              }}
            >
              <FolderPlus className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          <div className="p-4">
            {loading ? (
              <div className="text-center text-muted-foreground py-8">
                Loading files...
              </div>
            ) : Object.keys(fileTree).length > 0 ? (
              <div className="space-y-1">
                {Object.entries(fileTree).map(([name, node]) =>
                  renderTreeNode(name, node)
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <FileCode className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No files yet. Create your first file to get started!</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setCreateType('template');
                    setShowCreateDialog(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create File
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Create New {createType === 'folder' ? 'Folder' : 'File'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {createType === 'template' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">File Type</label>
                <Select 
                  value={selectedTemplate?.name || ''} 
                  onValueChange={(value) => {
                    const template = forgeFileTypes.find(t => t.name === value);
                    setSelectedTemplate(template || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select file type" />
                  </SelectTrigger>
                  <SelectContent>
                    {['java', 'resource', 'data', 'config'].map(category => (
                      <div key={category}>
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                          {category}
                        </div>
                        {forgeFileTypes
                          .filter(t => t.category === category)
                          .map(template => (
                            <SelectItem key={template.name} value={template.name}>
                              <div className="flex items-center gap-2">
                                <span>{template.icon}</span>
                                <span>{template.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {template.extension}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder={createType === 'folder' ? 'folder-name' : 'filename'}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Parent Folder (Optional)</label>
              <Select value={selectedParent} onValueChange={setSelectedParent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select parent folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">Root</SelectItem>
                  {getFolderOptions(files).map(folder => (
                    <SelectItem key={folder.value} value={folder.value}>
                      {folder.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreate}
                disabled={!newFileName.trim() || (createType === 'template' && !selectedTemplate)}
              >
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}