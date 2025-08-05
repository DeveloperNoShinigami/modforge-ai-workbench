import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface AIResponse {
  code: string;
  explanation: string;
  fileType: 'java' | 'json' | 'mcmeta';
  filename: string;
}

export function useAI() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const generateCode = async (prompt: string, projectId?: string): Promise<AIResponse | null> => {
    console.log("useAI: generateCode called", { prompt: prompt.substring(0, 50) + "...", projectId, userExists: !!user });
    
    if (!user) {
      console.log("useAI: No user found");
      toast({
        title: "Authentication required",
        description: "Please sign in to use AI features",
        variant: "destructive"
      });
      return null;
    }

    setLoading(true);
    console.log("useAI: Starting code generation...");
    
    try {
      // Simulate AI code generation (replace with actual AI service later)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockResponses: AIResponse[] = [
        {
          code: `@Mod("${projectId || 'examplemod'}")
public class ExampleMod {
    public static final String MODID = "${projectId || 'examplemod'}";
    private static final Logger LOGGER = LogUtils.getLogger();

    public ExampleMod() {
        IEventBus modEventBus = FMLJavaModLoadingContext.get().getModEventBus();
        modEventBus.addListener(this::commonSetup);
        
        ModItems.register(modEventBus);
        ModBlocks.register(modEventBus);
        
        MinecraftForge.EVENT_BUS.register(this);
    }

    private void commonSetup(final FMLCommonSetupEvent event) {
        LOGGER.info("Hello from ${projectId || 'ExampleMod'}!");
    }
}`,
          explanation: "Created main mod class with proper initialization and event handling",
          fileType: 'java',
          filename: 'ExampleMod.java'
        },
        {
          code: `public class CustomSword extends SwordItem {
    public CustomSword(Tier tier, int attackDamage, float attackSpeed, Properties properties) {
        super(tier, attackDamage, attackSpeed, properties);
    }

    @Override
    public boolean hurtEnemy(ItemStack stack, LivingEntity target, LivingEntity attacker) {
        // Add special effects when hitting enemies
        if (target instanceof Monster) {
            target.addEffect(new MobEffectInstance(MobEffects.WEAKNESS, 100, 1));
        }
        return super.hurtEnemy(stack, target, attacker);
    }

    @Override
    public InteractionResultHolder<ItemStack> use(Level level, Player player, InteractionHand hand) {
        if (!level.isClientSide) {
            // Special ability on right-click
            player.addEffect(new MobEffectInstance(MobEffects.DAMAGE_BOOST, 200, 1));
            player.getCooldowns().addCooldown(this, 300);
        }
        return InteractionResultHolder.success(player.getItemInHand(hand));
    }
}`,
          explanation: "Created a custom sword with special abilities: weakens monsters on hit and gives strength boost on right-click",
          fileType: 'java',
          filename: 'CustomSword.java'
        },
        {
          code: `public class CustomBlock extends Block {
    public CustomBlock(Properties properties) {
        super(properties);
    }

    @Override
    public void stepOn(Level level, BlockPos pos, BlockState state, Entity entity) {
        if (entity instanceof LivingEntity livingEntity) {
            // Heal players when they step on this block
            if (livingEntity instanceof Player) {
                livingEntity.heal(1.0F);
            }
        }
        super.stepOn(level, pos, state, entity);
    }

    @Override
    public InteractionResult use(BlockState state, Level level, BlockPos pos, Player player, InteractionHand hand, BlockHitResult hit) {
        if (!level.isClientSide) {
            // Give player experience when right-clicking
            player.giveExperiencePoints(10);
            level.playSound(null, pos, SoundEvents.EXPERIENCE_ORB_PICKUP, SoundSource.BLOCKS, 1.0F, 1.0F);
        }
        return InteractionResult.SUCCESS;
    }
}`,
          explanation: "Created a healing block that restores health when stepped on and gives experience when right-clicked",
          fileType: 'java',
          filename: 'CustomBlock.java'
        }
      ];

      const response = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      
      console.log("useAI: Generated response:", response.filename);
      
      toast({
        title: "Code generated successfully!",
        description: response.explanation
      });
      
      return response;
      
    } catch (error) {
      console.error('AI generation error:', error);
      toast({
        title: "Failed to generate code",
        description: "Please try again later",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const reviewCode = async (code: string): Promise<string | null> => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to use AI features",
        variant: "destructive"
      });
      return null;
    }

    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const reviews = [
        "✅ Code looks good! Consider adding null checks for better safety.",
        "⚠️ Missing @Override annotation on some methods. Consider adding proper JavaDoc comments.",
        "✅ Good use of event handling! You might want to add configuration options for the effects.",
        "⚠️ Consider using constants for magic numbers like duration and amplifier values.",
        "✅ Well-structured code! Consider adding client-side particle effects for better visual feedback."
      ];
      
      const review = reviews[Math.floor(Math.random() * reviews.length)];
      
      toast({
        title: "Code review completed",
        description: "AI has analyzed your code"
      });
      
      return review;
      
    } catch (error) {
      console.error('AI review error:', error);
      toast({
        title: "Failed to review code",
        description: "Please try again later",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    generateCode,
    reviewCode,
    loading
  };
}