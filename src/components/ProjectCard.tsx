import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, GitBranch, Play, Settings, Trash2 } from "lucide-react";
import { Project } from "@/hooks/useProjects";
import { useNavigate } from "react-router-dom";

interface ProjectCardProps extends Omit<Project, 'user_id' | 'mod_id' | 'description'> {
  onStatusUpdate?: (projectId: string, status: Project['status']) => void;
  onDelete?: (projectId: string) => void;
}

export function ProjectCard({ id, name, platform, minecraft_version, updated_at, status, onStatusUpdate, onDelete }: ProjectCardProps) {
  console.log("🃏 ProjectCard: Rendering project", { id, name, platform, status });
  
  const navigate = useNavigate();
  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'forge': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'fabric': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'quilt': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'neoforge': return 'bg-green-500/10 text-green-400 border-green-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-accent/10 text-accent border-accent/20';
      case 'building': return 'bg-tier-junior/10 text-tier-junior border-tier-junior/20';
      case 'error': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'completed': return 'bg-tier-senior/10 text-tier-senior border-tier-senior/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatLastModified = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return '1 day ago';
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  return (
    <Card className="hover:shadow-elegant transition-all duration-300 hover:scale-[1.02] bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold">{name}</CardTitle>
          <Badge variant="outline" className={getStatusColor(status)}>
            {status}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={getPlatformColor(platform)}>
            {platform.charAt(0).toUpperCase() + platform.slice(1)}
          </Badge>
          <span className="text-sm text-muted-foreground">MC {minecraft_version}</span>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <Calendar className="w-3 h-3" />
          Modified {formatLastModified(updated_at)}
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="hero" 
            size="sm" 
            className="flex-1"
            onClick={() => {
              console.log("🃏 ProjectCard: Opening project", { id, name });
              navigate(`/project/${id}`);
            }}
          >
            <Play className="w-3 h-3" />
            Open
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              console.log("🃏 ProjectCard: Git action requested", { id });
              // TODO: Implement git integration
            }}
          >
            <GitBranch className="w-3 h-3" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              console.log("🃏 ProjectCard: Settings requested", { id });
              // TODO: Implement project settings
            }}
          >
            <Settings className="w-3 h-3" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              console.log("🃏 ProjectCard: Delete requested", { id, name });
              onDelete?.(id);
            }}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}