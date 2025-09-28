// src/App.jsx - Actualizado con ruta de usuarios
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Movements from './pages/Movements'
import Reports from './pages/Reports'
import UsersAdmin from './pages/UsersAdmin'
import Login from './pages/Login'
import NotFound from './pages/NotFound'

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={<Login />} />
          
          {/* Rutas protegidas */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="productos" element={<Products />} />
            <Route path="movimientos" element={<Movements />} />
            <Route path="reportes" element={<Reports />} />
            
            {/* Ruta solo para administradores */}
            <Route 
              path="usuarios" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <UsersAdmin />
                </ProtectedRoute>
              } 
            />
          </Route>

          {/* Ruta 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>

        {/* Notificaciones */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#059669',
              },
            },
            error: {
              style: {
                background: '#DC2626',
              },
            },
          }}
        />
      </div>
    </Router>
  )
}

export default App