import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Transaction } from '@/models'
import api from '@/services/api'

export const useTransactionStore = defineStore('transaction', () => {
  const transactions = ref<Transaction[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const currentPage = ref(0)      // Spring pages are 0-indexed
  const totalPages = ref(1)
  const totalElements = ref(0)

  async function fetchTransactions(iban?: string, page = 0) {
    loading.value = true
    error.value = null

    try {
      const params = {
        ...(iban ? { iban } : {}),
        page, 
      }

      const response = await api.get('/api/transactions', { params })
      const data = response.data

      transactions.value = data.content
      currentPage.value = data.pageable.pageNumber
      totalPages.value = data.totalPages
      totalElements.value = data.totalElements

      return data
    } catch (e: any) {
      error.value = e.response?.data?.error ?? 'Failed to load transactions'
      return null
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

  return { transactions, loading, error, currentPage, totalPages, totalElements, transfer, fetchTransactions }
})
