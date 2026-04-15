import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Account, AccountType } from '@/models'
import api from '@/services/api'

export const useAccountStore = defineStore('account', () => {
  const accounts = ref<Account[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchMyAccounts() {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get('/api/accounts')
      accounts.value = data
    } catch (e: any) {
      error.value = e.response?.data?.error ?? 'Failed to load accounts'
    } finally {
      loading.value = false
    }
  }

  async function fetchAccountsByUser(userId: number) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get(`/api/accounts/user/${userId}`)
      return data as Account[]
    } catch (e: any) {
      error.value = e.response?.data?.error ?? 'Failed to load accounts'
      return []
    } finally {
      loading.value = false
    }
  }

  async function createAccount(accountType: AccountType, userId?: number) {
    const { data } = await api.post('/api/accounts', { accountType, userId })
    accounts.value.push(data)
    return data as Account
  }

  return { accounts, loading, error, fetchMyAccounts, fetchAccountsByUser, createAccount }
})
