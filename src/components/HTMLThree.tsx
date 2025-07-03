"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronRight,
  ChevronDown,
  Link,
  Globe,
  Folder,
  FileText,
  Eye,
  EyeOff,
} from "lucide-react";

interface URLNode {
  name: string;
  fullUrl: string;
  path: string;
  children: URLNode[];
  isExpanded: boolean;
  category?: string;
  depth: number;
}

interface HTMLThreeProps {
  links: string[];
  baseUrl: string;
  urlCategories?: Record<string, { type: string; examples: string[] }>;
  selectedCategories?: string[];
  onUrlClick?: (url: string) => void;
}

export default function HTMLThree({
  links,
  baseUrl,
  urlCategories = {},
  selectedCategories = [],
  onUrlClick,
}: HTMLThreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set([baseUrl]),
  );
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  // Build tree structure from URLs
  const treeData = useMemo(() => {
    const root: URLNode = {
      name: new URL(baseUrl).hostname,
      fullUrl: baseUrl,
      path: "",
      children: [],
      isExpanded: true,
      depth: 0,
    };

    // Get category for a URL
    const getCategoryForUrl = (url: string): string | undefined => {
      for (const [category, info] of Object.entries(urlCategories)) {
        if (info.examples.includes(url)) {
          return category;
        }
      }
      return undefined;
    };

    // Filter links based on selected categories if needed
    const filteredLinks =
      showOnlySelected && selectedCategories.length > 0
        ? links.filter((link) => {
            const category = getCategoryForUrl(link);
            return category && selectedCategories.includes(category);
          })
        : links;

    // Build tree structure
    const pathMap = new Map<string, URLNode>();
    pathMap.set("", root);

    filteredLinks.forEach((link) => {
      try {
        const url = new URL(link);
        const pathSegments = url.pathname
          .split("/")
          .filter((segment) => segment.length > 0);

        let currentPath = "";
        let currentNode = root;

        // Build path hierarchy
        pathSegments.forEach((segment, index) => {
          currentPath = currentPath ? `${currentPath}/${segment}` : segment;

          if (!pathMap.has(currentPath)) {
            const newNode: URLNode = {
              name: segment,
              fullUrl: `${url.origin}/${currentPath}`,
              path: currentPath,
              children: [],
              isExpanded: false,
              category: getCategoryForUrl(link),
              depth: index + 1,
            };

            pathMap.set(currentPath, newNode);
            currentNode.children.push(newNode);
          }

          currentNode = pathMap.get(currentPath)!;
        });

        // Add query parameters and fragments as leaf nodes if they exist
        if (url.search || url.hash) {
          const queryNode: URLNode = {
            name: `${url.search}${url.hash}` || "params",
            fullUrl: link,
            path: `${currentPath}${url.search}${url.hash}`,
            children: [],
            isExpanded: false,
            category: getCategoryForUrl(link),
            depth: currentNode.depth + 1,
          };
          currentNode.children.push(queryNode);
        }
      } catch {
        // Skip invalid URLs
        console.warn("Invalid URL:", link);
      }
    });

    // Sort children alphabetically
    const sortNode = (node: URLNode) => {
      node.children.sort((a, b) => a.name.localeCompare(b.name));
      node.children.forEach(sortNode);
    };
    sortNode(root);

    return root;
  }, [links, baseUrl, urlCategories, selectedCategories, showOnlySelected]);

  const toggleNode = (path: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const getCategoryColor = (category?: string): string => {
    if (!category) return "text-gray-600";

    const colors: Record<string, string> = {
      DATA_PAGES: "text-blue-600",
      CATEGORY_PAGES: "text-green-600",
      FILTER_PAGES: "text-purple-600",
      NAVIGATION_PAGES: "text-orange-600",
      UTILITY_PAGES: "text-gray-600",
      OTHER_PAGES: "text-indigo-600",
    };

    return colors[category] || "text-gray-600";
  };

  const getCategoryIcon = (category?: string) => {
    if (!category) return <FileText className="w-4 h-4" />;

    const icons: Record<string, React.ReactNode> = {
      DATA_PAGES: <FileText className="w-4 h-4" />,
      CATEGORY_PAGES: <Folder className="w-4 h-4" />,
      FILTER_PAGES: <Link className="w-4 h-4" />,
      NAVIGATION_PAGES: <Globe className="w-4 h-4" />,
      UTILITY_PAGES: <FileText className="w-4 h-4" />,
      OTHER_PAGES: <FileText className="w-4 h-4" />,
    };

    return icons[category] || <FileText className="w-4 h-4" />;
  };

  const renderNode = (node: URLNode): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.path);
    const hasChildren = node.children.length > 0;
    const isSelected =
      node.category && selectedCategories.includes(node.category);

    return (
      <div key={node.path} className="select-none">
        <div
          className={`flex items-center space-x-2 py-1 px-2 rounded hover:bg-gray-50 cursor-pointer group ${
            isSelected ? "bg-blue-50 border-l-2 border-blue-500" : ""
          }`}
          style={{ paddingLeft: `${node.depth * 20 + 8}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleNode(node.path);
            }
            if (onUrlClick) {
              onUrlClick(node.fullUrl);
            }
          }}
        >
          {hasChildren ? (
            <button className="flex-shrink-0 p-1">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>
          ) : (
            <div className="w-6 h-6 flex items-center justify-center">
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            </div>
          )}

          <div className={`flex-shrink-0 ${getCategoryColor(node.category)}`}>
            {getCategoryIcon(node.category)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span
                className={`text-sm font-medium truncate ${getCategoryColor(node.category)}`}
              >
                {node.name}
              </span>
              {node.category && (
                <span
                  className={`text-xs px-2 py-1 rounded-full bg-gray-100 ${getCategoryColor(node.category)}`}
                >
                  {node.category.replace("_", " ")}
                </span>
              )}
            </div>

            {node.depth > 0 && (
              <div className="text-xs text-gray-500 truncate group-hover:text-gray-700">
                {node.fullUrl}
              </div>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>{node.children.map((child) => renderNode(child))}</div>
        )}
      </div>
    );
  };

  const totalUrls = links.length;
  const visibleUrls =
    showOnlySelected && selectedCategories.length > 0
      ? links.filter((link) => {
          for (const [category, info] of Object.entries(urlCategories)) {
            if (
              info.examples.includes(link) &&
              selectedCategories.includes(category)
            ) {
              return true;
            }
          }
          return false;
        }).length
      : totalUrls;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Globe className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Website Structure
              </h3>
              <p className="text-sm text-gray-600">
                {visibleUrls} of {totalUrls} URLs
                {showOnlySelected && selectedCategories.length > 0 && (
                  <span className="ml-1 text-blue-600">
                    (filtered by selected categories)
                  </span>
                )}
              </p>
            </div>
          </div>

          {selectedCategories.length > 0 && (
            <button
              onClick={() => setShowOnlySelected(!showOnlySelected)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                showOnlySelected
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {showOnlySelected ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
              <span className="text-sm">
                {showOnlySelected ? "Show All" : "Show Selected Only"}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Tree View */}
      <div className="max-h-96 overflow-y-auto">
        <div className="p-2">{renderNode(treeData)}</div>
      </div>

      {/* Legend */}
      {Object.keys(urlCategories).length > 0 && (
        <div className="bg-gray-50 border-t border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-800 mb-3">
            URL Categories
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(urlCategories).map(([category]) => (
              <div key={category} className="flex items-center space-x-2">
                <div className={getCategoryColor(category)}>
                  {getCategoryIcon(category)}
                </div>
                <span className={`text-xs ${getCategoryColor(category)}`}>
                  {category.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
