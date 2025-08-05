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
    const { code, filename, fileType, provider = 'openrouter' } = await req.json();
    console.log("🔍 AI Code Review:", { filename, fileType, codeLength: code?.length, provider });

    if (!code) {
      throw new Error('Code content is required for review');
    }

    // Get API keys based on provider
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    
    console.log("🔍 API Keys check:", { 
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
      console.error("🔍 No API key found in environment");
      throw new Error('API key not configured - please check Supabase secrets');
    }

    // Build specialized system prompt for code review
    const systemPrompt = `You are an expert Minecraft mod developer and code reviewer specializing in Java development for Forge, Fabric, Quilt, and NeoForge platforms.

REVIEW GUIDELINES:
1. Check for Minecraft modding best practices
2. Identify potential bugs, security issues, or performance problems
3. Suggest improvements for code quality and maintainability
4. Verify proper use of Minecraft/mod loader APIs
5. Check for proper error handling and null safety
6. Suggest optimizations where appropriate
7. Ensure compatibility with modern Minecraft versions

FOCUS AREAS:
- Code structure and organization
- Proper use of Minecraft APIs and events
- Resource management and memory leaks
- Thread safety in Minecraft context
- Proper registration patterns for mod elements
- Error handling and edge cases
- Performance considerations
- Code style and documentation

Provide a comprehensive but concise review with specific suggestions for improvement.`;

    const reviewPrompt = `Please review this ${fileType} file (${filename}):

\`\`\`${fileType}
${code}
\`\`\`

Provide feedback on:
1. Code quality and best practices
2. Minecraft modding specific issues
3. Potential bugs or improvements
4. Performance considerations
5. Suggestions for enhancement`;

    // Configure API endpoint and headers based on provider
    let apiUrl, headers, requestBody;
    
    if (actualProvider === 'openrouter') {
      console.log('🔍 Making request to OpenRouter API...');
      apiUrl = 'https://api.openrouter.ai/api/v1/chat/completions';
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://modforge.ai',
        'X-Title': 'ModForge AI Workbench',
      };
      requestBody = {
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: reviewPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      };
    } else {
      console.log('🔍 Making request to OpenAI API...');
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };
      requestBody = {
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: reviewPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1500,
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
      console.error(`🔍 ${actualProvider.toUpperCase()} API Error Response:`, {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(`${actualProvider.toUpperCase()} API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const review = data.choices[0].message.content;
    
    console.log("🔍 Code review completed for:", filename);

    return new Response(
      JSON.stringify({ review }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      },
    );

  } catch (error) {
    console.error('🔍 Error in review-code function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to review code. Please try again.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});