import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Star } from "lucide-react";

interface SubscriptionPlansProps {
  currentTier: 'free' | 'junior' | 'senior';
}

export function SubscriptionPlans({ currentTier }: SubscriptionPlansProps) {
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      icon: Star,
      description: 'Perfect for getting started',
      features: [
        '3 projects maximum',
        '10 AI requests per day',
        'Basic templates',
        'Community support',
        'GitHub integration'
      ],
      limitations: [
        'No advanced verification',
        'No custom templates',
        'No priority support'
      ]
    },
    {
      id: 'junior',
      name: 'Junior Developer',
      price: '$9.99',
      icon: Zap,
      description: 'Enhanced features for active development',
      features: [
        '15 projects maximum',
        '100 AI requests per day',
        'All mod platforms',
        'Advanced verification pipeline',
        'Custom templates',
        'Priority support',
        'Build automation'
      ],
      limitations: [
        'No enterprise features',
        'No team collaboration'
      ]
    },
    {
      id: 'senior',
      name: 'Senior Developer',
      price: '$19.99',
      icon: Crown,
      description: 'Full access to all features',
      features: [
        'Unlimited projects',
        'Unlimited AI requests',
        'All platforms & versions',
        'Full verification suite',
        'Custom AI models',
        'Team collaboration',
        'API access',
        'Priority support',
        'Advanced analytics'
      ],
      limitations: []
    }
  ];

  const getTierButton = (planId: string) => {
    if (planId === currentTier) {
      return (
        <Button variant="outline" className="w-full" disabled>
          Current Plan
        </Button>
      );
    }
    
    if (planId === 'free') {
      return (
        <Button variant="outline" className="w-full">
          Downgrade
        </Button>
      );
    }
    
    return (
      <Button variant="tier" className="w-full">
        Upgrade to {plans.find(p => p.id === planId)?.name}
      </Button>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map((plan) => {
        const Icon = plan.icon;
        const isActive = plan.id === currentTier;
        
        return (
          <Card 
            key={plan.id} 
            className={`relative overflow-hidden transition-all duration-300 ${
              isActive 
                ? 'ring-2 ring-primary shadow-glow' 
                : 'hover:shadow-elegant hover:scale-[1.02]'
            }`}
          >
            {isActive && (
              <div className="absolute top-0 left-0 right-0 bg-gradient-primary h-1" />
            )}
            
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-2">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  plan.id === 'free' ? 'bg-tier-free/10' :
                  plan.id === 'junior' ? 'bg-tier-junior/10' :
                  'bg-tier-senior/10'
                }`}>
                  <Icon className={`w-6 h-6 ${
                    plan.id === 'free' ? 'text-tier-free' :
                    plan.id === 'junior' ? 'text-tier-junior' :
                    'text-tier-senior'
                  }`} />
                </div>
              </div>
              
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <div className="text-3xl font-bold text-primary">
                {plan.price}
                {plan.id !== 'free' && <span className="text-sm text-muted-foreground">/month</span>}
              </div>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-accent flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
              
              {plan.limitations.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Limitations:</p>
                  {plan.limitations.map((limitation, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-4 h-4 flex items-center justify-center">
                        <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                      </div>
                      <span className="text-xs text-muted-foreground">{limitation}</span>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="pt-4">
                {getTierButton(plan.id)}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}