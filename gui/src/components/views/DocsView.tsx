import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Search, BookOpen, AlertCircle, Copy, Check, Hash, LayoutTemplate, Zap, Shield, Book, LayoutGrid, Plug, Bug, Tag } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import _Editor from 'react-simple-code-editor';
const Editor = (_Editor as any).default || _Editor;
import Prism from 'prismjs';
import { useAppContext } from '../../context/AppContext';
import { ahk } from '../../lib/ahk';
import { CustomSelect } from '../ui/CustomSelect';

import { DOCS_DATA } from './docs/docsData';

// Define doc hierarchy / sections manually for good ordering
const SECTION_ORDER = [
  { id: 'getting_started', icon: LayoutGrid, title: 'Getting Started' },
  { id: 'principles', icon: LayoutTemplate, title: 'Principles & Concepts' },
  { id: 'making_plugins', icon: Plug, title: 'Making Your Own Plugin' },
  { id: 'adblocking', icon: Shield, title: 'Adblocking & Filtering' },
  { id: 'logic_flows', icon: Zap, title: 'Logic Flows & Userscripts' },
  { id: 'types', icon: Hash, title: 'Types & Formats' },
  { id: 'protips', icon: Tag, title: 'Protips & Use-Cases' },
  { id: 'limitations', icon: Bug, title: 'Limitations & Debugging' },
  { id: 'examples', icon: Zap, title: 'Live Examples Playground' },
];

let globalDocsScrollY = 0;
let globalDocsActiveId = 'getting_started';
let globalDocsHighlightTarget: string | null = null;

const InteractiveCodeBlock = ({ inline, className, children, theme, isDarkMode, handleCopy, copiedText, ...props }: any) => {
  const initialCode = String(children).replace(/\n$/, '');
  const [liveCode, setLiveCode] = useState(initialCode);

  useEffect(() => {
    setLiveCode(initialCode);
  }, [initialCode]);

  const match = /language-(\w+)/.exec(className || '');
  const syntaxStyle = isDarkMode ? vscDarkPlus : oneLight;
  const isExecutable = className && className.includes('language-runjs');
  const displayLang = match && match[1] === 'runjs' ? 'javascript' : (match ? match[1] : '');

  if (!inline && match) {
    const executeExample = async () => {
      try {
        const executor = new Function('ahk', `return (async () => { ${liveCode} })();`);
        await Promise.race([
          executor(ahk),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Execution Timed Out!")), 10000))
        ]);
      } catch (err: any) {
        ahk.call('ShowToast', "Error: " + err.message, "error");
      }
    };

    const getIntellisenseToolbar = () => {
      if (!isExecutable) return null;

      const getPrimaryApi = (code: string) => {
        if (code.includes('SmartFetch')) return 'SmartFetch';
        if (code.includes('PromptSelectFolder')) return 'PromptSelectFolder';
        if (code.includes('RawFetchHTML')) return 'RawFetchHTML';
        if (code.includes('RawParseFetch')) return 'RawParseFetch';
        if (code.includes('CacheSet') || code.includes('CacheGet')) return 'CacheSet';
        if (code.includes('TogglePiP')) return 'TogglePiP';
        if (code.includes('GetAboutConfig')) return 'GetAboutConfig';
        if (code.includes('ShowToast')) return 'ShowToast';
        return '';
      };

      const primaryApi = getPrimaryApi(initialCode);

      if (primaryApi === 'ShowToast') {
        const toastPresets = [
          { label: 'Basic Notification', value: "ahk.call('ShowToast', 'Hello from the BingeKit Documentation!', 'info');" },
          { label: 'Error Alert', value: "ahk.call('ShowToast', 'Critical Failure', 'error');" },
          { label: 'Theme Match', value: "ahk.call('ShowToast', 'System synced with theme.', 'theme');" },
          { label: 'Custom JSON Config', value: "ahk.call('ShowToast', 'Custom Layout', '{ \"bgC\":\"18181b\", \"textC\":\"e4e4e7\", \"borderC\":\"ef4444\" }');" }
        ];

        return (
          <div className="flex flex-wrap gap-x-4 gap-y-2 px-6 py-2.5 border-b border-black/10 items-center relative z-20" style={{ backgroundColor: theme.accent + '05', borderBottom: '1px solid ' + theme.border }}>
            <div className="flex items-center shrink-0">
              <span className="text-[11px] font-bold tracking-wider px-2 py-0.5 rounded-md" style={{ backgroundColor: theme.accent + '20', color: theme.accent }}>ShowToast</span>
            </div>
            <div className="h-4 w-px opacity-30 shrink-0" style={{ backgroundColor: theme.textSec }} />
            <div className="flex gap-2 items-center shrink-0">
              <span className="text-[11px] font-semibold" style={{ color: theme.textSec }}>Presets:</span>
              <CustomSelect
                options={toastPresets}
                value={toastPresets.find(p => p.value === liveCode)?.value || ''}
                onChange={(newVal) => setLiveCode(newVal)}
                className="w-48 text-[11px]"
                placeholder="Custom Script..."
              />
            </div>
            <div className="text-[10px] italic opacity-50 ml-auto break-words min-w-0" style={{ color: theme.textSec }}>
              ahk.call('ShowToast', msg, type?, arg2?, arg3?)
            </div>
          </div>
        );
      }

      if (primaryApi === 'CacheSet') {
        const cachePresets = [
          { label: 'Basic String Store', value: initialCode },
          { label: 'Object State Syncing', value: `ahk.call('CacheSet', 'userPrefs', JSON.stringify({ theme: 'dark', vol: 80 }));\nconst prefs = JSON.parse(ahk.call('CacheGet', 'userPrefs'));\nahk.call('ShowToast', 'Theme is: ' + prefs.theme, 'info');` }
        ];

        return (
          <div className="flex flex-wrap gap-x-4 gap-y-2 px-6 py-2.5 border-b border-black/10 items-center relative z-20" style={{ backgroundColor: theme.accent + '05', borderBottom: '1px solid ' + theme.border }}>
            <div className="flex gap-2 items-center shrink-0">
              <span className="text-[11px] font-bold tracking-wider px-2 py-0.5 rounded-md" style={{ backgroundColor: theme.accent + '20', color: theme.accent }}>Memory Cache</span>
            </div>
            <div className="h-4 w-px opacity-30 shrink-0" style={{ backgroundColor: theme.textSec }} />
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-semibold" style={{ color: theme.textSec }}>Presets:</span>
              <CustomSelect
                options={cachePresets}
                value={cachePresets.find(p => p.value === liveCode)?.value || ''}
                onChange={(newVal) => setLiveCode(newVal)}
                className="w-48 text-[11px]"
                placeholder="Custom Script..."
              />
            </div>
            <div className="text-[10px] italic opacity-50 ml-auto min-w-0" style={{ color: theme.textSec }}>
              ahk.call('CacheSet', key, val) | ahk.call('CacheGet', key)
            </div>
          </div>
        );
      }

      if (primaryApi === 'RawFetchHTML') {
        const fetchPresets = [
          { label: 'Basic GET Request', value: initialCode },
          { label: 'Fetch Raw Text Size', value: `const html = ahk.call('RawFetchHTML', 'https://example.com');\nahk.call('ShowToast', 'Extracted ' + html.length + ' bytes of raw html!', 'success');` }
        ];

        return (
          <div className="flex flex-wrap gap-x-4 gap-y-2 px-6 py-2.5 border-b border-black/10 items-center relative z-20" style={{ backgroundColor: theme.accent + '05', borderBottom: '1px solid ' + theme.border }}>
            <div className="flex gap-2 items-center shrink-0">
              <span className="text-[11px] font-bold tracking-wider px-2 py-0.5 rounded-md" style={{ backgroundColor: theme.accent + '20', color: theme.accent }}>RawFetchHTML</span>
            </div>
            <div className="h-4 w-px opacity-30 shrink-0" style={{ backgroundColor: theme.textSec }} />
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-semibold" style={{ color: theme.textSec }}>Presets:</span>
              <CustomSelect
                options={fetchPresets}
                value={fetchPresets.find(p => p.value === liveCode)?.value || ''}
                onChange={(newVal) => setLiveCode(newVal)}
                className="w-48 text-[11px]"
                placeholder="Custom Script..."
              />
            </div>
            <div className="text-[10px] italic opacity-50 ml-auto min-w-0" style={{ color: theme.textSec }}>
              ahk.call('RawFetchHTML', targetURL)
            </div>
          </div>
        );
      }

      if (primaryApi === 'RawParseFetch') {
        const fetchPresets = [
          { label: 'Headless DOM Exec', value: initialCode },
          { label: 'Extract Meta Tags', value: `window.RawParseFetch('https://example.com', \`\n  return new Promise(res => {\n    const meta = document.querySelector('meta[name="viewport"]');\n    res(meta ? meta.content : 'none');\n  });\n\`).then(data => ahk.call('ShowToast', 'Viewport rule: ' + data, 'info'));` }
        ];

        return (
          <div className="flex flex-wrap gap-x-4 gap-y-2 px-6 py-2.5 border-b border-black/10 items-center relative z-20" style={{ backgroundColor: theme.accent + '05', borderBottom: '1px solid ' + theme.border }}>
            <div className="flex gap-2 items-center shrink-0">
              <span className="text-[11px] font-bold tracking-wider px-2 py-0.5 rounded-md" style={{ backgroundColor: theme.accent + '20', color: theme.accent }}>RawParseFetch</span>
            </div>
            <div className="h-4 w-px opacity-30 shrink-0" style={{ backgroundColor: theme.textSec }} />
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-semibold" style={{ color: theme.textSec }}>Presets:</span>
              <CustomSelect
                options={fetchPresets}
                value={fetchPresets.find(p => p.value === liveCode)?.value || ''}
                onChange={(newVal) => setLiveCode(newVal)}
                className="w-48 text-[11px]"
                placeholder="Custom Script..."
              />
            </div>
            <div className="text-[10px] italic opacity-50 ml-auto min-w-0" style={{ color: theme.textSec }}>
              window.RawParseFetch(url, script)
            </div>
          </div>
        );
      }

      if (primaryApi === 'PromptSelectFolder') {
        const folderPresets = [
          { label: 'Native File Picker', value: initialCode },
          { label: 'Store Picked Path in Cache', value: `const handleFolder = (e) => {\n    if (e.detail && e.detail.id === 'save-target') {\n        window.removeEventListener('bk-folder-selected', handleFolder);\n        ahk.call('CacheSet', 'TargetFolder', e.detail.dir);\n        ahk.call('ShowToast', 'Saved to cache!', 'success');\n    }\n};\nwindow.addEventListener('bk-folder-selected', handleFolder);\nahk.call('PromptSelectFolder', 'save-target');` }
        ];

        return (
          <div className="flex flex-wrap gap-x-4 gap-y-2 px-6 py-2.5 border-b border-black/10 items-center relative z-20" style={{ backgroundColor: theme.accent + '05', borderBottom: '1px solid ' + theme.border }}>
            <div className="flex gap-2 items-center shrink-0">
              <span className="text-[11px] font-bold tracking-wider px-2 py-0.5 rounded-md" style={{ backgroundColor: theme.accent + '20', color: theme.accent }}>PromptSelectFolder</span>
            </div>
            <div className="h-4 w-px opacity-30 shrink-0" style={{ backgroundColor: theme.textSec }} />
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-semibold" style={{ color: theme.textSec }}>Presets:</span>
              <CustomSelect
                options={folderPresets}
                value={folderPresets.find(p => p.value === liveCode)?.value || ''}
                onChange={(newVal) => setLiveCode(newVal)}
                className="w-48 text-[11px]"
                placeholder="Custom Script..."
              />
            </div>
            <div className="text-[10px] italic opacity-50 ml-auto min-w-0" style={{ color: theme.textSec }}>
              ahk.call('PromptSelectFolder', eventId)
            </div>
          </div>
        );
      }

      if (primaryApi === 'SmartFetch') {
        const fetchPresets = [
          { label: 'Cloudflare Link Scraper', value: initialCode },
          { label: 'Extract Simple Title', value: `window.SmartFetch("https://google.com/", \`\n  return new Promise(resolve => resolve(document.title));\n\`).then(title => ahk.call("ShowToast", "Title: " + title, "success"));` },
          { label: 'Force Reveal Window', value: `ahk.call("ShowToast", "Revealing invisible edge layer natively!", "info");\nwindow.SmartFetch("https://example.com/", \`\n  // Immediately forces the DWM to spawn it front-and-center\n  window.BK_EXPOSE_FETCHER("Debugging SmartFetch Interactively", 1200, 800);\n\n  return new Promise(resolve => {\n     setTimeout(() => resolve("Look at the screen!"), 5000);\n  });\n\`).then(msg => ahk.call("ShowToast", msg, "success"));` }
        ];

        return (
          <div className="flex flex-wrap gap-x-4 gap-y-2 px-6 py-2.5 border-b border-black/10 items-center relative z-20" style={{ backgroundColor: theme.accent + '05', borderBottom: '1px solid ' + theme.border }}>
            <div className="flex gap-2 items-center shrink-0">
              <span className="text-[11px] font-bold tracking-wider px-2 py-0.5 rounded-md" style={{ backgroundColor: theme.accent + '20', color: theme.accent }}>SmartFetch (Promise)</span>
            </div>
            <div className="h-4 w-px opacity-30 shrink-0" style={{ backgroundColor: theme.textSec }} />
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-semibold" style={{ color: theme.textSec }}>Presets:</span>
              <CustomSelect
                options={fetchPresets}
                value={fetchPresets.find(p => p.value === liveCode)?.value || ''}
                onChange={(newVal) => setLiveCode(newVal)}
                className="w-48 text-[11px]"
                placeholder="Custom Script..."
              />
            </div>
            <div className="text-[10px] italic opacity-50 ml-auto min-w-0" style={{ color: theme.textSec }}>
              window.SmartFetch(url, script)
            </div>
          </div>
        );
      }

      return null;
    };

    return (
      <div className="my-8 shadow-sm">
        <div className="w-full px-5 py-3 flex justify-between items-center border-b backdrop-blur-md relative overflow-hidden rounded-t-[12px]" style={{ borderColor: theme.border, backgroundColor: theme.textMain + '05', border: '1px solid ' + theme.border, borderBottom: 'none' }}>
          <div className="absolute top-0 left-0 w-full h-[1px] opacity-20" style={{ background: `linear-gradient(90deg, transparent, ${theme.accent}, transparent)` }}></div>
          <div className="flex items-center relative z-10">
            <div className="w-1.5 h-4 rounded-full mr-3" style={{ backgroundColor: theme.accent }}></div>
            <span className="text-[12px] font-bold font-mono uppercase tracking-[0.2em] opacity-90 block" style={{ color: theme.textMain }}>
              {displayLang} {isExecutable && <span className="opacity-60 ml-2">(Live Sandbox)</span>}
            </span>
          </div>
          <div className="flex items-center gap-2 relative z-10">
            {isExecutable && (
              <button
                onClick={executeExample}
                className="px-3 py-1.5 rounded-lg flex items-center gap-2 text-[12px] font-semibold transition-all hover:bg-white/10 active:scale-95 border border-white/5"
                style={{ color: theme.accent, backgroundColor: theme.accent + '10' }}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Run</span>
              </button>
            )}
            <button
              onClick={() => handleCopy(liveCode)}
              className="px-3 py-1.5 rounded-lg flex items-center gap-2 text-[12px] font-semibold transition-all hover:bg-white/10 active:scale-95 border border-white/5"
              style={{ color: theme.textSec }}
            >
              {copiedText === liveCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-green-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 opacity-70" />
                  <span className="opacity-90">Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
        {getIntellisenseToolbar()}
        <div className="px-6 py-5 overflow-x-auto custom-scrollbar text-[14px] leading-[1.65] relative transition-colors duration-500 rounded-b-[12px] !border-t-0" style={{ border: '1px solid ' + theme.border, backgroundColor: 'transparent' }}>
          {isExecutable ? (
            <div className="relative font-mono font-medium block">
              <Editor
                value={liveCode}
                onValueChange={(code) => setLiveCode(code)}
                highlight={code => Prism.highlight(code, Prism.languages.javascript, 'javascript')}
                padding={0}
                style={{
                  fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
                  fontSize: 14,
                  minHeight: Math.max(2, liveCode.split('\n').length) * 23.1 + 'px'
                }}
                className="w-full bg-transparent text-inherit transition-colors min-h-full"
                textareaClassName="focus:outline-none"
              />
            </div>
          ) : (
            <SyntaxHighlighter
              style={{ ...syntaxStyle, "pre[class*=\"language-\"]": { ...(syntaxStyle["pre[class*=\"language-\"]"] || {}), background: "transparent", margin: 0, padding: 0 }, "code[class*=\"language-\"]": { ...(syntaxStyle["code[class*=\"language-\"]"] || {}), background: "transparent" } }}
              language={displayLang}
              PreTag="div"
              className="!bg-transparent !m-0 !p-0 font-mono tracking-tight"
            >
              {liveCode}
            </SyntaxHighlighter>
          )}
        </div>
      </div>
    );
  }
  return (
    <code className="before:content-none after:content-none font-mono text-[13.5px] font-semibold mx-0.5 whitespace-nowrap shadow-sm"
      style={{
        padding: '0.25rem 0.45rem',
        borderRadius: '6px',
        color: theme.accent,
        backgroundColor: theme.accent + '15',
        border: '1px solid ' + theme.accent + '25',
        boxShadow: `0 2px 4px -1px ${theme.accent}10`
      }}
      {...props}>
      {children}
    </code>
  );
};

export const DocsView = () => {
  const { theme } = useAppContext();
  const isDarkMode = parseInt(theme.textMain.replace('#', '') || 'ffffff', 16) > 0x888888;
  const [activeDocId, setActiveDocId] = useState(globalDocsActiveId);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);

  // Use our integrated DOCS_DATA
  const docs = DOCS_DATA;

  // Save/Load Scroll position locally
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = globalDocsScrollY;
    }
  }, []);

  const handleScroll = () => {
    if (contentRef.current) {
      globalDocsScrollY = contentRef.current.scrollTop;
    }
  };

  const handleDocClick = (id: string, preserveSearch: boolean = false) => {
    setActiveDocId(id);
    globalDocsActiveId = id;
    globalDocsScrollY = 0;
    if (contentRef.current && !preserveSearch) contentRef.current.scrollTop = 0;
    if (!preserveSearch) setSearchQuery('');
  };

  const currentDoc = docs.find(d => d.id === activeDocId);

  const filteredDocs = useMemo(() => {
    if (!searchQuery) return null;
    const lowerQuery = searchQuery.toLowerCase();
    const results: { docId: string; title: string, snippet: string }[] = [];

    docs.forEach(doc => {
      const lines = doc.content.split('\n');
      const titleMatch = doc.content.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1] : doc.id;

      if (title.toLowerCase().includes(lowerQuery)) {
        results.push({ docId: doc.id, title, snippet: 'Matched title' });
      } else {
        const matchIdx = lines.findIndex(l => l.toLowerCase().includes(lowerQuery));
        if (matchIdx !== -1) {
          results.push({
            docId: doc.id,
            title,
            snippet: lines[matchIdx].substring(0, 80) + '...'
          });
        }
      }
    });
    return results;
  }, [searchQuery, docs]);

  useEffect(() => {
    if (filteredDocs && filteredDocs.length === 1 && searchQuery.trim().length > 0) {
      if (activeDocId !== filteredDocs[0].docId) {
        handleDocClick(filteredDocs[0].docId, true);
      }
    }
  }, [filteredDocs, searchQuery, activeDocId]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Setup CSS Highlight API for search terminology inside the DOM
  useEffect(() => {
    // Scroll completely independently of highlighting if the target is an explicit element ID
    if (globalDocsHighlightTarget && globalDocsHighlightTarget.startsWith('elem-')) {
      const slug = globalDocsHighlightTarget.substring(5);
      setTimeout(() => {
        const element = document.getElementById(slug);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // visually blink the text to show the anchor location optionally
          element.style.transition = 'color 0.5s';
          element.style.color = theme.accent;
          setTimeout(() => { element.style.color = theme.textMain; }, 1000);
        }
        globalDocsHighlightTarget = null;
      }, 50);
      return;
    }

    // @ts-ignore - CSS Highlight API types may not be present in the TS version natively
    if (!window.CSS || !CSS.highlights) return;

    // @ts-ignore
    CSS.highlights.clear();

    const query = globalDocsHighlightTarget ? globalDocsHighlightTarget : searchQuery;
    if (!query || !contentRef.current || !activeDocId) {
      globalDocsHighlightTarget = null;
      return;
    }

    const lowerQuery = query.toLowerCase();

    // Slight delay to ensure React has fully committed the markdown DOM
    setTimeout(() => {
      if (!contentRef.current) return;
      const treeWalker = document.createTreeWalker(contentRef.current, NodeFilter.SHOW_TEXT);
      const ranges = [];
      let node;

      while ((node = treeWalker.nextNode())) {
        const text = node.nodeValue?.toLowerCase() || '';
        let startIndex = 0;
        let index;
        while ((index = text.indexOf(lowerQuery, startIndex)) !== -1) {
          const range = new Range();
          range.setStart(node, index);
          range.setEnd(node, index + lowerQuery.length);
          ranges.push(range);
          startIndex = index + lowerQuery.length;
        }
      }

      if (ranges.length > 0) {
        // @ts-ignore
        const highlight = new Highlight(...ranges);
        // @ts-ignore
        CSS.highlights.set('docs-search', highlight);

        const firstNode = ranges[0].startContainer;
        if (firstNode && firstNode.parentElement) {
          firstNode.parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      globalDocsHighlightTarget = null; // Clear manual highlight
    }, 50);

  }, [searchQuery, activeDocId]);

  return (
    <div className="flex h-full w-full overflow-hidden font-sans antialiased" style={{ backgroundColor: theme.main, color: theme.textMain }}>
      <style>{`
        ::highlight(docs-search) {
          background-color: ${theme.accent};
          color: #ffffff;
          border-radius: 4px;
        }
        ::selection {
          background-color: color-mix(in srgb, var(--theme-accent) 20%, transparent) !important;
          color: var(--theme-accent) !important;
        }
        .docs-content-container {
          background-image: 
            radial-gradient(at 100% 0%, ${theme.accent}10 0px, transparent 50%),
            radial-gradient(at 0% 100%, ${theme.accent}05 0px, transparent 50%);
        }
      `}</style>

      {/* Sidebar Navigation */}
      <div className="w-1/4 min-w-[250px] flex-shrink-0 flex flex-col border-r border-zinc-800/50 bg-zinc-950/50 z-10 overflow-hidden">
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-light tracking-tight text-zinc-100 flex items-center gap-2">
              <BookOpen size={20} className="text-indigo-400" /> Documentation
            </h2>
            <p className="text-xs text-zinc-500 mt-1">BingeKit developer guides.</p>
          </div>

          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <Search className="w-[18px] h-[18px] transition-colors duration-300 text-zinc-500" />
            </div>
            <input
              type="text"
              placeholder="Search guides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm rounded-xl py-2.5 outline-none transition-all placeholder:font-medium font-medium bg-zinc-900/50 border border-zinc-800/50 text-zinc-200 focus:border-indigo-500/50 focus:bg-zinc-900/80 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]"
              style={{ paddingLeft: '44px', paddingRight: '16px' }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-1 custom-scrollbar">
          {filteredDocs ? (
            <div className="animate-in fade-in duration-200">
              <div className="text-xs uppercase tracking-widest mb-4 pl-2 font-medium text-zinc-500">Search Results</div>
              {filteredDocs.length === 0 ? (
                <div className="py-10 flex flex-col items-center justify-center gap-3 text-zinc-600">
                  <Search className="w-8 h-8" />
                  <div className="font-medium text-sm">No matches found</div>
                </div>
              ) : (
                filteredDocs.map((res, i) => {
                  const isActive = activeDocId === res.docId;
                  return (
                    <button
                      key={i}
                      onClick={() => handleDocClick(res.docId, true)}
                      className={`w-full text-left p-4 rounded-xl mb-3 border cursor-pointer transition-all duration-300 block ${isActive
                        ? "bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.05)]"
                        : "bg-zinc-900/30 border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-900/50"
                        }`}
                    >
                      <div className={`font-medium text-[14px] leading-tight truncate transition-colors ${isActive ? 'text-indigo-300' : 'text-zinc-200'}`}>
                        {res.title}
                      </div>
                      <div className="text-[12px] truncate mt-1 text-zinc-500 leading-relaxed">
                        {res.snippet}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          ) : (
            <div className="animate-in fade-in duration-200">
              <div className="text-xs uppercase tracking-widest mb-4 pl-2 font-medium text-zinc-500">Overview</div>
              <div className="space-y-3">
                {SECTION_ORDER.map(section => {
                  const Icon = section.icon;
                  const isActive = activeDocId === section.id;
                  if (!docs.find(d => d.id === section.id)) return null;

                  return (
                    <button
                      key={section.id}
                      onClick={() => handleDocClick(section.id)}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-300 ${isActive
                        ? "bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.05)]"
                        : "bg-zinc-900/30 border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-900/50"
                        }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${isActive
                        ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
                        : "bg-zinc-900/40 text-zinc-500 border-zinc-700/50"
                        }`}
                      >
                        <Icon className="w-[14px] h-[14px] flex-shrink-0" />
                      </div>
                      <span className={`text-sm tracking-wide truncate transition-all flex-1 text-left ${isActive ? 'font-medium text-zinc-200' : 'text-zinc-400'}`}>
                        {section.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto w-full custom-scrollbar scroll-smooth relative docs-content-container"
        onScroll={handleScroll}
        style={{ padding: '3rem' }}
      >
        <div className="max-w-[880px] mx-auto relative z-10 w-full">
          {currentDoc ? (
            <div className="prose max-w-none select-text pb-32
              prose-p:leading-[1.9] prose-p:tracking-[0.01em]
              prose-li:tracking-[0.01em]
              prose-strong:font-extrabold prose-strong:text-[current]
              marker:text-[current]"
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ node, children, ...props }: any) => {
                    const text = React.Children.toArray(children).join('');
                    const slug = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
                    return (
                      <div className="mt-8 mb-12">
                        <h1 id={slug} className="text-5xl font-black tracking-tighter leading-tight mb-6" style={{ color: theme.textMain }} {...props}>{children}</h1>
                        <div className="h-1.5 w-24 rounded-full bg-gradient-to-r" style={{ backgroundImage: `linear-gradient(to right, ${theme.accent}, transparent)` }}></div>
                      </div>
                    );
                  },
                  h2: ({ node, children, ...props }: any) => {
                    const text = React.Children.toArray(children).join('');
                    const slug = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
                    return <h2 id={slug} className="text-3xl font-bold tracking-tight mt-20 mb-8 border-b pb-4 drop-shadow-sm" style={{ color: theme.textMain, borderColor: theme.border + '50' }} {...props}>{children}</h2>;
                  },
                  h3: ({ node, children, ...props }: any) => {
                    const text = React.Children.toArray(children).join('');
                    const slug = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
                    return <h3 id={slug} className="text-xl font-bold mb-6 mt-14 tracking-tight" style={{ color: theme.textMain }} {...props}>{children}</h3>;
                  },
                  h4: ({ node, ...props }) => (
                    <h4 className="text-xl font-bold tracking-tight mt-12 mb-4 opacity-95" style={{ color: theme.textMain }} {...props} />
                  ),
                  strong: ({ node, ...props }) => <strong className="font-extrabold tracking-tight" style={{ color: theme.textMain }} {...props} />,
                  a: ({ node, href, children, ...props }: any) => {
                    const isHashHover = href?.startsWith('#');
                    const isSearchLink = href?.startsWith('?search=');
                    const linkStyle: any = {
                      color: theme.accent,
                      textDecorationColor: theme.accent + '40',
                    };
                    return (
                      <a
                        href={isHashHover || isSearchLink ? '#' : href}
                        onClick={(e) => {
                          if (isHashHover) {
                            e.preventDefault();
                            const fullHash = href.substring(1);
                            const parts = fullHash.split('#');
                            const targetDoc = parts[0];
                            const targetSectionSlug = parts.length > 1 ? parts[1] : null;

                            if (targetSectionSlug) {
                              globalDocsHighlightTarget = 'elem-' + targetSectionSlug;
                            } else {
                              globalDocsHighlightTarget = e.currentTarget.textContent || null;
                            }
                            handleDocClick(targetDoc);
                          } else if (isSearchLink) {
                            e.preventDefault();
                            const params = new URLSearchParams(href.split('?')[1]);
                            const query = params.get('search');
                            if (query) {
                              setSearchQuery(query);
                            }
                          }
                        }}
                        className={`font-bold underline underline-offset-[6px] decoration-2 hover:decoration-current transition-all duration-300 hover:opacity-80 py-0.5`}
                        style={linkStyle}
                        target={isHashHover || isSearchLink ? undefined : "_blank"}
                        rel={isHashHover || isSearchLink ? undefined : "noreferrer"}
                        {...props}
                      >
                        {children}
                      </a>
                    );
                  },
                  pre: ({ node, ref, ...props }: any) => (
                    <div className="not-prose" {...props} />
                  ),
                  code: (props: any) => <InteractiveCodeBlock {...props} theme={theme} isDarkMode={isDarkMode} handleCopy={handleCopy} copiedText={copiedText} />
                }}
              >
                {currentDoc.content}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-70 py-40 animate-in fade-in zoom-in duration-500">
              <div className="p-6 rounded-full mb-8 shadow-2xl" style={{ backgroundColor: theme.accent + '15' }}>
                <BookOpen className="w-20 h-20" style={{ color: theme.accent }} />
              </div>
              <h2 className="text-3xl font-bold mb-4 tracking-tight" style={{ color: theme.textMain }}>Document Not Found</h2>
              <p className="text-lg opacity-80" style={{ color: theme.textSec }}>The requested guide could not be loaded or doesn't exist.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
