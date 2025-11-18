'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import GlooperBoard from '@/components/GlooperBoard'
import SearchUsers from '@/components/SearchUsers'
import SignupModal from '@/components/SignupModal'
import UserProfile from '@/components/UserProfile'
import InviteButton from '@/components/InviteButton'
import GlobalChat from '@/components/GlobalChat'

const estDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
})

const getEstDateString = (date: Date) => estDateFormatter.format(date)
const getCurrentEstDateString = () => getEstDateString(new Date())

const getEstDateStringAtResetBoundary = (date: Date) => {
  const boundary = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  boundary.setHours(boundary.getHours() - 2) // move to 2am EST boundary
  return getEstDateString(boundary)
}

const isSameEstResetPeriod = (storedDate?: string | null) => {
  if (!storedDate) return false
  const currentBoundaryDate = getEstDateStringAtResetBoundary(new Date())
  const storedBoundaryDate = getEstDateStringAtResetBoundary(new Date(storedDate))
  return currentBoundaryDate === storedBoundaryDate
}

export default function Home() {
  const [users, setUsers] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [recentGloops, setRecentGloops] = useState<any[]>([])
  const [boostActive, setBoostActive] = useState(false)
  const [boostTimeLeft, setBoostTimeLeft] = useState(0)
  const usersRef = useRef<any[]>([])
  const todayEstString = getEstDateStringAtResetBoundary(new Date())
  const getBoostUsageKey = (userId: string) => `gloop-boost-usage-${userId}-${todayEstString}`
  const getLocalBoostUsageValue = (userId: string) => {
    if (typeof window === 'undefined') return 0
    const stored = window.localStorage.getItem(getBoostUsageKey(userId))
    return stored ? parseInt(stored, 10) : 0
  }
  const setLocalBoostUsageValue = (userId: string, value: number) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(getBoostUsageKey(userId), value.toString())
  }

  useEffect(() => {
    loadRecentGloops()
    syncGloopCounts()

    const interval = setInterval(() => {
      syncGloopCounts()
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const resetKey = 'gloop-daily-reset-20250114'
    if (typeof window === 'undefined') return
    if (window.localStorage.getItem(resetKey)) return

    const forceReset = async () => {
      try {
        const resetTimestamp = new Date().toISOString()
        await supabase
          .from('users')
          .update({
            daily_gloop_count: 0,
            last_daily_reset: resetTimestamp
          })
          .not('id', 'is', null)
        window.localStorage.setItem(resetKey, 'done')
        const { data } = await supabase
          .from('users')
          .select('*')
          .order('gloop_count', { ascending: false })
        if (data) {
          setUsers(data)
          usersRef.current = data
        }
      } catch (error) {
        console.error('Error forcing daily reset:', error)
      }
    }

    forceReset()
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


  const hasBoostTrackingFields = (user: any) => 
    user && Object.prototype.hasOwnProperty.call(user, 'daily_boosts_used') && Object.prototype.hasOwnProperty.call(user, 'last_boost_reset')

  const getDailyBoostUsage = (user: any) => {
    if (!user) {
      return { used: 0, needsReset: false, usingLocal: true }
    }

    if (hasBoostTrackingFields(user)) {
      const sameDay = isSameEstResetPeriod(user.last_boost_reset)
      return {
        used: sameDay ? user.daily_boosts_used || 0 : 0,
        needsReset: !sameDay,
        usingLocal: false
      }
    }

    const localUsage = getLocalBoostUsageValue(user.id)
    return {
      used: localUsage,
      needsReset: false,
      usingLocal: true
    }
  }

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

    const pendingUpdates = new Map<
      string,
      {
        id: string
        gloop_count?: number
        daily_gloop_count?: number
        last_daily_reset?: string
        daily_boosts_used?: number
        last_boost_reset?: string
      }
    >()
    const queueUpdate = (
      id: string,
      fields: Partial<{
        gloop_count: number
        daily_gloop_count: number
        last_daily_reset: string
        daily_boosts_used: number
        last_boost_reset: string
      }>
    ) => {
      const existing = pendingUpdates.get(id) || { id }
      pendingUpdates.set(id, { ...existing, ...fields })
    }

    const serverMap = new Map<string, any>()
    data.forEach(user => {
      const dailyResetDate = user.last_daily_reset ? new Date(user.last_daily_reset) : null
      if (!isSameEstResetPeriod(user.last_daily_reset)) {
        const resetTimestamp = new Date().toISOString()
        user.daily_gloop_count = 0
        user.last_daily_reset = resetTimestamp
        queueUpdate(user.id, {
          daily_gloop_count: 0,
          last_daily_reset: resetTimestamp
        })
      }

      if (hasBoostTrackingFields(user) && !isSameEstResetPeriod(user.last_boost_reset)) {
        const resetTimestamp = new Date().toISOString()
        user.daily_boosts_used = 0
        user.last_boost_reset = resetTimestamp
        queueUpdate(user.id, {
          daily_boosts_used: 0,
          last_boost_reset: resetTimestamp
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
    
    const boostUsage = getDailyBoostUsage(currentUser)
    if (boostUsage.used >= 5) {
      alert('You can only use 5 gloop boosts per day. Try again tomorrow!')
      return
    }

    const nextDailyBoostsUsed = boostUsage.used + 1
    const newBoostBalance = Math.max(0, currentUser.gloop_boosts - 1)
    const nowIso = new Date().toISOString()
    const nextBoostReset = boostUsage.needsReset ? nowIso : (currentUser?.last_boost_reset || nowIso)
    
    try {
      setBoostActive(true)
      setBoostTimeLeft(60) // 60 seconds
      
      // Update user state optimistically
      setCurrentUser((prev: any) => {
        if (!prev) return prev
        const updates: any = {
          ...prev,
          gloop_boosts: newBoostBalance
        }
        if (!boostUsage.usingLocal) {
          updates.daily_boosts_used = nextDailyBoostsUsed
          updates.last_boost_reset = nextBoostReset
        }
        return updates
      })

      setUsers((prevUsers: any[]) => {
        const updatedList = prevUsers.map(u => {
          if (u.id !== currentUser.id) return u
          const updates: any = {
            ...u,
            gloop_boosts: newBoostBalance
          }
          if (!boostUsage.usingLocal) {
            updates.daily_boosts_used = nextDailyBoostsUsed
            updates.last_boost_reset = nextBoostReset
          }
          return updates
        })
        usersRef.current = updatedList
        return updatedList
      })

      if (boostUsage.usingLocal) {
        setLocalBoostUsageValue(currentUser.id, nextDailyBoostsUsed)
      }

      const updatePayload: Record<string, any> = {
        gloop_boosts: newBoostBalance
      }
      if (!boostUsage.usingLocal) {
        updatePayload.daily_boosts_used = nextDailyBoostsUsed
        updatePayload.last_boost_reset = nextBoostReset
      }

      await supabase
        .from('users')
        .update(updatePayload)
        .eq('id', currentUser.id)
      
      await syncGloopCounts()
    } catch (error) {
      console.error('Error activating boost:', error)
    }
  }

  const currentUserBoostUsage = getDailyBoostUsage(currentUser)
  const boostsLeftToday = currentUser ? Math.max(0, 5 - currentUserBoostUsage.used) : 0

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
              users={users.filter(u => isSameEstResetPeriod(u.last_daily_reset))} 
              type="daily"
              onUserClick={updateUserOptimistically}
            />
          </div>

          {/* Global Chat - Bottom on mobile */}
          <div className="mb-8">
            <GlobalChat currentUser={currentUser} />
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
              users={users.filter(u => isSameEstResetPeriod(u.last_daily_reset))} 
              type="daily"
              onUserClick={updateUserOptimistically}
            />
          </div>

          {/* Right Side - Global Chat */}
          <div>
            <GlobalChat currentUser={currentUser} />
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
                  boostsLeft={boostsLeftToday}
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
