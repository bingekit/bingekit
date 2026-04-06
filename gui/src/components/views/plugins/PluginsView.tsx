import React from "react";
import { PluginsSidebar } from "./PluginsSidebar";
import { PluginEditor } from "./PluginEditor";
import { PluginGallery } from "./PluginGallery";

export const PluginsView = () => {
  const [viewMode, setViewMode] = React.useState<"editor" | "gallery">("editor");

  return (
    <div className="flex h-full w-full overflow-hidden">
      <PluginsSidebar viewMode={viewMode} setViewMode={setViewMode} />
      <div className="flex-1 bg-zinc-950 p-6 overflow-y-auto no-scrollbar relative flex flex-col">
        {viewMode === "gallery" ? (
          <PluginGallery />
        ) : (
          <PluginEditor />
        )}
      </div>
    </div>
  );
};
