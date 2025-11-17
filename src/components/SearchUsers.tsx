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
    // Immediately update UI - allow unlimited fast clicking
    onUserClick(user.id)
    
    try {
      // Just insert the gloop - let the database handle counting
      const { error: gloopError } = await supabase
        .from('gloops')
        .insert({ user_id: user.id })

      if (gloopError) throw gloopError

      // Update count using database function for atomic increment
      const { error: updateError } = await supabase
        .rpc('increment_gloop_count', { user_id: user.id })

      if (updateError) {
        // Fallback to manual update if RPC doesn't exist
        const { data: userData } = await supabase
          .from('users')
          .select('gloop_count, daily_gloop_count')
          .eq('id', user.id)
          .single()

        if (userData) {
          await supabase
            .from('users')
            .update({ 
              gloop_count: userData.gloop_count + 1,
              daily_gloop_count: userData.daily_gloop_count + 1
            })
            .eq('id', user.id)
        }
      }

    } catch (error) {
      console.error('Error glooping user:', error)
    }
  }

  return (
    <div className="relative">
      <div>
        <input
          type="text"
          placeholder="Search for a name..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-purple-200 rounded-lg shadow-lg z-50 mt-1">
          <div className="space-y-3 p-3">
            {searchResults.map((user) => (
              <motion.div
                key={user.id}
                className="flex items-center justify-between"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.1 }}
              >
                <div className="flex items-center gap-3">
                  <motion.button
                    onClick={() => handleGloopUser(user)}
                    className="text-left hover:bg-purple-50 px-3 py-2 rounded-lg transition-all border border-transparent hover:border-purple-200 shadow-sm hover:shadow-md"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="font-medium text-gray-900">
                      {user.first_name} {user.last_name}
                    </span>
                  </motion.button>
                </div>
                <div className="flex items-center gap-2">
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
            ))}
          </div>
        </div>
      )}

      {searchTerm && searchResults.length === 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-purple-200 rounded-lg shadow-lg z-50 mt-1">
          <div className="text-center py-4 text-gray-500">
            No users found matching "{searchTerm}"
          </div>
        </div>
      )}
    </div>
  )
}