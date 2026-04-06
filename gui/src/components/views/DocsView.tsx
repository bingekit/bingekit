import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Search, BookOpen, AlertCircle, Copy, Check, Hash, LayoutTemplate, Zap, Shield, Book, LayoutGrid, Plug, Bug, Tag } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useAppContext } from '../../context/AppContext';

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
];

let globalDocsScrollY = 0;
let globalDocsActiveId = 'getting_started';

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
    // @ts-ignore - CSS Highlight API types may not be present in the TS version natively
    if (!window.CSS || !CSS.highlights) return;

    // @ts-ignore
    CSS.highlights.clear();

    if (!searchQuery || !contentRef.current || !activeDocId) return;

    const lowerQuery = searchQuery.toLowerCase();
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
        setTimeout(() => {
          firstNode.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 10);
      }
    }
  }, [searchQuery, activeDocId]);

  return (
    <div className="flex h-full w-full overflow-hidden font-sans antialiased" style={{ backgroundColor: theme.mainBg, color: theme.textMain }}>
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
                  h1: ({ node, ...props }) => (
                    <div className="mt-8 mb-12">
                      <h1 className="text-5xl font-black tracking-tighter leading-tight mb-6" style={{ color: theme.textMain }} {...props} />
                      <div className="h-1.5 w-24 rounded-full bg-gradient-to-r" style={{ backgroundImage: `linear-gradient(to right, ${theme.accent}, transparent)` }}></div>
                    </div>
                  ),
                  h2: ({ node, ...props }) => (
                    <h2 className="text-3xl font-bold tracking-tight mt-20 mb-8 border-b pb-4" style={{ color: theme.textMain, borderColor: theme.border + '50' }} {...props} />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3 className="text-2xl font-bold tracking-tight mt-16 mb-6" style={{ color: theme.textMain }} {...props} />
                  ),
                  h4: ({ node, ...props }) => (
                    <h4 className="text-xl font-bold tracking-tight mt-12 mb-4 opacity-95" style={{ color: theme.textMain }} {...props} />
                  ),
                  p: ({ node, ...props }) => <p className="mb-8 leading-[1.85] opacity-[0.85] text-[16px] font-medium" style={{ color: theme.textSec }} {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-10 opacity-[0.85] space-y-4 text-[16px] font-medium block" style={{ color: theme.textSec }} {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-10 opacity-[0.85] space-y-4 text-[16px] font-medium block" style={{ color: theme.textSec }} {...props} />,
                  li: ({ node, ...props }) => <li className="pl-2 leading-[1.8]" style={{ color: theme.textSec }} {...props} />,
                  blockquote: ({ node, children, ...props }) => (
                    <blockquote className="px-8 py-7 rounded-[24px] my-14 text-[16px] leading-[1.8] relative overflow-hidden backdrop-blur-md transition-all hover:shadow-xl"
                      style={{
                        backgroundColor: theme.titlebarAlt || 'rgba(0,0,0,0.1)',
                        border: '1px solid ' + theme.border + '40',
                        color: theme.textMain,
                        boxShadow: `0 8px 32px -8px ${theme.accent}15`
                      }}
                      {...props}
                    >
                      <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: theme.accent, backgroundImage: `linear-gradient(to bottom, ${theme.accent}, ${theme.accent}80)` }}></div>
                      <div className="absolute top-0 right-0 w-32 h-32 opacity-10 blur-3xl pointer-events-none rounded-full" style={{ backgroundColor: theme.accent }}></div>
                      <div className="relative z-10 font-medium opacity-95">{children}</div>
                    </blockquote>
                  ),
                  strong: ({ node, ...props }) => <strong className="font-extrabold tracking-tight" style={{ color: theme.textMain }} {...props} />,
                  a: ({ node, href, children, ...props }: any) => {
                    const isHashHover = href?.startsWith('#');
                    const linkStyle: any = {
                      color: theme.accent,
                      textDecorationColor: theme.accent + '40',
                    };
                    return (
                      <a
                        href={isHashHover ? '#' : href}
                        onClick={(e) => { if (isHashHover) { e.preventDefault(); handleDocClick(href.substring(1)); } }}
                        className={`font-bold underline underline-offset-[6px] decoration-2 hover:decoration-current transition-all duration-300 hover:opacity-80 py-0.5`}
                        style={linkStyle}
                        target={isHashHover ? undefined : "_blank"}
                        rel={isHashHover ? undefined : "noreferrer"}
                        {...props}
                      >
                        {children}
                      </a>
                    );
                  },
                  pre: ({ node, ref, ...props }: any) => (
                    <div className="not-prose rounded-[12px] overflow-hidden flex flex-col group relative my-8" style={{ backgroundColor: 'transparent', border: '1px solid ' + theme.border }} {...props} />
                  ),
                  code: ({ node, inline, className, children, ...props }: any) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeStr = String(children).replace(/\n$/, '');
                    const syntaxStyle = isDarkMode ? vscDarkPlus : oneLight;

                    if (!inline && match) {
                      return (
                        <>
                          <div className="w-full px-5 py-3 flex justify-between items-center border-b backdrop-blur-md relative overflow-hidden" style={{ borderColor: theme.border, backgroundColor: theme.textMain + '05' }}>
                            <div className="absolute top-0 left-0 w-full h-[1px] opacity-20" style={{ background: `linear-gradient(90deg, transparent, ${theme.accent}, transparent)` }}></div>
                            <div className="flex items-center relative z-10">
                              <div className="w-1.5 h-4 rounded-full mr-3" style={{ backgroundColor: theme.accent }}></div>
                              <span className="text-[12px] font-bold font-mono uppercase tracking-[0.2em] opacity-90" style={{ color: theme.textMain }}>{match[1]}</span>
                            </div>
                            <button
                              onClick={() => handleCopy(codeStr)}
                              className="px-3 py-1.5 rounded-lg flex items-center gap-2 text-[12px] font-semibold transition-all hover:bg-white/10 active:scale-95 border border-white/5 relative z-10"
                              style={{ color: theme.textSec }}
                            >
                              {copiedText === codeStr ? (
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
                          <div className="px-6 py-5 overflow-x-auto custom-scrollbar text-[14px] leading-[1.65] relative transition-colors duration-500">
                            <SyntaxHighlighter
                              style={{ ...syntaxStyle, "pre[class*=\"language-\"]": { ...(syntaxStyle["pre[class*=\"language-\"]"] || {}), background: "transparent", margin: 0, padding: 0 }, "code[class*=\"language-\"]": { ...(syntaxStyle["code[class*=\"language-\"]"] || {}), background: "transparent" } }}
                              language={match[1]}
                              PreTag="div"
                              className="!bg-transparent !m-0 !p-0 font-mono tracking-tight"
                            >
                              {codeStr}
                            </SyntaxHighlighter>
                          </div>
                        </>
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
                  }
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
