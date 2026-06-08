import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Transaction } from '@/models'
import api from '@/services/api'

export const useTransactionStore = defineStore('transaction', () => {
  const transactions = ref<Transaction[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchMyTransactions() {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get('/api/transactions')
      transactions.value = data
    } catch (e: any) {
      error.value = e.response?.data?.error ?? 'Failed to load transactions'
    } finally {
      loading.value = false
    }
  }

  async function fetchAllTransactions() {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get('/api/transactions/all')
      transactions.value = data
    } catch (e: any) {
      error.value = e.response?.data?.error ?? 'Failed to load transactions'
    } finally {
      loading.value = false
    }
  }

  async function fetchTransactionsByAccount(iban: string) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get(`/api/transactions/account/${iban}`)
      return data as Transaction[]
    } catch (e: any) {
      error.value = e.response?.data?.error ?? 'Failed to load account transactions'
      return []
    } finally {
      loading.value = false
    }
  }

  async function fetchTransactions(iban?: string) {
    loading.value = true
    error.value = null
    try {
      const params = iban ? { iban } : {}
      const { data } = await api.get('/api/transactions/newGetApi', { params })
      transactions.value = data
      return data as Transaction[]
    } catch (e: any) {
      error.value = e.response?.data?.error ?? 'Failed to load transactions'
      return []
    } finally {
      loading.value = false
    }
  }

  async function fetchTest() {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get('/api/transactions/testAPI')
      return data as Transaction[]
    } catch (e: any) {
      error.value = e.response?.data?.error ?? 'Failed to load transactions'
      return []
    } finally {
      loading.value = false
    }
  }


  async function transfer(fromIban: string, toIban: string, amount: number) {
    try {
      const { data } = await api.post('/api/transactions/transaction', {
        fromIban, toIban, amount
      })
      return data as Transaction
    } catch (e: any) {
      error.value = e.response?.data?.error ?? 'Failed to transfer'
      throw e
    }
  }

  return { transactions, loading, error, fetchMyTransactions, fetchAllTransactions, transfer, fetchTransactionsByAccount, fetchTransactions, fetchTest }
})
