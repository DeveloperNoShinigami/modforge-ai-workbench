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
    const { code, filename, fileType } = await req.json();
    console.log("🔍 AI Code Review:", { filename, fileType, codeLength: code?.length });

    if (!code) {
      throw new Error('Code content is required for review');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    console.log("🔍 OpenAI API key check:", openAIApiKey ? "Found" : "Missing");
    
    if (!openAIApiKey) {
      console.error("🔍 OpenAI API key not found in environment");
      throw new Error('OpenAI API key not configured - please check Supabase secrets');
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

    // Create the OpenAI request
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { 
            role: 'system', 
            content: systemPrompt
          },
          { 
            role: 'user', 
            content: reviewPrompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent reviews
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: 'Unknown API error' } }));
      console.error('🔍 OpenAI API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(`OpenAI API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
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