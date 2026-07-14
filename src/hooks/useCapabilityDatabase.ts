import { useState, useEffect } from 'react';
import { CapabilityDatabase } from '../types/capability';

export function useCapabilityDatabase() {
  const [database, setDatabase] = useState<CapabilityDatabase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check localStorage first
    const localDbStr = localStorage.getItem('puko_custom_database');
    if (localDbStr) {
      try {
        setDatabase(JSON.parse(localDbStr));
        setLoading(false);
      } catch (e) {
        console.error("Failed to parse custom DB", e);
      }
    }

    // Fetch from server
    fetch('/api/database')
      .then(res => {
        if (!res.ok) throw new Error("DB 로드 실패");
        return res.json();
      })
      .then(data => {
        const db = data.database;
        if (!localDbStr || (data.persistence === 'file' && !localStorage.getItem('puko_db_synced'))) {
           setDatabase(db);
           localStorage.setItem('puko_custom_database', JSON.stringify(db));
           localStorage.setItem('puko_db_synced', 'true');
        }
      })
      .catch(err => {
        console.error(err);
        if (!localDbStr) setError("데이터베이스를 읽어오지 못했습니다.");
      })
      .finally(() => setLoading(false));
  }, []);

  const saveDatabase = async (newDb: CapabilityDatabase) => {
    setDatabase(newDb);
    localStorage.setItem('puko_custom_database', JSON.stringify(newDb));

    try {
      const res = await fetch('/api/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ database: newDb })
      });
      const data = await res.json();
      
      if (data.persisted) {
        return "데이터베이스 변경 사항이 저장되었습니다.";
      } else {
        return "변경 사항이 이 브라우저에 저장되었습니다. 다른 기기나 브라우저에는 반영되지 않습니다.";
      }
    } catch (err) {
      console.error(err);
      return "서버 저장 실패: 변경 사항이 브라우저에만 저장되었습니다.";
    }
  };

  return { database, loading, error, saveDatabase };
}
