// src/components/dashboard/Charts.jsx
import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from 'recharts'
import Card from '../ui/Card'

const Charts = ({ productsByLaboratory, expirationData }) => {
  const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6']

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Productos por Laboratorio */}
      <Card title="Productos por Laboratorio">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={productsByLaboratory}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="laboratorio" 
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="cantidad" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Estado de Vencimientos */}
      <Card title="Estado de Vencimientos">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={expirationData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {expirationData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}

export default Charts