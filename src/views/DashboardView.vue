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
        <div class="card h-100 shadow-sm">
          <div class="card-body">
            <div class="d-flex justify-content-between">
              <span class="badge" :class="account.accountType === 'CHECKING' ? 'bg-primary' : 'bg-success'">
                {{ account.accountType }}
              </span>
              <small class="text-muted">{{ account.iban }}</small>
            </div>
            <h3 class="mt-2 mb-0">€ {{ account.balance.toFixed(2) }}</h3>
            <small class="text-muted">Day limit: €{{ account.dayLimit }}</small>
            <div class="mt-2 d-flex gap-2">
              <button class="btn btn-sm btn-outline-primary" @click="openDetails(account)">Details</button>
              <button class="btn btn-sm btn-outline-secondary" @click="selectForTransfer(account)">Transfer</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Transfer Section -->
    <div class="card shadow-sm mb-4">
      <div class="card-header"><h5 class="mb-0">Transfer Money</h5></div>
      <div class="card-body">
        <div v-if="transferError" class="alert alert-danger">{{ transferError }}</div>
        <div v-if="transferSuccess" class="alert alert-success">Transfer successful! Ref: {{ transferSuccess }}</div>

        <form @submit.prevent="handleTransfer" class="row g-3">
          <!-- Source account -->
          <div class="col-md-4">
            <label class="form-label">From Account</label>
            <select v-model="transferForm.fromIban" class="form-select" required>
              <option value="">-- Select source account --</option>
              <option v-for="acc in accountStore.accounts" :key="acc.iban" :value="acc.iban">
                {{ acc.iban }} ({{ acc.accountType }}) — €{{ acc.balance.toFixed(2) }}
              </option>
            </select>
          </div>

          <!-- Destination: own account or external -->
          <div class="col-md-4">
            <label class="form-label">To Account</label>
            <div class="input-group">
              <select v-if="toMode === 'own'" v-model="transferForm.toIban" class="form-select" required>
                <option value="">-- Select your account --</option>
                <option v-for="acc in otherOwnAccounts" :key="acc.iban" :value="acc.iban">
                  {{ acc.iban }} ({{ acc.accountType }})
                </option>
              </select>
              <input v-else v-model="transferForm.toIban" class="form-control" placeholder="NL02BANK..." required />
            </div>
            <div class="btn-group btn-group-sm mt-1 w-100">
              <button type="button" class="btn" :class="toMode === 'external' ? 'btn-secondary' : 'btn-outline-secondary'" @click="toMode = 'external'; transferForm.toIban = ''">External IBAN</button>
              <button type="button" class="btn" :class="toMode === 'own' ? 'btn-secondary' : 'btn-outline-secondary'" @click="toMode = 'own'; transferForm.toIban = ''">My Account</button>
            </div>
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

    <!-- Find Customer IBAN Section -->
    <div class="card shadow-sm mb-4">
      <div class="card-header"><h5 class="mb-0">Find Customer IBAN</h5></div>
      <div class="card-body">
        <div class="row g-2 align-items-end mb-3">
          <div class="col-md-6">
            <label class="form-label">Search by customer name</label>
            <input v-model="ibanSearchName" class="form-control" placeholder="e.g. John Doe" @keyup.enter="handleIbanSearch" />
          </div>
          <div class="col-auto">
            <button class="btn btn-outline-primary" @click="handleIbanSearch" :disabled="ibanSearchLoading || !ibanSearchName.trim()">
              <span v-if="ibanSearchLoading" class="spinner-border spinner-border-sm me-1"></span>
              Search
            </button>
          </div>
        </div>

        <div v-if="ibanSearchResults.length > 0">
          <table class="table table-sm table-hover">
            <thead class="table-light">
              <tr>
                <th>IBAN</th>
                <th>Owner</th>
                <th>Type</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="result in ibanSearchResults" :key="result.iban">
                <td><code>{{ result.iban }}</code></td>
                <td>{{ result.ownerFullName }}</td>
                <td><span class="badge" :class="result.accountType === 'CHECKING' ? 'bg-primary' : 'bg-success'">{{ result.accountType }}</span></td>
                <td>
                  <button class="btn btn-sm btn-outline-secondary" @click="useIbanForTransfer(result.iban)">
                    Use for transfer
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else-if="ibanSearchDone" class="text-muted">No accounts found.</div>
      </div>
    </div>

    <!-- Transaction History -->
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

    <!-- Account Details Modal -->
    <div v-if="detailAccount" class="modal d-block" style="background: rgba(0,0,0,0.5);" @click.self="closeDetails">
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Account Details</h5>
            <button class="btn-close" @click="closeDetails"></button>
          </div>
          <div class="modal-body">
            <!-- Account Info -->
            <div class="row g-3 mb-4">
              <div class="col-md-6">
                <div class="p-3 bg-light rounded">
                  <div class="mb-2">
                    <span class="badge fs-6" :class="detailAccount.accountType === 'CHECKING' ? 'bg-primary' : 'bg-success'">
                      {{ detailAccount.accountType }}
                    </span>
                  </div>
                  <table class="table table-sm table-borderless mb-0">
                    <tbody>
                      <tr><th>IBAN</th><td><code>{{ detailAccount.iban }}</code></td></tr>
                      <tr><th>Balance</th><td class="fw-bold">€ {{ detailAccount.balance.toFixed(2) }}</td></tr>
                      <tr><th>Status</th><td><span :class="detailAccount.active ? 'text-success' : 'text-danger'">{{ detailAccount.active ? 'Active' : 'Inactive' }}</span></td></tr>
                      <tr><th>Opened</th><td>{{ detailAccount.createdAt ? formatDate(detailAccount.createdAt) : '—' }}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div class="col-md-6">
                <div class="p-3 bg-light rounded h-100">
                  <h6 class="mb-3">Limits</h6>
                  <table class="table table-sm table-borderless mb-0">
                    <tbody>
                      <tr><th>Daily Limit</th><td>€ {{ detailAccount.dayLimit.toFixed(2) }}</td></tr>
                      <tr><th>Per Transaction</th><td>€ {{ detailAccount.transactionLimit.toFixed(2) }}</td></tr>
                      <tr><th>Absolute Limit</th><td>€ {{ detailAccount.absoluteLimit.toFixed(2) }}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Account Transactions -->
            <h6 class="mb-3">Transaction History</h6>
            <div v-if="detailTxLoading" class="text-center py-3">
              <div class="spinner-border text-primary"></div>
            </div>
            <div v-else-if="detailTransactions.length === 0" class="text-muted text-center py-3">
              No transactions for this account.
            </div>
            <table v-else class="table table-sm table-hover">
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
                <tr v-for="tx in detailTransactions" :key="tx.id">
                  <td><code>{{ tx.reference }}</code></td>
                  <td><span class="badge" :class="txBadge(tx.type)">{{ tx.type }}</span></td>
                  <td>{{ tx.sourceIban ?? '—' }}</td>
                  <td>{{ tx.destinationIban ?? '—' }}</td>
                  <td :class="txAmountClassForAccount(tx, detailAccount!.iban)">€ {{ tx.amount.toFixed(2) }}</td>
                  <td>{{ formatDate(tx.timestamp) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeDetails">Close</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useAccountStore } from '@/stores/account.store'
import { useTransactionStore } from '@/stores/transaction.store'
import type { Account, AccountType, IbanSearchResult, Transaction, TransactionType } from '@/models'
import api from '@/services/api'

const authStore = useAuthStore()
const accountStore = useAccountStore()
const txStore = useTransactionStore()

// Transfer form
const toMode = ref<'external' | 'own'>('external')
const transferForm = ref({ fromIban: '', toIban: '', amount: 0, description: '' })
const transferLoading = ref(false)
const transferError = ref<string | null>(null)
const transferSuccess = ref<string | null>(null)

const otherOwnAccounts = computed(() =>
  accountStore.accounts.filter(a => a.iban !== transferForm.value.fromIban)
)

// Create account
const showCreateAccount = ref(false)
const newAccountType = ref<AccountType>('SAVINGS')
const createLoading = ref(false)
const createError = ref<string | null>(null)

// Account details modal
const detailAccount = ref<Account | null>(null)
const detailTransactions = ref<Transaction[]>([])
const detailTxLoading = ref(false)

// IBAN search
const ibanSearchName = ref('')
const ibanSearchResults = ref<IbanSearchResult[]>([])
const ibanSearchLoading = ref(false)
const ibanSearchDone = ref(false)

onMounted(async () => {
  await accountStore.fetchMyAccounts()
  await txStore.fetchMyTransactions()
})

function selectForTransfer(account: Account) {
  transferForm.value.fromIban = account.iban
  transferForm.value.toIban = ''
  toMode.value = 'external'
  transferError.value = null
  transferSuccess.value = null
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function openDetails(account: Account) {
  detailAccount.value = account
  detailTransactions.value = []
  detailTxLoading.value = true
  try {
    const { data } = await api.get(`/api/transactions/account/${account.iban}`)
    detailTransactions.value = data
  } catch {
    detailTransactions.value = []
  } finally {
    detailTxLoading.value = false
  }
}

function closeDetails() {
  detailAccount.value = null
  detailTransactions.value = []
}

async function handleTransfer() {
  transferLoading.value = true
  transferError.value = null
  transferSuccess.value = null
  try {
    const tx = await txStore.transfer(
      transferForm.value.fromIban,
      transferForm.value.toIban,
      transferForm.value.amount,
      transferForm.value.description
    )
    transferSuccess.value = tx.reference
    transferForm.value = { fromIban: '', toIban: '', amount: 0, description: '' }
    toMode.value = 'external'
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

async function handleIbanSearch() {
  if (!ibanSearchName.value.trim()) return
  ibanSearchLoading.value = true
  ibanSearchDone.value = false
  ibanSearchResults.value = []
  try {
    ibanSearchResults.value = await accountStore.searchByName(ibanSearchName.value.trim())
  } finally {
    ibanSearchLoading.value = false
    ibanSearchDone.value = true
  }
}

function useIbanForTransfer(iban: string) {
  transferForm.value.toIban = iban
  toMode.value = 'external'
  transferError.value = null
  transferSuccess.value = null
}

function txBadge(type: TransactionType) {
  return {
    'bg-info text-dark': type === 'TRANSFER',
    'bg-success': type === 'ATM_DEPOSIT',
    'bg-warning text-dark': type === 'ATM_WITHDRAWAL'
  }
}

function txAmountClass(tx: Transaction) {
  if (tx.type === 'ATM_DEPOSIT') return 'text-success fw-bold'
  if (tx.type === 'ATM_WITHDRAWAL') return 'text-danger fw-bold'
  return tx.sourceIban && accountStore.accounts.some(a => a.iban === tx.sourceIban)
    ? 'text-danger fw-bold'
    : 'text-success fw-bold'
}

function txAmountClassForAccount(tx: Transaction, iban: string) {
  if (tx.type === 'ATM_DEPOSIT') return 'text-success fw-bold'
  if (tx.type === 'ATM_WITHDRAWAL') return 'text-danger fw-bold'
  return tx.sourceIban === iban ? 'text-danger fw-bold' : 'text-success fw-bold'
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleString('nl-NL')
}
</script>
