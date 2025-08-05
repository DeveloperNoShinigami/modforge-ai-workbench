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
    const { action, dependency, platform, minecraftVersion, buildFile } = await req.json();
    console.log("📦 Dependency Manager:", { action, dependency, platform });

    if (!action) {
      throw new Error('Action is required');
    }

    switch (action) {
      case 'search':
        return await handleSearch(dependency, platform, minecraftVersion);
      case 'add':
        return await handleAdd(dependency, platform, buildFile);
      case 'remove':
        return await handleRemove(dependency, platform, buildFile);
      case 'update':
        return await handleUpdate(dependency, platform, buildFile);
      case 'list':
        return await handleList(buildFile);
      case 'check_updates':
        return await handleCheckUpdates(buildFile, platform);
      default:
        throw new Error(`Unsupported action: ${action}`);
    }

  } catch (error) {
    console.error('📦 Error in dependency-manager function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        details: 'Dependency management operation failed.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function handleSearch(query: string, platform: string, mcVersion: string) {
  console.log("📦 Searching dependencies:", query);
  
  // Mock popular mod dependencies
  const searchResults = [
    {
      name: 'JEI (Just Enough Items)',
      id: 'jei',
      description: 'Item and recipe viewing mod',
      versions: ['11.6.0.1013', '11.5.0.297'],
      platform: ['forge', 'fabric'],
      downloads: 150000000,
      url: 'https://www.curseforge.com/minecraft/mc-mods/jei'
    },
    {
      name: 'Waystones',
      id: 'waystones',
      description: 'Teleportation stones for easy travel',
      versions: ['14.1.3', '14.0.2'],
      platform: ['forge', 'fabric'],
      downloads: 75000000,
      url: 'https://www.curseforge.com/minecraft/mc-mods/waystones'
    },
    {
      name: 'Botania',
      id: 'botania',
      description: 'Magic mod themed around nature',
      versions: ['443', '442'],
      platform: ['forge', 'fabric'],
      downloads: 45000000,
      url: 'https://www.curseforge.com/minecraft/mc-mods/botania'
    },
    {
      name: 'Applied Energistics 2',
      id: 'ae2',
      description: 'Storage and automation mod',
      versions: ['15.0.16', '15.0.15'],
      platform: ['forge', 'fabric'],
      downloads: 120000000,
      url: 'https://www.curseforge.com/minecraft/mc-mods/applied-energistics-2'
    }
  ].filter(mod => 
    mod.name.toLowerCase().includes(query.toLowerCase()) ||
    mod.description.toLowerCase().includes(query.toLowerCase())
  );

  return new Response(
    JSON.stringify({
      success: true,
      action: 'search',
      query,
      results: searchResults,
      totalResults: searchResults.length
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    }
  );
}

async function handleAdd(dependency: any, platform: string, buildFile: string) {
  console.log("📦 Adding dependency:", dependency.name);
  
  const dependencyConfig = generateDependencyConfig(dependency, platform);
  const updatedBuildFile = addDependencyToBuildFile(buildFile, dependencyConfig, platform);
  
  return new Response(
    JSON.stringify({
      success: true,
      action: 'add',
      dependency: dependency.name,
      version: dependency.version,
      updatedBuildFile,
      message: `Successfully added ${dependency.name} v${dependency.version}`
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    }
  );
}

async function handleRemove(dependency: any, platform: string, buildFile: string) {
  console.log("📦 Removing dependency:", dependency.name);
  
  const updatedBuildFile = removeDependencyFromBuildFile(buildFile, dependency.name, platform);
  
  return new Response(
    JSON.stringify({
      success: true,
      action: 'remove',
      dependency: dependency.name,
      updatedBuildFile,
      message: `Successfully removed ${dependency.name}`
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    }
  );
}

async function handleUpdate(dependency: any, platform: string, buildFile: string) {
  console.log("📦 Updating dependency:", dependency.name);
  
  const dependencyConfig = generateDependencyConfig(dependency, platform);
  const updatedBuildFile = updateDependencyInBuildFile(buildFile, dependencyConfig, platform);
  
  return new Response(
    JSON.stringify({
      success: true,
      action: 'update',
      dependency: dependency.name,
      oldVersion: dependency.oldVersion,
      newVersion: dependency.version,
      updatedBuildFile,
      message: `Successfully updated ${dependency.name} from v${dependency.oldVersion} to v${dependency.version}`
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    }
  );
}

async function handleList(buildFile: string) {
  console.log("📦 Listing dependencies");
  
  const dependencies = extractDependencies(buildFile);
  
  return new Response(
    JSON.stringify({
      success: true,
      action: 'list',
      dependencies,
      totalDependencies: dependencies.length
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    }
  );
}

async function handleCheckUpdates(buildFile: string, platform: string) {
  console.log("📦 Checking for updates");
  
  const currentDependencies = extractDependencies(buildFile);
  const availableUpdates = currentDependencies.map(dep => ({
    ...dep,
    currentVersion: dep.version,
    latestVersion: generateLatestVersion(dep.version),
    hasUpdate: true
  })).filter(dep => dep.hasUpdate);
  
  return new Response(
    JSON.stringify({
      success: true,
      action: 'check_updates',
      availableUpdates,
      totalUpdates: availableUpdates.length,
      message: `Found ${availableUpdates.length} available updates`
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    }
  );
}

function generateDependencyConfig(dependency: any, platform: string) {
  const configs = {
    forge: {
      implementation: `implementation fg.deobf('${dependency.group}:${dependency.artifact}:${dependency.version}')`,
      modImplementation: `modImplementation '${dependency.group}:${dependency.artifact}:${dependency.version}'`
    },
    fabric: {
      modImplementation: `modImplementation '${dependency.group}:${dependency.artifact}:${dependency.version}'`,
      include: `include '${dependency.group}:${dependency.artifact}:${dependency.version}'`
    },
    quilt: {
      modImplementation: `modImplementation '${dependency.group}:${dependency.artifact}:${dependency.version}'`
    },
    neoforge: {
      implementation: `implementation '${dependency.group}:${dependency.artifact}:${dependency.version}'`
    }
  };

  return configs[platform as keyof typeof configs] || configs.forge;
}

function addDependencyToBuildFile(buildFile: string, dependencyConfig: any, platform: string) {
  const dependenciesSection = buildFile.indexOf('dependencies {');
  if (dependenciesSection === -1) {
    return buildFile + '\n\ndependencies {\n    ' + dependencyConfig.modImplementation + '\n}';
  }
  
  const insertPoint = buildFile.indexOf('}', dependenciesSection);
  return buildFile.slice(0, insertPoint) + 
         '    ' + dependencyConfig.modImplementation + '\n' + 
         buildFile.slice(insertPoint);
}

function removeDependencyFromBuildFile(buildFile: string, dependencyName: string, platform: string) {
  const lines = buildFile.split('\n');
  const filteredLines = lines.filter(line => 
    !line.toLowerCase().includes(dependencyName.toLowerCase()) ||
    !line.trim().startsWith('modImplementation') &&
    !line.trim().startsWith('implementation')
  );
  return filteredLines.join('\n');
}

function updateDependencyInBuildFile(buildFile: string, dependencyConfig: any, platform: string) {
  // First remove old version, then add new version
  const removedOld = removeDependencyFromBuildFile(buildFile, dependencyConfig.name, platform);
  return addDependencyToBuildFile(removedOld, dependencyConfig, platform);
}

function extractDependencies(buildFile: string) {
  const dependencies = [];
  const lines = buildFile.split('\n');
  
  for (const line of lines) {
    if (line.trim().startsWith('modImplementation') || line.trim().startsWith('implementation')) {
      const match = line.match(/'([^:]+):([^:]+):([^']+)'/);
      if (match) {
        dependencies.push({
          group: match[1],
          artifact: match[2],
          version: match[3],
          name: match[2],
          type: line.trim().startsWith('modImplementation') ? 'mod' : 'library'
        });
      }
    }
  }
  
  return dependencies;
}

function generateLatestVersion(currentVersion: string) {
  // Simple version increment simulation
  const parts = currentVersion.split('.');
  if (parts.length >= 3) {
    const patch = parseInt(parts[2]) + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }
  return currentVersion;
}