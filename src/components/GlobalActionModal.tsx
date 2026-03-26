'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function GlobalActionModal({ isOpen, onClose, data }: any) {
  const [partNumber, setPartNumber] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadSuppliers = async () => {
      const { data } = await supabase
        .from('suppliers')
        .select('id, company_name')
        .order('company_name');

      setSuppliers(data || []);
    };

    loadSuppliers();

    if (data?.mapping) {
      setIsEditMode(true);
      setSupplierId(data.mapping.supplier_id);
      setPartNumber(data.mapping.supplier_part_number);
    } else {
      setIsEditMode(false);
      setSupplierId('');
      setPartNumber('');
    }
  }, [isOpen, data]);

const handleSave = async () => {
  if (!supplierId || !partNumber) {
    alert("Lütfen tedarikçi ve kod bilgisi girin!");
    return;
  }

  setLoading(true);

  try {

    const cleanPart = partNumber.trim().toLowerCase();

    // aynı supplier + part var mı kontrol et
    const { data: existingPart } = await supabase
      .from("product_mappings")
      .select("id, product_id")
      .eq("supplier_id", supplierId)
      .ilike("supplier_part_number", cleanPart)
      .maybeSingle();

    if (existingPart) {
      alert("Bu tedarikçi kodu zaten başka bir ürüne bağlı.");
      setLoading(false);
      return;
    }

    // ürün + supplier mapping var mı
    const { data: existingMapping } = await supabase
      .from("product_mappings")
      .select("id")
      .eq("product_id", data.id)
      .eq("supplier_id", supplierId)
      .maybeSingle();

    if (existingMapping) {

      const { error } = await supabase
        .from("product_mappings")
        .update({
          supplier_part_number: partNumber
        })
        .eq("id", existingMapping.id);

      if (error) throw error;

    } else {

      const { error } = await supabase
        .from("product_mappings")
        .insert({
          product_id: data.id,
          supplier_id: supplierId,
          supplier_part_number: partNumber
        });

      if (error) throw error;
    }

    onClose();

  } catch (err: any) {
    alert("Hata: " + err.message);
  }

  setLoading(false);
};

  const handleDelete = async () => {
    if (!confirm("Bu eşleşmeyi silmek istediğinize emin misiniz?")) return;

    setLoading(true);

    const { error } = await supabase
      .from('product_mappings')
      .delete()
      .eq('product_id', data.id)
      .eq('supplier_id', supplierId);

    if (error) {
      alert("Hata: " + error.message);
    } else {
      onClose();
    }

    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white p-8 rounded-xl w-[400px] text-black shadow-2xl">

        <h2 className="text-xl font-bold mb-4 border-b pb-2">
          {isEditMode ? 'Eşleşmeyi Düzenle' : 'Yeni Tedarikçi Ekle'}
        </h2>

        <label className="block text-xs font-bold mb-1 text-gray-500 uppercase">
          Tedarikçi
        </label>

        <select
          className="w-full border p-2 mb-4 rounded bg-gray-50"
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
          disabled={isEditMode}
        >
          <option value="">Tedarikçi Seçin</option>

          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.company_name}
            </option>
          ))}
        </select>

        <label className="block text-xs font-bold mb-1 text-gray-500 uppercase">
          Tedarikçi Kodu
        </label>

        <input
          className="w-full border p-2 mb-6 rounded"
          value={partNumber}
          onChange={(e) => setPartNumber(e.target.value)}
          placeholder="Örn: 987654"
        />

        <div className="flex gap-2">

          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 px-4 py-2 rounded"
          >
            İptal
          </button>

          {isEditMode && (
            <button
              onClick={handleDelete}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Sil
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
          >
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </button>

        </div>
      </div>
    </div>
  );
}