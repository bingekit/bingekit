import React from 'react';
import { useAppContext } from '../../context/AppContext';

export const ThemeStyles = () => {
  const { theme } = useAppContext();

  return (
    <style>{`
      :root {
        --theme-titlebar: ${theme.titlebarBg};
        --theme-sidebar: ${theme.sidebarBg};
        --theme-main: ${theme.mainBg};
        --theme-mainBg: ${theme.mainBg};
        --theme-border: ${theme.border};
        --theme-accent: ${theme.accent};
        --theme-text-main: ${theme.textMain};
        --theme-text-sec: ${theme.textSec};
        
        --theme-titlebar-text: ${theme.titlebarText || theme.textSec || '#a1a1aa'};
        --theme-titlebar-text-hover: ${theme.titlebarTextHover || theme.textMain || '#fafafa'};
        --theme-titlebar-accent: ${theme.titlebarAccent || theme.accent || '#6366f1'};
        --theme-titlebar-alt: ${theme.titlebarAlt || '#18181b'};
        --theme-titlebar-alt2: ${theme.titlebarAlt2 || '#27272a'};
        --theme-sidebar-text: ${theme.sidebarText || theme.textSec || '#a1a1aa'};
        --theme-urlbarBg: ${theme.urlbarBg || 'color-mix(in srgb, var(--theme-text-main) 4%, transparent)'};
        --theme-urlbarText: ${theme.urlbarText || theme.titlebarTextHover || '#fafafa'};
        --theme-urlbarIcon: ${theme.urlbarIcon || theme.urlbarText || theme.titlebarTextHover || '#a1a1aa'};
        --theme-surface: var(--theme-main);
      }

      /* Essential Layout Backgrounds mapped to IDs */
      #titlebar-region { background-color: var(--theme-titlebar) !important; border-color: color-mix(in srgb, var(--theme-border) 50%, var(--theme-titlebar)) !important; }
      #sidebar-region { background-color: var(--theme-sidebar) !important; border-color: color-mix(in srgb, var(--theme-border) 50%, var(--theme-sidebar)) !important; }
      #main-region, #main-region > div { background-color: var(--theme-main) !important; }

      /* General Borders / Overrides */
      .border-zinc-900, .border-zinc-800, .border-zinc-800\\/50, .border-zinc-800\\/60, .border-zinc-800\\/80, .border-zinc-700 { 
        border-color: color-mix(in srgb, var(--theme-border) 50%, transparent) !important; 
      }

      /* Dynamic Component Backgrounds using Transparent Tinting */
      .bg-zinc-950 { background-color: transparent !important; }
      .bg-zinc-900 { background-color: color-mix(in srgb, var(--theme-text-main) 3%, transparent) !important; }
      .bg-zinc-800 { background-color: color-mix(in srgb, var(--theme-text-main) 7%, transparent) !important; }
      .bg-zinc-700 { background-color: color-mix(in srgb, var(--theme-text-main) 12%, transparent) !important; }
      .bg-zinc-900\\/50, .bg-zinc-950\\/50 { background-color: color-mix(in srgb, var(--theme-text-main) 2%, transparent) !important; }
      .bg-zinc-900\\/30, .bg-zinc-900\\/40 { background-color: color-mix(in srgb, var(--theme-text-main) 1.5%, transparent) !important; }
      .bg-zinc-900\\/80 { background-color: color-mix(in srgb, var(--theme-text-main) 4%, transparent) !important; }

      /* Hover states for standard background tints */
      .hover\\:bg-zinc-900:hover { background-color: color-mix(in srgb, var(--theme-text-main) 5%, transparent) !important; }
      .hover\\:bg-zinc-800:hover { background-color: color-mix(in srgb, var(--theme-text-main) 9%, transparent) !important; }
      .hover\\:bg-zinc-700:hover { background-color: color-mix(in srgb, var(--theme-text-main) 15%, transparent) !important; }
      .hover\\:bg-zinc-900\\/80:hover { background-color: color-mix(in srgb, var(--theme-text-main) 6%, transparent) !important; }
      .hover\\:bg-zinc-900\\/50:hover { background-color: color-mix(in srgb, var(--theme-text-main) 4%, transparent) !important; }

      /* Generic Accent Colors */
      .text-indigo-500, .text-indigo-400, .text-indigo-300, .text-emerald-500, .text-emerald-400, .text-emerald-300 { color: var(--theme-accent) !important; }
      .bg-indigo-500, .bg-indigo-600, .bg-emerald-500, .bg-emerald-600 { background-color: var(--theme-accent) !important; border-color: var(--theme-accent) !important; }
      .bg-indigo-500\\/10, .bg-emerald-500\\/10 { background-color: color-mix(in srgb, var(--theme-accent) 10%, transparent) !important; }
      .bg-indigo-500\\/20, .bg-emerald-500\\/20 { background-color: color-mix(in srgb, var(--theme-accent) 20%, transparent) !important; }
      .bg-indigo-500\\/30, .bg-emerald-500\\/30 { background-color: color-mix(in srgb, var(--theme-accent) 30%, transparent) !important; }
      .border-indigo-500, .border-indigo-500\\/30, .border-indigo-500\\/40, .border-indigo-500\\/50, .border-emerald-500, .border-emerald-500\\/30 { border-color: color-mix(in srgb, var(--theme-accent) 50%, transparent) !important; }
      .fill-indigo-400, .fill-emerald-400 { fill: var(--theme-accent) !important; }
      .hover\\:text-indigo-400:hover, .hover\\:text-emerald-400:hover, .hover\\:text-emerald-300:hover { color: var(--theme-accent) !important; filter: drop-shadow(0 0 4px var(--theme-accent)); }
      .hover\\:bg-indigo-500\\/10:hover, .hover\\:bg-emerald-500\\/10:hover { background-color: color-mix(in srgb, var(--theme-accent) 10%, transparent) !important; }
      .hover\\:bg-emerald-500\\/30:hover { background-color: color-mix(in srgb, var(--theme-accent) 30%, transparent) !important; }
      .hover\\:border-emerald-500\\/30:hover { border-color: color-mix(in srgb, var(--theme-accent) 50%, transparent) !important; }

      /* Text Colors */
      .text-white, .text-zinc-50, .text-zinc-100, .text-zinc-200, .text-zinc-300 { color: var(--theme-text-main) !important; }
      .text-zinc-400, .text-zinc-500, .text-zinc-600 { color: var(--theme-text-sec) !important; }
      
      .hover\\:text-zinc-100:hover, .hover\\:text-zinc-200:hover, .hover\\:text-zinc-300:hover, .hover\\:text-white:hover { color: var(--theme-text-main) !important; }
      .hover\\:text-zinc-400:hover, .hover\\:text-zinc-500:hover { color: var(--theme-text-sec) !important; }

      /* Transparent overrides */
      input.bg-transparent, textarea.bg-transparent { background-color: transparent !important; }

      /* Hard Toolbar Fix */
      form#toolbar-form { display: flex !important; background-color: var(--theme-urlbarBg) !important; }
      form#toolbar-form:focus-within { background-color: color-mix(in srgb, var(--theme-urlbarBg) 80%, var(--theme-titlebar-alt2)) !important; }

      /* Global Selection */
      ::selection {
        background-color: color-mix(in srgb, var(--theme-accent) 20%, transparent) !important;
        color: var(--theme-accent) !important;
      }

      /* Titlebar Variables Overrides */
      #titlebar-region { color: var(--theme-titlebar-text) !important; }
      #titlebar-region .text-zinc-500, #titlebar-region .text-zinc-400 { color: var(--theme-titlebar-text) !important; }
      
      #titlebar-region .hover\\:text-zinc-100:hover, #titlebar-region .hover\\:text-zinc-200:hover, #titlebar-region .hover\\:text-zinc-300:hover, #titlebar-region .hover\\:text-white:hover { color: var(--theme-titlebar-text-hover) !important; filter: drop-shadow(0 0 2px var(--theme-titlebar-text-hover)); }
      #titlebar-region input.text-xs { color: var(--theme-urlbarText) !important; }
      #titlebar-region input::placeholder { color: color-mix(in srgb, var(--theme-urlbarText) 50%, transparent) !important; }
      
      #titlebar-region form#toolbar-form .urlbar-icon { color: color-mix(in srgb, var(--theme-urlbarIcon) 70%, transparent) !important; }
      #titlebar-region form#toolbar-form .hover\\:urlbar-icon-hover:hover, #titlebar-region form#toolbar-form button.hover\\:urlbar-icon-hover:hover { color: var(--theme-urlbarIcon) !important; }
      
      #sidebar-region { color: var(--theme-sidebar-text) !important; }
      #sidebar-region button.text-zinc-500 { color: var(--theme-sidebar-text) !important; }
      #sidebar-region button.hover\\:text-zinc-200:hover { color: color-mix(in srgb, var(--theme-sidebar-text) 50%, var(--theme-text-main)) !important; }

      #titlebar-region .border-indigo-500\\/50 { border-color: var(--theme-titlebar-accent) !important; }
      #titlebar-region .hover\\:text-indigo-400:hover { color: var(--theme-titlebar-accent) !important; }
      
      #titlebar-region .bg-zinc-800, #titlebar-region .bg-zinc-900, #titlebar-region form { background-color: var(--theme-titlebar-alt) !important; }
      #titlebar-region .border-zinc-800, #titlebar-region .border-zinc-800\\/80 { border-color: var(--theme-titlebar-alt2) !important; }
      
      #titlebar-region .hover\\:bg-zinc-800:hover, #titlebar-region button.hover\\:bg-zinc-800:hover { background-color: var(--theme-titlebar-alt2) !important; color: var(--theme-titlebar-text-hover) !important; }
      
      #titlebar-region form:focus-within { background-color: var(--theme-titlebar-alt2) !important; border-color: var(--theme-titlebar-accent) !important; }
      #titlebar-region .bg-indigo-500\\/10 { background-color: color-mix(in srgb, var(--theme-titlebar-accent) 15%, transparent) !important; }
      #titlebar-region .hover\\:bg-indigo-500\\/20:hover { background-color: color-mix(in srgb, var(--theme-titlebar-accent) 25%, transparent) !important; }
      
      #titlebar-region .bg-red-500\\/90:hover { background-color: rgb(239 68 68 / 0.9) !important; color: white !important; filter: none !important; }
      #titlebar-region .w-px.bg-zinc-800 { background-color: var(--theme-titlebar-alt2) !important; }
      
      /* Multi-tab Toolbar overrides (It is on sidebar Bg, not titlebar Bg) */
      #titlebar-region .multi-tab-toolbar { color: var(--theme-sidebar-text) !important; }
      #titlebar-region .multi-tab-toolbar .text-zinc-500, #titlebar-region .multi-tab-toolbar .text-zinc-400 { color: var(--theme-sidebar-text) !important; }
      #titlebar-region .multi-tab-toolbar .hover\\:text-zinc-200:hover, #titlebar-region .multi-tab-toolbar .hover\\:text-zinc-300:hover { color: color-mix(in srgb, var(--theme-sidebar-text) 50%, var(--theme-text-main)) !important; filter: none !important; }
      
      #titlebar-region .multi-tab-toolbar .bg-indigo-500\\/10 { background-color: color-mix(in srgb, var(--theme-accent) 15%, transparent) !important; }
      #titlebar-region .multi-tab-toolbar .hover\\:bg-indigo-500\\/20:hover { background-color: color-mix(in srgb, var(--theme-accent) 25%, transparent) !important; }
      
      #titlebar-region .multi-tab-toolbar .bg-zinc-800, #titlebar-region .multi-tab-toolbar .bg-zinc-900 { background-color: color-mix(in srgb, var(--theme-text-main) 7%, transparent) !important; }
      #titlebar-region .multi-tab-toolbar .hover\\:bg-zinc-800:hover, #titlebar-region .multi-tab-toolbar button.hover\\:bg-zinc-800:hover { background-color: color-mix(in srgb, var(--theme-text-main) 12%, transparent) !important; color: var(--theme-text-main) !important; }
      
      #titlebar-region .multi-tab-toolbar form:focus-within { border-color: var(--theme-accent) !important; background-color: color-mix(in srgb, var(--theme-urlbarBg) 80%, var(--theme-mainBg)) !important; }
    `}</style>
  );
};
