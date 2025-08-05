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

    // Generate comprehensive project structure
    const generateProjectStructure = (projectName: string, platform: string, mcVersion: string, description?: string) => {
      const normalizedName = projectName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const packagePath = `com/yourname/${normalizedName}`;
      
      const projectFiles: Record<string, string> = {
        // Root files
        'build.gradle': generateBuildGradle(platform, mcVersion, normalizedName),
        'gradle.properties': generateGradleProperties(platform, mcVersion),
        'settings.gradle': `rootProject.name = '${normalizedName}'`,
        'gradlew': generateGradlewScript(),
        'gradlew.bat': generateGradlewBat(),
        'README.md': generateReadme(projectName, description),
        '.gitignore': generateGitignore(),
        
        // Main mod class
        [`src/main/java/${packagePath}/${projectName}Mod.java`]: generateMainModClass(projectName, platform, normalizedName),
        
        // Registry classes
        [`src/main/java/${packagePath}/registry/ModItems.java`]: generateModItems(projectName, normalizedName),
        [`src/main/java/${packagePath}/registry/ModBlocks.java`]: generateModBlocks(projectName, normalizedName),
        [`src/main/java/${packagePath}/registry/ModEntities.java`]: generateModEntities(projectName, normalizedName),
        
        // Event handlers
        [`src/main/java/${packagePath}/events/CommonEvents.java`]: generateCommonEvents(projectName, normalizedName),
        
        // Config
        [`src/main/java/${packagePath}/config/ModConfig.java`]: generateModConfig(projectName, normalizedName),
        
        // Resources
        'src/main/resources/META-INF/mods.toml': generateModsToml(normalizedName, description || 'A Minecraft mod'),
        'src/main/resources/pack.mcmeta': generatePackMcmeta(),
        
        // Language files
        [`src/main/resources/assets/${normalizedName}/lang/en_us.json`]: generateLangFile(normalizedName),
        
        // Example textures (placeholder content)
        [`src/main/resources/assets/${normalizedName}/textures/item/example_item.png`]: '# Placeholder texture file',
        [`src/main/resources/assets/${normalizedName}/textures/block/example_block.png`]: '# Placeholder texture file',
        
        // Models
        [`src/main/resources/assets/${normalizedName}/models/item/example_item.json`]: generateItemModel(),
        [`src/main/resources/assets/${normalizedName}/models/block/example_block.json`]: generateBlockModel(),
        
        // Blockstates
        [`src/main/resources/assets/${normalizedName}/blockstates/example_block.json`]: generateBlockstate(),
        
        // Data files
        [`src/main/resources/data/${normalizedName}/recipes/example_item.json`]: generateRecipe(normalizedName),
        [`src/main/resources/data/${normalizedName}/loot_tables/blocks/example_block.json`]: generateLootTable(),
        [`src/main/resources/data/${normalizedName}/tags/blocks/example_block_tag.json`]: generateBlockTag(),
        [`src/main/resources/data/${normalizedName}/advancements/root.json`]: generateAdvancement(normalizedName),
        
        // Test files
        [`src/test/java/${packagePath}/ModTests.java`]: generateTestClass(projectName, normalizedName)
      };

      // Platform-specific files
      if (platform === 'fabric') {
        projectFiles['src/main/resources/fabric.mod.json'] = generateFabricModJson(normalizedName, description);
      } else if (platform === 'quilt') {
        projectFiles['src/main/resources/quilt.mod.json'] = generateQuiltModJson(normalizedName, description);
      }

      return {
        files: Object.keys(projectFiles),
        projectStructure: projectFiles,
        nextSteps: [
          'Review generated mod configuration',
          'Add textures to assets/textures/ folders',
          'Implement your first custom block or item',
          'Configure mod metadata in mods.toml',
          'Build and test your mod with gradlew runClient'
        ]
      };
    };

    const projectStructure = generateProjectStructure(projectName, platform, minecraftVersion, description);
    
    const scaffoldResult = {
      success: true,
      projectName,
      platform,
      minecraftVersion,
      ...projectStructure
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

function generateBuildGradle(platform: string, mcVersion: string, normalizedName: string): string {
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

function generateMainModClass(projectName: string, platform: string, normalizedName: string): string {
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

// Additional generator functions for comprehensive project structure

function generateGradleProperties(platform: string, mcVersion: string): string {
  return `org.gradle.jvmargs=-Xmx3G
org.gradle.daemon=false
minecraft_version=${mcVersion}
mod_version=1.0.0
maven_group=com.yourname.modname
loader_version=${platform === 'fabric' ? '0.14.24' : '0.19.3'}
fabric_version=0.91.0+1.20.1`;
}

function generateGradlewScript(): string {
  return `#!/bin/sh
# Gradle wrapper script for Unix systems
GRADLE_APP_NAME="Gradle"
exec gradle "$@"`;
}

function generateGradlewBat(): string {
  return `@echo off
rem Gradle wrapper script for Windows
gradle %*`;
}

function generateReadme(projectName: string, description?: string): string {
  return `# ${projectName}

${description || 'A Minecraft mod built with Forge'}

## Building

Run \`./gradlew build\` to build the mod.

## Development

Run \`./gradlew runClient\` to start a development client.

## License

This mod is licensed under MIT License.`;
}

function generateGitignore(): string {
  return `# Build output
build/
.gradle/
run/

# IDE files
.idea/
*.iml
*.ipr
*.iws
.vscode/

# OS files
.DS_Store
Thumbs.db

# Logs
logs/
*.log`;
}

function generateModItems(projectName: string, normalizedName: string): string {
  return `package com.yourname.${normalizedName}.registry;

import net.minecraft.world.item.Item;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.ForgeRegistries;
import net.minecraftforge.registries.RegistryObject;

public class ModItems {
    public static final DeferredRegister<Item> ITEMS = DeferredRegister.create(ForgeRegistries.ITEMS, "${normalizedName}");
    
    // Example item registration
    public static final RegistryObject<Item> EXAMPLE_ITEM = ITEMS.register("example_item", 
        () -> new Item(new Item.Properties()));
}`;
}

function generateModBlocks(projectName: string, normalizedName: string): string {
  return `package com.yourname.${normalizedName}.registry;

import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.state.BlockBehaviour;
import net.minecraft.world.level.material.Material;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.ForgeRegistries;
import net.minecraftforge.registries.RegistryObject;

public class ModBlocks {
    public static final DeferredRegister<Block> BLOCKS = DeferredRegister.create(ForgeRegistries.BLOCKS, "${normalizedName}");
    
    // Example block registration
    public static final RegistryObject<Block> EXAMPLE_BLOCK = BLOCKS.register("example_block", 
        () -> new Block(BlockBehaviour.Properties.of(Material.STONE)));
}`;
}

function generateModEntities(projectName: string, normalizedName: string): string {
  return `package com.yourname.${normalizedName}.registry;

import net.minecraft.world.entity.EntityType;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.ForgeRegistries;

public class ModEntities {
    public static final DeferredRegister<EntityType<?>> ENTITIES = DeferredRegister.create(ForgeRegistries.ENTITY_TYPES, "${normalizedName}");
    
    // Entity registrations will go here
}`;
}

function generateCommonEvents(projectName: string, normalizedName: string): string {
  return `package com.yourname.${normalizedName}.events;

import net.minecraftforge.eventbus.api.SubscribeEvent;
import net.minecraftforge.fml.common.Mod;
import net.minecraftforge.event.entity.player.PlayerEvent;

@Mod.EventBusSubscriber(modid = "${normalizedName}")
public class CommonEvents {
    
    @SubscribeEvent
    public static void onPlayerJoin(PlayerEvent.PlayerLoggedInEvent event) {
        // Handle player join events
    }
}`;
}

function generateModConfig(projectName: string, normalizedName: string): string {
  return `package com.yourname.${normalizedName}.config;

import net.minecraftforge.common.ForgeConfigSpec;

public class ModConfig {
    public static final ForgeConfigSpec.Builder BUILDER = new ForgeConfigSpec.Builder();
    public static final ForgeConfigSpec SPEC;
    
    // Example config option
    public static final ForgeConfigSpec.BooleanValue EXAMPLE_SETTING;
    
    static {
        EXAMPLE_SETTING = BUILDER
            .comment("An example configuration setting")
            .define("example_setting", true);
        
        SPEC = BUILDER.build();
    }
}`;
}

function generatePackMcmeta(): string {
  return JSON.stringify({
    pack: {
      description: "Mod resources",
      pack_format: 15
    }
  }, null, 2);
}

function generateLangFile(normalizedName: string): string {
  return JSON.stringify({
    [`item.${normalizedName}.example_item`]: "Example Item",
    [`block.${normalizedName}.example_block`]: "Example Block",
    [`itemGroup.${normalizedName}`]: "Example Mod"
  }, null, 2);
}

function generateItemModel(): string {
  return JSON.stringify({
    parent: "item/generated",
    textures: {
      layer0: "mymod:item/example_item"
    }
  }, null, 2);
}

function generateBlockModel(): string {
  return JSON.stringify({
    parent: "block/cube_all",
    textures: {
      all: "mymod:block/example_block"
    }
  }, null, 2);
}

function generateBlockstate(): string {
  return JSON.stringify({
    variants: {
      "": {
        model: "mymod:block/example_block"
      }
    }
  }, null, 2);
}

function generateRecipe(normalizedName: string): string {
  return JSON.stringify({
    type: "minecraft:crafting_shaped",
    pattern: [
      "XXX",
      "XYX",
      "XXX"
    ],
    key: {
      X: {
        item: "minecraft:stone"
      },
      Y: {
        item: "minecraft:diamond"
      }
    },
    result: {
      item: `${normalizedName}:example_item`,
      count: 1
    }
  }, null, 2);
}

function generateLootTable(): string {
  return JSON.stringify({
    type: "minecraft:block",
    pools: [
      {
        rolls: 1,
        entries: [
          {
            type: "minecraft:item",
            name: "mymod:example_block"
          }
        ]
      }
    ]
  }, null, 2);
}

function generateBlockTag(): string {
  return JSON.stringify({
    replace: false,
    values: [
      "mymod:example_block"
    ]
  }, null, 2);
}

function generateAdvancement(normalizedName: string): string {
  return JSON.stringify({
    display: {
      icon: {
        item: `${normalizedName}:example_item`
      },
      title: "Getting Started",
      description: "Welcome to the mod!",
      frame: "task",
      show_toast: true,
      announce_to_chat: true,
      hidden: false
    },
    criteria: {
      has_item: {
        trigger: "minecraft:inventory_changed",
        conditions: {
          items: [
            {
              items: [`${normalizedName}:example_item`]
            }
          ]
        }
      }
    },
    requirements: [["has_item"]]
  }, null, 2);
}

function generateTestClass(projectName: string, normalizedName: string): string {
  return `package com.yourname.${normalizedName};

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class ModTests {
    
    @Test
    public void testModInitialization() {
        // Test mod initialization
        assertTrue(true, "Mod should initialize successfully");
    }
}`;
}