import {defineStore} from 'pinia'
import {ref} from 'vue'
import type {Account, AccountType, UpdateAccountPayload} from '@/models'
import api from '@/services/api'

export const useAccountStore = defineStore('account', () => {
    const accounts = ref<Account[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    async function fetchMyAccounts() {
        loading.value = true
        error.value = null
        try {
            const {data} = await api.get('/api/accounts/accounts')
            accounts.value = data
        } catch (e: any) {
            error.value = e.response?.data?.error ?? 'Failed to load accounts'
        } finally {
            loading.value = false
        }
    }

    async function fetchAllAccounts() {
        loading.value = true
        error.value = null
        try {
            const {data} = await api.get('/api/accounts')
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
            const {data} = await api.get(`/api/accounts/`, {params: {userId}})
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
            const {data} = await api.get(`/api/accounts/${iban}`)
            return data as Account
        } catch (e: any) {
            error.value = e.response?.data?.error ?? 'Failed to load account'
            return null
        } finally {
            loading.value = false
        }
    }

    async function createAccount(accountType: AccountType, userId?: number) {
        const {data} = await api.post('/api/accounts', {accountType, userId})
        accounts.value.push(data)
        return data as Account
    }

    async function updateAccount(iban: string, payload: UpdateAccountPayload) {
        try {
            const {data} = await api.patch(`/api/accounts/${iban}`, payload)
            const index = accounts.value.findIndex(acc => acc.iban === iban)
            if (index !== -1) {
                accounts.value[index] = data
            }
            return data as Account
        } catch (e: any) {
            error.value = e.response?.data?.error ?? 'Failed to update account'
            return null
        }
    }

    async function closeAccount (iban: string) {
      return updateAccount(iban, {active: false})
    }

    return {accounts, loading, error,fetchAllAccounts, fetchMyAccounts, fetchAccountsByUser, createAccount, getAccountByIban,
       closeAccount, updateAccount
    }
})
