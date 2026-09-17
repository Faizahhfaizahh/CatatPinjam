import { useState } from 'react'
import { supabase } from '../supabaseClient'
import Sidebar from '../components/Sidebar'
import { X } from 'lucide-react'

export default function TambahPeminjaman({ onLogout }) {
  const [arah, setArah] = useState('saya_meminjamkan')
  const [jenis, setJenis] = useState('uang')
  const [namaPihak, setNamaPihak] = useState('')
  const [jumlahUang, setJumlahUang] = useState('')
  const [namaBarang, setNamaBarang] = useState('')
  const [tanggalPinjam, setTanggalPinjam] = useState('')
  const [tanggalJatuhTempo, setTanggalJatuhTempo] = useState('')
  const [catatan, setCatatan] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const labelNamaPihak = arah === 'saya_meminjamkan' ? 'Nama Peminjam' : 'Nama Pemberi Pinjaman'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('peminjaman').insert({
      user_id: user.id,
      arah,
      jenis,
      nama_pihak: namaPihak,
      jumlah_uang: jenis === 'uang' ? Number(jumlahUang) : null,
      nama_barang: jenis === 'barang' ? namaBarang : null,
      tanggal_pinjam: tanggalPinjam || undefined,
      tanggal_jatuh_tempo: tanggalJatuhTempo || null,
      catatan: catatan || null,
    })

    if (error) {
      setErrorMsg(error.message)
    } else {
      setShowSuccess(true)
      setNamaPihak('')
      setJumlahUang('')
      setNamaBarang('')
      setTanggalPinjam('')
      setTanggalJatuhTempo('')
      setCatatan('')
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />

      <div className="flex-1 md:ml-64 p-6 md:p-10 flex flex-col items-center">
        <h1 className="text-2xl font-bold text-[#1E293B] mb-6 w-full max-w-lg mt-12 md:mt-0">Tambah Peminjaman</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-6 w-full max-w-lg flex flex-col gap-4">

          {/* Arah transaksi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Transaksi</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setArah('saya_meminjamkan')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition
                  ${arah === 'saya_meminjamkan'
                    ? 'bg-[#0D9488] text-white border-[#0D9488]'
                    : 'border-gray-300 text-gray-600'}`}
              >
                Saya Meminjamkan
              </button>
              <button
                type="button"
                onClick={() => setArah('saya_meminjam')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition
                  ${arah === 'saya_meminjam'
                    ? 'bg-[#0D9488] text-white border-[#0D9488]'
                    : 'border-gray-300 text-gray-600'}`}
              >
                Saya Meminjam
              </button>
            </div>
          </div>

          {/* Jenis: uang / barang */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Pinjaman</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setJenis('uang')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition
                  ${jenis === 'uang'
                    ? 'bg-[#1E293B] text-white border-[#1E293B]'
                    : 'border-gray-300 text-gray-600'}`}
              >
                Uang
              </button>
              <button
                type="button"
                onClick={() => setJenis('barang')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition
                  ${jenis === 'barang'
                    ? 'bg-[#1E293B] text-white border-[#1E293B]'
                    : 'border-gray-300 text-gray-600'}`}
              >
                Barang
              </button>
            </div>
          </div>

          {/* Nama pihak (dinamis) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{labelNamaPihak}</label>
            <input
              type="text"
              value={namaPihak}
              onChange={(e) => setNamaPihak(e.target.value)}
              required
              className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />
          </div>

          {/* Jumlah uang / nama barang, tergantung jenis */}
          {jenis === 'uang' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Uang (Rp)</label>
              <input
                type="number"
                value={jumlahUang}
                onChange={(e) => setJumlahUang(e.target.value)}
                required
                min="0"
                className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Barang</label>
              <input
                type="text"
                value={namaBarang}
                onChange={(e) => setNamaBarang(e.target.value)}
                required
                className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
              />
            </div>
          )}

          {/* Tanggal pinjam */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Pinjam</label>
            <input
              type="date"
              value={tanggalPinjam}
              onChange={(e) => setTanggalPinjam(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />
          </div>

          {/* Tanggal jatuh tempo (opsional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Jatuh Tempo (opsional)</label>
            <input
              type="date"
              value={tanggalJatuhTempo}
              onChange={(e) => setTanggalJatuhTempo(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />
          </div>

          {/* Catatan (opsional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (opsional)</label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={3}
              className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />
          </div>

          {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-[#0D9488] text-white font-semibold rounded-lg py-2 hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : 'Simpan Peminjaman'}
          </button>
        </form>
      </div>

      {/* Modal Sukses */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full text-center relative">
            <button
              onClick={() => setShowSuccess(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="w-14 h-14 bg-[#0D9488]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-[#0D9488]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-[#1E293B] mb-2">Berhasil!</h2>
            <p className="text-gray-600 text-sm mb-4">Peminjaman berhasil dicatat.</p>
            <button
              onClick={() => setShowSuccess(false)}
              className="bg-[#0D9488] text-white font-semibold rounded-lg py-2 px-6 hover:opacity-90 transition"
            >
              Oke
            </button>
          </div>
        </div>
      )}
    </div>
  )
}