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
  const [pendingGloops, setPendingGloops] = useState<Record<string, number>>({})
  const [boostActive, setBoostActive] = useState(false)
  const [boostTimeLeft, setBoostTimeLeft] = useState(0)

  useEffect(() => {
    fetchUsers()
    loadRecentGloops()

    // Set up real-time updates every 5 seconds
    const interval = setInterval(fetchUsers, 5000)
    
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null
    
    if (boostActive && boostTimeLeft > 0) {
      timer = setInterval(() => {
        setBoostTimeLeft(prev => {
          if (prev <= 1) {
            setBoostActive(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [boostActive, boostTimeLeft])

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
    
    if (data) {
      // Merge with optimistic updates to prevent counts from going backwards
      setUsers(prevUsers => {
        return data.map(serverUser => {
          const currentUser = prevUsers.find(u => u.id === serverUser.id)
          const pending = pendingGloops[serverUser.id] || 0
          
          // If we have optimistic updates or the server count is higher, use the higher value
          if (currentUser && pending > 0) {
            return {
              ...serverUser,
              gloop_count: Math.max(serverUser.gloop_count, currentUser.gloop_count),
              daily_gloop_count: Math.max(serverUser.daily_gloop_count, currentUser.daily_gloop_count)
            }
          }
          
          // Always use higher count to prevent regression
          return currentUser ? {
            ...serverUser,
            gloop_count: Math.max(serverUser.gloop_count, currentUser.gloop_count),
            daily_gloop_count: Math.max(serverUser.daily_gloop_count, currentUser.daily_gloop_count)
          } : serverUser
        })
      })
      
      // Clear pending gloops that have been processed
      setPendingGloops(prev => {
        const updated = { ...prev }
        Object.keys(updated).forEach(userId => {
          const serverUser = data.find(u => u.id === userId)
          if (serverUser && updated[userId] <= 0) {
            delete updated[userId]
          }
        })
        return updated
      })
    }
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
    // Track pending gloop for this user
    setPendingGloops(prev => ({
      ...prev,
      [userId]: (prev[userId] || 0) + 1
    }))

    const user = users.find(u => u.id === userId)
    if (user) {
      const increment = boostActive ? 10 : 1
      // Update user count optimistically
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userId 
            ? { 
                ...u, 
                gloop_count: u.gloop_count + increment,
                daily_gloop_count: u.daily_gloop_count + increment
              }
            : u
        )
      )
      
      // Update current user if it's the same person
      if (currentUser?.id === userId) {
        setCurrentUser(prev => prev ? {
          ...prev,
          gloop_count: prev.gloop_count + increment,
          daily_gloop_count: prev.daily_gloop_count + increment
        } : null)
      }

      // Add to recent gloops after state update
      setTimeout(() => {
        const updatedUser = users.find(u => u.id === userId)
        if (updatedUser) {
          setRecentGloops(prev => {
            const newRecents = [updatedUser, ...prev.filter(u => u.id !== userId)].slice(0, 10)
            localStorage.setItem('recent-gloops', JSON.stringify(newRecents))
            return newRecents
          })
        }
      }, 0)
    }
  }

  const activateBoost = () => {
    if (currentUser && currentUser.gloop_boosts > 0) {
      setBoostActive(true)
      setBoostTimeLeft(60) // 60 seconds
      
      // Decrease boost count
      setCurrentUser(prev => prev ? {
        ...prev,
        gloop_boosts: prev.gloop_boosts - 1
      } : null)
      
      // Update in database
      supabase
        .from('users')
        .update({ gloop_boosts: currentUser.gloop_boosts - 1 })
        .eq('id', currentUser.id)
        .then(() => fetchUsers())
    }
  }

  return (
    <div className={`min-h-screen bg-white text-black ${boostActive ? 'shadow-[0_0_50px_rgba(168,85,247,0.4)]' : ''}`}>
      {/* Header */}
      <header className="py-8 px-4">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <h1 className="text-6xl md:text-8xl font-bold text-purple-600">
            Gloop
          </h1>
          <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8 flex-1">
            <p className="text-xl md:text-3xl text-gray-700 text-center lg:text-left">
              Click on a name to give them a gloop!
            </p>
            <div className="w-full lg:w-auto lg:min-w-[400px]">
              <SearchUsers users={users} onUserClick={updateUserOptimistically} />
            </div>
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
          {currentUser ? (
            <>
              {/* User Profile - Takes up most space */}
              <div className="w-full sm:flex-1 order-2 sm:order-1">
                <UserProfile user={currentUser} onSelfGloop={updateUserOptimistically} onActivateBoost={activateBoost} />
              </div>

              {/* Invite Button - Smaller on right */}
              <div className="w-full sm:w-auto sm:flex-shrink-0 order-1 sm:order-2">
                <InviteButton currentUser={currentUser} onSignupRequired={() => setShowSignupModal(true)} />
              </div>
            </>
          ) : (
            <>
              {/* Signup Button - Takes up half */}
              <div className="w-full sm:w-1/2 order-2 sm:order-1">
                <motion.button
                  onClick={() => setShowSignupModal(true)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white px-8 py-8 text-3xl rounded-full font-semibold transition-all shadow-lg hover:shadow-xl"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Sign up get Gloops!
                </motion.button>
              </div>

              {/* Invite Button - Takes up half */}
              <div className="w-full sm:w-1/2 order-1 sm:order-2">
                <InviteButton currentUser={currentUser} onSignupRequired={() => setShowSignupModal(true)} />
              </div>
            </>
          )}
        </div>
        
        {/* Boost Timer */}
        {boostActive && (
          <div className="fixed bottom-1/2 left-1/2 transform -translate-x-1/2 translate-y-1/2 bg-purple-600 text-white px-6 py-3 rounded-full shadow-lg z-50">
            <div className="text-center">
              <div className="text-2xl font-bold">🚀 BOOST ACTIVE</div>
              <div className="text-lg">10x multiplier</div>
              <div className="text-lg">{Math.floor(boostTimeLeft / 60)}:{(boostTimeLeft % 60).toString().padStart(2, '0')}</div>
            </div>
          </div>
        )}
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
