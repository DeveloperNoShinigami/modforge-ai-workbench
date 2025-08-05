import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileCode, Zap, BookOpen, Rocket, Github } from "lucide-react";
import { ProjectCreationDialog } from "@/components/ProjectCreationDialog";
import { useProjects } from "@/hooks/useProjects";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface QuickActionsProps {
  onProjectCreated?: () => void;
}

export function QuickActions({ onProjectCreated }: QuickActionsProps) {
  const { projects } = useProjects();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleQuickAction = (actionType: string) => {
    switch (actionType) {
      case 'recent':
        if (projects.length > 0) {
          navigate(`/project/${projects[0].id}`);
        } else {
          toast({
            title: "No recent projects",
            description: "Create a new project to get started",
            variant: "destructive"
          });
        }
        break;
      case 'ai':
        toast({
          title: "AI Generate",
          description: "Create a project first, then use AI in the editor"
        });
        break;
      case 'templates':
        toast({
          title: "Templates",
          description: "Coming soon! Browse example mod templates"
        });
        break;
      case 'import':
        toast({
          title: "GitHub Import",
          description: "Coming soon! Import mods from GitHub repositories"
        });
        break;
      case 'deploy':
        toast({
          title: "Deploy",
          description: "Coming soon! Publish your mods to CurseForge and Modrinth"
        });
        break;
    }
  };

  const actions = [
    {
      icon: Plus,
      title: "New Project",
      description: "Create a new mod project",
      variant: "hero" as const,
      color: "bg-primary/10 text-primary",
      action: () => {}
    },
    {
      icon: FileCode,
      title: "Open Recent",
      description: "Continue working",
      variant: "outline" as const,
      color: "bg-accent/10 text-accent",
      action: () => handleQuickAction('recent')
    },
    {
      icon: Zap,
      title: "AI Generate",
      description: "Create with AI",
      variant: "tier" as const,
      color: "bg-tier-junior/10 text-tier-junior",
      action: () => handleQuickAction('ai')
    },
    {
      icon: BookOpen,
      title: "Templates",
      description: "Browse examples",
      variant: "outline" as const,
      color: "bg-blue-500/10 text-blue-400",
      action: () => handleQuickAction('templates')
    },
    {
      icon: Github,
      title: "Import",
      description: "From GitHub",
      variant: "outline" as const,
      color: "bg-muted/50 text-foreground",
      action: () => handleQuickAction('import')
    },
    {
      icon: Rocket,
      title: "Deploy",
      description: "Publish mod",
      variant: "outline" as const,
      color: "bg-tier-senior/10 text-tier-senior",
      action: () => handleQuickAction('deploy')
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <ProjectCreationDialog onProjectCreated={onProjectCreated} />
          {actions.slice(1).map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.title}
                variant={action.variant}
                className="h-auto p-4 flex-col gap-2 group hover:scale-105 transition-all duration-300"
                onClick={action.action}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-center">
                  <div className="font-medium text-sm">{action.title}</div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}