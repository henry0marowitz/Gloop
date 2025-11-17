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

interface InviteButtonProps {
  currentUser: User | null
  onSignupRequired: () => void
}

export default function InviteButton({ currentUser, onSignupRequired }: InviteButtonProps) {
  const [showCopied, setShowCopied] = useState(false)

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  const handleInviteClick = async () => {
    if (!currentUser) {
      onSignupRequired()
      return
    }

    try {
      const inviteCode = generateInviteCode()
      
      const { error } = await supabase
        .from('invite_links')
        .insert({
          user_id: currentUser.id,
          code: inviteCode,
          uses: 0
        })

      if (error) throw error

      const inviteLink = `${window.location.origin}/invite/${inviteCode}`
      
      await navigator.clipboard.writeText(inviteLink)
      
      setShowCopied(true)
      setTimeout(() => setShowCopied(false), 2000)
    } catch (error) {
      console.error('Error creating invite link:', error)
    }
  }

  return (
    <div className="text-center w-full">
      <motion.button
        onClick={handleInviteClick}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-8 text-2xl rounded-full font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Invite friends to get a Gloop Boost!
      </motion.button>
      
      <div className="mt-2">
        <motion.div
          className="text-sm sm:text-lg md:text-xl font-bold text-yellow-600"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          10x Gloop Boost for 1 minute per friend
        </motion.div>
      </div>

      <AnimatePresence>
        {showCopied && (
          <motion.div
            className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            Invite link copied to clipboard!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

import { AnimatePresence } from 'framer-motion'