<template>
  <div class="container py-4">
    <h3 class="mb-1">Welcome back, {{ authStore.user?.firstName }}!</h3>
    <p class="text-muted mb-4">Manage your accounts and transfers</p>

    <!-- ── Accounts ───────────────────────────────────────── -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0">Your Accounts</h5>
      <button class="btn btn-sm btn-outline-primary" @click="showCreateAccount = true">+ New Account</button>
    </div>

    <div v-if="accountStore.loading" class="text-center py-4">
      <div class="spinner-border text-primary"></div>
    </div>

    <div v-else class="row g-3 mb-4">
      <div v-for="account in accountStore.accounts" :key="account.id" class="col-sm-6 col-lg-4">
        <div class="card h-100 border-0 shadow-sm account-card"
             :class="account.accountType === 'CHECKING' ? 'account-checking' : 'account-savings'">
          <div class="card-body text-white">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <span class="badge bg-white bg-opacity-25 text-white fw-normal">{{ account.accountType }}</span>
              <span class="opacity-75" style="font-size: .75rem;">
                {{ account.active ? '● Active' : '○ Inactive' }}
              </span>
            </div>
            <div class="mb-1" style="font-size: .8rem; opacity: .8;">
              {{ account.iban.slice(0, 8) }}&nbsp;····&nbsp;{{ account.iban.slice(-4) }}
            </div>
            <h2 class="mb-0 fw-bold">€&nbsp;{{ account.balance.toFixed(2) }}</h2>
            <small class="opacity-75">Day limit: €{{ account.dayLimit.toFixed(2) }}</small>
            <div class="mt-3 d-flex gap-2">
              <button class="btn btn-sm btn-light fw-semibold" @click="openDetails(account)">Details</button>
              <button class="btn btn-sm btn-light fw-semibold" @click="pickSourceAccount(account)">Transfer</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Transfer ───────────────────────────────────────── -->
    <div class="card border-0 shadow-sm mb-4">
      <div class="card-header bg-white border-bottom py-3">
        <h5 class="mb-0">Transfer Money</h5>
      </div>
      <div class="card-body">
        <div v-if="transferError" class="alert alert-danger py-2">{{ transferError }}</div>
        <div v-if="transferSuccess" class="alert alert-success py-2">
          ✓ Transfer successful — Ref: <strong>{{ transferSuccess }}</strong>
        </div>

        <form @submit.prevent="handleTransfer">
          <!-- Row 1: From + Amount -->
          <div class="row g-3 mb-3">
            <div class="col-md-8">
              <label class="form-label fw-semibold">From</label>
              <select v-model="transferForm.fromIban" class="form-select" required>
                <option value="">Select source account</option>
                <option v-for="acc in accountStore.accounts" :key="acc.iban" :value="acc.iban">
                  {{ acc.iban }} · {{ acc.accountType }} · €{{ acc.balance.toFixed(2) }}
                </option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label fw-semibold">Amount (€)</label>
              <input v-model.number="transferForm.amount" type="number" step="0.01" min="0.01"
                     class="form-control" placeholder="0.00" required />
            </div>
          </div>

          <!-- Row 2: To (tabbed) -->
          <div class="mb-3">
            <label class="form-label fw-semibold">To</label>
            <div class="d-flex gap-2 mb-2">
              <button type="button"
                      class="btn btn-sm"
                      :class="toMode === 'own' ? 'btn-primary' : 'btn-outline-secondary'"
                      @click="setToMode('own')">My Account</button>
              <button type="button"
                      class="btn btn-sm"
                      :class="toMode === 'external' ? 'btn-primary' : 'btn-outline-secondary'"
                      @click="setToMode('external')">Other Customer</button>
            </div>

            <!-- Own account dropdown -->
            <div v-if="toMode === 'own'">
              <select v-model="transferForm.toIban" class="form-select" required>
                <option value="">Select destination account</option>
                <option v-for="acc in otherOwnAccounts" :key="acc.iban" :value="acc.iban">
                  {{ acc.iban }} · {{ acc.accountType }}
                </option>
              </select>
              <small class="text-muted" v-if="otherOwnAccounts.length === 0">No other accounts available.</small>
            </div>

            <!-- External: IBAN + inline name search -->
            <div v-else>
              <input v-model="transferForm.toIban" class="form-control mb-2"
                     placeholder="Enter IBAN (e.g. NL02BANK…)" required />

              <!-- Inline search toggle -->
              <div>
                <button type="button" class="btn btn-sm btn-link p-0 text-decoration-none"
                        @click="searchOpen = !searchOpen">
                  {{ searchOpen ? '▲ Hide' : '▼ Search customer by name' }}
                </button>
              </div>
              <div v-if="searchOpen" class="mt-2 p-3 bg-light rounded">
                <div class="input-group input-group-sm">
                  <input v-model="ibanSearchName" class="form-control"
                         placeholder="First or last name…"
                         @keyup.enter="handleIbanSearch" />
                  <button class="btn btn-outline-secondary" type="button"
                          @click="handleIbanSearch" :disabled="ibanSearchLoading || !ibanSearchName.trim()">
                    <span v-if="ibanSearchLoading" class="spinner-border spinner-border-sm"></span>
                    <span v-else>Search</span>
                  </button>
                </div>
                <div v-if="ibanSearchResults.length > 0" class="mt-2">
                  <div v-for="r in ibanSearchResults" :key="r.iban"
                       class="d-flex align-items-center justify-content-between p-2 bg-white rounded mb-1 border">
                    <div>
                      <span class="fw-semibold">{{ r.ownerFullName }}</span>
                      <span class="badge ms-2" :class="r.accountType === 'CHECKING' ? 'bg-primary' : 'bg-success'">
                        {{ r.accountType }}
                      </span>
                      <div style="font-size: .8rem;" class="text-muted"><code>{{ r.iban }}</code></div>
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-primary"
                            @click="transferForm.toIban = r.iban; searchOpen = false">Use</button>
                  </div>
                </div>
                <div v-else-if="ibanSearchDone" class="mt-2 text-muted small">No accounts found.</div>
              </div>
            </div>
          </div>

          <button type="submit" class="btn btn-primary px-4" :disabled="transferLoading">
            <span v-if="transferLoading" class="spinner-border spinner-border-sm me-1"></span>
            Send Transfer
          </button>
        </form>
      </div>
    </div>

    <!-- ── Transaction History ─────────────────────────────── -->
    <TransactionHistory />

    <!-- ── Create Account Modal ───────────────────────────── -->
    <div v-if="showCreateAccount" class="modal d-block" style="background: rgba(0,0,0,0.45);">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
          <div class="modal-header border-bottom">
            <h5 class="modal-title">Open New Account</h5>
            <button class="btn-close" @click="showCreateAccount = false"></button>
          </div>
          <div class="modal-body">
            <div v-if="createError" class="alert alert-danger py-2">{{ createError }}</div>
            <label class="form-label fw-semibold">Account Type</label>
            <div class="d-flex gap-3">
              <div class="form-check">
                <input class="form-check-input" type="radio" value="CHECKING" id="typeChecking" v-model="newAccountType" />
                <label class="form-check-label" for="typeChecking">Checking</label>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="radio" value="SAVINGS" id="typeSavings" v-model="newAccountType" />
                <label class="form-check-label" for="typeSavings">Savings</label>
              </div>
            </div>
          </div>
          <div class="modal-footer border-top">
            <button class="btn btn-light" @click="showCreateAccount = false">Cancel</button>
            <button class="btn btn-primary" @click="handleCreateAccount" :disabled="createLoading">
              <span v-if="createLoading" class="spinner-border spinner-border-sm me-1"></span>
              Create Account
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Account Details Modal ─────────────────────────── -->
    <div v-if="detailAccount" class="modal d-block" style="background: rgba(0,0,0,0.45);" @click.self="closeDetails">
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content border-0 shadow">
          <div class="modal-header border-bottom"
               :class="detailAccount.accountType === 'CHECKING' ? 'account-checking' : 'account-savings'">
            <div class="text-white">
              <span class="badge bg-white bg-opacity-25 me-2">{{ detailAccount.accountType }}</span>
              <span class="fw-semibold">{{ detailAccount.iban }}</span>
            </div>
            <button class="btn-close btn-close-white" @click="closeDetails"></button>
          </div>
          <div class="modal-body">
            <!-- Stats row -->
            <div class="row g-3 mb-4">
              <div class="col-6 col-md-3">
                <div class="p-3 bg-light rounded text-center">
                  <div class="small text-muted mb-1">Balance</div>
                  <div class="fw-bold fs-5">€ {{ detailAccount.balance.toFixed(2) }}</div>
                </div>
              </div>
              <div class="col-6 col-md-3">
                <div class="p-3 bg-light rounded text-center">
                  <div class="small text-muted mb-1">Day Limit</div>
                  <div class="fw-bold fs-5">€ {{ detailAccount.dayLimit.toFixed(2) }}</div>
                </div>
              </div>
              <div class="col-6 col-md-3">
                <div class="p-3 bg-light rounded text-center">
                  <div class="small text-muted mb-1">Per Transaction</div>
                  <div class="fw-bold fs-5">€ {{ detailAccount.transactionLimit.toFixed(2) }}</div>
                </div>
              </div>
              <div class="col-6 col-md-3">
                <div class="p-3 bg-light rounded text-center">
                  <div class="small text-muted mb-1">Absolute Limit</div>
                  <div class="fw-bold fs-5">€ {{ detailAccount.absoluteLimit.toFixed(2) }}</div>
                </div>
              </div>
            </div>
            <div class="mb-4 d-flex gap-3 small text-muted">
              <span>Status: <strong :class="detailAccount.active ? 'text-success' : 'text-danger'">
                {{ detailAccount.active ? 'Active' : 'Inactive' }}</strong></span>
              <span>Opened: {{ detailAccount.createdAt ? formatDate(detailAccount.createdAt) : '—' }}</span>
            </div>

            <!-- Account transactions -->
            <h6 class="mb-3">Transactions on this account</h6>
            <div v-if="detailTxLoading" class="text-center py-3">
              <div class="spinner-border text-primary"></div>
            </div>
            <div v-else-if="detailTransactions.length === 0" class="text-muted text-center py-3">
              No transactions yet.
            </div>
            <div v-else class="table-responsive">
              <table class="table table-sm table-hover align-middle mb-0">
                <thead class="table-light">
                  <tr>
                    <th>Reference</th>
                    <th>Type</th>
                    <th>From</th>
                    <th>To</th>
                    <th class="text-end">Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="tx in detailTransactions" :key="tx.id">
                    <td><code class="text-muted small">{{ tx.reference }}</code></td>
                    <td><span class="badge" :class="txBadge(tx.type)">{{ txLabel(tx.type) }}</span></td>
                    <td class="text-muted small">{{ tx.sourceIban ?? '—' }}</td>
                    <td class="text-muted small">{{ tx.destinationIban ?? '—' }}</td>
                    <td class="text-end fw-semibold" :class="txAmountClassForAccount(tx, detailAccount!.iban)">
                      {{ txAmountClassForAccount(tx, detailAccount!.iban).includes('danger') ? '−' : '+' }}
                      €{{ tx.amount.toFixed(2) }}
                    </td>
                    <td class="text-muted small">{{ formatDate(tx.timestamp) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer border-top">
            <button class="btn btn-light" @click="closeDetails">Close</button>
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
import TransactionHistory from '@/components/transactions/UserDashboard.vue'

const authStore = useAuthStore()
const accountStore = useAccountStore()
const txStore = useTransactionStore()

// Transfer
const toMode = ref<'own' | 'external'>('external')
const transferForm = ref({ fromIban: '', toIban: '', amount: 0 })
const transferLoading = ref(false)
const transferError = ref<string | null>(null)
const transferSuccess = ref<string | null>(null)

const otherOwnAccounts = computed(() =>
  accountStore.accounts.filter(a => a.iban !== transferForm.value.fromIban)
)

function setToMode(mode: 'own' | 'external') {
  toMode.value = mode
  transferForm.value.toIban = ''
}

// Create account
const showCreateAccount = ref(false)
const newAccountType = ref<AccountType>('SAVINGS')
const createLoading = ref(false)
const createError = ref<string | null>(null)

// Account details
const detailAccount = ref<Account | null>(null)
const detailTransactions = ref<Transaction[]>([])
const detailTxLoading = ref(false)

// IBAN search (inline in transfer form)
const searchOpen = ref(false)
const ibanSearchName = ref('')
const ibanSearchResults = ref<IbanSearchResult[]>([])
const ibanSearchLoading = ref(false)
const ibanSearchDone = ref(false)

onMounted(async () => {
  await accountStore.fetchMyAccounts()
  await txStore.fetchTransactions()
})

function pickSourceAccount(account: Account) {
  transferForm.value.fromIban = account.iban
  transferForm.value.toIban = ''
  setToMode('external')
  transferError.value = null
  transferSuccess.value = null
}

async function openDetails(account: Account) {
  detailAccount.value = account
  detailTransactions.value = []
  detailTxLoading.value = true
  try {
    detailTransactions.value = await txStore.fetchTransactions(account.iban)
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
      transferForm.value.amount
    )
    transferSuccess.value = tx.reference
    transferForm.value = { fromIban: '', toIban: '', amount: 0 }
    toMode.value = 'external'
    await accountStore.fetchMyAccounts()
    await txStore.fetchTransactions()
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
    await accountStore.fetchMyAccounts()
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

function txBadge(type: TransactionType) {
  return {
    'bg-primary bg-opacity-75': type === 'TRANSFER',
    'bg-success': type === 'ATM_DEPOSIT',
    'bg-warning text-dark': type === 'ATM_WITHDRAWAL'
  }
}

function txLabel(type: TransactionType) {
  return { TRANSFER: 'Transfer', ATM_DEPOSIT: 'Deposit', ATM_WITHDRAWAL: 'Withdrawal' }[type]
}

function txAmountClassForAccount(tx: Transaction, iban: string) {
  if (tx.type === 'ATM_DEPOSIT') return 'text-success'
  if (tx.type === 'ATM_WITHDRAWAL') return 'text-danger'
  return tx.sourceIban === iban ? 'text-danger' : 'text-success'
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleString('nl-NL')
}
</script>

<style scoped>
.account-card { border-radius: 1rem; transition: transform .15s; }
.account-card:hover { transform: translateY(-2px); }
.account-checking { background: linear-gradient(135deg, #2563eb, #1e40af); }
.account-savings  { background: linear-gradient(135deg, #059669, #065f46); }
</style>
