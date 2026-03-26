'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import CSVReader from 'react-csv-reader';

export default function MappingImportPage() {
  const [loading, setLoading] = useState(false);

  const handleMappingData = async (data: any[]) => {
    setLoading(true);
    
    // 1. Tüm ürünleri ve tedarikçileri belleğe al (Sorgu yükünü azaltmak için)
    const { data: products } = await supabase.from('products').select('id, stock_code');
    const { data: suppliers } = await supabase.from('suppliers').select('id, company_name');

    if (!products || !suppliers) {
      alert("Veri çekilemedi, lütfen bağlantıyı kontrol edin.");
      setLoading(false);
      return;
    }

    let successCount = 0;

    // 2. CSV'yi işleyelim
    for (const row of data) {
      const [myCode, supplierName, supplierCode] = row;
      if (!myCode || !supplierName || !supplierCode) continue;

      const product = products.find(p => p.stock_code === myCode.toString().trim());
      const supplier = suppliers.find(s => s.company_name === supplierName.toString().trim());

      if (product && supplier) {
        const { error } = await supabase
          .from('product_mappings')
          .upsert({
            product_id: product.id,
            supplier_id: supplier.id,
            supplier_part_number: supplierCode.toString().trim()
          }, { 
            onConflict: 'supplier_id,supplier_part_number' 
          });
        
        if (!error) successCount++;
      }
    }

    alert(`${successCount} adet eşleşme başarıyla kuruldu.`);
    setLoading(false);
  };

  return (
    <main className="p-8 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-6 uppercase">Eşleşme Listesi Yükle</h1>
      <p className="text-sm mb-4 text-gray-600">
        CSV Formatı: [Kendi Kodun, Tedarikçi Adı, Tedarikçi Kodu]
      </p>
      
      <div className="border-2 border-dashed p-12 text-center bg-gray-50">
        <CSVReader 
          onFileLoaded={handleMappingData} 
          parserOptions={{ header: false, skipEmptyLines: true }} 
        />
      </div>
      {loading && <p className="mt-4 font-bold text-center animate-pulse">EŞLEŞTİRİLİYOR...</p>}
    </main>
  );
}