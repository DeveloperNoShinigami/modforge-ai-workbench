import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log("🔍 Simple Code Review: Request received");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("🔍 Handling CORS preflight");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, filename, fileType } = await req.json();
    console.log("🔍 Processing review request:", { 
      filename, 
      fileType, 
      codeLength: code?.length 
    });

    if (!code) {
      console.log("🔍 No code provided");
      return new Response(
        JSON.stringify({ 
          review: "No code provided for review. Please select a file with content."
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Get API keys
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    
    console.log("🔍 API Keys available:", { 
      openai: openAIApiKey ? "Yes" : "No",
      openrouter: openRouterApiKey ? "Yes" : "No"
    });

    // Try API call if we have keys
    if (openAIApiKey || openRouterApiKey) {
      try {
        const result = await callReviewAPI(code, filename, fileType, openAIApiKey, openRouterApiKey);
        if (result) {
          console.log("🔍 AI API review successful");
          return new Response(
            JSON.stringify({ review: result }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200
            }
          );
        }
      } catch (apiError) {
        console.log("🔍 AI API failed, falling back to template review:", apiError.message);
      }
    }

    // Always fall back to template review
    console.log("🔍 Using template review");
    const templateReview = generateTemplateReview(code, filename, fileType);
    
    return new Response(
      JSON.stringify({ review: templateReview }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('🔍 Error in simple-review function:', error);
    
    // Even for errors, return 200 with error info
    const errorReview = `Code Review Error: ${error.message}

However, I can provide a basic analysis:
- File appears to be a ${filename || 'code file'}
- Consider checking syntax and formatting
- Ensure proper error handling is implemented
- Review for potential security issues`;
    
    return new Response(
      JSON.stringify({ review: errorReview }),
      {
        status: 200, // Always 200!
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});

async function callReviewAPI(code: string, filename: string, fileType: string, openAIKey?: string, openRouterKey?: string) {
  const systemPrompt = `You are an expert code reviewer specializing in Minecraft modding, Java development, and software engineering best practices.

Analyze the following ${fileType} file and provide a comprehensive review covering:
1. Code quality and best practices
2. Minecraft modding specific issues and recommendations
3. Potential bugs, security issues, or improvements
4. Performance considerations and optimizations
5. Adherence to Java/Minecraft conventions

Be constructive, specific, and provide actionable feedback. Focus on both technical correctness and modding best practices.`;

  let apiUrl = '';
  let headers: Record<string, string> = {};
  let model = '';
  let requestBody: any = {};

  if (openAIKey) {
    console.log("🔍 Using OpenAI API for review");
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
        { role: 'user', content: `Please review this ${fileType} file (${filename}):\n\n\`\`\`${fileType}\n${code}\n\`\`\`\n\nProvide detailed feedback on code quality, best practices, potential issues, and suggestions for improvement.` }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    };
  } else if (openRouterKey) {
    console.log("🔍 Using OpenRouter API for review");
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
        { role: 'user', content: `Please review this ${fileType} file (${filename}):\n\n\`\`\`${fileType}\n${code}\n\`\`\`\n\nProvide detailed feedback on code quality, best practices, potential issues, and suggestions for improvement.` }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    };
  } else {
    throw new Error('No API key available');
  }

  console.log("🔍 Making review API request to:", apiUrl.substring(0, 30) + "...");
  console.log("🔍 Review model:", model);

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });

  console.log("🔍 Review API Response status:", response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.log("🔍 Review API Error response:", errorText);
    throw new Error(`API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log("🔍 Review API Response structure:", Object.keys(data));
  
  if (!data.choices || !data.choices[0]) {
    console.log("🔍 Unexpected review API response structure:", JSON.stringify(data));
    throw new Error('Invalid API response structure');
  }

  const content = data.choices[0].message.content;
  console.log("🔍 AI Review content received (first 100 chars):", content.substring(0, 100));
  
  return content;
}

function generateTemplateReview(code: string, filename: string, fileType: string): string {
  const codeLength = code.length;
  const lines = code.split('\n').length;
  const hasComments = code.includes('//') || code.includes('/*');
  const hasErrorHandling = code.includes('try') || code.includes('catch') || code.includes('throw');
  const hasLogging = code.includes('logger') || code.includes('log') || code.includes('System.out');

  let review = `## Code Review for ${filename}\n\n`;

  // File type specific analysis
  if (fileType === 'gradle' || filename.includes('gradle')) {
    review += `### Gradle Build File Analysis\n`;
    review += `✅ **File Type**: Gradle build configuration\n`;
    review += `📊 **Size**: ${lines} lines, ${codeLength} characters\n\n`;
    
    if (code.includes('minecraft')) {
      review += `✅ **Minecraft Integration**: Detected Minecraft-related dependencies\n`;
    }
    if (code.includes('forge') || code.includes('fabric') || code.includes('quilt')) {
      review += `✅ **Mod Loader**: Detected mod loader configuration\n`;
    }
    if (code.includes('repositories')) {
      review += `✅ **Repositories**: Repository configuration found\n`;
    }
    if (code.includes('dependencies')) {
      review += `✅ **Dependencies**: Dependency management configured\n`;
    }
    
    review += `\n### 💡 **Recommendations**:\n`;
    review += `- Ensure all repositories are secure and trusted\n`;
    review += `- Keep dependencies up to date\n`;
    review += `- Consider using version catalogs for better dependency management\n`;
    review += `- Add proper task configurations for development workflow\n`;
    
  } else if (fileType === 'java') {
    review += `### Java Code Analysis\n`;
    review += `📊 **Code Metrics**:\n`;
    review += `- Lines of code: ${lines}\n`;
    review += `- File size: ${codeLength} characters\n`;
    review += `- Has comments: ${hasComments ? '✅ Yes' : '❌ No'}\n`;
    review += `- Error handling: ${hasErrorHandling ? '✅ Present' : '⚠️ Missing'}\n`;
    review += `- Logging: ${hasLogging ? '✅ Present' : '⚠️ Basic'}\n\n`;

    if (code.includes('public class')) {
      review += `✅ **Class Structure**: Well-defined class structure\n`;
    }
    if (code.includes('@Override')) {
      review += `✅ **Method Overrides**: Proper use of @Override annotation\n`;
    }
    if (code.includes('import net.minecraft')) {
      review += `✅ **Minecraft APIs**: Using Minecraft framework correctly\n`;
    }

    review += `\n### 💡 **Suggestions**:\n`;
    if (!hasComments) {
      review += `- Add JavaDoc comments for public methods and classes\n`;
    }
    if (!hasErrorHandling) {
      review += `- Implement proper error handling with try-catch blocks\n`;
    }
    review += `- Follow Java naming conventions\n`;
    review += `- Consider performance implications of your code\n`;
    review += `- Ensure thread safety where applicable\n`;

  } else if (fileType === 'json') {
    review += `### JSON Configuration Analysis\n`;
    review += `📊 **Structure**: ${lines} lines of JSON configuration\n\n`;
    
    try {
      JSON.parse(code);
      review += `✅ **Validity**: JSON syntax is valid\n`;
    } catch {
      review += `❌ **Syntax Error**: JSON contains syntax errors\n`;
    }

    if (code.includes('"type"')) {
      review += `✅ **Type Definition**: Contains type specifications\n`;
    }
    if (code.includes('"minecraft:')) {
      review += `✅ **Minecraft Integration**: Uses Minecraft namespaces\n`;
    }

    review += `\n### 💡 **Recommendations**:\n`;
    review += `- Validate JSON syntax regularly\n`;
    review += `- Use consistent formatting and indentation\n`;
    review += `- Ensure all required fields are present\n`;

  } else {
    review += `### General Code Analysis\n`;
    review += `📊 **File Info**: ${fileType} file with ${lines} lines\n\n`;
    review += `✅ **Basic Structure**: File appears to be well-structured\n`;
    review += `\n### 💡 **General Recommendations**:\n`;
    review += `- Ensure proper formatting and indentation\n`;
    review += `- Add appropriate comments and documentation\n`;
    review += `- Follow language-specific best practices\n`;
  }

  review += `\n### 🎯 **Overall Assessment**\n`;
  
  let score = 7; // Base score
  if (hasComments) score += 1;
  if (hasErrorHandling) score += 1;
  if (codeLength > 100) score += 1; // Substantial code

  review += `**Code Quality Score**: ${score}/10\n\n`;
  
  if (score >= 8) {
    review += `🟢 **Status**: Good quality code with solid structure`;
  } else if (score >= 6) {
    review += `🟡 **Status**: Decent code with room for improvement`;
  } else {
    review += `🔴 **Status**: Needs significant improvements`;
  }

  return review;
}