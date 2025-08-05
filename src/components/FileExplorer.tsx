import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Folder, 
  File, 
  Plus, 
  FolderPlus, 
  Trash2, 
  FileCode,
  ChevronRight,
  ChevronDown,
  Package,
  Download
} from 'lucide-react';
import { useFileManager, ForgeFileType } from '@/hooks/useFileManager';
import { ProjectFile, adaptFromFileManager } from '@/hooks/useFileAdapter';
import { useToast } from '@/hooks/use-toast';

interface FileExplorerProps {
  projectId: string;
  modId: string;
  onFileSelect: (file: any) => void;
  selectedFile?: any;
}

export function FileExplorer({ projectId, modId, onFileSelect, selectedFile }: FileExplorerProps) {
  const { 
    files, 
    loading, 
    createFile, 
    createFolder, 
    deleteFile, 
    updateFile,
    createFileFromTemplate, 
    forgeFileTypes 
  } = useFileManager(projectId);
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createType, setCreateType] = useState<'file' | 'folder' | 'template'>('file');
  const [newFileName, setNewFileName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ForgeFileType | null>(null);
  const [selectedParent, setSelectedParent] = useState<string>('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src']));
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const { toast } = useToast();

  const adaptedFiles = files.map(adaptFromFileManager);
  
  const buildFileTree = (files: ProjectFile[]) => {
    const tree: Record<string, any> = {};
    
    files.forEach(file => {
      const parts = file.file_path.split('/');
      let current = tree;
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!current[part]) {
          current[part] = {
            type: i === parts.length - 1 ? (file.is_directory ? 'folder' : 'file') : 'folder',
            file: i === parts.length - 1 ? file : null,
            children: {}
          };
        }
        current = current[part].children;
      }
    });
    
    return tree;
  };

  const handleDragStart = (e: React.DragEvent, file: ProjectFile) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(file));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetPath: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFolder(targetPath);
  };

  const handleDragLeave = () => {
    setDragOverFolder(null);
  };

  const handleDrop = async (e: React.DragEvent, targetPath: string) => {
    e.preventDefault();
    setDragOverFolder(null);
    
    try {
      const fileData = JSON.parse(e.dataTransfer.getData('text/plain'));
      const newPath = targetPath === '' ? fileData.file_name : `${targetPath}/${fileData.file_name}`;
      
      // Update file path in database
      await updateFile(fileData.id, fileData.file_content, newPath);
      
      toast({
        title: "File moved",
        description: `${fileData.file_name} moved to ${targetPath || 'root'}`,
      });
    } catch (error) {
      console.error('Error moving file:', error);
      toast({
        title: "Error",
        description: "Failed to move file",
        variant: "destructive"
      });
    }
  };

  const createSampleProject = async () => {
    try {
      toast({
        title: "Creating sample project",
        description: "Generating complete mod structure...",
      });
      
      // Create main mod folder structure
      await createFolder('src', undefined);
      await createFolder('main', 'src');
      await createFolder('java', 'src/main');
      await createFolder('com', 'src/main/java');
      await createFolder('example', 'src/main/java/com');
      await createFolder(modId, 'src/main/java/com/example');
      await createFolder('resources', 'src/main');
      await createFolder('META-INF', 'src/main/resources');
      await createFolder('assets', 'src/main/resources');
      await createFolder(modId, 'src/main/resources/assets');
      await createFolder('textures', `src/main/resources/assets/${modId}`);
      await createFolder('item', `src/main/resources/assets/${modId}/textures`);
      await createFolder('block', `src/main/resources/assets/${modId}/textures`);
      await createFolder('models', `src/main/resources/assets/${modId}`);
      await createFolder('item', `src/main/resources/assets/${modId}/models`);
      await createFolder('block', `src/main/resources/assets/${modId}/models`);
      await createFolder('blockstates', `src/main/resources/assets/${modId}`);
      await createFolder('lang', `src/main/resources/assets/${modId}`);
      await createFolder('data', 'src/main/resources');
      await createFolder(modId, 'src/main/resources/data');
      await createFolder('recipes', `src/main/resources/data/${modId}`);
      await createFolder('gradle', undefined);
      await createFolder('wrapper', 'gradle');
      
      // Create sample files with complete content
      const sampleFiles = [
        // Root files
        {
          name: 'build.gradle',
          path: 'build.gradle',
          content: `buildscript {
    repositories {
        maven { url = 'https://maven.minecraftforge.net' }
        mavenCentral()
    }
    dependencies {
        classpath group: 'net.minecraftforge.gradle', name: 'ForgeGradle', version: '5.1.+', changing: true
    }
}

plugins {
    id 'eclipse'
    id 'maven-publish'
    id 'net.minecraftforge.gradle' version '5.1.+'
}

version = '0.0.1-1.20.1'
group = 'com.example.${modId}'
archivesBaseName = '${modId}'

java.toolchain.languageVersion = JavaLanguageVersion.of(17)

minecraft {
    mappings channel: 'official', version: '1.20.1'
    
    runs {
        client {
            workingDirectory project.file('run')
            property 'forge.logging.markers', 'REGISTRIES'
            property 'forge.logging.console.level', 'debug'
            mods {
                ${modId} {
                    source sourceSets.main
                }
            }
        }
        
        server {
            workingDirectory project.file('run')
            property 'forge.logging.markers', 'REGISTRIES'
            property 'forge.logging.console.level', 'debug'
            mods {
                ${modId} {
                    source sourceSets.main
                }
            }
        }
    }
}

sourceSets.main.resources { srcDir 'src/generated/resources' }

repositories {
    maven {
        name = 'ParchmentMC'
        url = 'https://maven.parchmentmc.org'
    }
}

dependencies {
    minecraft 'net.minecraftforge:forge:1.20.1-47.2.0'
}

jar {
    manifest {
        attributes([
                "Specification-Title"     : "${modId}",
                "Specification-Vendor"    : "ExampleAuthor",
                "Specification-Version"   : "1",
                "Implementation-Title"    : project.name,
                "Implementation-Version"  : project.jar.archiveVersion,
                "Implementation-Vendor"   : "ExampleAuthor",
                "Implementation-Timestamp": new Date().format("yyyy-MM-dd'T'HH:mm:ssZ")
        ])
    }
}`,
          type: 'gradle'
        },
        {
          name: 'settings.gradle',
          path: 'settings.gradle',
          content: `pluginManagement {
    repositories {
        gradlePluginPortal()
        maven {
            name = 'MinecraftForge'
            url = 'https://maven.minecraftforge.net/'
        }
    }
}`,
          type: 'gradle'
        },
        {
          name: 'gradle.properties',
          path: 'gradle.properties',
          content: `org.gradle.jvmargs=-Xmx3G
org.gradle.daemon=false`,
          type: 'properties'
        },
        {
          name: 'gradlew',
          path: 'gradlew',
          content: `#!/usr/bin/env sh
./gradle/wrapper/gradle-wrapper.jar`,
          type: 'shell'
        },
        {
          name: 'gradlew.bat',
          path: 'gradlew.bat',
          content: `@rem Execute Gradle
@rem Add default JVM options here
gradle-wrapper.jar %*`,
          type: 'batch'
        },
        {
          name: 'gradle-wrapper.properties',
          path: 'gradle/wrapper/gradle-wrapper.properties',
          content: `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.1.1-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists`,
          type: 'properties'
        },
        {
          name: 'mods.toml',
          path: 'src/main/resources/META-INF/mods.toml',
          content: `modLoader="javafml"
loaderVersion="[47,)"
license="MIT"

[[mods]]
modId="${modId}"
version="0.0.1"
displayName="${modId.charAt(0).toUpperCase() + modId.slice(1)}"
updateJSONURL=""
displayURL=""
logoFile=""
credits=""
authors="YourName"
description='''
A sample Minecraft mod created with ModForge AI Workbench.
'''

[[dependencies.${modId}]]
modId="forge"
mandatory=true
versionRange="[47,)"
ordering="NONE"
side="BOTH"

[[dependencies.${modId}]]
modId="minecraft"
mandatory=true
versionRange="[1.20.1,1.21)"
ordering="NONE"
side="BOTH"`,
          type: 'toml'
        },
        {
          name: 'pack.mcmeta',
          path: 'src/main/resources/pack.mcmeta',
          content: `{
    "pack": {
        "description": "${modId.charAt(0).toUpperCase() + modId.slice(1)} resources",
        "pack_format": 15,
        "forge:resource_pack_format": 15,
        "forge:data_pack_format": 12
    }
}`,
          type: 'json'
        },
        // Main mod class
        {
          name: modId.charAt(0).toUpperCase() + modId.slice(1) + 'Mod.java',
          path: `src/main/java/com/example/${modId}/${modId.charAt(0).toUpperCase() + modId.slice(1)}Mod.java`,
          content: `package com.example.${modId};

import net.minecraftforge.common.MinecraftForge;
import net.minecraftforge.eventbus.api.IEventBus;
import net.minecraftforge.fml.common.Mod;
import net.minecraftforge.fml.event.lifecycle.FMLCommonSetupEvent;
import net.minecraftforge.fml.javafmlmod.FMLJavaModLoadingContext;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

@Mod("${modId}")
public class ${modId.charAt(0).toUpperCase() + modId.slice(1)}Mod {
    public static final String MOD_ID = "${modId}";
    private static final Logger LOGGER = LogManager.getLogger();

    public ${modId.charAt(0).toUpperCase() + modId.slice(1)}Mod() {
        IEventBus modEventBus = FMLJavaModLoadingContext.get().getModEventBus();
        
        // Register our items and blocks
        ModItems.register(modEventBus);
        ModBlocks.register(modEventBus);
        
        modEventBus.addListener(this::commonSetup);
        MinecraftForge.EVENT_BUS.register(this);
        
        LOGGER.info("${modId.charAt(0).toUpperCase() + modId.slice(1)} mod loaded!");
    }

    private void commonSetup(final FMLCommonSetupEvent event) {
        LOGGER.info("Common setup for ${modId.charAt(0).toUpperCase() + modId.slice(1)} mod");
    }
}`,
          type: 'java'
        },
        {
          name: 'ModItems.java',
          path: `src/main/java/com/example/${modId}/ModItems.java`,
          content: `package com.example.${modId};

import net.minecraft.world.item.CreativeModeTab;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.Rarity;
import net.minecraftforge.eventbus.api.IEventBus;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.ForgeRegistries;
import net.minecraftforge.registries.RegistryObject;

public class ModItems {
    public static final DeferredRegister<Item> ITEMS = 
        DeferredRegister.create(ForgeRegistries.ITEMS, ${modId.charAt(0).toUpperCase() + modId.slice(1)}Mod.MOD_ID);

    // Example custom item
    public static final RegistryObject<Item> EXAMPLE_ITEM = ITEMS.register("example_item",
        () -> new Item(new Item.Properties()
            .tab(CreativeModeTab.TAB_MISC)
            .rarity(Rarity.UNCOMMON)
            .stacksTo(64)));

    public static void register(IEventBus eventBus) {
        ITEMS.register(eventBus);
    }
}`,
          type: 'java'
        },
        {
          name: 'ModBlocks.java',
          path: `src/main/java/com/example/${modId}/ModBlocks.java`,
          content: `package com.example.${modId};

import net.minecraft.world.item.BlockItem;
import net.minecraft.world.item.CreativeModeTab;
import net.minecraft.world.item.Item;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.SoundType;
import net.minecraft.world.level.block.state.BlockBehaviour;
import net.minecraft.world.level.material.Material;
import net.minecraftforge.eventbus.api.IEventBus;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.ForgeRegistries;
import net.minecraftforge.registries.RegistryObject;

import java.util.function.Supplier;

public class ModBlocks {
    public static final DeferredRegister<Block> BLOCKS = 
        DeferredRegister.create(ForgeRegistries.BLOCKS, ${modId.charAt(0).toUpperCase() + modId.slice(1)}Mod.MOD_ID);

    // Example custom block
    public static final RegistryObject<Block> EXAMPLE_BLOCK = registerBlock("example_block",
        () -> new Block(BlockBehaviour.Properties.of(Material.STONE)
            .strength(3.0f, 3.0f)
            .sound(SoundType.STONE)
            .requiresCorrectToolForDrops()));

    private static <T extends Block> RegistryObject<T> registerBlock(String name, Supplier<T> block) {
        RegistryObject<T> toReturn = BLOCKS.register(name, block);
        registerBlockItem(name, toReturn);
        return toReturn;
    }

    private static <T extends Block> RegistryObject<Item> registerBlockItem(String name, RegistryObject<T> block) {
        return ModItems.ITEMS.register(name, () -> new BlockItem(block.get(), 
            new Item.Properties().tab(CreativeModeTab.TAB_BUILDING_BLOCKS)));
    }

    public static void register(IEventBus eventBus) {
        BLOCKS.register(eventBus);
    }
}`,
          type: 'java'
        },
        {
          name: 'en_us.json',
          path: `src/main/resources/assets/${modId}/lang/en_us.json`,
          content: `{
  "item.${modId}.example_item": "Example Item",
  "block.${modId}.example_block": "Example Block",
  "itemGroup.${modId}": "${modId.charAt(0).toUpperCase() + modId.slice(1)} Items"
}`,
          type: 'json'
        },
        {
          name: 'example_item.json',
          path: `src/main/resources/assets/${modId}/models/item/example_item.json`,
          content: `{
  "parent": "item/generated",
  "textures": {
    "layer0": "${modId}:item/example_item"
  }
}`,
          type: 'json'
        },
        {
          name: 'example_block.json',
          path: `src/main/resources/assets/${modId}/models/block/example_block.json`,
          content: `{
  "parent": "block/cube_all",
  "textures": {
    "all": "${modId}:block/example_block"
  }
}`,
          type: 'json'
        },
        {
          name: 'example_block.json',
          path: `src/main/resources/assets/${modId}/models/item/example_block.json`,
          content: `{
  "parent": "${modId}:block/example_block"
}`,
          type: 'json'
        },
        {
          name: 'example_block.json',
          path: `src/main/resources/assets/${modId}/blockstates/example_block.json`,
          content: `{
  "variants": {
    "": {
      "model": "${modId}:block/example_block"
    }
  }
}`,
          type: 'json'
        },
        {
          name: 'example_recipe.json',
          path: `src/main/resources/data/${modId}/recipes/example_recipe.json`,
          content: `{
  "type": "minecraft:crafting_shaped",
  "pattern": [
    "###",
    "###",
    "###"
  ],
  "key": {
    "#": {
      "item": "minecraft:cobblestone"
    }
  },
  "result": {
    "item": "${modId}:example_block",
    "count": 1
  }
}`,
          type: 'json'
        }
      ];
      
      for (const fileSpec of sampleFiles) {
        const parentPath = fileSpec.path.includes('/') ? fileSpec.path.substring(0, fileSpec.path.lastIndexOf('/')) : '';
        await createFile(
          fileSpec.name,
          fileSpec.path,
          fileSpec.content,
          fileSpec.type,
          false,
          parentPath || undefined
        );
      }
      
      toast({
        title: "Sample project created!",
        description: `Complete Forge mod project with ${sampleFiles.length} files created`,
      });
      
    } catch (error) {
      console.error('Error creating sample project:', error);
      toast({
        title: "Error",
        description: "Failed to create sample project",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (file: ProjectFile) => {
    if (confirm(`Are you sure you want to delete ${file.file_name}?`)) {
      await deleteFile(file.id);
    }
  };

  const clearProject = async () => {
    if (confirm('Are you sure you want to clear the entire project? This will delete ALL files and cannot be undone.')) {
      try {
        // Delete all files
        for (const file of files) {
          await deleteFile(file.id);
        }
        toast({
          title: "Project cleared",
          description: "All files have been deleted from the project",
        });
      } catch (error) {
        console.error('Error clearing project:', error);
        toast({
          title: "Error",
          description: "Failed to clear project",
          variant: "destructive"
        });
      }
    }
  };

  const handleCreate = async () => {
    if (!newFileName.trim()) return;
    
    const parentPath = selectedParent === 'root' ? undefined : selectedParent;
    
    try {
      if (createType === 'folder') {
        await createFolder(newFileName, parentPath);
      } else if (createType === 'template' && selectedTemplate) {
        await createFileFromTemplate(selectedTemplate, newFileName, parentPath, modId);
      } else {
        await createFile(newFileName, parentPath ? `${parentPath}/${newFileName}` : newFileName, '', 'text', false, parentPath);
      }
      
      setShowCreateDialog(false);
      setNewFileName('');
      setSelectedTemplate(null);
      setSelectedParent('');
    } catch (error) {
      console.error('Error creating file/folder:', error);
    }
  };

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFileTree = (tree: any, depth = 0, parentPath = '') => {
    return Object.entries(tree).map(([name, node]: [string, any]) => {
      const path = parentPath ? `${parentPath}/${name}` : name;
      const isExpanded = expandedFolders.has(path);
      
      return (
        <div key={path}>
          {node.type === 'folder' ? (
            <div
              className={`flex items-center gap-2 py-1 px-2 cursor-pointer hover:bg-muted/50 rounded group ${
                dragOverFolder === path ? 'bg-primary/20' : ''
              }`}
              style={{ paddingLeft: `${(depth + 1) * 12}px` }}
              onClick={() => toggleFolder(path)}
              onDragOver={(e) => handleDragOver(e, path)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, path)}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <Folder className="h-4 w-4 text-blue-500" />
              <span className="text-sm flex-1">{name}</span>
              {node.file && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(node.file);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ) : (
            <div
              className={`flex items-center gap-2 py-1 px-2 cursor-pointer hover:bg-muted/50 rounded group ${
                selectedFile?.id === node.file?.id ? 'bg-primary/10' : ''
              }`}
              style={{ paddingLeft: `${(depth + 1) * 12}px` }}
              onClick={() => onFileSelect(node.file)}
              draggable
              onDragStart={(e) => handleDragStart(e, node.file)}
            >
              <File className="h-4 w-4 text-gray-500" />
              <span className="text-sm flex-1">{name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(node.file);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
          
          {node.type === 'folder' && isExpanded && Object.keys(node.children).length > 0 && (
            renderFileTree(node.children, depth + 1, path)
          )}
        </div>
      );
    });
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="p-6">
          <div className="text-center">Loading files...</div>
        </CardContent>
      </Card>
    );
  }

  const tree = buildFileTree(adaptedFiles);
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Folder className="h-5 w-5" />
          Project Files
        </CardTitle>
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Add File
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {setCreateType('folder'); setShowCreateDialog(true);}}
            className="flex items-center gap-1"
          >
            <FolderPlus className="h-4 w-4" />
            Add Folder
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={createSampleProject}
            className="flex items-center gap-1"
          >
            <Package className="h-4 w-4" />
            Sample Project
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={clearProject}
            className="flex items-center gap-1"
          >
            <Trash2 className="h-4 w-4" />
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="p-2">
            {/* Root drop zone */}
            <div
              className={`p-2 border-2 border-dashed rounded mb-2 ${
                dragOverFolder === '' ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'
              }`}
              onDragOver={(e) => handleDragOver(e, '')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, '')}
            >
              <span className="text-sm text-muted-foreground">Root Directory</span>
            </div>
            
            {Object.keys(tree).length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <FileCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No files yet</p>
                <p className="text-sm">Create your first file or generate a sample project</p>
              </div>
            ) : (
              renderFileTree(tree)
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {createType === 'folder' ? 'Create New Folder' : 
               createType === 'template' ? 'Create From Template' : 'Create New File'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={createType === 'file' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCreateType('file')}
              >
                File
              </Button>
              <Button
                variant={createType === 'folder' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCreateType('folder')}
              >
                Folder
              </Button>
              <Button
                variant={createType === 'template' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCreateType('template')}
              >
                Template
              </Button>
            </div>

            {createType === 'template' && (
              <div>
                <label className="block text-sm font-medium mb-2">Select Template</label>
                <Select
                  value={selectedTemplate?.name || ''}
                  onValueChange={(value) => {
                    const template = forgeFileTypes.find(t => t.name === value);
                    setSelectedTemplate(template || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(
                      forgeFileTypes.reduce((acc, type) => {
                        if (!acc[type.category]) acc[type.category] = [];
                        acc[type.category].push(type);
                        return acc;
                      }, {} as Record<string, ForgeFileType[]>)
                    ).map(([category, types]) => (
                      <div key={category}>
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                          {category}
                        </div>
                        {types.map(type => (
                          <SelectItem key={type.name} value={type.name}>
                            <div className="flex items-center gap-2">
                              <span>{type.icon}</span>
                              <span>{type.name}</span>
                              <Badge variant="secondary" className="text-xs">
                                {type.extension}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                {createType === 'folder' ? 'Folder Name' : 'File Name'}
              </label>
              <Input
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder={createType === 'folder' ? 'my-folder' : 'MyFile.java'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Parent Directory</label>
              <Select value={selectedParent} onValueChange={setSelectedParent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select parent directory" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">Root Directory</SelectItem>
                  {files.filter(f => f.is_directory).map(folder => (
                    <SelectItem key={folder.id} value={folder.file_path}>
                      {folder.file_path}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!newFileName.trim()}>
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}