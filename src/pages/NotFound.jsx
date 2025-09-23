// src/pages/NotFound.jsx
import React from 'react'
import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'
import Button from '../components/ui/Button'

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Página no encontrada
        </h2>
        <p className="text-gray-600 mb-8">
          La página que buscas no existe o ha sido movida.
        </p>
        <Link to="/">
          <Button className="flex items-center space-x-2">
            <Home size={20} />
            <span>Volver al inicio</span>
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default NotFound