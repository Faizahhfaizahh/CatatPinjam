import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import Sidebar from '../components/Sidebar'
import { ArrowLeft, X, Trash2, CheckCircle2, XCircle } from 'lucide-react'

export default function KelolaCicilan({ onLogout }) {
  const { id } = useParams()
  const navigate = useNavigate()

  const [item, setItem] = useState(null)
  const [cicilanList, setCicilanList] = useState([])
  const [loading, setLoading] = useState(true)

  const [cicilanBaru, setCicilanBaru] = useState('')
  const [tanggalCicilan, setTanggalCicilan] = useState(new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toast, setToast] = useState(null)
  const [toastVisible, setToastVisible] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    const { data: peminjamanData } = await supabase
      .from('peminjaman')
      .select('*')
      .eq('id', id)
      .single()

    const { data: cicilanData } = await supabase
      .from('cicilan')
      .select('*')
      .eq('peminjaman_id', id)
      .order('tanggal', { ascending: false })

    setItem(peminjamanData)
    setCicilanList(cicilanData || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [id])

  const formatRupiah = (angka) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka)

  const formatTanggal = (tanggal) =>
    new Date(tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 1800)
    setTimeout(() => setToast(null), 2200)
  }

  const totalDibayar = cicilanList.reduce((sum, c) => sum + Number(c.jumlah), 0)
  const sisa = item ? item.jumlah_uang - totalDibayar : 0
  const persen = item && item.jumlah_uang > 0
    ? Math.min(100, Math.round((totalDibayar / item.jumlah_uang) * 100))
    : 0

  const handleTambahCicilan = async () => {
    if (!cicilanBaru || Number(cicilanBaru) <= 0) return
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('cicilan').insert({
      peminjaman_id: id,
      user_id: user.id,
      jumlah: Number(cicilanBaru),
      tanggal: tanggalCicilan,
    })

    if (error) {
      showToast(error.message, 'error')
      setSaving(false)
      return
    }

    const totalBaru = totalDibayar + Number(cicilanBaru)
    if (totalBaru >= item.jumlah_uang) {
      await supabase
        .from('peminjaman')
        .update({ status: 'lunas', tanggal_selesai: new Date().toISOString().slice(0, 10) })
        .eq('id', id)
    }

    setCicilanBaru('')
    fetchData()
    showToast('Cicilan berhasil ditambahkan.')
    setSaving(false)
  }

  const handleHapusCicilan = (cicilanId) => {
    setDeleteTarget(cicilanId)
  }

  const confirmHapusCicilan = async () => {
    const { error } = await supabase.from('cicilan').delete().eq('id', deleteTarget)
    if (error) {
      showToast(error.message, 'error')
      setDeleteTarget(null)
      return
    }

    if (item.status === 'lunas') {
      await supabase
        .from('peminjaman')
        .update({ status: 'belum_lunas', tanggal_selesai: null })
        .eq('id', id)
    }

    setDeleteTarget(null)
    fetchData()
    showToast('Cicilan berhasil dihapus.')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar onLogout={onLogout} />
        <div className="flex-1 md:ml-64 p-6 md:p-10">
          <p className="text-gray-500">Memuat...</p>
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar onLogout={onLogout} />
        <div className="flex-1 md:ml-64 p-6 md:p-10">
          <p className="text-gray-500">Data tidak ditemukan.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />

      <div className="flex-1 md:ml-64 p-6 md:p-10 mt-12 md:mt-0 flex flex-col items-center">
        <button
          onClick={() => navigate('/dashboard/daftar')}
          className="self-start flex items-center gap-1 text-sm text-gray-500 hover:text-[#1E293B] mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Peminjaman
        </button>

        <h1 className="text-2xl font-bold text-[#1E293B] mb-4 text-center">Kelola Cicilan</h1>

        <div className="bg-white rounded-2xl shadow p-6 w-full max-w-lg">
          <h2 className="text-lg font-semibold text-[#1E293B] mb-1">{item.nama_pihak}</h2>
          <p className="text-sm text-gray-500 mb-4">
            {item.arah === 'saya_meminjamkan' ? 'Peminjam' : 'Pemberi Pinjaman'} · Uang
          </p>

          <p className="text-2xl font-bold text-[#1E293B] mb-2">{formatRupiah(item.jumlah_uang)}</p>

          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-[#0D9488] rounded-full transition-all"
              style={{ width: `${persen}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Dibayar {formatRupiah(totalDibayar)} · Sisa {formatRupiah(sisa)} ({persen}%)
          </p>

          {item.status === 'belum_lunas' && (
            <div className="flex gap-2 mb-6">
              <input
                type="number"
                placeholder="Jumlah cicilan (Rp)"
                value={cicilanBaru}
                onChange={(e) => setCicilanBaru(e.target.value)}
                min="1"
                max={sisa}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
              />
              <input
                type="date"
                value={tanggalCicilan}
                onChange={(e) => setTanggalCicilan(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
              />
              <button
                onClick={handleTambahCicilan}
                disabled={saving || !cicilanBaru}
                className="bg-[#0D9488] text-white text-sm font-semibold px-4 rounded-lg hover:opacity-90 transition disabled:opacity-50 whitespace-nowrap"
              >
                {saving ? '...' : 'Tambah'}
              </button>
            </div>
          )}

          <h3 className="text-sm font-semibold text-gray-700 mb-2">Riwayat Cicilan</h3>
          {cicilanList.length === 0 ? (
            <p className="text-sm text-gray-400">Belum ada cicilan tercatat.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {cicilanList.map((c) => (
                <div key={c.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2">
                  <span className="text-sm text-gray-700">{formatTanggal(c.tanggal)} · {formatRupiah(c.jumlah)}</span>
                  <button onClick={() => handleHapusCicilan(c.id)} className="text-red-400 hover:text-red-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Konfirmasi Hapus Cicilan */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-[#1E293B] mb-2">Hapus Cicilan Ini?</h2>
            <p className="text-sm text-gray-500 mb-6">
              Data cicilan yang dihapus tidak bisa dikembalikan lagi.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 border border-gray-300 text-gray-600 font-semibold rounded-lg py-2 hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                onClick={confirmHapusCicilan}
                className="flex-1 bg-red-500 text-white font-semibold rounded-lg py-2 hover:opacity-90 transition"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup Notifikasi */}
      {toast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none px-4">
          <div
            className={`flex flex-col items-center gap-4 px-10 py-10 rounded-3xl shadow-2xl bg-white border border-gray-100 w-full max-w-xs transition-all duration-300 ${
              toastVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
            }`}
          >
            {toast.type === 'error' ? (
              <XCircle className="h-16 w-16 text-red-500" />
            ) : (
              <CheckCircle2 className="h-16 w-16 text-[#0D9488]" />
            )}
            <p className="text-base font-semibold text-[#1E293B] text-center">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  )
}