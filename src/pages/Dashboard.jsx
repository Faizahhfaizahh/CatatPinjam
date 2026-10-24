import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import Sidebar from '../components/Sidebar'
import { ArrowUpCircle, ArrowDownCircle, Package, ListChecks } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function Dashboard({ onLogout }) {
  const [data, setData] = useState([])
  const [cicilanList, setCicilanList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const { data: peminjamanData } = await supabase
        .from('peminjaman')
        .select('*')
        .order('tanggal_pinjam', { ascending: false })

      const { data: cicilanData } = await supabase
        .from('cicilan')
        .select('*')

      setData(peminjamanData || [])
      setCicilanList(cicilanData || [])
      setLoading(false)
    }
    fetchData()
  }, [])

  const formatRupiah = (angka) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka)

  const formatTanggal = (tanggal) => {
    if (!tanggal) return '-'
    const [tahun, bulan, hari] = tanggal.split('-')
    return `${hari}-${bulan}-${tahun}`
  }

  const getSisaUang = (item) => {
    const totalCicilan = cicilanList
      .filter((c) => c.peminjaman_id === item.id)
      .reduce((sum, c) => sum + Number(c.jumlah), 0)
    return item.jumlah_uang - totalCicilan
  }

  const piutang = data
    .filter((i) => i.jenis === 'uang' && i.arah === 'saya_meminjamkan' && i.status === 'belum_lunas')
    .reduce((sum, i) => sum + getSisaUang(i), 0)

  const hutang = data
    .filter((i) => i.jenis === 'uang' && i.arah === 'saya_meminjam' && i.status === 'belum_lunas')
    .reduce((sum, i) => sum + getSisaUang(i), 0)

  const barangBelumKembali = data.filter((i) => i.jenis === 'barang' && i.status === 'belum_lunas').length

  const totalBelumLunas = data.filter((i) => i.status === 'belum_lunas').length

  const dataStatus = [
    { name: 'Lunas', value: data.filter((i) => i.status === 'lunas').length },
    { name: 'Belum Lunas', value: data.filter((i) => i.status === 'belum_lunas').length },
  ]
  const WARNA_STATUS = ['#0D9488', '#F59E0B']

  const dataArah = [
    {
      name: 'Meminjamkan',
      total: data.filter((i) => i.arah === 'saya_meminjamkan' && i.jenis === 'uang').reduce((s, i) => s + Number(i.jumlah_uang), 0),
    },
    {
      name: 'Meminjam',
      total: data.filter((i) => i.arah === 'saya_meminjam' && i.jenis === 'uang').reduce((s, i) => s + Number(i.jumlah_uang), 0),
    },
  ]

  const dataArahBarang = [
    {
      name: 'Dipinjamkan',
      total: data.filter((i) => i.arah === 'saya_meminjamkan' && i.jenis === 'barang').length,
    },
    {
      name: 'Dipinjam',
      total: data.filter((i) => i.arah === 'saya_meminjam' && i.jenis === 'barang').length,
    },
  ]
  const totalBarang = dataArahBarang.reduce((s, i) => s + i.total, 0)

  const transaksiTerbaru = data.slice(0, 5)

  const CardRingkasan = ({ icon: Icon, label, value, warna }) => (
    <div className="bg-white rounded-2xl shadow p-5 flex items-center gap-4">
      <div className={`h-11 w-11 rounded-full flex items-center justify-center ${warna.bg}`}>
        <Icon className={`h-5 w-5 ${warna.text}`} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-lg font-bold text-[#1E293B]">{value}</p>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar onLogout={onLogout} />
        <div className="flex-1 md:ml-64 p-6 md:p-10 mt-12 md:mt-0">
          <p className="text-gray-500">Memuat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={onLogout} />

      <div className="flex-1 md:ml-64 p-6 md:p-10 mt-12 md:mt-0">
        <h1 className="text-2xl font-bold text-[#1E293B] mb-6">Dashboard</h1>

        {/* Kartu Ringkasan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <CardRingkasan
            icon={ArrowUpCircle}
            label="Piutang (belum kembali)"
            value={formatRupiah(piutang)}
            warna={{ bg: 'bg-teal-100', text: 'text-teal-700' }}
          />
          <CardRingkasan
            icon={ArrowDownCircle}
            label="Hutang (belum dibayar)"
            value={formatRupiah(hutang)}
            warna={{ bg: 'bg-orange-100', text: 'text-orange-700' }}
          />
          <CardRingkasan
            icon={Package}
            label="Barang Belum Kembali"
            value={`${barangBelumKembali} item`}
            warna={{ bg: 'bg-slate-100', text: 'text-slate-700' }}
          />
          <CardRingkasan
            icon={ListChecks}
            label="Total Belum Lunas"
            value={`${totalBelumLunas} transaksi`}
            warna={{ bg: 'bg-yellow-100', text: 'text-yellow-700' }}
          />
        </div>

        {/* Grafik */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Status Peminjaman */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Status Peminjaman</h2>
            {data.length === 0 ? (
              <p className="text-sm text-gray-400">Belum ada data.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={dataStatus} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                    {dataStatus.map((entry, index) => (
                      <Cell key={index} fill={WARNA_STATUS[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Uang: Meminjamkan vs Meminjam */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Uang: Meminjamkan vs Meminjam</h2>
            {data.length === 0 ? (
              <p className="text-sm text-gray-400">Belum ada data.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={dataArah}
                    dataKey="total"
                    nameKey="name"
                    outerRadius={90}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    <Cell fill="#0D9488" />
                    <Cell fill="#FB923C" />
                  </Pie>
                  <Tooltip formatter={(value) => formatRupiah(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Barang: Dipinjamkan vs Dipinjam */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Barang: Dipinjamkan vs Dipinjam</h2>
            {totalBarang === 0 ? (
              <p className="text-sm text-gray-400">Belum ada data barang.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={dataArahBarang}
                    dataKey="total"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    <Cell fill="#0D9488" />
                    <Cell fill="#FB923C" />
                  </Pie>
                  <Tooltip formatter={(value) => `${value} item`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Transaksi Terbaru */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Transaksi Terbaru</h2>
          {transaksiTerbaru.length === 0 ? (
            <p className="text-sm text-gray-400">Belum ada transaksi.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {transaksiTerbaru.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b border-gray-50 last:border-0 pb-3 last:pb-0">
                  <div>
                    <p className="font-medium text-[#1E293B]">{item.nama_pihak}</p>
                    <p className="text-xs text-gray-500">
                      {item.arah === 'saya_meminjamkan' ? 'Meminjamkan' : 'Meminjam'} · {formatTanggal(item.tanggal_pinjam)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#1E293B]">
                      {item.jenis === 'uang' ? formatRupiah(item.jumlah_uang) : item.nama_barang}
                    </p>
                    <p className={`text-xs font-medium ${item.status === 'lunas' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {item.status === 'lunas' ? 'Lunas' : 'Belum Lunas'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
