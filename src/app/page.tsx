'use client'

import { useState, useEffect } from 'react'
import { UserPlus, Users, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { userSchema, type CreateUserInput } from '@/lib/validations'

type User = {
  id: number
  username: string
  email: string
  createdAt: string
}

export default function Home() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const form = useForm<CreateUserInput>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: '',
      email: '',
    },
  })

  async function onSubmit(data: CreateUserInput) {
    try {
      setLoading(true)
      setError(null)
      const baseUrl = window.location.origin
      const response = await fetch(`${baseUrl}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create user')
      }

      const user = await response.json()
      setUsers(prev => [user, ...prev])
      form.reset()
    } catch (error) {
      console.error('Failed to create user:', error)
      setError(error instanceof Error ? error.message : 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  async function fetchUsers() {
    try {
      setLoading(true)
      setError(null)
      const baseUrl = window.location.origin
      const response = await fetch(`${baseUrl}/api/users`)
      if (!response.ok) throw new Error('Failed to fetch users')
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8">XAIAgent Platform</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-6 h-6" />
            <h2 className="text-2xl font-semibold">Create User</h2>
          </div>
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input
                {...form.register('username')}
                className="w-full p-2 border rounded-md"
                placeholder="Enter username"
              />
              {form.formState.errors.username && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.username.message}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                {...form.register('email')}
                type="email"
                className="w-full p-2 border rounded-md"
                placeholder="Enter email"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create User
            </button>
          </form>
        </div>

        <div className="p-6 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-6 h-6" />
            <h2 className="text-2xl font-semibold">User List</h2>
          </div>
          
          {loading ? (
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-gray-500">No users found</p>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="p-3 rounded-lg border border-gray-200"
                >
                  <p className="font-medium">{user.username}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <p className="text-xs text-gray-400">
                    Created: {new Date(user.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
