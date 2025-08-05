import { ProjectFile as FileManagerFile } from './useFileManager';
import { ProjectFile as ProjectEditorFile } from './useProjectEditor';

// Unified ProjectFile interface with all required fields
export interface ProjectFile {
  id: string;
  name: string;
  path: string;
  content: string;
  type: 'java' | 'json' | 'mcmeta' | 'properties' | 'toml' | 'bat' | 'sh' | 'md' | 'gitignore' | 'gradle';
  modified: boolean;
  isFolder?: boolean;
  parentPath?: string;
  
  // Database fields (all required for useFileManager compatibility)
  project_id: string;
  file_path: string;
  file_name: string;
  file_content: string;
  file_type: string;
  is_directory?: boolean;
  parent_path?: string;
  created_at?: string;
  updated_at?: string;
}

// Adapter functions to convert between different interfaces
export const adaptFromFileManager = (file: FileManagerFile): ProjectFile => {
  return {
    id: file.id,
    name: file.file_name || file.name || '',
    path: file.file_path || file.path || '',
    content: file.file_content || file.content || '',
    type: mapFileType(file.file_type || file.type || 'java'),
    modified: file.modified || false,
    isFolder: file.is_directory || file.isFolder || false,
    parentPath: file.parent_path || file.parentPath,
    
    // Database fields (required)
    project_id: file.project_id,
    file_path: file.file_path || file.path || '',
    file_name: file.file_name || file.name || '',
    file_content: file.file_content || file.content || '',
    file_type: file.file_type || file.type || 'java',
    is_directory: file.is_directory || file.isFolder || false,
    parent_path: file.parent_path || file.parentPath,
    created_at: file.created_at,
    updated_at: file.updated_at
  };
};

export const adaptToFileManager = (file: ProjectFile): FileManagerFile => {
  return {
    id: file.id,
    project_id: file.project_id || '',
    file_path: file.path,
    file_name: file.name,
    file_content: file.content,
    file_type: file.type,
    is_directory: file.isFolder || false,
    parent_path: file.parentPath,
    created_at: file.created_at || new Date().toISOString(),
    updated_at: file.updated_at || new Date().toISOString(),
    
    // Keep new fields for compatibility
    name: file.name,
    path: file.path,
    content: file.content,
    type: file.type,
    modified: file.modified,
    isFolder: file.isFolder,
    parentPath: file.parentPath
  };
};

export const adaptFromProjectEditor = (file: ProjectEditorFile): ProjectFile => {
  return {
    id: file.id,
    name: file.name,
    path: file.path,
    content: file.content,
    type: file.type,
    modified: file.modified,
    isFolder: file.isFolder,
    parentPath: file.parentPath,
    
    // Keep legacy fields if they exist
    project_id: file.project_id,
    file_path: file.file_path,
    file_name: file.file_name,
    file_content: file.file_content,
    file_type: file.file_type,
    is_directory: file.is_directory,
    parent_path: file.parent_path,
    created_at: file.created_at,
    updated_at: file.updated_at
  };
};

export const adaptToProjectEditor = (file: ProjectFile): ProjectEditorFile => {
  return {
    id: file.id,
    name: file.name,
    path: file.path,
    content: file.content,
    type: file.type,
    modified: file.modified,
    isFolder: file.isFolder,
    parentPath: file.parentPath,
    
    // Keep database fields if they exist
    project_id: file.project_id,
    file_path: file.file_path,
    file_name: file.file_name,
    file_content: file.file_content,
    file_type: file.file_type,
    is_directory: file.is_directory,
    parent_path: file.parent_path,
    created_at: file.created_at,
    updated_at: file.updated_at
  };
};

// Helper function to map file types
const mapFileType = (fileType: string): ProjectFile['type'] => {
  switch (fileType.toLowerCase()) {
    case 'java': return 'java';
    case 'json': return 'json';
    case 'mcmeta': return 'mcmeta';
    case 'properties': return 'properties';
    case 'toml': return 'toml';
    case 'bat': return 'bat';
    case 'sh': return 'sh';
    case 'md': return 'md';
    case 'gitignore': return 'gitignore';
    case 'gradle': return 'gradle';
    default: return 'java';
  }
};
