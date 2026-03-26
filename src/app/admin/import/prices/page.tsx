'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import CSVReader from 'react-csv-reader';

export default function PriceImportPage() {
  const [suppliers, setSuppliers] = useState<{id: string, company_name: string}[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from('suppliers').select('id, company_name').then(({ data }) => {
      if (data) setSuppliers(data);
    });
  }, []);

  const handlePriceData = async (data: any[]) => {
    if (!selectedSupplier) return alert("Önce tedarikçi seçin!");
    setLoading(true);

    // Mükerrer kayıtları engellemek için Map kullanımı
    const uniqueRecords = new Map();

    data.forEach((row) => {
      // row[0] Kod olduğu için boşsa atla
      if (row[0]) {
        const partNumber = row[0].toString().trim();
        const cleanPrice = (val: any) => 
          parseFloat(val?.toString().replace(/\./g, '').replace(',', '.')) || 0;

        uniqueRecords.set(partNumber, {
          supplier_id: selectedSupplier,
          part_number: partNumber,
          product_name: row[1]?.toString().trim() || '',
          list_price: cleanPrice(row[2]),
          discounted_price: cleanPrice(row[3])
        });
      }
    });

    const finalData = Array.from(uniqueRecords.values());

    // Veritabanına yaz
    const { error } = await supabase
      .from('supplier_raw_prices')
      .upsert(finalData, { onConflict: 'supplier_id,part_number' });

    if (error) alert("Hata: " + error.message);
    else alert(`${finalData.length} adet benzersiz ürün başarıyla havuza eklendi.`);
    
    setLoading(false);
  };

  return (
    <main className="p-8 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-6 uppercase">Fiyat İçe Aktarma (Havuz)</h1>
      
      <select 
        onChange={(e) => setSelectedSupplier(e.target.value)} 
        className="w-full p-2 border mb-6"
      >
        <option value="">Tedarikçi Seçin...</option>
        {suppliers.map(s => <option key={s.id} value={s.id}>{s.company_name}</option>)}
      </select>

      <div className="border-2 border-dashed p-12 text-center bg-gray-50">
        <CSVReader 
          onFileLoaded={handlePriceData} 
          parserOptions={{ header: false, skipEmptyLines: true }} 
        />
      </div>
      
      {loading && <p className="mt-4 animate-pulse text-center">VERİLER İŞLENİYOR...</p>}
    </main>
  );
}