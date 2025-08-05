import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, platform, buildType = 'compile' } = await req.json();
    console.log("🔨 Build & Test:", { projectId, platform, buildType });

    if (!projectId || !platform) {
      throw new Error('Project ID and platform are required');
    }

    // Simulate build process based on platform
    const buildCommands = {
      forge: ['./gradlew build', './gradlew runClient'],
      fabric: ['./gradlew build', './gradlew runClient'],
      quilt: ['./gradlew build', './gradlew runClient'],
      neoforge: ['./gradlew build', './gradlew runClient']
    };

    const commands = buildCommands[platform as keyof typeof buildCommands];
    if (!commands) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    // Simulate build process
    const buildSteps = [
      { step: 'Validating project structure', status: 'completed', duration: 500 },
      { step: 'Downloading dependencies', status: 'completed', duration: 2000 },
      { step: 'Compiling Java sources', status: 'completed', duration: 3000 },
      { step: 'Processing resources', status: 'completed', duration: 1000 },
      { step: 'Creating mod JAR', status: 'completed', duration: 1500 },
    ];

    if (buildType === 'test') {
      buildSteps.push(
        { step: 'Starting Minecraft client', status: 'completed', duration: 5000 },
        { step: 'Loading mod', status: 'completed', duration: 2000 },
        { step: 'Running validation tests', status: 'completed', duration: 3000 }
      );
    }

    // Simulate some potential issues
    const hasWarnings = Math.random() > 0.7;
    const warnings = hasWarnings ? [
      'Deprecated API usage detected in BlockRegistry',
      'Missing @Override annotation in CustomItem.use()',
      'Unused import: net.minecraft.world.level.Level'
    ] : [];

    const buildResult = {
      success: true,
      buildSteps,
      warnings,
      artifacts: [`${projectId}-1.0.0.jar`],
      buildTime: buildSteps.reduce((sum, step) => sum + step.duration, 0),
      platform,
      buildType
    };

    console.log("🔨 Build completed successfully for:", projectId);

    return new Response(
      JSON.stringify(buildResult),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('🔨 Error in build-test function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        details: 'Build failed. Check your project configuration.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});