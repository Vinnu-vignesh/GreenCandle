import { useOutletContext } from 'react-router-dom';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useState, useEffect } from 'react';
import TradingChart from '../components/Chart/TradingChart';
import OrderEntry   from '../components/Dashboard/OrderEntry';
import NewsPanel    from '../components/Dashboard/NewsPanel';
import { LineChart, ShoppingCart, Newspaper } from 'lucide-react';

/* Detect mobile */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

const MOBILE_TABS = [
  { id: 'chart', label: 'Chart',       icon: LineChart     },
  { id: 'order', label: 'Order Entry', icon: ShoppingCart  },
  { id: 'news',  label: 'News',        icon: Newspaper     },
];

export default function Home() {
  const { activeSymbol, setActiveSymbol, liveData } = useOutletContext();
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState('chart');

  /* ── Mobile Layout: Tab-based stacking ── */
  if (isMobile) {
    return (
      <div className="h-full flex flex-col bg-[#040406]">

        {/* Tab Switcher Bar */}
        <div className="flex border-b border-[#111118] shrink-0 bg-[#070709]">
          {MOBILE_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setMobileTab(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors relative ${
                mobileTab === id
                  ? 'text-blue-400'
                  : 'text-[#55556a] hover:text-white'
              }`}
            >
              <Icon size={16} />
              {label}
              {mobileTab === id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {mobileTab === 'chart' && (
            <div className="h-full">
              <TradingChart symbol={activeSymbol} liveData={liveData} />
            </div>
          )}
          {mobileTab === 'order' && (
            <div className="h-full overflow-y-auto p-4">
              <OrderEntry symbol={activeSymbol} liveData={liveData} />
            </div>
          )}
          {mobileTab === 'news' && (
            <div className="h-full flex flex-col overflow-hidden bg-[#06060a]">
              <NewsPanel />
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── Desktop Layout: Resizable panels ── */
  return (
    <PanelGroup direction="horizontal" className="h-full w-full">

      {/* Chart Panel ~70% */}
      <Panel defaultSize={70} minSize={50} className="flex flex-col bg-[#040406]">
        <TradingChart symbol={activeSymbol} liveData={liveData} />
      </Panel>

      <PanelResizeHandle className="w-px bg-[#111118] hover:bg-blue-600 transition-colors cursor-col-resize" />

      {/* Right Panel — Order Entry + News */}
      <Panel defaultSize={30} minSize={22} maxSize={42} className="bg-[#070709] border-l border-[#111118] flex flex-col">
        <PanelGroup direction="vertical">
          <Panel defaultSize={55} minSize={35} className="flex flex-col overflow-y-auto p-4">
            <OrderEntry symbol={activeSymbol} liveData={liveData} />
          </Panel>
          <PanelResizeHandle className="h-px bg-[#111118] hover:bg-blue-600 transition-colors cursor-row-resize" />
          <Panel defaultSize={45} minSize={25} className="flex flex-col overflow-hidden bg-[#06060a]">
            <NewsPanel />
          </Panel>
        </PanelGroup>
      </Panel>

    </PanelGroup>
  );
}