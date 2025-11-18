'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'

interface ChatMessage {
  id: string
  display_name: string
  message: string
  created_at: string
}

interface GlobalChatProps {
  currentUser: {
    id: string
    first_name: string
    last_name: string
  } | null
}

const CHAT_NAME_KEY = 'gloop-chat-name'
const MAX_MESSAGE_LENGTH = 150
const GLOOPERBOARD_LIST_MAX_HEIGHT = 'calc(100vh - 510px)'
const GLOOP_CHAT_CARD_HEIGHT = 'calc(100vh - 405px)'
const bannedWords = ['nigg', 'fagg', 'spic', 'kike', 'chink', 'coon', 'retard']

export default function GlobalChat({ currentUser }: GlobalChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatName, setChatName] = useState('')
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const containsBannedWords = (text: string) => {
    const normalized = text.toLowerCase()
    return bannedWords.some(word => normalized.includes(word))
  }

  useEffect(() => {
    if (currentUser) {
      setChatName(`${currentUser.first_name} ${currentUser.last_name}`)
    } else {
      const storedName = localStorage.getItem(CHAT_NAME_KEY)
      if (storedName) {
        setChatName(storedName)
      }
    }
  }, [currentUser])

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(() => {
      fetchMessages()
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const fetchMessages = async () => {
    try {
      const { data } = await supabase
        .from('global_chat')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (data) {
        setMessages(data.reverse())
      }
    } catch (error) {
      console.error('Error loading chat messages:', error)
    }
  }

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault()
    if (isSending) return

    const trimmedMessage = message.trim().slice(0, MAX_MESSAGE_LENGTH)
    if (!trimmedMessage) return

    const senderName = currentUser
      ? `${currentUser.first_name} ${currentUser.last_name}`
      : chatName.trim() || 'Anonymous Glooper'

    if (containsBannedWords(senderName)) {
      alert('That name is not allowed in chat.')
      if (!currentUser) {
        setChatName('')
        localStorage.removeItem(CHAT_NAME_KEY)
      }
      return
    }

    if (containsBannedWords(trimmedMessage)) {
      alert('That message contains banned words.')
      return
    }

    if (!currentUser) {
      localStorage.setItem(CHAT_NAME_KEY, senderName)
    }

    setIsSending(true)
    const optimisticMessage: ChatMessage = {
      id: `local-${Date.now()}`,
      display_name: senderName,
      message: trimmedMessage,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, optimisticMessage])
    setMessage('')

    try {
      await supabase.from('global_chat').insert({
        display_name: senderName,
        message: trimmedMessage
      })
      await fetchMessages()
    } catch (error) {
      console.error('Error sending chat message:', error)
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id))
      setMessage(trimmedMessage)
    } finally {
      setIsSending(false)
    }
  }

  const isOwnMessage = (message: ChatMessage) => {
    if (currentUser) {
      const userName = `${currentUser.first_name} ${currentUser.last_name}`
      return message.display_name === userName
    }
    const storedName = localStorage.getItem(CHAT_NAME_KEY)
    return storedName ? message.display_name === storedName : false
  }

  return (
    <div
      className="bg-white border border-purple-200 rounded-lg p-4 shadow-sm flex flex-col"
      style={{ height: GLOOP_CHAT_CARD_HEIGHT, maxHeight: GLOOP_CHAT_CARD_HEIGHT }}
    >
      <h2 className="text-2xl font-bold text-purple-600 mb-4">Gloop Chat</h2>
      <div
        className="flex-1 overflow-y-auto border border-purple-50 rounded-lg p-3 space-y-2 bg-white"
        style={{ maxHeight: GLOOPERBOARD_LIST_MAX_HEIGHT }}
      >
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-4">No chat messages yet. Say hi to the gloops!</div>
        ) : (
          messages.map(message => {
            const mine = isOwnMessage(message)
            return (
              <div
                key={message.id}
                className={`flex items-start gap-2 text-sm text-gray-800 ${mine ? 'justify-end text-right' : ''}`}
              >
                {!mine && (
                  <span className="font-semibold text-purple-600 whitespace-nowrap">{message.display_name}:</span>
                )}
                <p className="max-w-[75%] break-words whitespace-pre-wrap break-all">
                  {message.message}
                </p>
                {mine && (
                  <span className="font-semibold text-purple-600 whitespace-nowrap">{message.display_name}</span>
                )}
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="mt-4 space-y-2">
        {!currentUser && (
          <input
            type="text"
            value={chatName}
            onChange={(e) => {
              const nextValue = e.target.value.slice(0, 50)
              if (containsBannedWords(nextValue)) {
                return
              }
              setChatName(nextValue)
            }}
            placeholder="Enter your chat name"
            className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            maxLength={50}
          />
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => {
              const nextValue = e.target.value.slice(0, MAX_MESSAGE_LENGTH)
              if (containsBannedWords(nextValue)) {
                return
              }
              setMessage(nextValue)
            }}
            placeholder="Send a message to everyone…"
            className="flex-1 px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            maxLength={MAX_MESSAGE_LENGTH}
          />
          <motion.button
            type="submit"
            disabled={isSending}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Send
          </motion.button>
        </div>
      </form>
    </div>
  )
}
