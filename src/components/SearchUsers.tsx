'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'

interface User {
  id: string
  first_name: string
  last_name: string
  gloop_count: number
  daily_gloop_count: number
  gloop_boosts: number
}

interface SearchUsersProps {
  users: User[]
  onUserClick: (userId: string) => void
}

export default function SearchUsers({ users, onUserClick }: SearchUsersProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    if (term.trim() === '') {
      setSearchResults([])
      return
    }

    const filtered = users.filter(user => {
      const fullName = `${user.first_name} ${user.last_name}`.toLowerCase()
      return fullName.includes(term.toLowerCase())
    })
    
    setSearchResults(filtered.slice(0, 10))
  }

  const handleGloopUser = async (user: User) => {
    // Immediately update UI
    onUserClick(user.id)
    
    try {
      const { error: gloopError } = await supabase
        .from('gloops')
        .insert({ user_id: user.id })

      if (gloopError) throw gloopError

      const newGloopCount = user.gloop_count + 1
      const newDailyCount = user.daily_gloop_count + 1

      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          gloop_count: newGloopCount,
          daily_gloop_count: newDailyCount 
        })
        .eq('id', user.id)

      if (updateError) throw updateError

    } catch (error) {
      console.error('Error glooping user:', error)
      // On error, revert the optimistic update by fetching fresh data
      window.location.reload()
    }
  }

  return (
    <div className="bg-white border border-purple-200 rounded-lg p-4 shadow-sm">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search for a name..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {searchResults.length > 0 && (
        <div className="space-y-2">
          {searchResults.map((user) => (
            <motion.div
              key={user.id}
              className="flex items-center justify-between p-3 hover:bg-purple-50 rounded-lg transition-colors"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.1 }}
            >
              <motion.button
                onClick={() => handleGloopUser(user)}
                className="text-left flex-1 hover:bg-purple-100 p-2 rounded transition-all shadow-sm hover:shadow-md"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="font-medium text-gray-900">
                  {user.first_name} {user.last_name}
                </span>
              </motion.button>
              
              <div className="flex items-center gap-2">
                <motion.span 
                  className="text-lg font-bold text-purple-600"
                  key={user.gloop_count}
                  initial={{ scale: 1.2, color: '#7c3aed' }}
                  animate={{ scale: 1, color: '#7c3aed' }}
                  transition={{ duration: 0.3, type: 'spring' }}
                >
                  {user.gloop_count}
                </motion.span>
                {user.gloop_boosts > 0 && (
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                    {user.gloop_boosts}x
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {searchTerm && searchResults.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          No users found matching "{searchTerm}"
        </div>
      )}
    </div>
  )
}