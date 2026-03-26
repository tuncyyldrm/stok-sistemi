'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import CSVReader from 'react-csv-reader';

export default function ProductImportPage() {
  const [loading, setLoading] = useState(false);

  const handleProductData = async (data: any[]) => {
    setLoading(true);

    // CSV formatı: [stok_kodu, urun_adi, image_url]
    const productsToUpsert = data
      .filter(row => row[0]) // Kodu olmayanları temizle
      .map(row => ({
        stock_code: row[0]?.toString().trim(),
        product_name: row[1]?.toString().trim(),
        image_url: row[2]?.toString().trim() // 3. sütun link
      }));

    const { error } = await supabase
      .from('products')
      .upsert(productsToUpsert, { onConflict: 'stock_code' });

    if (error) alert("Hata: " + error.message);
    else alert(`${productsToUpsert.length} adet ürün başarıyla yüklendi.`);
    
    setLoading(false);
  };

  return (
    <main className="p-8 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-6 uppercase">Ürün İçe Aktarma</h1>
      
      <div className="border-2 border-dashed p-12 text-center bg-gray-50">
        <CSVReader 
          onFileLoaded={handleProductData} 
          parserOptions={{ header: false, skipEmptyLines: true }} 
        />
      </div>
      
      {loading && <p className="mt-4 animate-pulse text-center">VERİLER YÜKLENİYOR...</p>}
    </main>
  );
}