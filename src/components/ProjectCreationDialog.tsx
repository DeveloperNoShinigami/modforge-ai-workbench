import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2 } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useToast } from "@/hooks/use-toast";

interface ProjectCreationDialogProps {
  onProjectCreated?: () => void;
}

export function ProjectCreationDialog({ onProjectCreated }: ProjectCreationDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    platform: "",
    minecraft_version: "",
    mod_id: ""
  });
  
  const { createProject } = useProjects();
  const { toast } = useToast();

  const platforms = [
    { id: 'forge', name: 'Forge', color: 'bg-orange-500/10 text-orange-400' },
    { id: 'fabric', name: 'Fabric', color: 'bg-blue-500/10 text-blue-400' },
    { id: 'quilt', name: 'Quilt', color: 'bg-purple-500/10 text-purple-400' },
    { id: 'neoforge', name: 'NeoForge', color: 'bg-green-500/10 text-green-400' }
  ];

  const minecraftVersions = [
    "1.20.4", "1.20.1", "1.19.4", "1.19.2", "1.18.2", "1.17.1", "1.16.5"
  ];

  const generateModId = (name: string) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      mod_id: generateModId(name)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.platform || !formData.minecraft_version) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const project = await createProject({
        name: formData.name,
        description: formData.description || undefined,
        platform: formData.platform as 'forge' | 'fabric' | 'quilt' | 'neoforge',
        minecraft_version: formData.minecraft_version
      });
      
      if (project) {
        setFormData({
          name: "",
          description: "",
          platform: "",
          minecraft_version: "",
          mod_id: ""
        });
        setOpen(false);
        onProjectCreated?.();
      }
      
    } catch (error) {
      // Error already handled in createProject
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="hero" className="flex-col gap-2 h-auto p-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
            <Plus className="w-4 h-4" />
          </div>
          <div className="text-center">
            <div className="font-medium text-sm">New Project</div>
            <div className="text-xs text-muted-foreground">Create a new mod project</div>
          </div>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Plus className="w-4 h-4 text-primary-foreground" />
            </div>
            Create New Mod Project
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Epic Weapons Mod"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mod_id">Mod ID</Label>
              <div className="relative">
                <Input
                  id="mod_id"
                  value={formData.mod_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, mod_id: e.target.value }))}
                  placeholder="epicweaponsmod"
                  className="font-mono text-xs"
                  required
                />
                <Badge variant="outline" className="absolute -top-2 -right-2 text-xs bg-background">
                  Auto-generated
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="A mod that adds epic weapons and armor to Minecraft"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="platform">Platform</Label>
              <Select value={formData.platform} onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map(platform => (
                    <SelectItem key={platform.id} value={platform.id}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded ${platform.color.split(' ')[0]}`} />
                        {platform.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="minecraft_version">Minecraft Version</Label>
              <Select value={formData.minecraft_version} onValueChange={(value) => setFormData(prev => ({ ...prev, minecraft_version: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select version" />
                </SelectTrigger>
                <SelectContent>
                  {minecraftVersions.map(version => (
                    <SelectItem key={version} value={version}>
                      {version}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="hero" disabled={loading || !formData.name || !formData.platform || !formData.minecraft_version}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Project
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}