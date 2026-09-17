import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import Sidebar from '../components/Sidebar'
import { Pencil, Trash2, ArrowDownCircle, ArrowUpCircle, Wallet, Package, Search, X, ChevronDown, ChevronLeft, ChevronRight, Eye, CheckCircle2, XCircle } from 'lucide-react'

export default function DaftarPeminjaman({ onLogout }) {
  const navigate = useNavigate()

  const [data, setData] = useState([])
  const [cicilanList, setCicilanList] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  const [editItem, setEditItem] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [viewItem, setViewItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toast, setToast] = useState(null) // notif jika berhasil di update/hapus
  const [toastVisible, setToastVisible] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [filterArah, setFilterArah] = useState('semua')
  const [filterJenis, setFilterJenis] = useState('semua')
  const [filterStatus, setFilterStatus] = useState('semua')

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const fetchData = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('peminjaman')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: cicilanData, error: cicilanError } = await supabase
      .from('cicilan')
      .select('*')

    if (error || cicilanError) {
      setErrorMsg(error?.message || cicilanError?.message)
    } else {
      setData(data)
      setCicilanList(cicilanData)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterArah, filterJenis, filterStatus])

  const handleDelete = (id) => {
    setDeleteTarget(id)
  }

  const confirmDelete = async () => {
    const { error } = await supabase.from('peminjaman').delete().eq('id', deleteTarget)
    if (error) {
      showToast(error.message, 'error')
    } else {
      setData(data.filter((item) => item.id !== deleteTarget))
      showToast('Catatan berhasil dihapus.')
    }
    setDeleteTarget(null)
  }

  const openEdit = (item) => {
    setEditItem(item)
    setEditForm({
      nama_pihak: item.nama_pihak,
      jumlah_uang: item.jumlah_uang || '',
      nama_barang: item.nama_barang || '',
      tanggal_pinjam: item.tanggal_pinjam || '',
      tanggal_jatuh_tempo: item.tanggal_jatuh_tempo || '',
      status: item.status,
      tanggal_selesai: item.tanggal_selesai || '',
      catatan: item.catatan || '',
    })
  }

  const handleStatusChange = (newStatus) => {
    setEditForm({
      ...editForm,
      status: newStatus,
      tanggal_selesai: newStatus === 'lunas'
        ? (editForm.tanggal_selesai || new Date().toISOString().slice(0, 10))
        : '',
    })
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase
      .from('peminjaman')
      .update({
        nama_pihak: editForm.nama_pihak,
        jumlah_uang: editItem.jenis === 'uang' ? Number(editForm.jumlah_uang) : null,
        nama_barang: editItem.jenis === 'barang' ? editForm.nama_barang : null,
        tanggal_pinjam: editForm.tanggal_pinjam,
        tanggal_jatuh_tempo: editForm.tanggal_jatuh_tempo || null,
        status: editForm.status,
        tanggal_selesai: editForm.status === 'lunas' ? editForm.tanggal_selesai : null,
        catatan: editForm.catatan || null,
      })
      .eq('id', editItem.id)

    if (error) {
      showToast(error.message, 'error')
    } else {
      setEditItem(null)
      fetchData()
      showToast('Perubahan berhasil disimpan.')
    }
    setSaving(false)
  }

  const formatRupiah = (angka) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka)

  const formatTanggal = (tanggal) => {
    if (!tanggal) return '-'
    const [tahun, bulan, hari] = tanggal.split('-')
    return `${hari}-${bulan}-${tahun}`
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 1800) // mulai fade out
    setTimeout(() => setToast(null), 2200) // hilang total dari DOM
  }

  const getStatusLabel = (status, jenis) => {
    if (jenis === 'barang') {
      return status === 'lunas' ? 'Dikembalikan' : 'Belum Dikembalikan'
    }
    return status === 'lunas' ? 'Lunas' : 'Belum Lunas'
  }

  const getTotalCicilan = (peminjamanId) =>
    cicilanList
      .filter((c) => c.peminjaman_id === peminjamanId)
      .reduce((sum, c) => sum + Number(c.jumlah), 0)

  const getProgress = (item) => {
    if (item.jenis !== 'uang') return null
    const totalDibayar = getTotalCicilan(item.id)
    const sisa = item.jumlah_uang - totalDibayar
    const persen = item.jumlah_uang > 0
      ? Math.min(100, Math.round((totalDibayar / item.jumlah_uang) * 100))
      : 0
    return { totalDibayar, sisa, persen }
  }

  const filteredData = data.filter((item) => {
    const cocokNama = item.nama_pihak.toLowerCase().includes(searchQuery.toLowerCase())
    const cocokArah = filterArah === 'semua' || item.arah === filterArah
    const cocokJenis = filterJenis === 'semua' || item.jenis === filterJenis
    const cocokStatus = filterStatus === 'semua' || item.status === filterStatus
    return cocokNama && cocokArah && cocokJenis && cocokStatus
  })

  const adaFilterAktif = searchQuery || filterArah !== 'semua' || filterJenis !== 'semua' || filterStatus !== 'semua'

  const resetFilter = () => {
    setSearchQuery('')
    setFilterArah('semua')
    setFilterJenis('semua')
    setFilterStatus('semua')
  }

  const Dropdown = ({ options, value, onChange }) => {
    const [open, setOpen] = useState(false)
    const isActive = value !== 'semua'
    const selectedLabel = options.find((opt) => opt.value === value)?.label

    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold transition
            ${isActive
              ? 'bg-[#1E293B] text-white border-[#1E293B]'
              : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}
        >
          {selectedLabel}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-[150px] overflow-hidden py-1">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm transition
                    ${value === opt.value
                      ? 'bg-[#0D9488]/10 text-[#0D9488] font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const ArahBadge = ({ arah }) => {
    const isMeminjamkan = arah === 'saya_meminjamkan'
    return (
      <span
        className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap
          ${isMeminjamkan ? 'bg-teal-100 text-teal-700' : 'bg-orange-100 text-orange-700'}`}
      >
        {isMeminjamkan ? <ArrowUpCircle className="h-3.5 w-3.5" /> : <ArrowDownCircle className="h-3.5 w-3.5" />}
        {isMeminjamkan ? 'Meminjamkan' : 'Meminjam'}
      </span>
    )
  }

  const JenisBadge = ({ jenis }) => {
    const isUang = jenis === 'uang'
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 whitespace-nowrap">
        {isUang ? <Wallet className="h-3.5 w-3.5" /> : <Package className="h-3.5 w-3.5" />}
        {isUang ? 'Uang' : 'Barang'}
      </span>
    )
  }

  const StatusBadge = ({ status, jenis }) => (
    <span
      className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap
        ${status === 'lunas' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}
    >
      {getStatusLabel(status, jenis)}
    </span>
  )

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />

      <div className="flex-1 md:ml-64 p-6 md:p-10">
        <h1 className="text-2xl font-bold text-[#1E293B] mb-6 mt-12 md:mt-0">Daftar Peminjaman</h1>

        <div className="flex flex-col gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border border-gray-300 rounded-lg pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
            <Dropdown
              value={filterArah}
              onChange={setFilterArah}
              options={[
                { value: 'semua', label: 'Semua Arah' },
                { value: 'saya_meminjamkan', label: 'Meminjamkan' },
                { value: 'saya_meminjam', label: 'Meminjam' },
              ]}
            />
            <Dropdown
              value={filterJenis}
              onChange={setFilterJenis}
              options={[
                { value: 'semua', label: 'Semua Jenis' },
                { value: 'uang', label: 'Uang' },
                { value: 'barang', label: 'Barang' },
              ]}
            />
            <Dropdown
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: 'semua', label: 'Semua Status' },
                { value: 'lunas', label: 'Lunas / Dikembalikan' },
                { value: 'belum_lunas', label: 'Belum Lunas / Belum Dikembalikan' },
              ]}
            />

            {adaFilterAktif && (
              <button
                onClick={resetFilter}
                className="flex items-center gap-1 text-sm font-medium text-red-500 hover:underline md:ml-auto"
              >
                <X className="h-4 w-4" /> Reset Filter
              </button>
            )}
          </div>
        </div>

        {loading && <p className="text-gray-500">Memuat data...</p>}
        {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}
        {!loading && filteredData.length === 0 && (
          <p className="text-gray-500">Belum ada catatan peminjaman.</p>
        )}

        {/* Tabel — desktop/tablet ke atas */}
        {!loading && filteredData.length > 0 && (
          <div className="hidden md:block bg-white rounded-2xl shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="px-4 py-3 font-medium">Arah</th>
                  <th className="px-4 py-3 font-medium">Jenis</th>
                  <th className="px-4 py-3 font-medium">Nama Pihak</th>
                  <th className="px-4 py-3 font-medium">Jumlah / Barang</th>
                  <th className="px-4 py-3 font-medium">Tanggal Pinjam</th>
                  <th className="px-4 py-3 font-medium">Jatuh Tempo</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Selesai</th>
                  <th className="px-4 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3"><ArahBadge arah={item.arah} /></td>
                    <td className="px-4 py-3"><JenisBadge jenis={item.jenis} /></td>
                    <td className="px-4 py-3 font-medium text-[#1E293B]">{item.nama_pihak}</td>
                    <td className="px-4 py-3 text-[#1E293B]">
                      {item.jenis === 'uang' ? (
                        <div className="min-w-[150px]">
                          <p>{formatRupiah(item.jumlah_uang)}</p>
                          {item.status === 'belum_lunas' && (() => {
                            const { totalDibayar, sisa, persen } = getProgress(item)
                            return (
                              <div className="mt-1.5">
                                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-[#0D9488] rounded-full transition-all"
                                    style={{ width: `${persen}%` }}
                                  />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  Dibayar {formatRupiah(totalDibayar)} · Sisa {formatRupiah(sisa)}
                                </p>
                              </div>
                            )
                          })()}
                        </div>
                      ) : (
                        item.nama_barang
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatTanggal(item.tanggal_pinjam)}</td>
                    <td className="px-4 py-3 text-gray-500">{formatTanggal(item.tanggal_jatuh_tempo)}</td>
                    <td className="px-4 py-3"><StatusBadge status={item.status} jenis={item.jenis} /></td>
                    <td className="px-4 py-3 text-gray-500">{formatTanggal(item.tanggal_selesai)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        {item.jenis === 'uang' ? (
                          <button onClick={() => navigate(`/dashboard/cicilan/${item.id}`)} className="text-purple-500 hover:opacity-70" title="Kelola Cicilan">
                            <Wallet className="h-4 w-4" />
                          </button>
                        ) : (
                          <span className="w-4 h-4" />
                        )}
                        <button onClick={() => setViewItem(item)} className="text-blue-500 hover:opacity-70" title="Lihat Detail">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => openEdit(item)} className="text-yellow-500 hover:opacity-70" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:opacity-70" title="Hapus">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Kartu — mobile */}
        <div className="md:hidden flex flex-col gap-4">
          {paginatedData.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl shadow p-5 flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <ArahBadge arah={item.arah} />
                <JenisBadge jenis={item.jenis} />
                <StatusBadge status={item.status} jenis={item.jenis} />
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  {item.arah === 'saya_meminjamkan' ? 'Peminjam' : 'Pemberi Pinjaman'}
                </p>
                <p className="text-lg font-semibold text-[#1E293B]">{item.nama_pihak}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">{item.jenis === 'uang' ? 'Jumlah' : 'Nama Barang'}</p>
                <p className="text-base font-medium text-[#1E293B]">
                  {item.jenis === 'uang' ? formatRupiah(item.jumlah_uang) : item.nama_barang}
                </p>
                {item.jenis === 'uang' && item.status === 'belum_lunas' && (() => {
                  const { totalDibayar, sisa, persen } = getProgress(item)
                  return (
                    <div className="mt-2">
                      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#0D9488] rounded-full transition-all"
                          style={{ width: `${persen}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Dibayar {formatRupiah(totalDibayar)} · Sisa {formatRupiah(sisa)}
                      </p>
                    </div>
                  )
                })()}
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <span>Pinjam: {formatTanggal(item.tanggal_pinjam)}</span>
                {item.tanggal_jatuh_tempo && <span>Jatuh Tempo: {formatTanggal(item.tanggal_jatuh_tempo)}</span>}
                {item.tanggal_selesai && <span>Selesai: {formatTanggal(item.tanggal_selesai)}</span>}
              </div>

              {item.catatan && <p className="text-sm text-gray-600 italic">"{item.catatan}"</p>}

              <div className="flex gap-4 pt-2 border-t border-gray-100 flex-wrap">
                {item.jenis === 'uang' && (
                  <button onClick={() => navigate(`/dashboard/cicilan/${item.id}`)} className="flex items-center gap-1 text-sm font-medium text-purple-500">
                    <Wallet className="h-4 w-4" /> Cicilan
                  </button>
                )}
                <button onClick={() => setViewItem(item)} className="flex items-center gap-1 text-sm font-medium text-blue-500">
                  <Eye className="h-4 w-4" /> Lihat
                </button>
                <button onClick={() => openEdit(item)} className="flex items-center gap-1 text-sm font-medium text-yellow-500">
                  <Pencil className="h-4 w-4" /> Edit
                </button>
                <button onClick={() => handleDelete(item.id)} className="flex items-center gap-1 text-sm font-medium text-red-500">
                  <Trash2 className="h-4 w-4" /> Hapus
                </button>
              </div>
            </div>
          ))}
        </div>

        {!loading && filteredData.length > 0 && totalPages > 1 && (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-6">
            <p className="text-sm text-gray-500">
              Menampilkan {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length} data
            </p>

            <div className="flex items-center justify-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-7 w-7 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`h-7 w-7 flex items-center justify-center rounded-full text-xs font-semibold transition
                    ${currentPage === page
                      ? 'bg-[#0D9488] text-white'
                      : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-7 w-7 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Edit (sama untuk semua ukuran layar) */}
      {editItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-50">
          <form
            onSubmit={handleUpdate}
            className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-lg font-bold text-[#1E293B]">Edit Peminjaman</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {editItem.arah === 'saya_meminjamkan' ? 'Nama Peminjam' : 'Nama Pemberi Pinjaman'}
              </label>
              <input
                type="text"
                value={editForm.nama_pihak}
                onChange={(e) => setEditForm({ ...editForm, nama_pihak: e.target.value })}
                required
                className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
              />
            </div>

            {editItem.jenis === 'uang' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Uang (Rp)</label>
                <input
                  type="number"
                  value={editForm.jumlah_uang}
                  onChange={(e) => setEditForm({ ...editForm, jumlah_uang: e.target.value })}
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
                  value={editForm.nama_barang}
                  onChange={(e) => setEditForm({ ...editForm, nama_barang: e.target.value })}
                  required
                  className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Pinjam</label>
              <input
                type="date"
                value={editForm.tanggal_pinjam}
                onChange={(e) => setEditForm({ ...editForm, tanggal_pinjam: e.target.value })}
                required
                className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Jatuh Tempo</label>
              <input
                type="date"
                value={editForm.tanggal_jatuh_tempo}
                onChange={(e) => setEditForm({ ...editForm, tanggal_jatuh_tempo: e.target.value })}
                className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleStatusChange('belum_lunas')}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition
                    ${editForm.status === 'belum_lunas'
                      ? 'bg-yellow-500 text-white border-yellow-500'
                      : 'border-gray-300 text-gray-600'}`}
                >
                  {getStatusLabel('belum_lunas', editItem.jenis)}
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('lunas')}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition
                    ${editForm.status === 'lunas'
                      ? 'bg-green-600 text-white border-green-600'
                      : 'border-gray-300 text-gray-600'}`}
                >
                  {getStatusLabel('lunas', editItem.jenis)}
                </button>
              </div>
            </div>

            {editForm.status === 'lunas' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editItem.jenis === 'uang' ? 'Tanggal Lunas' : 'Tanggal Dikembalikan'}
                </label>
                <input
                  type="date"
                  value={editForm.tanggal_selesai}
                  onChange={(e) => setEditForm({ ...editForm, tanggal_selesai: e.target.value })}
                  className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
              <textarea
                value={editForm.catatan}
                onChange={(e) => setEditForm({ ...editForm, catatan: e.target.value })}
                rows={2}
                className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditItem(null)}
                className="flex-1 border border-gray-300 text-gray-600 font-semibold rounded-lg py-2 hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-[#0D9488] text-white font-semibold rounded-lg py-2 hover:opacity-90 transition disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal untuk melihat */}
      {viewItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1E293B]">Detail Peminjaman</h2>
              <button onClick={() => setViewItem(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <ArahBadge arah={viewItem.arah} />
              <JenisBadge jenis={viewItem.jenis} />
              <StatusBadge status={viewItem.status} jenis={viewItem.jenis} />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                {viewItem.arah === 'saya_meminjamkan' ? 'Nama Peminjam' : 'Nama Pemberi Pinjaman'}
              </p>
              <p className="text-base font-semibold text-[#1E293B]">{viewItem.nama_pihak}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">{viewItem.jenis === 'uang' ? 'Jumlah' : 'Nama Barang'}</p>
              <p className="text-base font-medium text-[#1E293B]">
                {viewItem.jenis === 'uang' ? formatRupiah(viewItem.jumlah_uang) : viewItem.nama_barang}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Tanggal Pinjam</p>
                <p className="text-sm font-medium text-[#1E293B]">{formatTanggal(viewItem.tanggal_pinjam)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Jatuh Tempo</p>
                <p className="text-sm font-medium text-[#1E293B]">{formatTanggal(viewItem.tanggal_jatuh_tempo)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{viewItem.jenis === 'uang' ? 'Tanggal Lunas' : 'Tanggal Dikembalikan'}</p>
                <p className="text-sm font-medium text-[#1E293B]">{formatTanggal(viewItem.tanggal_selesai)}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Catatan</p>
              <p className="text-sm text-gray-700 italic bg-gray-50 rounded-lg p-3">
                {viewItem.catatan || 'Tidak ada catatan.'}
              </p>
            </div>

            <button
              onClick={() => setViewItem(null)}
              className="bg-[#1E293B] text-white font-semibold rounded-lg py-2 hover:opacity-90 transition"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-[#1E293B] mb-2">Konfirmasi Penghapusan</h2>
            <p className="text-sm text-gray-500 mb-6">
              Catatan yang sudah dihapus tidak bisa dikembalikan lagi
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 border border-gray-300 text-gray-600 font-semibold rounded-lg py-2 hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
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