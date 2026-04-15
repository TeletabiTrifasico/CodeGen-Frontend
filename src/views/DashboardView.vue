<template>
  <div class="container mt-4">
    <h2 class="mb-4">Welcome, {{ authStore.user?.firstName }}!</h2>

    <!-- Accounts Section -->
    <div class="row g-4 mb-4">
      <div class="col-12 d-flex justify-content-between align-items-center">
        <h4>Your Accounts</h4>
        <button class="btn btn-sm btn-primary" @click="showCreateAccount = true">+ New Account</button>
      </div>

      <div v-if="accountStore.loading" class="col-12 text-center">
        <div class="spinner-border text-primary"></div>
      </div>

      <div v-for="account in accountStore.accounts" :key="account.id" class="col-md-4">
        <div class="card h-100 shadow-sm" :class="{ 'border-primary': selectedAccount?.iban === account.iban }"
             @click="selectAccount(account)" style="cursor: pointer;">
          <div class="card-body">
            <div class="d-flex justify-content-between">
              <span class="badge" :class="account.accountType === 'CHECKING' ? 'bg-primary' : 'bg-success'">
                {{ account.accountType }}
              </span>
              <small class="text-muted">{{ account.iban }}</small>
            </div>
            <h3 class="mt-2 mb-0">€ {{ account.balance.toFixed(2) }}</h3>
            <small class="text-muted">Day limit: €{{ account.dayLimit }}</small>
          </div>
        </div>
      </div>
    </div>

    <!-- Transfer Section -->
    <div v-if="selectedAccount" class="card shadow-sm mb-4">
      <div class="card-body">
        <h5>Transfer Money</h5>
        <div v-if="transferError" class="alert alert-danger">{{ transferError }}</div>
        <div v-if="transferSuccess" class="alert alert-success">Transfer successful! Ref: {{ transferSuccess }}</div>
        <form @submit.prevent="handleTransfer" class="row g-3">
          <div class="col-md-4">
            <label class="form-label">From</label>
            <input :value="selectedAccount.iban" class="form-control" readonly />
          </div>
          <div class="col-md-4">
            <label class="form-label">To IBAN</label>
            <input v-model="transferForm.toIban" class="form-control" placeholder="NL02BANK..." required />
          </div>
          <div class="col-md-2">
            <label class="form-label">Amount (€)</label>
            <input v-model.number="transferForm.amount" type="number" step="0.01" min="0.01" class="form-control" required />
          </div>
          <div class="col-md-2">
            <label class="form-label">Description</label>
            <input v-model="transferForm.description" class="form-control" />
          </div>
          <div class="col-12">
            <button type="submit" class="btn btn-primary" :disabled="transferLoading">
              <span v-if="transferLoading" class="spinner-border spinner-border-sm me-1"></span>
              Transfer
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Transactions Section -->
    <div class="card shadow-sm">
      <div class="card-header d-flex justify-content-between">
        <h5 class="mb-0">Transaction History</h5>
        <button class="btn btn-sm btn-outline-secondary" @click="txStore.fetchMyTransactions()">Refresh</button>
      </div>
      <div class="card-body p-0">
        <div v-if="txStore.loading" class="text-center p-4">
          <div class="spinner-border text-primary"></div>
        </div>
        <div v-else-if="txStore.transactions.length === 0" class="text-center p-4 text-muted">
          No transactions yet.
        </div>
        <table v-else class="table table-hover mb-0">
          <thead class="table-light">
            <tr>
              <th>Reference</th>
              <th>Type</th>
              <th>From</th>
              <th>To</th>
              <th>Amount</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tx in txStore.transactions" :key="tx.id">
              <td><code>{{ tx.reference }}</code></td>
              <td>
                <span class="badge" :class="txBadge(tx.type)">{{ tx.type }}</span>
              </td>
              <td>{{ tx.sourceIban ?? '—' }}</td>
              <td>{{ tx.destinationIban ?? '—' }}</td>
              <td :class="txAmountClass(tx)">€ {{ tx.amount.toFixed(2) }}</td>
              <td>{{ formatDate(tx.timestamp) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Account Modal -->
    <div v-if="showCreateAccount" class="modal d-block" style="background: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Create New Account</h5>
            <button class="btn-close" @click="showCreateAccount = false"></button>
          </div>
          <div class="modal-body">
            <div v-if="createError" class="alert alert-danger">{{ createError }}</div>
            <label class="form-label">Account Type</label>
            <select v-model="newAccountType" class="form-select">
              <option value="SAVINGS">Savings</option>
              <option value="CHECKING">Checking</option>
            </select>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showCreateAccount = false">Cancel</button>
            <button class="btn btn-primary" @click="handleCreateAccount" :disabled="createLoading">
              <span v-if="createLoading" class="spinner-border spinner-border-sm me-1"></span>
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useAccountStore } from '@/stores/account.store'
import { useTransactionStore } from '@/stores/transaction.store'
import type { Account, AccountType, TransactionType } from '@/models'

const authStore = useAuthStore()
const accountStore = useAccountStore()
const txStore = useTransactionStore()

const selectedAccount = ref<Account | null>(null)
const transferForm = ref({ toIban: '', amount: 0, description: '' })
const transferLoading = ref(false)
const transferError = ref<string | null>(null)
const transferSuccess = ref<string | null>(null)

const showCreateAccount = ref(false)
const newAccountType = ref<AccountType>('SAVINGS')
const createLoading = ref(false)
const createError = ref<string | null>(null)

onMounted(async () => {
  await accountStore.fetchMyAccounts()
  await txStore.fetchMyTransactions()
})

function selectAccount(account: Account) {
  selectedAccount.value = account
  transferError.value = null
  transferSuccess.value = null
}

async function handleTransfer() {
  if (!selectedAccount.value) return
  transferLoading.value = true
  transferError.value = null
  transferSuccess.value = null
  try {
    const tx = await txStore.transfer(
      selectedAccount.value.iban,
      transferForm.value.toIban,
      transferForm.value.amount,
      transferForm.value.description
    )
    transferSuccess.value = tx.reference
    transferForm.value = { toIban: '', amount: 0, description: '' }
    await accountStore.fetchMyAccounts()
    await txStore.fetchMyTransactions()
  } catch (e: any) {
    transferError.value = e.response?.data?.error ?? 'Transfer failed'
  } finally {
    transferLoading.value = false
  }
}

async function handleCreateAccount() {
  createLoading.value = true
  createError.value = null
  try {
    await accountStore.createAccount(newAccountType.value)
    showCreateAccount.value = false
  } catch (e: any) {
    createError.value = e.response?.data?.error ?? 'Failed to create account'
  } finally {
    createLoading.value = false
  }
}

function txBadge(type: TransactionType) {
  return {
    'bg-info text-dark': type === 'TRANSFER',
    'bg-success': type === 'ATM_DEPOSIT',
    'bg-warning text-dark': type === 'ATM_WITHDRAWAL'
  }
}

function txAmountClass(tx: any) {
  if (tx.type === 'ATM_DEPOSIT') return 'text-success fw-bold'
  if (tx.type === 'ATM_WITHDRAWAL') return 'text-danger fw-bold'
  return tx.sourceIban && accountStore.accounts.some(a => a.iban === tx.sourceIban)
    ? 'text-danger fw-bold'
    : 'text-success fw-bold'
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleString('nl-NL')
}
</script>
