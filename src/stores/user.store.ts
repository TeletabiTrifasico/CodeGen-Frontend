import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User } from '@/models'
import api from '@/services/api'

export const useUserStore = defineStore('user', () => {
  const users = ref<User[]>([])
  const pendingUsers = ref<User[]>([])
  const userWithoutAccounts = ref<User[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAllUsers() {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get('/api/users')
      users.value = data
    } catch (e: any) {
      error.value = e.response?.data?.error ?? 'Failed to load users'
    } finally {
      loading.value = false
    }
  }

  async function fetchPendingUsers() {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get('/api/users', { params: { status: 'pending' } })
      pendingUsers.value = data
    } catch (e: any) {
      error.value = e.response?.data?.error ?? 'Failed to load pending users'
    } finally {
      loading.value = false
    }
  }

  async function fetchUsersWithoutAccounts() {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get('/api/users', { params: { status: 'without_accounts' } })
      userWithoutAccounts.value = data
    } catch (e: any) {
      error.value = e.response?.data?.error ?? 'Failed to load users without accounts'
    } finally {
      loading.value = false
    }
  }

  async function getUserById(userId: number) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get(`/api/users/${userId}`)
      return data as User
    } catch (e: any) {
      error.value = e.response?.data?.error ?? 'Failed to load user'
      return null
    } finally {
      loading.value = false
    }
  }

  async function approveUser(userId: number) {
    try {
      const { data } = await api.put(`/api/users/${userId}`)
      const idx = pendingUsers.value.findIndex(u => u.id === userId)
      if (idx !== -1) pendingUsers.value.splice(idx, 1)
      const allIdx = users.value.findIndex(u => u.id === userId)
      if (allIdx !== -1) users.value[allIdx] = data
      return data as User
    } catch (e: any) {
      error.value = e.response?.data?.error ?? 'Failed to approve user'
      throw e
    }
  }

  return { users,userWithoutAccounts, pendingUsers, loading, error, fetchAllUsers, fetchPendingUsers, approveUser, getUserById, fetchUsersWithoutAccounts }
})
