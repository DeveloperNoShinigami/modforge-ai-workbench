import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, GitBranch, Play, Settings } from "lucide-react";

interface ProjectCardProps {
  name: string;
  platform: 'forge' | 'fabric' | 'quilt' | 'neoforge';
  minecraftVersion: string;
  lastModified: string;
  status: 'active' | 'building' | 'error';
}

export function ProjectCard({ name, platform, minecraftVersion, lastModified, status }: ProjectCardProps) {
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
      default: return 'bg-muted text-muted-foreground';
    }
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
          <span className="text-sm text-muted-foreground">MC {minecraftVersion}</span>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <Calendar className="w-3 h-3" />
          Modified {lastModified}
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="hero" size="sm" className="flex-1">
            <Play className="w-3 h-3" />
            Open
          </Button>
          <Button variant="outline" size="sm">
            <GitBranch className="w-3 h-3" />
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}