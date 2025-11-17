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

interface RecentsProps {
  recentGloops: User[]
  onUserClick: (userId: string) => void
}

export default function Recents({ recentGloops, onUserClick }: RecentsProps) {
  const handleGloopUser = (userId: string) => {
    onUserClick(userId)
  }

  const handleKeyHold = (event: KeyboardEvent<HTMLButtonElement>, userId: string) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleGloopUser(userId)
    }
  }
  return (
    <div className="bg-white border border-purple-200 rounded-lg p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-purple-600 mb-6">Recents</h2>
      
      <div className="space-y-3 overflow-y-auto overflow-x-hidden pt-4" style={{ maxHeight: 'calc(100vh - 510px)' }}>
        {recentGloops.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No recent gloops yet! Click on names to gloop them.</p>
        ) : (
          recentGloops.map((user) => (
            <motion.div
              key={user.id}
              className="flex items-center justify-between"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.1 }}
            >
              <div className="flex items-center gap-3">
                <motion.button
                  onClick={() => handleGloopUser(user.id)}
                  onKeyDown={(event) => handleKeyHold(event, user.id)}
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
                  key={user.gloop_count}
                  initial={{ scale: 1.2, color: '#7c3aed' }}
                  animate={{ scale: 1, color: '#7c3aed' }}
                  transition={{ duration: 0.3, type: 'spring' }}
                >
                  {user.gloop_count}
                </motion.span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
