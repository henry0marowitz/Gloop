'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'

export default function InvitePage() {
  const router = useRouter()
  const params = useParams()
  const [isLoading, setIsLoading] = useState(true)
  const [inviter, setInviter] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (params.code) {
      handleInvite(params.code as string)
    }
  }, [params.code])

  const handleInvite = async (code: string) => {
    try {
      const { data: inviteLink, error: fetchError } = await supabase
        .from('invite_links')
        .select(`
          *,
          users (*)
        `)
        .eq('code', code)
        .single()

      if (fetchError || !inviteLink) {
        setError('Invalid invite link')
        setIsLoading(false)
        return
      }

      setInviter(inviteLink.users)
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'gloop-pending-invite',
          JSON.stringify({
            code,
            inviterId: inviteLink.user_id,
            inviterName: `${inviteLink.users.first_name} ${inviteLink.users.last_name}`
          })
        )
      }

    } catch (error) {
      console.error('Error processing invite:', error)
      setError('Error processing invite')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div
          className="text-2xl text-purple-600"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          Processing invite...
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">{error}</h1>
          <motion.button
            onClick={() => router.push('/')}
            className="bg-purple-600 text-white px-6 py-3 rounded-full hover:bg-purple-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Go to Homepage
          </motion.button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1
          className="text-4xl font-bold text-purple-600 mb-4"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🎉 Invite Locked In! 🎉
        </motion.h1>
        
        {inviter && (
          <p className="text-xl text-gray-700 mb-4">
            Sign up to give {inviter.first_name} {inviter.last_name} a 10x Gloop Boost for 1 minute!
          </p>
        )}
        
        <p className="text-gray-600 mb-6">
          Create your account (or sign in) from the homepage to complete the boost.
        </p>

        <motion.button
          onClick={() => router.push('/')}
          className="bg-purple-600 text-white px-6 py-3 rounded-full hover:bg-purple-700 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Go to Homepage
        </motion.button>
      </motion.div>
    </div>
  )
}
