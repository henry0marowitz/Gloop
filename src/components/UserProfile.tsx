'use client'

import type { KeyboardEvent } from 'react'
import { motion } from 'framer-motion'

interface User {
  id: string
  first_name: string
  last_name: string
  gloop_count: number
  daily_gloop_count: number
  gloop_boosts: number
  received_gloops_today?: number
  received_gloops_total?: number
  daily_boosts_used?: number
}

interface UserProfileProps {
  user: User
  onSelfGloop: (userId: string) => void
  onActivateBoost?: () => void
  boostActive?: boolean
  boostTimeLeft?: number
}

export default function UserProfile({ user, onSelfGloop, onActivateBoost, boostActive, boostTimeLeft }: UserProfileProps) {
  const handleKeyHold = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      onSelfGloop(user.id)
    }
  }

  return (
    <motion.div
      className="w-full text-left hover:bg-purple-50 px-6 py-6 rounded-lg transition-all border border-transparent hover:border-purple-200 shadow-sm hover:shadow-md cursor-pointer"
      onClick={() => onSelfGloop(user.id)}
      onKeyDown={handleKeyHold}
      tabIndex={0}
      role="button"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center justify-between">
        <div className="text-left">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <h3 className="text-3xl font-bold text-purple-600">
                {user.first_name} {user.last_name}
              </h3>
              {boostActive && boostTimeLeft && (
                <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  🚀 {Math.floor(boostTimeLeft / 60)}:{(boostTimeLeft % 60).toString().padStart(2, '0')}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 text-base text-gray-600">
            <span>Gloops: <strong className="text-purple-600">{user.gloop_count}</strong></span>
            <span>Today: <strong className="text-purple-600">{user.daily_gloop_count}</strong></span>
            {user.gloop_boosts > 0 && (
              <motion.button
                onClick={(e) => {
                  e.stopPropagation()
                  if (onActivateBoost) {
                    onActivateBoost()
                  }
                }}
                className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium hover:bg-yellow-200 transition-colors cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {user.gloop_boosts} boosts ({10 - (user.daily_boosts_used || 0)} left today)
              </motion.button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.span 
            className="text-4xl font-bold text-purple-600"
            key={user.gloop_count}
            initial={{ scale: 1.2, color: '#7c3aed' }}
            animate={{ scale: 1, color: '#7c3aed' }}
            transition={{ duration: 0.3, type: 'spring' }}
          >
            {user.gloop_count}
          </motion.span>
        </div>
      </div>
    </motion.div>
  )
}
