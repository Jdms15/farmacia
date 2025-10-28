// src/pages/Products.jsx
import React, { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { useProducts } from '../hooks/useProducts'
import ProductList from '../components/products/ProductList'
import ProductForm from '../components/forms/ProductForm'
import ProductFilters from '../components/products/ProductFilters'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'

const Products = () => {
  const { 
    products, 
    filteredProducts,
    loading, 
    filters, 
    setFilters, 
    createProduct, 
    updateProduct, 
    deleteProduct,
    fetchProducts
  } = useProducts()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)

  // Usar productos filtrados si existen filtros activos, sino todos
  const displayProducts = filters.search || 
                          filters.proximosVencer || 
                          filters.bajoStock || 
                          filters.refrigeracion !== undefined
    ? filteredProducts
    : products

  const handleCreate = () => {
    setEditingProduct(null)
    setIsModalOpen(true)
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setIsModalOpen(true)
  }

  const handleSave = async (productData) => {
    let result
    if (editingProduct) {
      result = await updateProduct(editingProduct.id, productData)
    } else {
      result = await createProduct(productData)
    }

    if (result.success) {
      setIsModalOpen(false)
      setEditingProduct(null)
    }
  }

  const handleDelete = async (productId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      await deleteProduct(productId)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-600">
            Gestiona el inventario de medicamentos
            {displayProducts.length !== products.length && (
              <span className="ml-2 text-blue-600">
                (Mostrando {displayProducts.length} de {products.length})
              </span>
            )}
          </p>
        </div>
        <Button onClick={handleCreate} className="flex items-center space-x-2">
          <Plus size={20} />
          <span>Nuevo Producto</span>
        </Button>
      </div>

      <ProductFilters filters={filters} onFiltersChange={setFilters} />

      <ProductList
        products={displayProducts}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
        size="lg"
      >
        <ProductForm
          product={editingProduct}
          onSave={handleSave}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  )
}

export default Products