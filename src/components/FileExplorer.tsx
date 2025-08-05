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
import { useFileManager, ProjectFile, ForgeFileType } from '@/hooks/useFileManager';
import { useToast } from '@/hooks/use-toast';

interface FileExplorerProps {
  projectId: string;
  modId: string;
  onFileSelect: (file: ProjectFile) => void;
  selectedFile?: ProjectFile;
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
      const newPath = targetPath === 'root' ? fileData.file_name : `${targetPath}/${fileData.file_name}`;
      
      // Update file path in database
      await updateFile(fileData.id, fileData.file_content, newPath);
      
      toast({
        title: "File moved",
        description: `${fileData.file_name} moved to ${targetPath}`,
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
      await createFolder('src/main', undefined);
      await createFolder('src/main/java', undefined);
      await createFolder('src/main/java/com', undefined);
      await createFolder('src/main/java/com/example', undefined);
      await createFolder('src/main/java/com/example/' + modId, undefined);
      await createFolder('src/main/resources', undefined);
      await createFolder('src/main/resources/META-INF', undefined);
      await createFolder('src/main/resources/assets', undefined);
      await createFolder('src/main/resources/assets/' + modId, undefined);
      await createFolder('src/main/resources/assets/' + modId + '/textures', undefined);
      await createFolder('src/main/resources/assets/' + modId + '/textures/item', undefined);
      await createFolder('src/main/resources/assets/' + modId + '/textures/block', undefined);
      await createFolder('src/main/resources/assets/' + modId + '/models', undefined);
      await createFolder('src/main/resources/assets/' + modId + '/models/item', undefined);
      await createFolder('src/main/resources/assets/' + modId + '/models/block', undefined);
      await createFolder('src/main/resources/assets/' + modId + '/blockstates', undefined);
      await createFolder('src/main/resources/assets/' + modId + '/lang', undefined);
      await createFolder('src/main/resources/data', undefined);
      await createFolder('src/main/resources/data/' + modId, undefined);
      await createFolder('src/main/resources/data/' + modId + '/recipes', undefined);
      await createFolder('gradle', undefined);
      await createFolder('gradle/wrapper', undefined);
      
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
        }
      ];

      // Create all sample files
      for (const file of sampleFiles) {
        await createFile(file.name, file.path, file.content, file.type);
      }

      toast({
        title: "Sample project created!",
        description: "Complete mod structure with working code generated",
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

  const renderTreeNode = (name: string, node: any, path: string = '', level: number = 0) => {
    const fullPath = path ? `${path}/${name}` : name;
    const isExpanded = expandedFolders.has(fullPath);
    const isSelected = selectedFile?.id === node.file?.id;
    const isDragOver = dragOverFolder === fullPath;

    const toggleExpanded = () => {
      const newExpanded = new Set(expandedFolders);
      if (isExpanded) {
        newExpanded.delete(fullPath);
      } else {
        newExpanded.add(fullPath);
      }
      setExpandedFolders(newExpanded);
    };

    return (
      <div key={fullPath} className="space-y-1">
        <div 
          className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted transition-colors ${
            isSelected ? 'bg-primary/10 text-primary' : ''
          } ${isDragOver ? 'bg-accent/20 border-2 border-accent border-dashed' : ''}`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          draggable={node.type === 'file'}
          onDragStart={(e) => node.file && handleDragStart(e, node.file)}
          onDragOver={node.type === 'folder' ? (e) => handleDragOver(e, fullPath) : undefined}
          onDragLeave={node.type === 'folder' ? handleDragLeave : undefined}
          onDrop={node.type === 'folder' ? (e) => handleDrop(e, fullPath) : undefined}
          onClick={() => {
            if (node.type === 'folder') {
              toggleExpanded();
            } else if (node.file) {
              onFileSelect(node.file);
            }
          }}
        >
          {node.type === 'folder' && (
            <>
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <Folder className="w-4 h-4 text-blue-400" />
            </>
          )}
          {node.type === 'file' && (
            <>
              <div className="w-4"></div>
              <FileCode className="w-4 h-4 text-green-400" />
            </>
          )}
          <span className="text-sm font-mono">{name}</span>
          {node.file && !node.file.is_directory && (
            <>
              <Badge variant="outline" className="ml-auto text-xs">
                {node.file.file_type}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteFile(node.file.id);
                }}
                className="ml-1 h-6 w-6 p-0 text-destructive hover:text-destructive-foreground hover:bg-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </>
          )}
        </div>
        
        {node.type === 'folder' && isExpanded && Object.keys(node.children).length > 0 && (
          <div>
            {Object.entries(node.children).map(([childName, childNode]) =>
              renderTreeNode(childName, childNode, fullPath, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  const handleCreate = async () => {
    if (!newFileName.trim()) return;

    try {
      const parentPath = selectedParent === 'root' ? undefined : selectedParent || undefined;
      
      if (createType === 'folder') {
        await createFolder(newFileName, parentPath);
      } else if (createType === 'template' && selectedTemplate) {
        await createFileFromTemplate(selectedTemplate, newFileName, parentPath, modId);
      } else {
        const filePath = parentPath ? `${parentPath}/${newFileName}` : newFileName;
        await createFile(newFileName, filePath);
      }
      
      setShowCreateDialog(false);
      setNewFileName('');
      setSelectedTemplate(null);
      setSelectedParent('');
    } catch (error) {
      console.error('Error creating file/folder:', error);
    }
  };

  const fileTree = buildFileTree(files);
  
  const getFolderOptions = (files: ProjectFile[]) => {
    return files
      .filter(f => f.is_directory)
      .map(f => ({ value: f.file_path, label: f.file_path }));
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Folder className="w-5 h-5 text-primary" />
            Project Files
          </CardTitle>
          <div className="flex gap-1">
            <Button 
              variant="outline" 
              size="sm"
              onClick={createSampleProject}
              title="Create complete sample mod"
            >
              <Package className="w-3 h-3" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setCreateType('template');
                setShowCreateDialog(true);
              }}
            >
              <Plus className="w-3 h-3" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setCreateType('folder');
                setShowCreateDialog(true);
              }}
            >
              <FolderPlus className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          <div className="p-4">
            {loading ? (
              <div className="text-center text-muted-foreground py-8">
                Loading files...
              </div>
            ) : Object.keys(fileTree).length > 0 ? (
              <div className="space-y-1">
                {Object.entries(fileTree).map(([name, node]) =>
                  renderTreeNode(name, node)
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <FileCode className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No files yet. Create your first file to get started!</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setCreateType('template');
                    setShowCreateDialog(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create File
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Create New {createType === 'folder' ? 'Folder' : 'File'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {createType === 'template' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">File Type</label>
                <Select 
                  value={selectedTemplate?.name || ''} 
                  onValueChange={(value) => {
                    const template = forgeFileTypes.find(t => t.name === value);
                    setSelectedTemplate(template || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select file type" />
                  </SelectTrigger>
                  <SelectContent>
                    {['java', 'resource', 'data', 'config'].map(category => (
                      <div key={category}>
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                          {category}
                        </div>
                        {forgeFileTypes
                          .filter(t => t.category === category)
                          .map(template => (
                            <SelectItem key={template.name} value={template.name}>
                              <div className="flex items-center gap-2">
                                <span>{template.icon}</span>
                                <span>{template.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {template.extension}
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
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder={createType === 'folder' ? 'folder-name' : 'filename'}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Parent Folder (Optional)</label>
              <Select value={selectedParent} onValueChange={setSelectedParent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select parent folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">Root</SelectItem>
                  {getFolderOptions(files).map(folder => (
                    <SelectItem key={folder.value} value={folder.value}>
                      {folder.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreate}
                disabled={!newFileName.trim() || (createType === 'template' && !selectedTemplate)}
              >
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}