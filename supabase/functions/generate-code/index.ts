import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, currentFile, projectContext, provider = 'openrouter' } = await req.json();
    console.log("🤖 AI Generate Code:", { 
      prompt: prompt?.substring(0, 50) + "...", 
      hasCurrentFile: !!currentFile,
      projectContext,
      provider 
    });

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    // Get API keys based on provider
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    
    console.log("🤖 API Keys check:", { 
      openai: openAIApiKey ? "Found" : "Missing",
      openrouter: openRouterApiKey ? "Found" : "Missing",
      selectedProvider: provider
    });
    
    // Detect if the "OPENAI" key is actually an OpenRouter key
    const isOpenRouterKey = openAIApiKey?.startsWith('sk-or-v1');
    
    // Choose the right API key and provider
    let apiKey, actualProvider;
    if (openRouterApiKey) {
      apiKey = openRouterApiKey;
      actualProvider = 'openrouter';
    } else if (openAIApiKey && !isOpenRouterKey) {
      apiKey = openAIApiKey;
      actualProvider = 'openai';
    } else if (openAIApiKey && isOpenRouterKey) {
      apiKey = openAIApiKey;
      actualProvider = 'openrouter';
    } else {
      throw new Error('No valid API key found');
    }
    
    if (!apiKey) {
      console.error("🤖 No API key found in environment");
      throw new Error('API key not configured - please check Supabase secrets');
    }

    // Build context-aware system prompt for Minecraft modding
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

    // Configure API endpoint and headers based on provider
    let apiUrl, headers, requestBody;
    
    
    if (actualProvider === 'openrouter') {
      console.log('🤖 Making request to OpenRouter API...');
      apiUrl = 'https://api.openrouter.ai/api/v1/chat/completions';
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://modforge.ai',
        'X-Title': 'ModForge AI Workbench',
      };
      requestBody = {
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      };
    } else {
      console.log('🤖 Making request to OpenAI API...');
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };
      requestBody = {
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      };
    }

    // Create the API request
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: 'Unknown API error' } }));
      console.error(`🤖 ${actualProvider.toUpperCase()} API Error Response:`, {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(`${actualProvider.toUpperCase()} API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log(`🤖 ${actualProvider.toUpperCase()} Response received:`, aiResponse.substring(0, 100) + "...");

    // Try to parse JSON response, fallback to text processing
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (parseError) {
      console.log("🤖 Parsing as plain text response");
      // Fallback: extract code and create response
      parsedResponse = parseTextResponse(aiResponse, prompt, currentFile);
    }

    // Validate response structure
    if (!parsedResponse.code || !parsedResponse.explanation || !parsedResponse.filename) {
      throw new Error('Invalid AI response format');
    }

    console.log("🤖 Generated code for:", parsedResponse.filename);

    return new Response(
      JSON.stringify(parsedResponse),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      },
    );

  } catch (error) {
    console.error('🤖 Error in generate-code function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to generate code. Please try again.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});

// Helper function to parse text responses when JSON parsing fails
function parseTextResponse(response: string, prompt: string, currentFile: any) {
  console.log("🤖 Parsing text response...");
  
  // Extract code blocks (between ```java or ```json tags)
  const codeBlockRegex = /```(?:java|json|mcmeta|properties)?\n?([\s\S]*?)```/g;
  const codeMatches = response.match(codeBlockRegex);
  
  let code = '';
  if (codeMatches && codeMatches.length > 0) {
    // Get the first code block and clean it
    code = codeMatches[0].replace(/```(?:java|json|mcmeta|properties)?\n?/g, '').replace(/```/g, '').trim();
  } else {
    // If no code blocks found, try to extract code based on keywords
    const lines = response.split('\n');
    const codeLines = lines.filter(line => 
      line.includes('public class') || 
      line.includes('import ') || 
      line.includes('@Mod') ||
      line.includes('extends ') ||
      line.includes('implements ') ||
      line.trim().startsWith('{') ||
      line.trim().startsWith('}') ||
      line.includes('private ') ||
      line.includes('public ')
    );
    code = codeLines.join('\n');
  }

  // If still no code, generate a basic template
  if (!code.trim()) {
    code = generateFallbackCode(prompt, currentFile);
  }

  // Determine file type and name
  let fileType = 'java';
  let filename = 'GeneratedCode.java';
  
  if (code.includes('{') && code.includes('"')) {
    fileType = 'json';
    filename = 'generated_recipe.json';
  } else if (code.includes('pack_format')) {
    fileType = 'mcmeta';
    filename = 'pack.mcmeta';
  } else if (code.includes('modLoader=')) {
    fileType = 'properties';
    filename = 'mods.toml';
  } else if (prompt.toLowerCase().includes('block')) {
    filename = 'CustomBlock.java';
  } else if (prompt.toLowerCase().includes('item')) {
    filename = 'CustomItem.java';
  } else if (prompt.toLowerCase().includes('entity')) {
    filename = 'CustomEntity.java';
  }

  // Generate explanation
  const explanation = `Generated ${fileType.toUpperCase()} code based on your request: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"`;

  return {
    code,
    explanation,
    filename,
    fileType
  };
}

// Fallback code generation when no code is extracted
function generateFallbackCode(prompt: string, currentFile: any): string {
  const isBlockRequest = prompt.toLowerCase().includes('block');
  const isItemRequest = prompt.toLowerCase().includes('item');
  const isEntityRequest = prompt.toLowerCase().includes('entity');

  if (isBlockRequest) {
    return `public class CustomBlock extends Block {
    public CustomBlock(Properties properties) {
        super(properties.strength(3.0F, 4.0F)
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
    return `public class CustomItem extends Item {
    public CustomItem(Properties properties) {
        super(properties.stacksTo(1).rarity(Rarity.RARE));
    }

    @Override
    public InteractionResultHolder<ItemStack> use(Level level, Player player, InteractionHand hand) {
        if (!level.isClientSide) {
            player.addEffect(new MobEffectInstance(MobEffects.LUCK, 200, 1));
        }
        return InteractionResultHolder.success(player.getItemInHand(hand));
    }
}`;
  } else if (isEntityRequest) {
    return `public class CustomEntity extends Animal {
    public CustomEntity(EntityType<? extends Animal> entityType, Level level) {
        super(entityType, level);
    }

    @Override
    protected void registerGoals() {
        this.goalSelector.addGoal(0, new FloatGoal(this));
        this.goalSelector.addGoal(1, new WaterAvoidingRandomStrollGoal(this, 1.0D));
        this.goalSelector.addGoal(2, new LookAtPlayerGoal(this, Player.class, 6.0F));
        this.goalSelector.addGoal(3, new RandomLookAroundGoal(this));
    }

    @Override
    public boolean isFood(ItemStack stack) {
        return stack.is(Items.WHEAT);
    }
}`;
  }

  return `// Generated code based on: ${prompt}
public class GeneratedCode {
    // TODO: Implement your custom functionality here
    public void customMethod() {
        System.out.println("Custom code generated!");
    }
}`;
}