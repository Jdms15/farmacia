// src/components/ui/Input.jsx
import React, { forwardRef } from 'react'

const Input = forwardRef(({
  label,
  error,
  type = 'text',
  className = '',
  required = false,
  placeholder,
  disabled = false,
  helperText,
  leftIcon,
  rightIcon,
  onLeftIconClick,
  onRightIconClick,
  ...props
}, ref) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {/* Icono izquierdo */}
        {leftIcon && (
          <div 
            className={`absolute inset-y-0 left-0 pl-3 flex items-center ${
              onLeftIconClick ? 'cursor-pointer' : 'pointer-events-none'
            }`}
            onClick={onLeftIconClick}
          >
            <div className="text-gray-400">
              {leftIcon}
            </div>
          </div>
        )}

        {/* Input principal */}
        <input
          ref={ref}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
            focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            placeholder:text-gray-400
            ${error ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500 focus:border-red-500' : ''}
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            ${className}
          `}
          {...props}
        />

        {/* Icono derecho */}
        {rightIcon && (
          <div 
            className={`absolute inset-y-0 right-0 pr-3 flex items-center ${
              onRightIconClick ? 'cursor-pointer' : 'pointer-events-none'
            }`}
            onClick={onRightIconClick}
          >
            <div className="text-gray-400">
              {rightIcon}
            </div>
          </div>
        )}
      </div>

      {/* Texto de ayuda */}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}

      {/* Mensaje de error */}
      {error && (
        <p className="text-sm text-red-600 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input