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

  async function transfer(fromIban: string, toIban: string, amount: number, description: string) {
    const { data } = await api.post('/api/transactions/transfer', {
      fromIban, toIban, amount, description
    })
    return data as Transaction
  }

  return { transactions, loading, error, fetchMyTransactions, fetchAllTransactions, transfer }
})
