import React, { useState, useEffect, useCallback } from 'react'
import type { User, LoginPayload, RegisterPayload, TokenResponse } from '../types'
import { apiClient } from '../../../shared/api/client'
import { AuthContext } from './AuthContextDef'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('scan_user')
    return saved ? JSON.parse(saved) : null
  })
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('scan_token')
  })
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('scan_token')
    localStorage.removeItem('scan_user')
  }, [])

  const login = useCallback(async (payload: LoginPayload) => {
    const res = await apiClient<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    setToken(res.access_token)
    setUser(res.user)
    localStorage.setItem('scan_token', res.access_token)
    localStorage.setItem('scan_user', JSON.stringify(res.user))
  }, [])

  const register = useCallback(async (payload: RegisterPayload) => {
    await apiClient<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    await login({ email: payload.email, password: payload.password })
  }, [login])

  useEffect(() => {
    const verifyAuth = async () => {
      if (token) {
        try {
          const currentUser = await apiClient<User>('/auth/me')
          setUser(currentUser)
          localStorage.setItem('scan_user', JSON.stringify(currentUser))
        } catch {
          logout()
        }
      }
      setIsLoading(false)
    }

    verifyAuth()

    const handleUnauthorized = () => {
      logout()
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
    }
  }, [token, logout])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
