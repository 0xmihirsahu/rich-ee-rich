import React from 'react'
import { Icon } from '@/components/ui/Icon'
import clsx from 'clsx'
const Card = ({children, className}) => {
  return (
    <div className={clsx(
      'relative p-6 bg-gradient-to-br from-zinc-800/5 via-zinc-900/10 to-black/60 shadow-[0_10px_20px_rgba(0,0,0,0.5),_0_6px_6px_rgba(0,0,0,0.3)] border border-gray-700',
      className
    )}>
        <Icon className="absolute h-6 w-6 -top-3 -left-3 dark:text-gray-600 text-black" />
        <Icon className="absolute h-6 w-6 -bottom-3 -left-3 dark:text-gray-600 text-black" />
        <Icon className="absolute h-6 w-6 -top-3 -right-3 dark:text-gray-600 text-black" />
        <Icon className="absolute h-6 w-6 -bottom-3 -right-3 dark:text-gray-600 text-black" />
        {children}
    </div>
  )
}

export default Card