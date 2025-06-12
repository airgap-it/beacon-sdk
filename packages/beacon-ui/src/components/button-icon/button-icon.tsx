import React from 'react'
import './button-icon.css'

interface ButtonIconProps {
  onClick?: () => void
  children: React.ReactNode
  className?: string
}

export const ButtonIcon: React.FC<ButtonIconProps> = ({ onClick, children, className = '' }) => {
  return (
    <div className={`button-icon ${className}`} onClick={onClick}>
      {children}
    </div>
  )
}