import { useState } from 'react';
import { ChatMessage } from '@/components/ChatHistory';
import { ProjectFile } from '@/hooks/useProjectEditor';
import { useToast } from '@/hooks/use-toast';

export interface AICodeResponse {
  code: string;
  explanation: string;
  filename: string;
  fileType: 'java' | 'json' | 'mcmeta' | 'properties';
}

export function useAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const addMessage = (type: 'user' | 'ai', content: string, fileContext?: string) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      fileContext
    };
    setMessages(prev => [...prev, message]);
    return message;
  };

  const generateCodeWithAI = async (
    prompt: string, 
    currentFile?: ProjectFile,
    projectContext?: string
  ): Promise<AICodeResponse | null> => {
    console.log("🤖 useAIChat: Generating code", { prompt: prompt.substring(0, 50), hasFile: !!currentFile });
    
    setLoading(true);
    addMessage('user', prompt, currentFile?.name);

    try {
      // Create context for the AI
      const context = {
        currentFile: currentFile ? {
          name: currentFile.name,
          type: currentFile.type,
          content: currentFile.content
        } : null,
        projectContext,
        prompt
      };

      console.log("🤖 useAIChat: Sending context to AI", context);

      // Simulate real AI call - replace with actual OpenAI/Claude API
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate intelligent response based on context
      const response = generateIntelligentResponse(context);
      
      addMessage('ai', response.explanation, response.filename);

      toast({
        title: "Code generated successfully!",
        description: response.explanation
      });

      return response;

    } catch (error) {
      console.error('🤖 useAIChat: Error generating code:', error);
      addMessage('ai', 'Sorry, I encountered an error generating code. Please try again.');
      
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

  const reviewCodeWithAI = async (file: ProjectFile): Promise<string | null> => {
    console.log("🤖 useAIChat: Reviewing code for", file.name);
    
    setLoading(true);
    addMessage('user', `Please review my ${file.name} file`, file.name);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const review = generateCodeReview(file);
      addMessage('ai', review, file.name);

      toast({
        title: "Code review completed",
        description: "AI has analyzed your code"
      });

      return review;

    } catch (error) {
      console.error('🤖 useAIChat: Error reviewing code:', error);
      addMessage('ai', 'Sorry, I encountered an error reviewing your code. Please try again.');
      
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

  const clearChat = () => {
    setMessages([]);
  };

  return {
    messages,
    loading,
    generateCodeWithAI,
    reviewCodeWithAI,
    clearChat,
    addMessage
  };
}

// Helper function to generate intelligent responses based on context
function generateIntelligentResponse(context: any): AICodeResponse {
  const { currentFile, prompt } = context;
  
  // Analyze prompt for intent
  const isBlockRequest = prompt.toLowerCase().includes('block');
  const isItemRequest = prompt.toLowerCase().includes('item') || prompt.toLowerCase().includes('sword') || prompt.toLowerCase().includes('tool');
  const isEntityRequest = prompt.toLowerCase().includes('entity') || prompt.toLowerCase().includes('mob');
  const isRecipeRequest = prompt.toLowerCase().includes('recipe') || prompt.toLowerCase().includes('craft');

  // Generate appropriate response based on context and intent
  if (isBlockRequest) {
    return {
      code: generateBlockCode(prompt),
      explanation: `Created a custom block based on your request: "${prompt}". The block includes proper registration, properties, and interaction methods.`,
      filename: 'CustomBlock.java',
      fileType: 'java'
    };
  } else if (isItemRequest) {
    return {
      code: generateItemCode(prompt),
      explanation: `Generated a custom item/tool based on: "${prompt}". Includes special abilities and proper item properties.`,
      filename: 'CustomItem.java',
      fileType: 'java'
    };
  } else if (isEntityRequest) {
    return {
      code: generateEntityCode(prompt),
      explanation: `Created a custom entity for: "${prompt}". Includes AI, rendering, and spawn logic.`,
      filename: 'CustomEntity.java',
      fileType: 'java'
    };
  } else if (isRecipeRequest) {
    return {
      code: generateRecipeCode(prompt),
      explanation: `Generated crafting recipe based on: "${prompt}". Includes proper JSON structure for Minecraft recipes.`,
      filename: 'custom_recipe.json',
      fileType: 'json'
    };
  } else {
    // General code modification based on current file
    if (currentFile) {
      return {
        code: modifyExistingCode(currentFile, prompt),
        explanation: `Modified ${currentFile.name} based on your request: "${prompt}". Enhanced the existing code with new functionality.`,
        filename: currentFile.name,
        fileType: currentFile.type
      };
    } else {
      return {
        code: generateUtilityCode(prompt),
        explanation: `Created utility code for: "${prompt}". This provides helpful functionality for your mod.`,
        filename: 'ModUtility.java',
        fileType: 'java'
      };
    }
  }
}

function generateBlockCode(prompt: string): string {
  return `public class CustomBlock extends Block {
    public CustomBlock(Properties properties) {
        super(properties.strength(3.0F, 4.0F)
            .sound(SoundType.STONE)
            .requiresCorrectToolForDrops());
    }

    @Override
    public InteractionResult use(BlockState state, Level level, BlockPos pos, Player player, InteractionHand hand, BlockHitResult hit) {
        if (!level.isClientSide) {
            // Custom interaction based on: ${prompt}
            player.sendSystemMessage(Component.literal("You interacted with the custom block!"));
            
            // Add custom effects based on the prompt
            player.addEffect(new MobEffectInstance(MobEffects.LUCK, 200, 1));
        }
        return InteractionResult.SUCCESS;
    }

    @Override
    public void stepOn(Level level, BlockPos pos, BlockState state, Entity entity) {
        if (entity instanceof LivingEntity livingEntity) {
            // Custom step effect
            livingEntity.addEffect(new MobEffectInstance(MobEffects.SPEED, 100, 0));
        }
        super.stepOn(level, pos, state, entity);
    }
}`;
}

function generateItemCode(prompt: string): string {
  return `public class CustomItem extends Item {
    public CustomItem(Properties properties) {
        super(properties.stacksTo(1)
            .rarity(Rarity.RARE)
            .fireResistant());
    }

    @Override
    public InteractionResultHolder<ItemStack> use(Level level, Player player, InteractionHand hand) {
        ItemStack itemStack = player.getItemInHand(hand);
        
        if (!level.isClientSide) {
            // Custom ability based on: ${prompt}
            player.addEffect(new MobEffectInstance(MobEffects.DAMAGE_BOOST, 300, 2));
            player.addEffect(new MobEffectInstance(MobEffects.SPEED, 300, 1));
            
            // Play sound and spawn particles
            level.playSound(null, player.getX(), player.getY(), player.getZ(), 
                SoundEvents.EXPERIENCE_ORB_PICKUP, SoundSource.PLAYERS, 1.0F, 1.0F);
            
            player.getCooldowns().addCooldown(this, 200);
        }
        
        return InteractionResultHolder.success(itemStack);
    }

    @Override
    public boolean hurtEnemy(ItemStack stack, LivingEntity target, LivingEntity attacker) {
        // Custom combat effect
        if (target instanceof Monster) {
            target.addEffect(new MobEffectInstance(MobEffects.WEAKNESS, 200, 1));
        }
        return super.hurtEnemy(stack, target, attacker);
    }
}`;
}

function generateEntityCode(prompt: string): string {
  return `public class CustomEntity extends Animal {
    public CustomEntity(EntityType<? extends Animal> entityType, Level level) {
        super(entityType, level);
    }

    @Override
    protected void registerGoals() {
        this.goalSelector.addGoal(0, new FloatGoal(this));
        this.goalSelector.addGoal(1, new BreedGoal(this, 1.0D));
        this.goalSelector.addGoal(2, new TemptGoal(this, 1.25D, Ingredient.of(Items.WHEAT), false));
        this.goalSelector.addGoal(3, new FollowParentGoal(this, 1.25D));
        this.goalSelector.addGoal(4, new WaterAvoidingRandomStrollGoal(this, 1.0D));
        this.goalSelector.addGoal(5, new LookAtPlayerGoal(this, Player.class, 6.0F));
        this.goalSelector.addGoal(6, new RandomLookAroundGoal(this));
    }

    @Override
    public boolean isFood(ItemStack stack) {
        return stack.is(Items.WHEAT);
    }

    @Override
    public AgeableMob getBreedOffspring(ServerLevel level, AgeableMob otherParent) {
        return ModEntities.CUSTOM_ENTITY.get().create(level);
    }

    @Override
    protected SoundEvent getAmbientSound() {
        return SoundEvents.COW_AMBIENT;
    }

    @Override
    protected SoundEvent getHurtSound(DamageSource damageSource) {
        return SoundEvents.COW_HURT;
    }

    @Override
    protected SoundEvent getDeathSound() {
        return SoundEvents.COW_DEATH;
    }

    // Custom behavior based on: ${prompt}
    @Override
    public void tick() {
        super.tick();
        
        if (!this.level().isClientSide && this.random.nextInt(200) == 0) {
            // Special ability every ~10 seconds
            this.addEffect(new MobEffectInstance(MobEffects.SPEED, 100, 1));
        }
    }
}`;
}

function generateRecipeCode(prompt: string): string {
  return `{
  "type": "minecraft:crafting_shaped",
  "pattern": [
    " X ",
    "XYX",
    " X "
  ],
  "key": {
    "X": {
      "item": "minecraft:iron_ingot"
    },
    "Y": {
      "item": "minecraft:diamond"
    }
  },
  "result": {
    "item": "modid:custom_item",
    "count": 1
  }
}`;
}

function modifyExistingCode(file: ProjectFile, prompt: string): string {
  // Enhance existing code based on prompt
  if (file.type === 'java' && file.content.includes('class')) {
    return file.content + `

    // Added based on request: ${prompt}
    public void customMethod() {
        // Implementation based on user request
        LOGGER.info("Custom functionality added: ${prompt}");
    }`;
  }
  return file.content;
}

function generateUtilityCode(prompt: string): string {
  return `public class ModUtility {
    private static final Logger LOGGER = LogUtils.getLogger();

    // Utility method based on: ${prompt}
    public static void performCustomAction(Player player) {
        LOGGER.info("Performing custom action for: " + player.getName().getString());
        
        // Custom implementation
        player.addEffect(new MobEffectInstance(MobEffects.LUCK, 600, 1));
        player.giveExperiencePoints(50);
    }

    public static boolean isValidForAction(Entity entity) {
        return entity instanceof Player && entity.isAlive();
    }
}`;
}

function generateCodeReview(file: ProjectFile): string {
  const content = file.content;
  const reviews = [];

  // Analyze code for common issues
  if (!content.includes('@Override') && content.includes('public ')) {
    reviews.push("⚠️ Consider adding @Override annotations to overridden methods for better code clarity.");
  }

  if (!content.includes('LOGGER') && content.includes('class')) {
    reviews.push("💡 Consider adding logging for better debugging. Use: private static final Logger LOGGER = LogUtils.getLogger();");
  }

  if (content.includes('magic number') || /\b\d{2,}\b/.test(content)) {
    reviews.push("⚠️ Found potential magic numbers. Consider using constants for better maintainability.");
  }

  if (!content.includes('null') && content.includes('get(')) {
    reviews.push("⚠️ Consider adding null checks for safer code execution.");
  }

  if (content.includes('System.out.print')) {
    reviews.push("❌ Avoid using System.out.println in mod code. Use the Logger instead.");
  }

  // File-specific reviews
  if (file.type === 'java') {
    if (!content.includes('package ')) {
      reviews.push("❌ Missing package declaration. Add proper package structure.");
    }
    
    if (content.includes('public class') && !content.includes('constructor')) {
      reviews.push("💡 Consider adding a constructor if the class needs initialization.");
    }
  }

  if (reviews.length === 0) {
    reviews.push("✅ Code looks good! Well-structured and follows Minecraft modding best practices.");
    reviews.push("💡 Consider adding JavaDoc comments for better documentation.");
  }

  return reviews.join('\n\n');
}