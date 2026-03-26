'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // Giriş Yapma İşlemi
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert("Giriş hatası: " + error.message)
    } else {
      // Başarılı girişte middleware'in oturumu algılaması için tam sayfa yenileme
      window.location.href = '/'
    }
    setLoading(false)
  }

  // Kayıt Olma İşlemi
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      alert("Kayıt hatası: " + error.message)
    } else {
      alert("Kayıt başarılı! Lütfen giriş yapın.")
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <form className="p-8 bg-white border border-slate-100 rounded-3xl shadow-sm w-96">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Hoş Geldiniz</h2>
        
        <input 
          type="email" 
          placeholder="Email" 
          className="w-full p-3 mb-4 border border-slate-200 rounded-xl outline-none" 
          value={email}
          onChange={(e) => setEmail(e.target.value)} 
          required
        />
        
        <input 
          type="password" 
          placeholder="Şifre" 
          className="w-full p-3 mb-6 border border-slate-200 rounded-xl outline-none" 
          value={password}
          onChange={(e) => setPassword(e.target.value)} 
          required
        />
        
        <div className="flex flex-col gap-3">
          <button 
            type="button" 
            onClick={handleLogin} 
            disabled={loading}
            className="w-full py-3 text-white bg-blue-600 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'İşleniyor...' : 'Giriş Yap'}
          </button>
          
          <button 
            type="button" 
            onClick={handleSignUp} 
            disabled={loading}
            className="w-full py-3 text-blue-600 bg-blue-50 rounded-xl font-bold hover:bg-blue-100 disabled:opacity-50"
          >
            Kayıt Ol
          </button>
        </div>
      </form>
    </div>
  )
}