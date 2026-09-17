import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import Sidebar from '../components/Sidebar'
import { Eye, EyeOff } from 'lucide-react'

export default function Akun({ onLogout }) {
  const [email, setEmail] = useState('')
  const [passwordBaru, setPasswordBaru] = useState('')
  const [konfirmasiPassword, setKonfirmasiPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showKonfirmasi, setShowKonfirmasi] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setEmail(user?.email || '')
    }
    getUser()
  }, [])

  const handleGantiPassword = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (passwordBaru !== konfirmasiPassword) {
      setErrorMsg('Konfirmasi password tidak cocok.')
      return
    }
    if (passwordBaru.length < 6) {
      setErrorMsg('Password minimal 6 karakter.')
      return
    }

    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: passwordBaru })

    if (error) {
      setErrorMsg(error.message)
    } else {
      setSuccessMsg('Password berhasil diubah.')
      setPasswordBaru('')
      setKonfirmasiPassword('')
    }
    setSaving(false)
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />

      <div className="flex-1 md:ml-64 p-6 md:p-10 mt-12 md:mt-0 flex flex-col items-center">
        <h1 className="text-2xl font-bold text-[#1E293B] mb-6 w-full max-w-md">Akun</h1>

        <div className="bg-white rounded-2xl shadow p-6 w-full max-w-md flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="border border-gray-200 bg-gray-100 text-gray-500 rounded-lg px-4 py-2 w-full cursor-not-allowed"
            />
          </div>

          <hr className="border-gray-100" />

          <h2 className="text-lg font-bold text-[#1E293B]">Ganti Password</h2>

          <form onSubmit={handleGantiPassword} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
              <div className="relative w-full">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordBaru}
                  onChange={(e) => setPasswordBaru(e.target.value)}
                  required
                  minLength={6}
                  className="border border-gray-300 rounded-lg px-4 py-2 pr-10 w-full focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#0D9488]"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password Baru</label>
              <div className="relative w-full">
                <input
                  type={showKonfirmasi ? 'text' : 'password'}
                  value={konfirmasiPassword}
                  onChange={(e) => setKonfirmasiPassword(e.target.value)}
                  required
                  minLength={6}
                  className="border border-gray-300 rounded-lg px-4 py-2 pr-10 w-full focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
                <button
                  type="button"
                  onClick={() => setShowKonfirmasi(!showKonfirmasi)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#0D9488]"
                  tabIndex={-1}
                >
                  {showKonfirmasi ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}
            {successMsg && <p className="text-green-600 text-sm">{successMsg}</p>}

            <button
              type="submit"
              disabled={saving}
              className="bg-[#0D9488] text-white font-semibold rounded-lg py-2 hover:opacity-90 transition disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan Password Baru'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}