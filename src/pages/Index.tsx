import { useState } from "react";
import { Header } from "@/components/Header";
import { ProjectCard } from "@/components/ProjectCard";
import { QuickActions } from "@/components/QuickActions";
import { AIAssistant } from "@/components/AIAssistant";
import { CodeEditor } from "@/components/CodeEditor";
import { SubscriptionPlans } from "@/components/SubscriptionPlans";
import { useProjects } from "@/hooks/useProjects";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import heroImage from "@/assets/hero-image.jpg";
import { 
  Rocket, 
  Zap, 
  Code, 
  Shield, 
  Users, 
  TrendingUp,
  FileCode,
  GitBranch,
  Bot
} from "lucide-react";

const Index = () => {
  const [currentTier, setCurrentTier] = useState<'free' | 'junior' | 'senior'>('free');
  const { projects, loading, fetchProjects, updateProjectStatus, deleteProject } = useProjects();
  const { user } = useAuth();

  const features = [
    {
      icon: Code,
      title: "AI-Powered Code Generation",
      description: "Generate mod code with natural language prompts"
    },
    {
      icon: Shield,
      title: "Multi-Stage Verification",
      description: "Automated testing and validation pipeline"
    },
    {
      icon: GitBranch,
      title: "GitHub Integration",
      description: "Seamless version control and collaboration"
    },
    {
      icon: Rocket,
      title: "Multi-Platform Support",
      description: "Forge, Fabric, Quilt, and NeoForge support"
    }
  ];

  const stats = [
    { label: "Projects Created", value: "15K+", icon: FileCode },
    { label: "Lines of Code Generated", value: "2.5M+", icon: Bot },
    { label: "Active Developers", value: "8.2K+", icon: Users },
    { label: "Success Rate", value: "94%", icon: TrendingUp }
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header currentTier={currentTier} />
      
      <main className="container mx-auto px-4 py-8 space-y-12">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-hero border border-border/50">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="relative z-10 p-12 md:p-16 text-center">
            <div className="max-w-4xl mx-auto space-y-6">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                <Zap className="w-3 h-3 mr-1" />
                AI-Powered Minecraft Mod Development
              </Badge>
              
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
                Build Epic Minecraft Mods
                <br />
                <span className="text-3xl md:text-5xl">With AI Assistance</span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                The ultimate IDE for Minecraft mod development. Generate code with AI, 
                test automatically, and deploy across all major platforms.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="hero" size="lg" className="text-lg px-8">
                  <Rocket className="w-5 h-5 mr-2" />
                  Start Building
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-8">
                  <FileCode className="w-5 h-5 mr-2" />
                  View Examples
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="text-center p-6 hover:shadow-elegant transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="text-2xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </Card>
            );
          })}
        </section>

        {/* Main Content Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-fit lg:grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="editor">Code Editor</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <QuickActions onProjectCreated={fetchProjects} />
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {user ? 'Your Projects' : 'Recent Projects'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center text-muted-foreground py-8">
                        Loading projects...
                      </div>
                    ) : projects.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {projects.map((project) => (
                          <ProjectCard 
                            key={project.id} 
                            {...project} 
                            onStatusUpdate={updateProjectStatus}
                            onDelete={deleteProject}
                          />
                        ))}
                      </div>
                    ) : user ? (
                      <div className="text-center text-muted-foreground py-8">
                        <p>No projects yet. Create your first mod project to get started!</p>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        <p>Sign in to create and manage your mod projects.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-6">
                <AIAssistant currentTier={currentTier} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="editor">
            <CodeEditor />
          </TabsContent>

          <TabsContent value="pricing">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
                <p className="text-xl text-muted-foreground">
                  Select the perfect tier for your mod development needs
                </p>
              </div>
              <SubscriptionPlans currentTier={currentTier} />
            </div>
          </TabsContent>

          <TabsContent value="features" className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
              <p className="text-xl text-muted-foreground">
                Everything you need to create amazing Minecraft mods
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card key={feature.title} className="p-6 hover:shadow-elegant transition-all duration-300">
                    <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-accent-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
