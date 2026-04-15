import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/models'
import api from '@/services/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<User | null>(JSON.parse(localStorage.getItem('user') ?? 'null'))

  const isLoggedIn = computed(() => !!token.value)
  const isApproved = computed(() => user.value?.approved ?? false)
  const isEmployee = computed(() => user.value?.role === 'EMPLOYEE')
  const isCustomer = computed(() => user.value?.role === 'CUSTOMER')

  async function login(username: string, password: string) {
    const { data } = await api.post('/api/auth/login', { username, password })
    token.value = data.token
    user.value = data.user
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
  }

  async function logout() {
    try {
      await api.post('/api/auth/logout')
    } catch {
      // ignore errors during logout
    } finally {
      token.value = null
      user.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }

  function setUser(u: User) {
    user.value = u
    localStorage.setItem('user', JSON.stringify(u))
  }

  return { token, user, isLoggedIn, isApproved, isEmployee, isCustomer, login, logout, setUser }
})
