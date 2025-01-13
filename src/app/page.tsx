'use client'

import { useState, useEffect } from 'react'

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
import { UserPlus, Users, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { userSchema, type CreateUserInput } from '@/lib/validations'
import { Alert, AlertDescription } from '@/components/ui/alert'

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
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10 p-8">
      <div className="container mx-auto max-w-6xl space-y-10">
        <div className="space-y-3">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-orange-600 to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
            XAIAgent Platform
          </h1>
          <p className="text-lg text-muted-foreground/90 max-w-2xl">User Management System</p>
        </div>

        <div className="p-8 rounded-lg bg-card border border-border/50 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200">
          <p className="text-base font-medium text-muted-foreground/90 mb-6">Test Components:</p>
          <div className="flex flex-wrap items-center gap-6">
            <Button size="lg" variant="default" className="min-w-[160px] button-primary">Primary Button</Button>
            <Button size="lg" variant="outline" className="min-w-[160px] button-outline">Outline Button</Button>
            <Button size="lg" variant="ghost" className="min-w-[160px] button-ghost">Ghost Button</Button>
            <Button size="lg" variant="secondary" className="min-w-[160px] button-secondary">Secondary Button</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-border/50 shadow-sm hover:border-primary/20 transition-colors">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-primary">
                <UserPlus className="w-6 h-6" />
                Create User
              </CardTitle>
              <p className="text-sm text-muted-foreground">Add a new user to the platform</p>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Username</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter username"
                            className="input-base hover:border-primary/40 focus-visible:border-primary/60"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-destructive" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Enter email"
                            className="input-base hover:border-primary/40 focus-visible:border-primary/60"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-destructive" />
                      </FormItem>
                    )}
                  />

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full button-primary"
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create User
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200">
            <CardHeader className="space-y-2">
              <CardTitle className="flex items-center gap-3 text-primary text-xl">
                <Users className="w-6 h-6" />
                User List
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary/80" />
                </div>
              ) : users.length === 0 ? (
                <p className="text-center text-muted-foreground/90 py-8">No users found</p>
              ) : (
                <div className="space-y-4">
                  {users.map((user) => (
                    <Card key={user.id} className="border-border/40 shadow-sm hover:shadow-md hover:border-primary/30 hover:bg-orange-light/5 transition-all duration-200">
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <p className="font-medium text-foreground/90">{user.username}</p>
                          <p className="text-sm text-muted-foreground/90">{user.email}</p>
                          <p className="text-xs text-muted-foreground/80">
                            Created: {new Date(user.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
