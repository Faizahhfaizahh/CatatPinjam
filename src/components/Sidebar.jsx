import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, ListChecks, PlusCircle, User, LogOut, Menu } from 'lucide-react'

const menuItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Tambah Peminjaman', path: '/dashboard/tambah', icon: PlusCircle },
  { name: 'Daftar Peminjaman', path: '/dashboard/daftar', icon: ListChecks },
  { name: 'Akun', path: '/dashboard/profil', icon: User },
]

export default function Sidebar({ onLogout }) {
  const [isOpen, setIsOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const location = useLocation()

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false)
    onLogout()
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 bg-[#1E293B] text-white p-2 rounded-lg"
      >
        <Menu className="h-6 w-6" />
      </button>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="md:hidden fixed inset-0 bg-black/50 z-40"
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-[#1E293B] text-white flex flex-col z-50 transform transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="flex flex-col items-center py-6 border-b border-white/10">
          <h1 className="text-xl font-bold">CatatPinjam</h1>
        </div>

        <nav className="flex-1 px-4 py-6 flex flex-col gap-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition
                  ${isActive
                    ? 'bg-white text-[#1E293B]'
                    : 'text-gray-300 hover:bg-white/10'}`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="px-4 pb-6">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 transition"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Modal Konfirmasi Logout */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-[60]">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogOut className="h-6 w-6 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-[#1E293B] mb-2">Keluar dari Akun?</h2>
            <p className="text-sm text-gray-500 mb-6">
              Kamu perlu login kembali untuk mengakses akunmu.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 border border-gray-300 text-gray-600 font-semibold rounded-lg py-2 hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 bg-red-500 text-white font-semibold rounded-lg py-2 hover:opacity-90 transition"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}