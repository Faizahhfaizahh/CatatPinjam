import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import SignUp from './pages/Signup'
import Dashboard from './pages/Dashboard'
import TambahPeminjaman from './pages/TambahPeminjaman'
import DaftarPeminjaman from './pages/DaftarPeminjaman'
import KelolaCicilan from './pages/KelolaCicilan'
import Akun from './pages/Akun'
import LupaPassword from './pages/LupaPassword'
import ResetPassword from './pages/ResetPassword'
import ProtectedRoute from './components/ProtectedRoute'
import { supabase } from './supabaseClient'

function App() {
  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/lupa-password" element={<LupaPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/tambah"
          element={
            <ProtectedRoute>
              <TambahPeminjaman onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/daftar"
          element={
            <ProtectedRoute>
              <DaftarPeminjaman onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/cicilan/:id"
          element={
            <ProtectedRoute>
              <KelolaCicilan onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/profil"
          element={
            <ProtectedRoute>
              <Akun onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
      </Routes>

    </BrowserRouter>
  )
}

export default App