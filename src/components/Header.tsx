import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code, Zap, Github, User, Crown, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  currentTier: 'free' | 'junior' | 'senior';
}

export function Header({ currentTier }: HeaderProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'bg-tier-free/10 text-tier-free border-tier-free/20';
      case 'junior': return 'bg-tier-junior/10 text-tier-junior border-tier-junior/20';
      case 'senior': return 'bg-tier-senior/10 text-tier-senior border-tier-senior/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleAuthAction = () => {
    if (user) {
      signOut();
    } else {
      navigate('/auth');
    }
  };

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Code className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                ModCraft IDE
              </h1>
            </div>
            
            <Badge variant="outline" className={`${getTierColor(currentTier)} font-medium`}>
              {currentTier === 'senior' && <Crown className="w-3 h-3 mr-1" />}
              {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)} Plan
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm">
              <Github className="w-4 h-4" />
              GitHub
            </Button>
            <Button variant="ghost" size="sm">
              <Zap className="w-4 h-4" />
              AI Assistant
            </Button>
            <Button variant="outline" size="sm" onClick={handleAuthAction}>
              {user ? <LogOut className="w-4 h-4" /> : <User className="w-4 h-4" />}
              {user ? 'Sign Out' : 'Sign In'}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}