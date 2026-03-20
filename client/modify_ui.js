const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Update states
content = content.replace(
  "  const [activeTab, setActiveTab] = useState<'fleet' | 'global' | 'risk' | 'logs'>('fleet');",
  "  const [activeTab, setActiveTab] = useState<'fleet' | 'global' | 'risk'>('fleet');\n  const [rightTab, setRightTab] = useState<'analytics' | 'logs'>('analytics');"
);

// 2. Reduce global green saturation
content = content.replace(
  "bg-black text-terminal-text font-mono selection:bg-terminal-text selection:text-black",
  "bg-black text-zinc-300 font-mono selection:bg-terminal-text selection:text-black"
);

// 3. Header text sizing and color
content = content.replace(
  '<h1 className="text-xl font-display font-bold tracking-wider uppercase">KaijuGuard Command</h1>',
  '<h1 className="text-2xl font-display font-bold tracking-wider text-white uppercase">KaijuGuard Command</h1>'
);
content = content.replace(
  '<div className="flex items-center gap-2 text-[10px] opacity-60">',
  '<div className="flex items-center gap-4 text-sm text-zinc-400 font-bold">'
);

// 4. Update left tab buttons
content = content.replace(/\{ id: 'logs', icon: Terminal, label: 'Logs' \},\r?\n?/g, "");
content = content.replace(
  '"flex-1 py-4 flex flex-col items-center gap-1 transition-all relative group",',
  '"flex-1 py-4 flex flex-col items-center gap-2 transition-all relative group",'
);
content = content.replace(
  /className=\{cn\("w-5 h-5", activeTab === tab\.id && "animate-pulse"\)\} \/>\s*<span className="text-\[9px\] uppercase font-bold tracking-tighter">\{tab\.label\}<\/span>/g,
  'className={cn("w-6 h-6", activeTab === tab.id && "animate-pulse")} />\\n                <span className="text-xs uppercase font-bold tracking-wider">{tab.label}</span>'
);

// 5. Generic font size increases across the file
content = content.replace(/text-\[8px\]/g, 'text-xs');
content = content.replace(/text-\[9px\]/g, 'text-sm font-semibold');
content = content.replace(/text-\[10px\]/g, 'text-base font-semibold');
content = content.replace(/text-\[11px\]/g, 'text-lg');

// 6. Fix text saturation across generic buttons
content = content.replace(/text-terminal-text\/40 hover:text-terminal-text\/70/g, 'text-gray-400 hover:text-gray-200');

// 7. Remove bottom terminal entirely
const bottomTerminalRegex = /\{\/\* Bottom: Terminal \/ Logs \*\/\}\s*<div className="h-48[\s\S]*?<\/div>\s*<\/div>\s*<\/section>/;
content = content.replace(bottomTerminalRegex, '</section>');

// 8. Remove left tab log view entirely
const leftLogsRegex = /\{activeTab === 'logs' && \([\s\S]*?<\/motion\.div>\s*\)\}/;
content = content.replace(leftLogsRegex, '');

fs.writeFileSync('src/App.tsx', content);
