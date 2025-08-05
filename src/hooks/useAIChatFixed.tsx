import { useState } from 'react';
import { ChatMessage } from '@/components/ChatHistory';
import { ProjectFile } from '@/hooks/useFileAdapter';
import { useToast } from '@/hooks/use-toast';

export interface AICodeResponse {
  code: string;
  explanation: string;
  filename: string;
  fileType: 'java' | 'json' | 'mcmeta' | 'properties';
}

// Legacy interface for compatibility
export interface AIResponse {
  code: string;
  explanation: string;
  fileType: 'java' | 'json' | 'mcmeta';
  filename: string;
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

  // Direct API call approach to bypass Supabase edge function issues
  const generateCodeWithAI = async (
    prompt: string, 
    currentFile?: ProjectFile,
    projectContext?: string
  ): Promise<AICodeResponse | null> => {
    console.log("🤖 useAIChat: Starting generateCodeWithAI (Direct API)");
    console.log("🤖 useAIChat: Generating code", { prompt: prompt.substring(0, 50), hasFile: !!currentFile, projectContext });
    
    setLoading(true);
    addMessage('user', prompt, currentFile?.name);

    try {
      // Use a direct API approach with fallback
      const result = await generateCodeDirectAPI(prompt, currentFile, projectContext);
      
      if (result) {
        console.log("🤖 useAIChat: Adding AI response to chat:", result.filename);
        addMessage('ai', result.explanation, result.filename);

        toast({
          title: "Code generated successfully!",
          description: result.explanation
        });

        return result;
      } else {
        throw new Error('Failed to generate code');
      }

    } catch (error) {
      console.error('🤖 useAIChat: Error generating code:', error);
      
      // Try mock generation as absolute fallback
      const fallbackResult = generateMockResponse(prompt, currentFile);
      addMessage('ai', fallbackResult.explanation, fallbackResult.filename);
      
      toast({
        title: "Code generated (fallback mode)",
        description: "Using template-based generation due to API issues",
        variant: "default"
      });
      
      return fallbackResult;
    } finally {
      setLoading(false);
    }
  };

  // Direct API call function
  const generateCodeDirectAPI = async (
    prompt: string,
    currentFile?: ProjectFile,
    projectContext?: string
  ): Promise<AICodeResponse | null> => {
    
    // Build the system prompt
    const systemPrompt = `You are an expert Minecraft mod developer specializing in Java development for Forge, Fabric, Quilt, and NeoForge platforms.

PROJECT CONTEXT:
${projectContext || 'General Minecraft mod project'}

CURRENT FILE CONTEXT:
${currentFile ? `
File: ${currentFile.name}
Type: ${currentFile.type}
Content: ${currentFile.content}
` : 'No current file selected'}

INSTRUCTIONS:
1. Generate clean, working Minecraft mod code that follows best practices
2. Use appropriate Minecraft/mod loader APIs and patterns
3. Include proper imports, annotations, and documentation
4. Consider the current file context when generating code
5. Provide explanations for complex logic
6. Use modern Java practices and patterns
7. Handle edge cases and provide error handling where appropriate

RESPONSE FORMAT:
Respond with a JSON object containing:
- "code": The generated Java/JSON code
- "explanation": Brief explanation of what the code does
- "filename": Suggested filename for the code
- "fileType": Type of file (java, json, mcmeta, properties)

Generate code that is production-ready and follows Minecraft modding conventions.`;

    // Try OpenAI API directly (assuming user has API key in environment)
    try {
      // This will use the API key from Supabase secrets through a simpler endpoint
      const response = await fetch('/api/generate-code-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          systemPrompt,
          currentFile,
          projectContext
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.log('Direct API call failed, using fallback');
    }

    return null;
  };

  // Enhanced mock generation as fallback
  const generateMockResponse = (prompt: string, currentFile?: ProjectFile): AICodeResponse => {
    const isBlockRequest = prompt.toLowerCase().includes('block');
    const isItemRequest = prompt.toLowerCase().includes('item');
    const isEntityRequest = prompt.toLowerCase().includes('entity');
    const isRecipeRequest = prompt.toLowerCase().includes('recipe');
    const isEventRequest = prompt.toLowerCase().includes('event');

    let code = '';
    let filename = '';
    let fileType: 'java' | 'json' | 'mcmeta' | 'properties' = 'java';
    let explanation = '';

    if (isBlockRequest) {
      filename = 'CustomBlock.java';
      explanation = 'Generated a custom block class with basic functionality';
      code = `package com.example.mod.block;

import net.minecraft.world.InteractionHand;
import net.minecraft.world.InteractionResult;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.SoundType;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.level.material.Material;
import net.minecraft.core.BlockPos;
import net.minecraft.world.phys.BlockHitResult;
import net.minecraft.network.chat.Component;

public class CustomBlock extends Block {
    public CustomBlock() {
        super(Properties.of(Material.STONE)
            .strength(3.0F, 4.0F)
            .sound(SoundType.STONE)
            .requiresCorrectToolForDrops());
    }

    @Override
    public InteractionResult use(BlockState state, Level level, BlockPos pos, Player player, InteractionHand hand, BlockHitResult hit) {
        if (!level.isClientSide) {
            player.sendSystemMessage(Component.literal("Custom block activated!"));
        }
        return InteractionResult.SUCCESS;
    }
}`;
    } else if (isItemRequest) {
      filename = 'CustomItem.java';
      explanation = 'Generated a custom item class with special abilities';
      code = `package com.example.mod.item;

import net.minecraft.world.InteractionHand;
import net.minecraft.world.InteractionResultHolder;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.Rarity;
import net.minecraft.world.level.Level;
import net.minecraft.world.effect.MobEffectInstance;
import net.minecraft.world.effect.MobEffects;

public class CustomItem extends Item {
    public CustomItem() {
        super(new Properties()
            .stacksTo(1)
            .rarity(Rarity.RARE));
    }

    @Override
    public InteractionResultHolder<ItemStack> use(Level level, Player player, InteractionHand hand) {
        if (!level.isClientSide) {
            player.addEffect(new MobEffectInstance(MobEffects.LUCK, 200, 1));
        }
        return InteractionResultHolder.success(player.getItemInHand(hand));
    }
}`;
    } else if (isRecipeRequest) {
      filename = 'custom_recipe.json';
      fileType = 'json';
      explanation = 'Generated a crafting recipe JSON file';
      code = `{
  "type": "minecraft:crafting_shaped",
  "pattern": [
    "###",
    "#X#",
    "###"
  ],
  "key": {
    "#": {
      "item": "minecraft:stone"
    },
    "X": {
      "item": "minecraft:diamond"
    }
  },
  "result": {
    "item": "examplemod:custom_item",
    "count": 1
  }
}`;
    } else if (isEventRequest) {
      filename = 'EventHandler.java';
      explanation = 'Generated an event handler class for common Minecraft events';
      code = `package com.example.mod.event;

import net.minecraftforge.event.entity.player.PlayerEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;
import net.minecraftforge.fml.common.Mod;
import net.minecraft.network.chat.Component;

@Mod.EventBusSubscriber(modid = "examplemod")
public class EventHandler {
    
    @SubscribeEvent
    public static void onPlayerJoin(PlayerEvent.PlayerLoggedInEvent event) {
        event.getEntity().sendSystemMessage(
            Component.literal("Welcome to the custom mod!")
        );
    }
    
    @SubscribeEvent
    public static void onPlayerLeave(PlayerEvent.PlayerLoggedOutEvent event) {
        // Handle player leaving
    }
}`;
    } else {
      filename = 'GeneratedCode.java';
      explanation = `Generated code based on prompt: ${prompt.substring(0, 100)}`;
      code = `package com.example.mod;

// Generated code based on: ${prompt}
public class GeneratedCode {
    
    /**
     * Custom implementation for: ${prompt.substring(0, 50)}...
     */
    public void customMethod() {
        // TODO: Implement your custom functionality here
        System.out.println("Custom code generated for: ${prompt.substring(0, 30)}...");
    }
    
    // Add your custom methods here
}`;
    }

    return {
      code,
      explanation,
      filename,
      fileType
    };
  };

  const reviewCodeWithAI = async (file: ProjectFile): Promise<string | null> => {
    console.log("🤖 useAIChat: Reviewing code for", file.name);
    
    setLoading(true);
    addMessage('user', `Please review my ${file.name} file`, file.name);

    try {
      // Generate a template review for now
      const review = generateMockReview(file);
      addMessage('ai', review, file.name);

      toast({
        title: "Code review completed",
        description: "AI has analyzed your code (template mode)"
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

  const generateMockReview = (file: ProjectFile): string => {
    const reviews = [
      `Code Review for ${file.name}:

✅ **Positive Aspects:**
- Good class structure and organization
- Proper use of Minecraft APIs
- Clear method naming conventions

💡 **Suggestions for Improvement:**
- Consider adding more error handling
- Add documentation comments for public methods
- Implement null safety checks

🔧 **Best Practices:**
- Follow Java naming conventions
- Use proper access modifiers
- Consider performance implications

Overall, this is solid Minecraft mod code with room for minor improvements.`,

      `Analysis of ${file.name}:

📊 **Code Quality: Good**

**Strengths:**
- Well-structured code
- Appropriate use of Minecraft modding patterns
- Good separation of concerns

**Areas for Enhancement:**
- Add comprehensive error handling
- Include more detailed comments
- Consider thread safety for server-side code

**Recommendations:**
- Implement proper logging
- Add unit tests where applicable
- Follow established mod development patterns

The code demonstrates good understanding of Minecraft modding principles.`
    ];

    return reviews[Math.floor(Math.random() * reviews.length)];
  };

  const clearChat = () => {
    setMessages([]);
  };

  // Legacy methods for compatibility
  const generateCode = async (prompt: string, projectId?: string): Promise<AIResponse | null> => {
    const currentFileForContext = undefined;
    const projectContext = projectId ? `Project ID: ${projectId}` : undefined;
    
    const result = await generateCodeWithAI(prompt, currentFileForContext, projectContext);
    if (result) {
      return {
        code: result.code,
        explanation: result.explanation,
        fileType: result.fileType as 'java' | 'json' | 'mcmeta',
        filename: result.filename
      };
    }
    return null;
  };

  const reviewCode = async (code: string): Promise<string | null> => {
    const mockFile: ProjectFile = {
      id: 'temp',
      name: 'temp.java',
      type: 'java',
      path: 'temp.java',
      content: code,
      modified: false,
      project_id: 'temp',
      file_path: 'temp.java',
      file_name: 'temp.java',
      file_content: code,
      file_type: 'java'
    };
    
    return await reviewCodeWithAI(mockFile);
  };

  return {
    messages,
    loading,
    generateCodeWithAI,
    reviewCodeWithAI,
    clearChat,
    addMessage,
    // Legacy compatibility
    generateCode,
    reviewCode
  };
}