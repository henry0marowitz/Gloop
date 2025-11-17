'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'

interface SignupModalProps {
  onClose: () => void
  onSignup: (user: any) => void
}

export default function SignupModal({ onClose, onSignup }: SignupModalProps) {
  const [isSignIn, setIsSignIn] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email.includes('@')) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!isSignIn) {
      if (formData.firstName.length < 1 || formData.firstName.length > 50) {
        newErrors.firstName = 'First name must be 1-50 characters'
      }

      if (formData.lastName.length < 1 || formData.lastName.length > 50) {
        newErrors.lastName = 'Last name must be 1-50 characters'
      }
    }

    if (formData.email.length > 100) {
      newErrors.email = 'Email must be less than 100 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      if (isSignIn) {
        // Sign in with email - try case-insensitive search
        const { data: users, error } = await supabase
          .from('users')
          .select('*')

        if (error) {
          console.error('Error fetching users:', error)
          setErrors({ email: 'Error connecting to database' })
          return
        }

        // Find user with case-insensitive email match
        const user = users?.find(u => 
          u.email.toLowerCase() === formData.email.trim().toLowerCase()
        )

        if (!user) {
          console.log('Available emails:', users?.map(u => u.email))
          console.log('Searching for:', formData.email.trim().toLowerCase())
          setErrors({ email: 'No account found with this email address' })
          return
        }

        onSignup(user)
        onClose()
      } else {
        // Sign up new user
        const { data, error } = await supabase
          .from('users')
          .insert({
            email: formData.email.trim().toLowerCase(),
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
            gloop_count: 0,
            daily_gloop_count: 0,
            gloop_boosts: 0
          })
          .select()
          .single()

        if (error) {
          if (error.code === '23505') {
            setErrors({ email: 'This email is already registered. Try signing in instead.' })
          } else {
            throw error
          }
          return
        }

        onSignup(data)
        onClose()
      }
    } catch (error) {
      console.error('Auth error:', error)
      setErrors({ general: 'An error occurred. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-lg p-8 max-w-md w-full"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-purple-600 mb-4 text-center">
            {isSignIn ? 'Sign In to Gloop!' : 'Sign Up for Gloop!'}
          </h2>
          
          <div className="flex justify-center gap-4">
            <button
              type="button"
              onClick={() => setIsSignIn(false)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                !isSignIn 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => setIsSignIn(true)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isSignIn 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Sign In
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {errors.general}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="your@email.com"
              maxLength={100}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {!isSignIn && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.firstName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="John"
                  maxLength={50}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.lastName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Doe"
                  maxLength={50}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                )}
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <motion.button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSubmitting 
                ? (isSignIn ? 'Signing In...' : 'Signing Up...') 
                : (isSignIn ? 'Sign In' : 'Sign Up')
              }
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}