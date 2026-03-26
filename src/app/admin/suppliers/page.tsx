'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<{id: string, company_name: string}[]>([]);
  const [newSupplier, setNewSupplier] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  async function fetchSuppliers() {
    const { data } = await supabase.from('suppliers').select('*').order('company_name');
    if (data) setSuppliers(data);
  }

  async function addSupplier() {
    if (!newSupplier) return;
    setLoading(true);
    await supabase.from('suppliers').insert({ company_name: newSupplier });
    setNewSupplier('');
    fetchSuppliers();
    setLoading(false);
  }

  return (
    <main className="p-8 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-6 uppercase">Tedarikçi Yönetimi</h1>

      <div className="flex gap-2 mb-8">
        <input 
          className="flex-1 border p-2"
          placeholder="Tedarikçi Adı..."
          value={newSupplier}
          onChange={(e) => setNewSupplier(e.target.value)}
        />
        <button 
          onClick={addSupplier}
          disabled={loading}
          className="bg-black text-white px-4 py-2 hover:opacity-80"
        >
          {loading ? '...' : 'EKLE'}
        </button>
      </div>

      <div className="border">
        {suppliers.map(s => (
          <div key={s.id} className="p-3 border-b flex justify-between">
            {s.company_name}
          </div>
        ))}
      </div>
    </main>
  );
}