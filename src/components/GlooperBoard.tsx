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

interface GlooperBoardProps {
  title: string
  users: User[]
  type: 'global' | 'daily'
  onUserClick: (userId: string) => void
}

export default function GlooperBoard({ title, users, type, onUserClick }: GlooperBoardProps) {
  const handleGloopUser = async (user: User) => {
    // Immediately update UI - allow unlimited fast clicking
    onUserClick(user.id)
    
    try {
      // Use upsert for atomic operation to ensure each click is counted
      const { error } = await supabase
        .rpc('increment_user_gloop', { 
          user_id: user.id,
          increment_amount: 1 
        })

      if (error) {
        console.error('Error incrementing gloop:', error)
        // Fallback: insert gloop record and manual count update
        await supabase.from('gloops').insert({ user_id: user.id })
        
        const { data: currentUser } = await supabase
          .from('users')
          .select('gloop_count, daily_gloop_count')
          .eq('id', user.id)
          .single()
        
        if (currentUser) {
          await supabase
            .from('users')
            .update({
              gloop_count: currentUser.gloop_count + 1,
              daily_gloop_count: currentUser.daily_gloop_count + 1
            })
            .eq('id', user.id)
        }
      }
    } catch (error) {
      console.error('Error glooping user:', error)
    }
  }

  const sortedUsers = users
    .sort((a, b) => {
      const aCount = type === 'global' ? a.gloop_count : a.daily_gloop_count
      const bCount = type === 'global' ? b.gloop_count : b.daily_gloop_count
      return bCount - aCount
    })
    .slice(0, 10)

  return (
    <div className="bg-white border border-purple-200 rounded-lg p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-purple-600 mb-6">{title}</h2>
      <div className="space-y-3">
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
                <span className="text-lg font-semibold text-purple-500 w-8">
                  #{index + 1}
                </span>
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