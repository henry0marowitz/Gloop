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
}

interface GlooperBoardProps {
  title: string
  users: User[]
  type: 'global' | 'daily'
  onUserClick: (userId: string) => void
}

export default function GlooperBoard({ title, users, type, onUserClick }: GlooperBoardProps) {
  const handleGloopUser = async (user: User) => {
    // Use centralized update function
    onUserClick(user.id)
  }

  const handleKeyHold = (event: KeyboardEvent<HTMLButtonElement>, user: User) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleGloopUser(user)
    }
  }

  const sortedUsers = users
    .sort((a, b) => {
      const aCount = type === 'global' ? a.gloop_count : a.daily_gloop_count
      const bCount = type === 'global' ? b.gloop_count : b.daily_gloop_count
      return bCount - aCount
    })

  return (
    <div className="bg-white border border-purple-200 rounded-lg p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-purple-600 mb-6">{title}</h2>
      <div className="space-y-3 overflow-y-auto overflow-x-hidden pt-4" style={{ maxHeight: 'calc(100vh - 510px)' }}>
        {sortedUsers.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No users yet! Be the first to sign up.</p>
        ) : (
          sortedUsers.map((user, index) => (
            <motion.div
              key={user.id}
              className="flex items-center justify-between"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.1 }}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold text-purple-500 w-8 ml-2">
                  #{index + 1}
                </span>
                <motion.button
                  onClick={() => handleGloopUser(user)}
                  onKeyDown={(event) => handleKeyHold(event, user)}
                  className="text-left hover:bg-purple-50 px-3 py-2 rounded-lg transition-all border border-transparent hover:border-purple-200 shadow-sm hover:shadow-md"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="font-medium text-gray-900">
                    {user.first_name} {user.last_name}
                  </span>
                </motion.button>
              </div>
              <div className="flex items-center gap-2 mr-4">
                <motion.span 
                  className="text-xl font-bold text-purple-600"
                  key={type === 'global' ? user.gloop_count : user.daily_gloop_count}
                  initial={{ scale: 1.2, color: '#7c3aed' }}
                  animate={{ scale: 1, color: '#7c3aed' }}
                  transition={{ duration: 0.3, type: 'spring' }}
                >
                  {type === 'global' ? user.gloop_count : user.daily_gloop_count}
                </motion.span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
