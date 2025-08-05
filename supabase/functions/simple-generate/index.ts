import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log("🚀 Simple Code Generator: Request received");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("🚀 Handling CORS preflight");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, currentFile, projectContext } = await req.json();
    console.log("🚀 Processing request:", { 
      prompt: prompt?.substring(0, 50) + "...", 
      hasCurrentFile: !!currentFile,
      projectContext 
    });

    if (!prompt) {
      console.log("🚀 No prompt provided");
      return new Response(
        JSON.stringify({ 
          error: "Prompt is required",
          code: generateFallbackCode(prompt || "basic mod"),
          explanation: "Generated fallback code due to missing prompt",
          filename: "FallbackCode.java",
          fileType: "java"
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 // Always return 200 to avoid Supabase client issues
        }
      );
    }

    // Get API keys
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    
    console.log("🚀 API Keys available:", { 
      openai: openAIApiKey ? "Yes" : "No",
      openrouter: openRouterApiKey ? "Yes" : "No"
    });

    // Try API call if we have keys
    if (openAIApiKey || openRouterApiKey) {
      try {
        const result = await callAIAPI(prompt, currentFile, projectContext, openAIApiKey, openRouterApiKey);
        if (result) {
          console.log("🚀 AI API successful, returning result");
          return new Response(
            JSON.stringify(result),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200
            }
          );
        }
      } catch (apiError) {
        console.log("🚀 AI API failed, falling back to template:", apiError.message);
      }
    }

    // Always fall back to template generation
    console.log("🚀 Using template generation");
    const fallbackResult = generateSmartTemplate(prompt, currentFile, projectContext);
    
    return new Response(
      JSON.stringify(fallbackResult),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('🚀 Error in simple-generate function:', error);
    
    // Even for errors, return 200 with error info to avoid client issues
    const errorResult = {
      code: generateFallbackCode("error fallback"),
      explanation: "Generated template code due to processing error: " + error.message,
      filename: "ErrorFallback.java",
      fileType: "java",
      error: error.message
    };
    
    return new Response(
      JSON.stringify(errorResult),
      {
        status: 200, // Always 200!
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});

async function callAIAPI(prompt: string, currentFile: any, projectContext: string, openAIKey?: string, openRouterKey?: string) {
  const systemPrompt = `You are an expert Minecraft mod developer. Generate working Java code for Minecraft mods.

Context: ${projectContext || 'Minecraft mod project'}
Current File: ${currentFile?.name || 'None'}

Respond ONLY with valid JSON:
{
  "code": "Java code here",
  "explanation": "Brief explanation",
  "filename": "SuggestedName.java",
  "fileType": "java"
}`;

  let apiUrl = '';
  let headers = {};
  let model = '';

  if (openRouterKey) {
    apiUrl = 'https://api.openrouter.ai/api/v1/chat/completions';
    headers = {
      'Authorization': `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://modforge.ai',
    };
    model = 'anthropic/claude-3.5-sonnet';
  } else if (openAIKey) {
    apiUrl = 'https://api.openai.com/v1/chat/completions';
    headers = {
      'Authorization': `Bearer ${openAIKey}`,
      'Content-Type': 'application/json',
    };
    model = 'gpt-4o';
  } else {
    throw new Error('No API key available');
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  try {
    return JSON.parse(content);
  } catch {
    // If not JSON, create structured response
    return {
      code: content,
      explanation: "Generated code based on your request",
      filename: "Generated.java",
      fileType: "java"
    };
  }
}

function generateSmartTemplate(prompt: string, currentFile: any, projectContext: string) {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('block')) {
    return {
      code: `package com.example.mod.block;

import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.SoundType;
import net.minecraft.world.level.material.Material;
import net.minecraft.world.level.block.state.BlockBehaviour;

public class CustomBlock extends Block {
    public CustomBlock() {
        super(BlockBehaviour.Properties.of(Material.STONE)
            .strength(3.0F, 4.0F)
            .sound(SoundType.STONE)
            .requiresCorrectToolForDrops());
    }
}`,
      explanation: "Generated a custom block class with basic properties",
      filename: "CustomBlock.java",
      fileType: "java"
    };
  }
  
  if (lowerPrompt.includes('item')) {
    return {
      code: `package com.example.mod.item;

import net.minecraft.world.item.Item;
import net.minecraft.world.item.Rarity;

public class CustomItem extends Item {
    public CustomItem() {
        super(new Item.Properties()
            .stacksTo(64)
            .rarity(Rarity.COMMON));
    }
}`,
      explanation: "Generated a custom item class",
      filename: "CustomItem.java",
      fileType: "java"
    };
  }

  if (lowerPrompt.includes('recipe')) {
    return {
      code: `{
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
}`,
      explanation: "Generated a crafting recipe JSON",
      filename: "custom_recipe.json",
      fileType: "json"
    };
  }

  // Default template
  return {
    code: generateFallbackCode(prompt),
    explanation: `Generated template code for: ${prompt.substring(0, 100)}`,
    filename: "GeneratedCode.java",
    fileType: "java"
  };
}

function generateFallbackCode(prompt: string): string {
  return `package com.example.mod;

/**
 * Generated for: ${prompt.substring(0, 80)}...
 */
public class GeneratedCode {
    
    public void customMethod() {
        // TODO: Implement functionality for: ${prompt.substring(0, 50)}...
        System.out.println("Custom code executed!");
    }
}`;
}