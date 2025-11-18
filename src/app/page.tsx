'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import GlooperBoard from '@/components/GlooperBoard'
import SearchUsers from '@/components/SearchUsers'
import SignupModal from '@/components/SignupModal'
import UserProfile from '@/components/UserProfile'
import InviteButton from '@/components/InviteButton'
import Recents from '@/components/Recents'

const estDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
})

const getEstDateString = (date: Date) => estDateFormatter.format(date)
const getCurrentEstDateString = () => getEstDateString(new Date())
const isSameEstDay = (dateString?: string | null, comparisonDate?: string) => {
  if (!dateString) return false
  const target = comparisonDate ?? getCurrentEstDateString()
  return getEstDateString(new Date(dateString)) === target
}

export default function Home() {
  const [users, setUsers] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [recentGloops, setRecentGloops] = useState<any[]>([])
  const [boostActive, setBoostActive] = useState(false)
  const [boostTimeLeft, setBoostTimeLeft] = useState(0)
  const usersRef = useRef<any[]>([])
  const todayEstString = getCurrentEstDateString()

  useEffect(() => {
    loadRecentGloops()
    syncGloopCounts()

    const interval = setInterval(() => {
      syncGloopCounts()
    }, 5000)
    
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

  useEffect(() => {
    usersRef.current = users
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

  const syncGloopCounts = async () => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .order('gloop_count', { ascending: false })

    if (!data) return

    const todayEst = getCurrentEstDateString()
    const pendingUpdates = new Map<string, { id: string; gloop_count?: number; daily_gloop_count?: number; last_daily_reset?: string }>()
    const queueUpdate = (id: string, fields: Partial<{ gloop_count: number; daily_gloop_count: number; last_daily_reset: string }>) => {
      const existing = pendingUpdates.get(id) || { id }
      pendingUpdates.set(id, { ...existing, ...fields })
    }

    const serverMap = new Map<string, any>()
    data.forEach(user => {
      const resetDate = user.last_daily_reset ? getEstDateString(new Date(user.last_daily_reset)) : null
      if (resetDate !== todayEst) {
        const resetTimestamp = new Date().toISOString()
        user.daily_gloop_count = 0
        user.last_daily_reset = resetTimestamp
        queueUpdate(user.id, {
          daily_gloop_count: 0,
          last_daily_reset: resetTimestamp
        })
      }
      serverMap.set(user.id, user)
    })

    const localUsers = usersRef.current
    const nextUsers: any[] = []

    localUsers.forEach(localUser => {
      const serverUser = serverMap.get(localUser.id)

      if (serverUser) {
        const shouldPushToServer =
          localUser.gloop_count > serverUser.gloop_count ||
          localUser.daily_gloop_count > serverUser.daily_gloop_count

        const serverFarAhead =
          localUser.gloop_count + 100 < serverUser.gloop_count ||
          localUser.daily_gloop_count + 100 < serverUser.daily_gloop_count

        if (shouldPushToServer) {
          queueUpdate(localUser.id, {
            gloop_count: localUser.gloop_count,
            daily_gloop_count: localUser.daily_gloop_count
          })
          nextUsers.push(localUser)
        } else if (serverFarAhead) {
          nextUsers.push({
            ...localUser,
            gloop_count: serverUser.gloop_count,
            daily_gloop_count: serverUser.daily_gloop_count
          })
        } else {
          nextUsers.push(localUser)
        }

        serverMap.delete(localUser.id)
      } else {
        nextUsers.push(localUser)
      }
    })

    serverMap.forEach(serverUser => {
      nextUsers.push(serverUser)
    })

    nextUsers.sort((a, b) => b.gloop_count - a.gloop_count)
    setUsers(nextUsers)
    usersRef.current = nextUsers

    const updatesToSend = Array.from(pendingUpdates.values())
    if (updatesToSend.length > 0) {
      await Promise.all(
        updatesToSend.map(entry => {
          const { id, ...rest } = entry
          if (Object.keys(rest).length === 0) return Promise.resolve()
          return supabase
            .from('users')
            .update(rest)
            .eq('id', id)
        })
      )
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

  const updateUserOptimistically = async (userId: string) => {
    const user = usersRef.current.find(u => u.id === userId)
    if (user) {
      const increment = boostActive ? 10 : 1
      let updatedUserSnapshot: any = null
      
      // Update user count optimistically for instant UI feedback
      setUsers((prevUsers: any[]) => {
        const updatedList = prevUsers.map(u => {
          if (u.id === userId) {
            const updatedUser = {
              ...u,
              gloop_count: u.gloop_count + increment,
              daily_gloop_count: u.daily_gloop_count + increment
            }
            updatedUserSnapshot = updatedUser
            return updatedUser
          }
          return u
        })
        usersRef.current = updatedList
        return updatedList
      })
      
      // Update current user if it's the same person
      if (currentUser?.id === userId) {
        setCurrentUser((prev: any) => prev ? {
          ...prev,
          gloop_count: prev.gloop_count + increment,
          daily_gloop_count: prev.daily_gloop_count + increment
        } : null)
      }

      if (updatedUserSnapshot) {
        setRecentGloops(prev => {
          const newRecents = [updatedUserSnapshot, ...prev.filter(u => u.id !== userId)].slice(0, 10)
          localStorage.setItem('recent-gloops', JSON.stringify(newRecents))
          return newRecents
        })
      }
    }
  }

  const activateBoost = async () => {
    if (!currentUser || currentUser.gloop_boosts <= 0) return
    
    try {
      setBoostActive(true)
      setBoostTimeLeft(60) // 60 seconds
      
      // Update user state optimistically
      setCurrentUser((prev: any) => prev ? {
        ...prev,
        gloop_boosts: prev.gloop_boosts - 1
      } : null)
      
      // Update in database
      await supabase
        .from('users')
        .update({ 
          gloop_boosts: currentUser.gloop_boosts - 1
        })
        .eq('id', currentUser.id)
      
      await syncGloopCounts()
    } catch (error) {
      console.error('Error activating boost:', error)
    }
  }

  return (
    <div className={`h-screen flex flex-col bg-white text-black ${boostActive ? 'shadow-[0_0_50px_rgba(168,85,247,0.4)]' : ''}`}>
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
      <main className="flex-1 px-4 overflow-y-auto">
        {/* Mobile Layout */}
        <div className="block lg:hidden">
          {/* Global Leaderboard - Top on mobile */}
          <div className="mb-8">
            <GlooperBoard 
              title="Global Glooperboard" 
              users={users} 
              type="global"
              onUserClick={updateUserOptimistically}
            />
          </div>
          
          {/* Daily Leaderboard - Middle on mobile */}
          <div className="mb-8">
            <GlooperBoard 
              title="Daily Glooperboard" 
              users={users.filter(u => isSameEstDay(u.last_daily_reset, todayEstString))} 
              type="daily"
              onUserClick={updateUserOptimistically}
            />
          </div>

          {/* Recents - Bottom on mobile */}
          <div className="mb-8">
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

        {/* Desktop Layout */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-8">
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
              users={users.filter(u => isSameEstDay(u.last_daily_reset, todayEstString))} 
              type="daily"
              onUserClick={updateUserOptimistically}
            />
          </div>

          {/* Right Side - Recents */}
          <div>
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
      <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4 lg:p-12">
        {/* Full width container - no max-width */}
        <div className="flex flex-col sm:flex-row gap-4 lg:gap-8">
          {currentUser ? (
            <>
              {/* User Profile - Takes up most space */}
              <div className="w-full sm:flex-1 order-2 sm:order-1">
                <UserProfile 
                  user={currentUser} 
                  onSelfGloop={updateUserOptimistically} 
                  onActivateBoost={activateBoost}
                  boostActive={boostActive}
                  boostTimeLeft={boostTimeLeft}
                />
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
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-4 lg:px-8 lg:py-8 text-lg lg:text-3xl rounded-full font-semibold transition-all shadow-lg hover:shadow-xl"
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
      </div>

      {/* Signup Modal */}
      <AnimatePresence>
        {showSignupModal && (
          <SignupModal 
            onClose={() => setShowSignupModal(false)}
            onSignup={(user) => {
              setCurrentUser(user)
              localStorage.setItem('gloop-user-id', user.id)
              syncGloopCounts()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
