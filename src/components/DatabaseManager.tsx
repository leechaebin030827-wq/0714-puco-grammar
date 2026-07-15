import { useState } from 'react';
import { CapabilityDatabase } from '../types/capability';

interface DatabaseManagerProps {
  database: CapabilityDatabase | null;
  onSave: (db: CapabilityDatabase) => Promise<string>;
}

const TYPE_TABS = [
  { id: 'All', label: '전체',    icon: 'fa-layer-group'  },
  { id: 'SN',  label: 'Sensing', icon: 'fa-eye'           },
  { id: 'MP',  label: 'Motion',  icon: 'fa-robot'         },
  { id: 'PJ',  label: 'Projection', icon: 'fa-display'   },
  { id: 'SP',  label: 'Speaker', icon: 'fa-volume-high'   },
] as const;

const CODE_COLOR: Record<string, string> = {
  SN: 'text-emerald-700 bg-emerald-50',
  MP: 'text-blue-700 bg-blue-50',
  PJ: 'text-amber-700 bg-amber-50',
  SP: 'text-rose-700 bg-rose-50',
};

export function DatabaseManager({ database, onSave }: DatabaseManagerProps) {
  const [activeTab, setActiveTab] = useState<'All' | 'SN' | 'MP' | 'PJ' | 'SP'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  if (!database) return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-10 text-center text-xs text-gray-400">
      <i className="fa-solid fa-circle-notch fa-spin mr-2"></i>데이터베이스 로딩 중…
    </div>
  );

  const allItems = [
    ...database.SN,
    ...database.MP,
    ...database.PJ,
    ...database.SP,
  ];

  const filteredItems = allItems.filter(item => {
    if (activeTab !== 'All' && !item.code.startsWith(activeTab)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return item.code.toLowerCase().includes(q) ||
             item.name.toLowerCase().includes(q) ||
             item.category.toLowerCase().includes(q);
    }
    return true;
  });

  const toggleEnabled = async (code: string) => {
    const cat = code.substring(0, 2) as keyof CapabilityDatabase;
    const newDb = { ...database };
    const idx = newDb[cat].findIndex(i => i.code === code);
    if (idx !== -1) {
      newDb[cat] = [...newDb[cat]];
      newDb[cat][idx] = { ...newDb[cat][idx], enabled: newDb[cat][idx].enabled === false ? true : false };
      setSaving(true);
      const msg = await onSave(newDb);
      setMessage(msg);
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const getCodeColor = (code: string) => CODE_COLOR[code.substring(0, 2)] || 'text-gray-600 bg-gray-100';

  const counts = {
    All: allItems.length,
    SN: database.SN.length,
    MP: database.MP.length,
    PJ: database.PJ.length,
    SP: database.SP.length,
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-database text-xs text-gray-400"></i>
          <span className="text-xs font-bold text-gray-500">Capability Database</span>
          <span className="text-[11px] font-medium text-gray-300 ml-1">{allItems.length}개</span>
        </div>

        {/* Search */}
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-300"></i>
          <input
            type="text"
            placeholder="코드·이름 검색"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-48 pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all placeholder:text-gray-300"
          />
        </div>
      </div>

      {/* Status message */}
      {message && (
        <div className={`mx-5 mt-3 px-3 py-2 rounded-lg text-[11px] font-medium ${
          message.includes('브라우저')
            ? 'bg-amber-50 text-amber-700 border border-amber-100'
            : 'bg-green-50 text-green-700 border border-green-100'
        }`}>
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-0.5 px-5 pt-3 pb-0 border-b border-gray-100 overflow-x-auto hide-scrollbar">
        {TYPE_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold whitespace-nowrap transition-all border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'text-blue-600 border-blue-500'
                : 'text-gray-400 border-transparent hover:text-gray-600'
            }`}
          >
            <i className={`fa-solid ${tab.icon} text-[10px]`}></i>
            {tab.label}
            <span className={`text-[10px] font-medium ${activeTab === tab.id ? 'text-blue-400' : 'text-gray-300'}`}>
              {counts[tab.id]}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-5 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">코드</th>
              <th className="px-3 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">활성</th>
              <th className="px-3 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">카테고리</th>
              <th className="px-3 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">이름</th>
              <th className="px-3 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider w-full">설명</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredItems.map(item => (
              <tr key={item.code} className="hover:bg-gray-50/60 transition-colors">
                {/* Code */}
                <td className="px-5 py-3">
                  <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-lg ${getCodeColor(item.code)}`}>
                    {item.code}
                  </span>
                </td>
                {/* Toggle */}
                <td className="px-3 py-3">
                  <button
                    onClick={() => toggleEnabled(item.code)}
                    disabled={saving}
                    className={`w-8 h-4.5 h-[18px] rounded-full relative transition-colors ${
                      item.enabled !== false ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 bg-white w-3.5 h-3.5 rounded-full shadow-sm transition-transform ${
                      item.enabled !== false ? 'translate-x-[14px]' : ''
                    }`}></span>
                  </button>
                </td>
                {/* Category */}
                <td className="px-3 py-3 text-[11px] text-gray-400 whitespace-nowrap">{item.category}</td>
                {/* Name */}
                <td className="px-3 py-3 text-xs font-bold text-gray-700 whitespace-nowrap">{item.name}</td>
                {/* Description */}
                <td className="px-3 py-3 text-[11px] text-gray-400 leading-relaxed min-w-[180px]">{item.desc}</td>
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-xs text-gray-300">
                  <i className="fa-solid fa-ghost mr-1.5 opacity-40"></i>검색 결과가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
