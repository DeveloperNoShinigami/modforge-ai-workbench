import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.5.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectName, platform, minecraftVersion, description, projectId } = await req.json();
    console.log("🏗️ Project Scaffolding:", { projectName, platform, minecraftVersion, projectId });

    if (!projectName || !platform || !minecraftVersion) {
      throw new Error('Project name, platform, and Minecraft version are required');
    }

    // Initialize Supabase client if projectId is provided
    let supabase = null;
    if (projectId) {
      supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
    }

    // Generate comprehensive project structure
    const generateProjectStructure = async (projectName: string, platform: string, mcVersion: string, description?: string) => {
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

      // Store files in database if projectId provided
      if (supabase && projectId) {
        console.log("🏗️ Storing files in database for project:", projectId);
        
        const fileInserts = Object.entries(projectFiles).map(([filePath, content]) => {
          const fileName = filePath.split('/').pop() || filePath;
          const parentPath = filePath.includes('/') ? filePath.substring(0, filePath.lastIndexOf('/')) : '';
          
          return {
            project_id: projectId,
            file_path: filePath,
            file_name: fileName,
            file_content: content,
            file_type: getFileType(fileName),
            is_directory: false,
            parent_path: parentPath || null
          };
        });

        // Also create directory entries
        const directories = new Set<string>();
        Object.keys(projectFiles).forEach(filePath => {
          const parts = filePath.split('/');
          for (let i = 1; i < parts.length; i++) {
            const dirPath = parts.slice(0, i).join('/');
            if (dirPath) directories.add(dirPath);
          }
        });

        const dirInserts = Array.from(directories).map(dirPath => {
          const dirName = dirPath.split('/').pop() || dirPath;
          const parentPath = dirPath.includes('/') ? dirPath.substring(0, dirPath.lastIndexOf('/')) : '';
          
          return {
            project_id: projectId,
            file_path: dirPath,
            file_name: dirName,
            file_content: '',
            file_type: 'folder',
            is_directory: true,
            parent_path: parentPath || null
          };
        });

        // Insert directories first, then files
        if (dirInserts.length > 0) {
          const { error: dirError } = await supabase
            .from('project_files')
            .insert(dirInserts);
          
          if (dirError) {
            console.error("Error inserting directories:", dirError);
          }
        }

        if (fileInserts.length > 0) {
          const { error: fileError } = await supabase
            .from('project_files')
            .insert(fileInserts);
          
          if (fileError) {
            console.error("Error inserting files:", fileError);
          }
        }

        console.log(`🏗️ Created ${dirInserts.length} directories and ${fileInserts.length} files`);
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

    const projectStructure = await generateProjectStructure(projectName, platform, minecraftVersion, description);
    
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

function getFileType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'java': return 'java';
    case 'json': return 'json';
    case 'toml': return 'toml';
    case 'properties': return 'properties';
    case 'gradle': return 'gradle';
    case 'mcmeta': return 'mcmeta';
    case 'png': return 'image';
    case 'md': return 'markdown';
    case 'bat': case 'sh': return 'script';
    default: return 'text';
  }
}

function generateBuildGradle(platform: string, mcVersion: string, normalizedName: string): string {
  const templates = {
    forge: `plugins {
    id 'eclipse'
    id 'maven-publish'
    id 'net.minecraftforge.gradle' version '5.1.+'
}

version = '1.0.0'
group = 'com.yourname.${normalizedName}'
archivesBaseName = '${normalizedName}'

java.toolchain.languageVersion = JavaLanguageVersion.of(17)

minecraft {
    mappings channel: 'official', version: '${mcVersion}'
    runs {
        client {
            workingDirectory project.file('run')
            property 'forge.logging.markers', 'REGISTRIES'
            property 'forge.logging.console.level', 'debug'
            mods {
                ${normalizedName} {
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
    id 'net.neoforged.gradle' version '7.0.+'
}

version = '1.0.0'
group = 'com.yourname.${normalizedName}'

java.toolchain.languageVersion = JavaLanguageVersion.of(17)

minecraft {
    mappings channel: 'official', version: '${mcVersion}'
    runs {
        client {
            workingDirectory project.file('run')
        }
    }
}

dependencies {
    implementation "net.neoforged:neoforge:\${neo_version}"
}`
  };

  return templates[platform as keyof typeof templates] || templates.forge;
}

function generateGradleProperties(platform: string, mcVersion: string): string {
  return `minecraft_version=${mcVersion}
mod_version=1.0.0
maven_group=com.yourname.modname
archives_base_name=modname

${platform === 'fabric' || platform === 'quilt' ? `
loader_version=0.14.+
fabric_version=0.91.0+${mcVersion}
` : ''}`;
}

function generateMainModClass(projectName: string, platform: string, normalizedName: string): string {
  if (platform === 'forge' || platform === 'neoforge') {
    return `package com.yourname.${normalizedName};

import net.minecraftforge.common.MinecraftForge;
import net.minecraftforge.fml.common.Mod;
import net.minecraftforge.fml.event.lifecycle.FMLCommonSetupEvent;
import net.minecraftforge.fml.javafmlmod.FMLJavaModLoadingContext;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

@Mod("${normalizedName}")
public class ${projectName}Mod {
    public static final String MODID = "${normalizedName}";
    private static final Logger LOGGER = LogManager.getLogger();
    
    public ${projectName}Mod() {
        FMLJavaModLoadingContext.get().getModEventBus().addListener(this::setup);
        MinecraftForge.EVENT_BUS.register(this);
    }
    
    private void setup(final FMLCommonSetupEvent event) {
        LOGGER.info("Hello from ${projectName}!");
    }
}`;
  } else {
    return `package com.yourname.${normalizedName};

import net.fabricmc.api.ModInitializer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ${projectName}Mod implements ModInitializer {
    public static final String MODID = "${normalizedName}";
    public static final Logger LOGGER = LoggerFactory.getLogger(MODID);
    
    @Override
    public void onInitialize() {
        LOGGER.info("Hello from ${projectName}!");
    }
}`;
  }
}

function generateModItems(projectName: string, normalizedName: string): string {
  return `package com.yourname.${normalizedName}.registry;

import net.minecraft.world.item.Item;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.ForgeRegistries;
import net.minecraftforge.registries.RegistryObject;
import com.yourname.${normalizedName}.${projectName}Mod;

public class ModItems {
    public static final DeferredRegister<Item> ITEMS = 
        DeferredRegister.create(ForgeRegistries.ITEMS, ${projectName}Mod.MODID);
    
    public static final RegistryObject<Item> EXAMPLE_ITEM = ITEMS.register("example_item",
        () -> new Item(new Item.Properties()));
}`;
}

function generateModBlocks(projectName: string, normalizedName: string): string {
  return `package com.yourname.${normalizedName}.registry;

import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.SoundType;
import net.minecraft.world.level.material.Material;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.ForgeRegistries;
import net.minecraftforge.registries.RegistryObject;
import com.yourname.${normalizedName}.${projectName}Mod;

public class ModBlocks {
    public static final DeferredRegister<Block> BLOCKS = 
        DeferredRegister.create(ForgeRegistries.BLOCKS, ${projectName}Mod.MODID);
    
    public static final RegistryObject<Block> EXAMPLE_BLOCK = BLOCKS.register("example_block",
        () -> new Block(Block.Properties.of(Material.METAL)
            .strength(3.0f, 3.0f)
            .sound(SoundType.METAL)));
}`;
}

function generateModEntities(projectName: string, normalizedName: string): string {
  return `package com.yourname.${normalizedName}.registry;

import net.minecraft.world.entity.EntityType;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.ForgeRegistries;
import com.yourname.${normalizedName}.${projectName}Mod;

public class ModEntities {
    public static final DeferredRegister<EntityType<?>> ENTITIES = 
        DeferredRegister.create(ForgeRegistries.ENTITY_TYPES, ${projectName}Mod.MODID);
    
    // Register custom entities here
}`;
}

function generateCommonEvents(projectName: string, normalizedName: string): string {
  return `package com.yourname.${normalizedName}.events;

import net.minecraftforge.event.entity.player.PlayerEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;
import net.minecraftforge.fml.common.Mod;
import com.yourname.${normalizedName}.${projectName}Mod;

@Mod.EventBusSubscriber(modid = ${projectName}Mod.MODID)
public class CommonEvents {
    
    @SubscribeEvent
    public static void onPlayerLogin(PlayerEvent.PlayerLoggedInEvent event) {
        ${projectName}Mod.LOGGER.info("Player {} logged in", event.getEntity().getName().getString());
    }
}`;
}

function generateModConfig(projectName: string, normalizedName: string): string {
  return `package com.yourname.${normalizedName}.config;

import net.minecraftforge.common.ForgeConfigSpec;
import net.minecraftforge.fml.ModLoadingContext;
import net.minecraftforge.fml.config.ModConfig;

public class ModConfig {
    private static final ForgeConfigSpec.Builder BUILDER = new ForgeConfigSpec.Builder();
    
    public static final ForgeConfigSpec.BooleanValue EXAMPLE_SETTING = BUILDER
        .comment("An example configuration setting")
        .define("exampleSetting", true);
    
    public static final ForgeConfigSpec SPEC = BUILDER.build();
    
    public static void register() {
        ModLoadingContext.get().registerConfig(ModConfig.Type.COMMON, SPEC);
    }
}`;
}

function generateModsToml(normalizedName: string, description: string): string {
  return `modLoader="javafml"
loaderVersion="[47,)"
license="MIT"

[[mods]]
modId="${normalizedName}"
version="\${version}"
displayName="${normalizedName}"
description='''
${description}
'''

[[dependencies.${normalizedName}]]
modId="forge"
mandatory=true
versionRange="[47,)"
ordering="NONE"
side="BOTH"

[[dependencies.${normalizedName}]]
modId="minecraft"
mandatory=true
versionRange="[1.20.1,1.21)"
ordering="NONE"
side="BOTH"`;
}

function generateFabricModJson(normalizedName: string, description?: string): string {
  return `{
  "schemaVersion": 1,
  "id": "${normalizedName}",
  "version": "\${version}",
  "name": "${normalizedName}",
  "description": "${description || 'A Fabric mod'}",
  "authors": ["Your Name"],
  "contact": {},
  "license": "MIT",
  "icon": "assets/${normalizedName}/icon.png",
  "environment": "*",
  "entrypoints": {
    "main": [
      "com.yourname.${normalizedName}.${normalizedName}Mod"
    ]
  },
  "mixins": [],
  "depends": {
    "fabricloader": ">=0.14.0",
    "fabric": "*",
    "minecraft": "~1.20.1"
  }
}`;
}

function generateQuiltModJson(normalizedName: string, description?: string): string {
  return `{
  "schema_version": 1,
  "quilt_loader": {
    "group": "com.yourname.${normalizedName}",
    "id": "${normalizedName}",
    "version": "\${version}",
    "metadata": {
      "name": "${normalizedName}",
      "description": "${description || 'A Quilt mod'}",
      "contributors": {
        "Your Name": "Owner"
      },
      "contact": {},
      "license": "MIT",
      "icon": "assets/${normalizedName}/icon.png"
    },
    "intermediate_mappings": "net.fabricmc:intermediary",
    "entrypoints": {
      "init": "com.yourname.${normalizedName}.${normalizedName}Mod"
    },
    "depends": [
      {
        "id": "quilt_loader",
        "versions": ">=0.19.0"
      },
      {
        "id": "quilted_fabric_api",
        "versions": ">=7.0.0"
      },
      {
        "id": "minecraft",
        "versions": ">=1.20.1"
      }
    ]
  }
}`;
}

function generatePackMcmeta(): string {
  return `{
  "pack": {
    "description": "Resources for your mod",
    "pack_format": 15,
    "forge:resource_pack_format": 15,
    "forge:data_pack_format": 12
  }
}`;
}

function generateLangFile(normalizedName: string): string {
  return `{
  "item.${normalizedName}.example_item": "Example Item",
  "block.${normalizedName}.example_block": "Example Block",
  "itemGroup.${normalizedName}": "${normalizedName} Items"
}`;
}

function generateItemModel(): string {
  return `{
  "parent": "item/generated",
  "textures": {
    "layer0": "mymod:item/example_item"
  }
}`;
}

function generateBlockModel(): string {
  return `{
  "parent": "block/cube_all",
  "textures": {
    "all": "mymod:block/example_block"
  }
}`;
}

function generateBlockstate(): string {
  return `{
  "variants": {
    "": {
      "model": "mymod:block/example_block"
    }
  }
}`;
}

function generateRecipe(normalizedName: string): string {
  return `{
  "type": "minecraft:crafting_shaped",
  "pattern": [
    "###",
    "###",
    "###"
  ],
  "key": {
    "#": {
      "item": "minecraft:iron_ingot"
    }
  },
  "result": {
    "item": "${normalizedName}:example_item",
    "count": 1
  }
}`;
}

function generateLootTable(): string {
  return `{
  "type": "minecraft:block",
  "pools": [
    {
      "rolls": 1,
      "entries": [
        {
          "type": "minecraft:item",
          "name": "mymod:example_block"
        }
      ]
    }
  ]
}`;
}

function generateBlockTag(): string {
  return `{
  "replace": false,
  "values": [
    "mymod:example_block"
  ]
}`;
}

function generateAdvancement(normalizedName: string): string {
  return `{
  "display": {
    "icon": {
      "item": "${normalizedName}:example_item"
    },
    "title": {
      "translate": "advancement.${normalizedName}.root"
    },
    "description": {
      "translate": "advancement.${normalizedName}.root.desc"
    },
    "background": "minecraft:textures/gui/advancements/backgrounds/adventure.png",
    "show_toast": true,
    "announce_to_chat": true,
    "hidden": false
  },
  "criteria": {
    "get_item": {
      "trigger": "minecraft:inventory_changed",
      "conditions": {
        "items": [
          {
            "items": ["${normalizedName}:example_item"]
          }
        ]
      }
    }
  }
}`;
}

function generateTestClass(projectName: string, normalizedName: string): string {
  return `package com.yourname.${normalizedName};

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class ModTests {
    
    @Test
    public void testModInitialization() {
        // Add your tests here
        assertTrue(true);
    }
}`;
}

function generateReadme(projectName: string, description?: string): string {
  return `# ${projectName}

${description || 'A Minecraft mod'}

## Features

- Feature 1
- Feature 2
- Feature 3

## Installation

1. Install Minecraft Forge
2. Download the mod .jar file
3. Place it in your mods folder
4. Launch Minecraft

## Development

This mod was created using ModForge AI Workbench.

## License

MIT License`;
}

function generateGitignore(): string {
  return `# Gradle
.gradle/
build/
out/
classes/

# IntelliJ IDEA
.idea/
*.iml
*.ipr
*.iws

# Eclipse
.eclipse/
.metadata/
.project
.classpath
.settings/
bin/

# Visual Studio Code
.vscode/

# OS
.DS_Store
Thumbs.db

# Mod development
run/
logs/
crash-reports/

# Minecraft
minecraft_server.*.jar
server.properties
eula.txt
banned-*.json
ops.json
usercache.json
usernamecache.json
whitelist.json`;
}

function generateGradlewScript(): string {
  return `#!/bin/sh

# Gradle start up script for UNIX

# Add default JVM options here
DEFAULT_JVM_OPTS='"-Xmx64m" "-Xms64m"'

# Use the maximum available, or set MAX_FD != -1 to use that value
MAX_FD="maximum"

APP_NAME="Gradle"
APP_BASE_NAME=\`basename "$0"\`

# Locate Java
if [ -n "$JAVA_HOME" ] ; then
    if [ -x "$JAVA_HOME/jre/sh/java" ] ; then
        JAVACMD="$JAVA_HOME/jre/sh/java"
    else
        JAVACMD="$JAVA_HOME/bin/java"
    fi
    if [ ! -x "$JAVACMD" ] ; then
        die "ERROR: JAVA_HOME is set to an invalid directory: $JAVA_HOME"
    fi
else
    JAVACMD="java"
    which java >/dev/null 2>&1 || die "ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH."
fi

exec "$JAVACMD" "$@"`;
}

function generateGradlewBat(): string {
  return `@rem Gradle startup script for Windows

@if "%DEBUG%" == "" @echo off
@rem Set local scope for the variables with windows NT shell
if "%OS%"=="Windows_NT" setlocal

set DIRNAME=%~dp0
if "%DIRNAME%" == "" set DIRNAME=.
set APP_BASE_NAME=%~n0
set APP_HOME=%DIRNAME%

@rem Resolve any "." and ".." in APP_HOME to make it shorter.
for %%i in ("%APP_HOME%") do set APP_HOME=%%~fi

@rem Add default JVM options here. You can also use JAVA_OPTS and GRADLE_OPTS to pass JVM options to this script.
set DEFAULT_JVM_OPTS="-Xmx64m" "-Xms64m"

@rem Find java.exe
if defined JAVA_HOME goto findJavaFromJavaHome

set JAVA_EXE=java.exe
%JAVA_EXE% -version >NUL 2>&1
if "%ERRORLEVEL%" == "0" goto execute

echo.
echo ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.
echo.

goto fail

:findJavaFromJavaHome
set JAVA_HOME=%JAVA_HOME:"=%
set JAVA_EXE=%JAVA_HOME%/bin/java.exe

if exist "%JAVA_EXE%" goto execute

echo.
echo ERROR: JAVA_HOME is set to an invalid directory: %JAVA_HOME%
echo.

:fail
rem Set variable GRADLE_EXIT_CONSOLE if you need the _script_ return code instead of
rem the _cmd_ return code in batch files.
exit /b 1

:execute
"%JAVA_EXE%" %DEFAULT_JVM_OPTS% %JAVA_OPTS% %GRADLE_OPTS% "-Dorg.gradle.appname=%APP_BASE_NAME%" -classpath "%CLASSPATH%" org.gradle.wrapper.GradleWrapperMain %*

:end
@rem End local scope for the variables with windows NT shell
if "%ERRORLEVEL%"=="0" goto mainEnd

:fail
rem Set variable GRADLE_EXIT_CONSOLE if you need the _script_ return code instead of
rem the _cmd_ return code in batch files.
exit /b 1

:mainEnd
if "%OS%"=="Windows_NT" endlocal

:omega`;
}