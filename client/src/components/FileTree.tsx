import React, { useState } from 'react';
import { ChevronRight, ChevronDown, FileText, Folder, FolderOpen } from 'lucide-react';
import type { FileItem } from '../types';

interface FileTreeProps {
  items: FileItem[];
  onFileSelect: (path: string) => void;
  activePath: string | null;
}

const FileTreeItem: React.FC<{
  item: FileItem;
  level: number;
  onFileSelect: (path: string) => void;
  activePath: string | null;
}> = ({ item, level, onFileSelect, activePath }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => {
    if (item.type === 'directory') {
      setIsOpen(!isOpen);
    } else {
      onFileSelect(item.path);
    }
  };

  const isActive = activePath === item.path;

  return (
    <div>
      <div
        className={`flex items-center py-1 px-2 cursor-pointer hover:bg-gray-700 rounded select-none ${
          isActive ? 'bg-gray-600 hover:bg-gray-500' : ''
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={toggle}
      >
        <span className="mr-1">
          {item.type === 'directory' ? (
            isOpen ? (
              <ChevronDown size={14} className="text-gray-400" />
            ) : (
              <ChevronRight size={14} className="text-gray-400" />
            )
          ) : (
            <div className="w-[14px]" />
          )}
        </span>
        <span className="mr-2">
          {item.type === 'directory' ? (
            isOpen ? (
              <FolderOpen size={16} className="text-yellow-500" />
            ) : (
              <Folder size={16} className="text-yellow-500" />
            )
          ) : (
            <FileText size={16} className="text-blue-400" />
          )}
        </span>
        <span className="text-sm truncate">{item.name}</span>
      </div>
      {item.type === 'directory' && isOpen && item.children && (
        <div>
          {item.children.map((child) => (
            <FileTreeItem
              key={child.path}
              item={child}
              level={level + 1}
              onFileSelect={onFileSelect}
              activePath={activePath}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileTree: React.FC<FileTreeProps> = ({ items, onFileSelect, activePath }) => {
  return (
    <div className="overflow-y-auto h-full py-2">
      {items.map((item) => (
        <FileTreeItem
          key={item.path}
          item={item}
          level={0}
          onFileSelect={onFileSelect}
          activePath={activePath}
        />
      ))}
    </div>
  );
};
