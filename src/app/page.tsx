'use client'

import { Suspense } from 'react'
import InventoryPage from './InventoryClient'

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold animate-pulse">Sistem Yükleniyor...</p>
      </div>
    }>
      <InventoryPage />
    </Suspense>
  )
}