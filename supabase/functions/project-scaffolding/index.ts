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
    const { projectName, platform, minecraftVersion, description } = await req.json();
    console.log("🏗️ Project Scaffolding:", { projectName, platform, minecraftVersion });

    if (!projectName || !platform || !minecraftVersion) {
      throw new Error('Project name, platform, and Minecraft version are required');
    }

    // Generate project structure based on platform
    const generateProjectFiles = (platform: string, projectName: string, mcVersion: string) => {
      const baseFiles = {
        'build.gradle': generateBuildGradle(platform, mcVersion),
        'gradle.properties': generateGradleProperties(platform),
        'settings.gradle': `rootProject.name = '${projectName}'`,
        'src/main/resources/META-INF/mods.toml': generateModsToml(projectName, description || 'A Minecraft mod'),
        [`src/main/java/com/${projectName.toLowerCase()}/${projectName}Mod.java`]: generateMainModClass(projectName, platform)
      };

      // Platform-specific files
      if (platform === 'fabric') {
        baseFiles['src/main/resources/fabric.mod.json'] = generateFabricModJson(projectName, description);
      } else if (platform === 'quilt') {
        baseFiles['src/main/resources/quilt.mod.json'] = generateQuiltModJson(projectName, description);
      }

      return baseFiles;
    };

    const projectFiles = generateProjectFiles(platform, projectName, minecraftVersion);
    
    const scaffoldResult = {
      success: true,
      projectName,
      platform,
      minecraftVersion,
      files: Object.keys(projectFiles),
      projectStructure: projectFiles,
      nextSteps: [
        'Review generated mod configuration',
        'Customize your mod metadata',
        'Add your first block or item',
        'Build and test your mod'
      ]
    };

    console.log("🏗️ Project scaffolded successfully:", projectName);

    return new Response(
      JSON.stringify(scaffoldResult),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('🏗️ Error in project-scaffolding function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        details: 'Failed to create project structure.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function generateBuildGradle(platform: string, mcVersion: string): string {
  const templates = {
    forge: `plugins {
    id 'eclipse'
    id 'maven-publish'
    id 'net.minecraftforge.gradle' version '5.1.+'
}

version = '1.0.0'
group = 'com.yourname.modname'
archivesBaseName = 'modname'

java.toolchain.languageVersion = JavaLanguageVersion.of(17)

minecraft {
    mappings channel: 'official', version: '${mcVersion}'
    runs {
        client {
            workingDirectory project.file('run')
            property 'forge.logging.markers', 'REGISTRIES'
            property 'forge.logging.console.level', 'debug'
            mods {
                modname {
                    source sourceSets.main
                }
            }
        }
    }
}

dependencies {
    minecraft 'net.minecraftforge:forge:${mcVersion}-47.2.0'
}`,
    fabric: `plugins {
    id 'fabric-loom' version '1.4-SNAPSHOT'
    id 'maven-publish'
}

version = project.mod_version
group = project.maven_group

repositories {
    maven {
        name = 'ParchmentMC'
        url = 'https://maven.parchmentmc.org'
    }
}

dependencies {
    minecraft "com.mojang:minecraft:\${project.minecraft_version}"
    mappings loom.officialMojangMappings()
    modImplementation "net.fabricmc:fabric-loader:\${project.loader_version}"
    modImplementation "net.fabricmc.fabric-api:fabric-api:\${project.fabric_version}"
}`,
    quilt: `plugins {
    id 'org.quiltmc.loom' version '1.4.+'
}

version = project.mod_version
group = project.maven_group

dependencies {
    minecraft "com.mojang:minecraft:\${project.minecraft_version}"
    mappings loom.officialMojangMappings()
    modImplementation "org.quiltmc:quilt-loader:\${project.loader_version}"
    modImplementation "org.quiltmc.quilted-fabric-api:quilted-fabric-api:\${project.fabric_version}"
}`,
    neoforge: `plugins {
    id 'net.neoforged.gradle' version '7.0.80'
    id 'maven-publish'
}

version = '1.0.0'
group = 'com.yourname.modname'

java.toolchain.languageVersion = JavaLanguageVersion.of(21)

minecraft {
    mappings channel: 'official', version: '${mcVersion}'
}`
  };

  return templates[platform as keyof typeof templates] || templates.forge;
}

function generateGradleProperties(platform: string): string {
  return `org.gradle.jvmargs=-Xmx3G
org.gradle.daemon=false
minecraft_version=${platform === 'neoforge' ? '1.20.4' : '1.20.1'}
mod_version=1.0.0
maven_group=com.yourname.modname
loader_version=${platform === 'fabric' ? '0.14.24' : '0.19.3'}
fabric_version=0.91.0+1.20.1`;
}

function generateModsToml(projectName: string, description: string): string {
  return `modLoader="javafml"
loaderVersion="[47,)"
license="MIT"

[[mods]]
modId="${projectName.toLowerCase()}"
version="\${file.jarVersion}"
displayName="${projectName}"
description='''${description}'''

[[dependencies.${projectName.toLowerCase()}]]
modId="forge"
mandatory=true
versionRange="[47,)"
ordering="NONE"
side="BOTH"`;
}

function generateFabricModJson(projectName: string, description: string): string {
  return JSON.stringify({
    schemaVersion: 1,
    id: projectName.toLowerCase(),
    version: "${version}",
    name: projectName,
    description,
    authors: ["Your Name"],
    contact: {},
    license: "MIT",
    icon: "assets/modname/icon.png",
    environment: "*",
    entrypoints: {
      main: [`com.${projectName.toLowerCase()}.${projectName}Mod`]
    },
    depends: {
      fabricloader: ">=0.14.0",
      minecraft: "~1.20.1",
      java: ">=17",
      "fabric-api": "*"
    }
  }, null, 2);
}

function generateQuiltModJson(projectName: string, description: string): string {
  return JSON.stringify({
    schema_version: 1,
    quilt_loader: {
      group: `com.${projectName.toLowerCase()}`,
      id: projectName.toLowerCase(),
      version: "${version}",
      metadata: {
        name: projectName,
        description,
        contributors: { "Your Name": "Owner" },
        contact: {},
        license: "MIT"
      },
      intermediate_mappings: "net.fabricmc:intermediary",
      entrypoints: {
        init: [`com.${projectName.toLowerCase()}.${projectName}Mod`]
      },
      depends: [
        { id: "quilt_loader", version: ">=0.19.0" },
        { id: "quilted_fabric_api", version: ">=7.0.0" },
        { id: "minecraft", version: ">=1.20.0" }
      ]
    }
  }, null, 2);
}

function generateMainModClass(projectName: string, platform: string): string {
  const templates = {
    forge: `package com.${projectName.toLowerCase()};

import net.minecraftforge.common.MinecraftForge;
import net.minecraftforge.fml.common.Mod;
import net.minecraftforge.fml.event.lifecycle.FMLCommonSetupEvent;
import net.minecraftforge.fml.javafmlmod.FMLJavaModLoadingContext;

@Mod("${projectName.toLowerCase()}")
public class ${projectName}Mod {
    public ${projectName}Mod() {
        FMLJavaModLoadingContext.get().getModEventBus().addListener(this::setup);
        MinecraftForge.EVENT_BUS.register(this);
    }

    private void setup(final FMLCommonSetupEvent event) {
        // Mod setup code here
    }
}`,
    fabric: `package com.${projectName.toLowerCase()};

import net.fabricmc.api.ModInitializer;

public class ${projectName}Mod implements ModInitializer {
    @Override
    public void onInitialize() {
        // Mod initialization code here
    }
}`,
    quilt: `package com.${projectName.toLowerCase()};

import org.quiltmc.loader.api.ModContainer;
import org.quiltmc.qsl.base.api.entrypoint.ModInitializer;

public class ${projectName}Mod implements ModInitializer {
    @Override
    public void onInitialize(ModContainer mod) {
        // Mod initialization code here
    }
}`,
    neoforge: `package com.${projectName.toLowerCase()};

import net.neoforged.fml.common.Mod;
import net.neoforged.fml.event.lifecycle.FMLCommonSetupEvent;
import net.neoforged.bus.api.IEventBus;
import net.neoforged.fml.ModLoadingContext;

@Mod("${projectName.toLowerCase()}")
public class ${projectName}Mod {
    public ${projectName}Mod(IEventBus modEventBus) {
        modEventBus.addListener(this::setup);
    }

    private void setup(final FMLCommonSetupEvent event) {
        // Mod setup code here
    }
}`
  };

  return templates[platform as keyof typeof templates] || templates.forge;
}