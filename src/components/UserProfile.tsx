'use client'

import { motion } from 'framer-motion'

interface User {
  id: string
  first_name: string
  last_name: string
  gloop_count: number
  daily_gloop_count: number
  gloop_boosts: number
}

interface UserProfileProps {
  user: User
}

export default function UserProfile({ user }: UserProfileProps) {
  return (
    <motion.div
      className="flex items-center gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-left">
        <h3 className="text-2xl font-bold text-purple-600">
          {user.first_name} {user.last_name}
        </h3>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Gloops: <strong className="text-purple-600">{user.gloop_count}</strong></span>
          <span>Today: <strong className="text-purple-600">{user.daily_gloop_count}</strong></span>
          {user.gloop_boosts > 0 && (
            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
              {user.gloop_boosts} boosts
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}