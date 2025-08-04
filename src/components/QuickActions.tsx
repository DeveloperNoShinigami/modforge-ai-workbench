import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileCode, Zap, BookOpen, Rocket, Github } from "lucide-react";

export function QuickActions() {
  const actions = [
    {
      icon: Plus,
      title: "New Project",
      description: "Create a new mod project",
      variant: "hero" as const,
      color: "bg-primary/10 text-primary"
    },
    {
      icon: FileCode,
      title: "Open Recent",
      description: "Continue working",
      variant: "outline" as const,
      color: "bg-accent/10 text-accent"
    },
    {
      icon: Zap,
      title: "AI Generate",
      description: "Create with AI",
      variant: "tier" as const,
      color: "bg-tier-junior/10 text-tier-junior"
    },
    {
      icon: BookOpen,
      title: "Templates",
      description: "Browse examples",
      variant: "outline" as const,
      color: "bg-blue-500/10 text-blue-400"
    },
    {
      icon: Github,
      title: "Import",
      description: "From GitHub",
      variant: "outline" as const,
      color: "bg-muted/50 text-foreground"
    },
    {
      icon: Rocket,
      title: "Deploy",
      description: "Publish mod",
      variant: "outline" as const,
      color: "bg-tier-senior/10 text-tier-senior"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.title}
                variant={action.variant}
                className="h-auto p-4 flex-col gap-2 group hover:scale-105 transition-all duration-300"
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