import React from 'react'
import { Icon } from '@/components/ui/Icon'
const Card = ({children, className}) => {
  return (
    <div className={`relative p-6 rounded-none shadow-xl ${className}  border border-gray-600`}>
        <Icon className="absolute h-6 w-6 -top-3 -left-3 dark:text-gray-600 text-black" />
        <Icon className="absolute h-6 w-6 -bottom-3 -left-3 dark:text-gray-600 text-black" />
        <Icon className="absolute h-6 w-6 -top-3 -right-3 dark:text-gray-600 text-black" />
        <Icon className="absolute h-6 w-6 -bottom-3 -right-3 dark:text-gray-600 text-black" />
        {children}
    </div>
  )
}

export default Card