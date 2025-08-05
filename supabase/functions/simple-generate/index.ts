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
  const systemPrompt = `You are an expert Minecraft mod developer specializing in Forge, Fabric, Quilt, and NeoForge modding.

Current Context: ${projectContext || 'Minecraft mod project'}
Current File: ${currentFile?.name || 'None'} (Type: ${currentFile?.type || 'None'})
${currentFile?.content ? `Current file content preview: ${currentFile.content.substring(0, 300)}...` : ''}

Generate working, production-ready code for Minecraft mods. Consider:
- Proper package structure and imports
- Minecraft version compatibility
- Best practices for the target mod loader
- Error handling and performance
- Proper registration and event handling

Respond ONLY with valid JSON in this exact format:
{
  "code": "Your generated code here",
  "explanation": "Brief explanation of what the code does",
  "filename": "SuggestedFileName.java",
  "fileType": "java"
}`;

  let apiUrl = '';
  let headers: Record<string, string> = {};
  let model = '';
  let requestBody: any = {};

  if (openAIKey) {
    console.log("🚀 Using OpenAI API");
    apiUrl = 'https://api.openai.com/v1/chat/completions';
    headers = {
      'Authorization': `Bearer ${openAIKey}`,
      'Content-Type': 'application/json',
    };
    model = 'gpt-4.1-2025-04-14';
    requestBody = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 3000,
    };
  } else if (openRouterKey) {
    console.log("🚀 Using OpenRouter API");
    apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
    headers = {
      'Authorization': `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://modforge.ai',
      'X-Title': 'ModForge AI Workbench',
    };
    model = 'anthropic/claude-3-5-sonnet-20241022';
    requestBody = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 3000,
    };
  } else {
    throw new Error('No API key available');
  }

  console.log("🚀 Making API request to:", apiUrl.substring(0, 30) + "...");
  console.log("🚀 Request model:", model);

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });

  console.log("🚀 API Response status:", response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.log("🚀 API Error response:", errorText);
    throw new Error(`API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log("🚀 API Response structure:", Object.keys(data));
  
  if (!data.choices || !data.choices[0]) {
    console.log("🚀 Unexpected API response structure:", JSON.stringify(data));
    throw new Error('Invalid API response structure');
  }
  
  const content = data.choices[0].message.content;
  console.log("🚀 AI Content received (first 100 chars):", content.substring(0, 100));
  
  try {
    const parsed = JSON.parse(content);
    console.log("🚀 Successfully parsed JSON response");
    return parsed;
  } catch (parseError) {
    console.log("🚀 Content is not JSON, creating structured response");
    // If not JSON, create structured response
    return {
      code: content,
      explanation: "Generated code based on your request",
      filename: generateFilename(prompt, currentFile),
      fileType: determineFileType(prompt, currentFile)
    };
  }
}

function generateFilename(prompt: string, currentFile: any): string {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('block')) return 'CustomBlock.java';
  if (lowerPrompt.includes('item')) return 'CustomItem.java';
  if (lowerPrompt.includes('entity')) return 'CustomEntity.java';
  if (lowerPrompt.includes('recipe')) return 'custom_recipe.json';
  if (lowerPrompt.includes('model')) return 'custom_model.json';
  if (currentFile?.name) return currentFile.name.replace(/\.[^/.]+$/, "") + "Generated.java";
  
  return 'Generated.java';
}

function determineFileType(prompt: string, currentFile: any): string {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('recipe') || lowerPrompt.includes('model') || lowerPrompt.includes('json')) return 'json';
  if (lowerPrompt.includes('gradle') || lowerPrompt.includes('build')) return 'gradle';
  if (lowerPrompt.includes('properties')) return 'properties';
  if (currentFile?.type) return currentFile.type;
  
  return 'java';
}

function generateSmartTemplate(prompt: string, currentFile: any, projectContext: string) {
  const lowerPrompt = prompt.toLowerCase();
  
  // Only use templates as absolute fallback when AI is completely unavailable
  console.log("🚀 WARNING: Using template generation (AI API unavailable)");
  
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
    
    // TODO: Add custom block functionality based on: ${prompt.substring(0, 50)}...
}`,
      explanation: "⚠️ Generated template block class (AI temporarily unavailable). This is a basic template that needs customization.",
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
    
    // TODO: Add custom item functionality based on: ${prompt.substring(0, 50)}...
}`,
      explanation: "⚠️ Generated template item class (AI temporarily unavailable). This is a basic template that needs customization.",
      filename: "CustomItem.java",
      fileType: "java"
    };
  }

  // Default template with clear indication it's not AI-generated
  return {
    code: `package com.example.mod;

/**
 * ⚠️ TEMPLATE CODE - AI temporarily unavailable
 * Generated for: ${prompt.substring(0, 80)}...
 * 
 * This is a basic template that should be customized for your specific needs.
 */
public class GeneratedCode {
    
    public void customMethod() {
        // TODO: Implement functionality for: ${prompt.substring(0, 50)}...
        System.out.println("Custom code executed!");
    }
}`,
    explanation: `⚠️ Generated template code (AI temporarily unavailable). Please customize this template based on your requirements: ${prompt.substring(0, 100)}`,
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