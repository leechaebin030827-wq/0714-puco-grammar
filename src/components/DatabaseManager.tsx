import { useState } from 'react';
import { CapabilityDatabase } from '../types/capability';

interface DatabaseManagerProps {
  database: CapabilityDatabase | null;
  onSave: (db: CapabilityDatabase) => Promise<string>;
}

export function DatabaseManager({ database, onSave }: DatabaseManagerProps) {
  const [activeTab, setActiveTab] = useState<'All' | 'SN' | 'MP' | 'PJ' | 'SP'>('All');
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  if (!database) return <div className="p-8 text-center text-gray-500">데이터베이스를 불러오는 중입니다...</div>;

  const allItems = [
    ...database.SN,
    ...database.MP,
    ...database.PJ,
    ...database.SP
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
      newDb[cat][idx] = { ...newDb[cat][idx], enabled: newDb[cat][idx].enabled === false ? true : false };
      setSaving(true);
      const msg = await onSave(newDb);
      setMessage(msg);
      setSaving(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const getCatColor = (code: string) => {
    if (code.startsWith('SN')) return 'bg-emerald-100 text-emerald-800';
    if (code.startsWith('MP')) return 'bg-blue-100 text-blue-800';
    if (code.startsWith('PJ')) return 'bg-amber-100 text-amber-800';
    if (code.startsWith('SP')) return 'bg-rose-100 text-rose-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Capability Database</h2>
          <p className="text-sm text-gray-500 mt-1">푸코의 동작 문법을 관리하고 활성화 상태를 변경합니다.</p>
        </div>
        
        <div className="mt-4 md:mt-0 relative w-full md:w-64">
          <i className="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            placeholder="코드 또는 이름 검색..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${message.includes('브라우저') ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {message}
        </div>
      )}

      <div className="flex space-x-2 mb-6 border-b border-gray-100 pb-2 overflow-x-auto hide-scrollbar">
        {['All', 'SN', 'MP', 'PJ', 'SP'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors whitespace-nowrap ${
              activeTab === tab ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            {tab === 'All' ? '전체 보기' : 
             tab === 'SN' ? '센서 (Sensing)' : 
             tab === 'MP' ? '모션 (Motion)' : 
             tab === 'PJ' ? '투사 (Projection)' : '스피커 (Speaker)'}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
            <tr>
              <th className="p-4 rounded-tl-xl">코드</th>
              <th className="p-4">활성</th>
              <th className="p-4">카테고리</th>
              <th className="p-4">이름</th>
              <th className="p-4 w-full">설명</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredItems.map(item => (
              <tr key={item.code} className="hover:bg-gray-50/50 transition-colors">
                <td className="p-4 font-mono font-bold text-gray-800">
                  <span className={`px-2 py-1 rounded text-xs ${getCatColor(item.code)}`}>
                    {item.code}
                  </span>
                </td>
                <td className="p-4">
                  <button 
                    onClick={() => toggleEnabled(item.code)}
                    disabled={saving}
                    className={`w-10 h-6 rounded-full relative transition-colors ${item.enabled !== false ? 'bg-blue-500' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${item.enabled !== false ? 'transform translate-x-4' : ''}`}></span>
                  </button>
                </td>
                <td className="p-4 text-gray-600">{item.category}</td>
                <td className="p-4 font-bold text-gray-800">{item.name}</td>
                <td className="p-4 text-gray-500 whitespace-normal min-w-[200px]">{item.desc}</td>
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400">
                  검색 결과가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
