'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import GlooperBoard from '@/components/GlooperBoard'
import SearchUsers from '@/components/SearchUsers'
import SignupModal from '@/components/SignupModal'
import UserProfile from '@/components/UserProfile'
import InviteButton from '@/components/InviteButton'
import Recents from '@/components/Recents'

export default function Home() {
  const [users, setUsers] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [recentGloops, setRecentGloops] = useState<any[]>([])

  useEffect(() => {
    fetchUsers()
    loadRecentGloops()

    // Set up real-time updates every 5 seconds
    const interval = setInterval(fetchUsers, 5000)
    
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    checkCurrentUser()
  }, [users])

  const loadRecentGloops = () => {
    try {
      const saved = localStorage.getItem('recent-gloops')
      if (saved) {
        setRecentGloops(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Error loading recent gloops:', error)
    }
  }

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .order('gloop_count', { ascending: false })
    
    if (data) setUsers(data)
  }

  const checkCurrentUser = () => {
    const userId = localStorage.getItem('gloop-user-id')
    if (userId && users.length > 0) {
      const user = users.find(u => u.id === userId)
      if (user) {
        setCurrentUser(user)
      }
    }
  }

  const updateUserOptimistically = (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (user) {
      // Add to recent gloops
      setRecentGloops(prev => {
        const newRecents = [user, ...prev.filter(u => u.id !== userId)].slice(0, 10)
        localStorage.setItem('recent-gloops', JSON.stringify(newRecents))
        return newRecents
      })
      
      // Update user count
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userId 
            ? { 
                ...u, 
                gloop_count: u.gloop_count + 1,
                daily_gloop_count: u.daily_gloop_count + 1
              }
            : u
        )
      )
    }
  }

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="py-8 px-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-6">
            <h1 className="text-6xl md:text-8xl font-bold text-purple-600">
              Gloop
            </h1>
            <p className="text-xl md:text-3xl text-gray-700 text-center md:text-left">
              Click on a name to give them a gloop!
            </p>
          </div>
          <div className="w-full lg:w-auto lg:min-w-[400px]">
            <SearchUsers users={users} onUserClick={updateUserOptimistically} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 pb-48">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - Global Leaderboard */}
          <div>
            <GlooperBoard 
              title="Global Glooperboard" 
              users={users} 
              type="global"
              onUserClick={updateUserOptimistically}
            />
          </div>

          {/* Middle - Daily Leaderboard */}
          <div>
            <GlooperBoard 
              title="Daily Glooperboard" 
              users={users.filter(u => {
                const today = new Date()
                const lastReset = new Date(u.last_daily_reset)
                return today.toDateString() === lastReset.toDateString()
              })} 
              type="daily"
              onUserClick={updateUserOptimistically}
            />
          </div>

          {/* Right Side - Recents */}
          <div className="lg:order-none order-first lg:order-last">
            <Recents 
              recentGloops={recentGloops.map(recentUser => {
                // Find the current data for this user to show updated counts
                const currentUser = users.find(u => u.id === recentUser.id)
                return currentUser || recentUser
              })} 
              onUserClick={updateUserOptimistically} 
            />
          </div>
        </div>
      </main>

      {/* Bottom Section - Full width buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-12">
        {/* Full width container - no max-width */}
        <div className="flex flex-col sm:flex-row gap-8">
          {/* Signup or User Profile - Takes up half */}
          <div className="w-full sm:w-1/2 order-2 sm:order-1">
            {currentUser ? (
              <UserProfile user={currentUser} />
            ) : (
              <motion.button
                onClick={() => setShowSignupModal(true)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-8 py-8 text-3xl rounded-full font-semibold transition-all shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Sign up get Gloops!
              </motion.button>
            )}
          </div>

          {/* Invite Button - Takes up half */}
          <div className="w-full sm:w-1/2 order-1 sm:order-2">
            <InviteButton currentUser={currentUser} onSignupRequired={() => setShowSignupModal(true)} />
          </div>
        </div>
      </div>

      {/* Signup Modal */}
      <AnimatePresence>
        {showSignupModal && (
          <SignupModal 
            onClose={() => setShowSignupModal(false)}
            onSignup={(user) => {
              setCurrentUser(user)
              localStorage.setItem('gloop-user-id', user.id)
              fetchUsers()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export const dynamic = 'force-dynamic'
