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
      const { data } = await api.get('/api/accounts/myAccounts')
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
      const { data } = await api.get(`/api/accounts/`, { params: { userId } })
      return data as Account[]
    } catch (e: any) {
      error.value = e.response?.data?.error ?? 'Failed to load accounts'
      return []
    } finally {
      loading.value = false
    }
  }

  async function getAccountByIban(iban: string) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get(`/api/accounts/${iban}`)
      return data as Account
    } catch (e: any) {
      error.value = e.response?.data?.error ?? 'Failed to load account'
      return null
    } finally {
      loading.value = false
    }
  }

  async function createAccount(accountType: AccountType, userId?: number) {
    const { data } = await api.post('/api/accounts', { accountType, userId })
    accounts.value.push(data)
    return data as Account
  }

  async function updateDailyLimit(iban: string, dayLimit: number) {
    try {
      const { data } = await api.put(`/api/accounts/${iban}/daily-limit`, { dayLimit })
      const idx = accounts.value.findIndex(a => a.iban === iban)
      if (idx !== -1) {
        accounts.value[idx] = data
      }
      return data as Account
    } catch (e: any) {
      error.value = e.response?.data?.error ?? 'Failed to update daily limit'
      throw e
    }
  }

  async function updateAbsoluteLimit(iban: string, absoluteLimit: number) {
    try {
      const { data } = await api.put(`/api/accounts/${iban}/absolute-limit`, { absoluteLimit })
      const idx = accounts.value.findIndex(a => a.iban === iban)
      if (idx !== -1) {
        accounts.value[idx] = data
      }
      return data as Account
    } catch (e: any) {
      error.value = e.response?.data?.error ?? 'Failed to update absolute limit'
      throw e
    }
  }

  async function closeAccount(iban: string) {
    try {
      const { data } = await api.put(`/api/accounts/${iban}/close`)
      const idx = accounts.value.findIndex(a => a.iban === iban)
      if (idx !== -1) {
        accounts.value[idx] = data
      }
      return data as Account
    } catch (e: any) {
      error.value = e.response?.data?.error ?? 'Failed to close account'
      throw e
    }
  }


  return { accounts, loading, error, fetchMyAccounts,
    fetchAccountsByUser, createAccount, getAccountByIban,
    updateDailyLimit, updateAbsoluteLimit, closeAccount }
})
