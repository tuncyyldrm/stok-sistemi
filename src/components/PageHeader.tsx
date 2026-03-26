'use client'
import { useState } from "react"
import { Search } from "lucide-react"

interface PageHeaderProps {
  title: string;
  count?: number;
  searchTerm?: string;
  setSearchTerm?: (val: string) => void;
  placeholder?: string;
}

export default function PageHeader({ title, count, searchTerm, setSearchTerm, placeholder }: PageHeaderProps) {
  // Input içindeki anlık değeri tutan yerel state
  const [inputValue, setInputValue] = useState(searchTerm || "");

  const handleSearch = () => {
    if (setSearchTerm) {
      // Sadece "Ara"ya basınca veya Enter'a basınca üst componenti tetikler
      setSearchTerm(inputValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <header className="flex flex-col space-y-6 mb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-8 bg-blue-600 rounded-full" />
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 uppercase italic">{title}</h1>
          </div>
          {count !== undefined && (
            <p className="text-slate-500 font-medium tracking-tight">
              Toplam <span className="text-blue-600 font-bold">{count.toLocaleString()}</span> sonuç listeleniyor
            </p>
          )}
        </div>
        
        {setSearchTerm && (
          <div className="relative flex w-full md:w-96 items-center gap-2">
<div className="relative flex-1">
  <div 
    style={{ 
      position: 'absolute', 
      left: '12px', 
      top: '50%', 
      transform: 'translateY(-50%)', 
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      pointerEvents: 'none'
    }}
  >
    <Search style={{ width: '16px', height: '16px', color: '#94a3b8' }} />
  </div>
  
  <input
    type="text"
    placeholder={placeholder || "Ürün adı..."}
    value={inputValue}
    onChange={(e) => setInputValue(e.target.value)}
    onKeyDown={handleKeyDown}
    style={{
      width: '100%',
      paddingLeft: '40px', // pl-10 karşılığı
      paddingRight: '16px',
      paddingTop: '8px',
      paddingBottom: '8px',
      backgroundColor: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '12px', // rounded-xl karşılığı
      outline: 'none',
      color: '#0f172a'
    }}
  />
</div>
            <button 
              onClick={handleSearch}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl transition-colors shadow-sm shadow-blue-200"
            >
              Ara
            </button>
          </div>
        )}
      </div>
    </header>
  )
}