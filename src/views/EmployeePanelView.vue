<template>
  <div class="container mt-4">
    <h2 class="mb-4">Employee Panel</h2>

    <ul class="nav nav-tabs mb-4">
      <li class="nav-item">
        <button class="nav-link" :class="{ active: tab === 'pending' }" @click="tab = 'pending'">
          Pending Approvals
          <span v-if="userStore.pendingUsers.length" class="badge bg-danger ms-1">
            {{ userStore.pendingUsers.length }}
          </span>
        </button>
      </li>

      <li class="nav-item">
        <button class="nav-link" :class="{ active: tab === 'users' }" @click="tab = 'users'">
          All Users
        </button>
      </li>

      <li class="nav-item">
        <button class="nav-link" :class="{ active: tab === 'withoutAccounts' }" @click="loadWithoutAccounts">
          Without Accounts
        </button>
      </li>

      <li class="nav-item">
        <button class="nav-link" :class="{ active: tab === 'accounts' }" @click="loadAllAccounts">
          All Accounts
        </button>
      </li>

      <li class="nav-item">
        <button class="nav-link" :class="{ active: tab === 'transfer' }" @click="loadTransferTab">
          Employee Transfer
        </button>
      </li>

      <li class="nav-item">
        <button class="nav-link" :class="{ active: tab === 'transactions' }" @click="loadAllTransactions">
          All Transactions
        </button>
      </li>
    </ul>

    <!-- Pending Approvals -->
    <div v-if="tab === 'pending'">
      <div v-if="userStore.loading" class="text-center">
        <div class="spinner-border text-primary"></div>
      </div>

      <div v-else-if="userStore.pendingUsers.length === 0" class="alert alert-info">
        No pending approvals.
      </div>

      <div v-else class="row g-3">
        <div v-for="user in userStore.pendingUsers" :key="user.id" class="col-md-6">
          <div class="card shadow-sm">
            <div class="card-body">
              <h5 class="card-title">{{ user.firstName }} {{ user.lastName }}</h5>
              <p class="text-muted mb-1">@{{ user.username }} · {{ user.email }}</p>
              <p class="mb-1"><strong>BSN:</strong> {{ user.bsn }}</p>
              <p class="mb-1"><strong>DOB:</strong> {{ user.dateOfBirth }}</p>
              <p class="mb-3"><strong>Phone:</strong> {{ user.phoneNumber }}</p>

              <div v-if="approveError[user.id]" class="alert alert-danger py-1 small">
                {{ approveError[user.id] }}
              </div>

              <button class="btn btn-success btn-sm" @click="handleApprove(user.id)" :disabled="approveLoading[user.id]">
                <span v-if="approveLoading[user.id]" class="spinner-border spinner-border-sm me-1"></span>
                Approve
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- All Users -->
    <div v-if="tab === 'users'">
      <div v-if="userStore.loading" class="text-center">
        <div class="spinner-border text-primary"></div>
      </div>

      <table v-else class="table table-hover shadow-sm">
        <thead class="table-light">
        <tr>
          <th>Name</th>
          <th>Username</th>
          <th>Email</th>
          <th>Role</th>
          <th>Status</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="user in userStore.users" :key="user.id">
          <td>{{ user.firstName }} {{ user.lastName }}</td>
          <td>@{{ user.username }}</td>
          <td>{{ user.email }}</td>
          <td>
              <span class="badge" :class="user.role === 'EMPLOYEE' ? 'bg-dark' : 'bg-primary'">
                {{ user.role }}
              </span>
          </td>
          <td>
              <span
                  v-if="user.role === 'CUSTOMER'"
                  class="badge"
                  :class="user.approved ? 'bg-success' : 'bg-warning text-dark'"
              >
                {{ user.approved ? 'Approved' : 'Pending' }}
              </span>
            <span v-else class="badge bg-secondary">N/A</span>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- Customers Without Accounts -->
    <div v-if="tab === 'withoutAccounts'">
      <div v-if="userStore.loading" class="text-center">
        <div class="spinner-border text-primary"></div>
      </div>

      <div v-else-if="userStore.error" class="alert alert-danger">
        {{ userStore.error }}
      </div>

      <div v-else-if="userStore.userWithoutAccounts.length === 0" class="alert alert-info">
        No customers without accounts found.
      </div>

      <table v-else class="table table-hover shadow-sm">
        <thead class="table-light">
        <tr>
          <th>Name</th>
          <th>Username</th>
          <th>Email</th>
          <th>Phone</th>
          <th>BSN</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="user in userStore.userWithoutAccounts" :key="user.id">
          <td>{{ user.firstName }} {{ user.lastName }}</td>
          <td>@{{ user.username }}</td>
          <td>{{ user.email }}</td>
          <td>{{ user.phoneNumber }}</td>
          <td>{{ user.bsn }}</td>
        </tr>
        </tbody>
      </table>
    </div>



    <!-- All Accounts -->
    <div v-if="tab === 'accounts'">
      <div v-if="accountStore.loading" class="text-center">
        <div class="spinner-border text-primary"></div>
      </div>

      <div v-else-if="accountStore.error" class="alert alert-danger">
        {{ accountStore.error }}
      </div>

      <div v-else-if="accountStore.accounts.length === 0" class="alert alert-info">
        No accounts found.
      </div>

      <table v-else class="table table-hover shadow-sm">
        <thead class="table-light">
        <tr>
          <th>IBAN</th>
          <th>Owner</th>
          <th>Username</th>
          <th>Type</th>
          <th class="text-end">Balance</th>
          <th>Active</th>
          <th class="text-end">Day Limit</th>
          <th class="text-end">Absolute Limit</th>
          <th class="text-end">Tx Limit</th>
          <th>Actions</th>
        </tr>
        </thead>

        <tbody>
        <tr v-for="account in accountStore.accounts" :key="account.iban">
          <td><code>{{ account.iban }}</code></td>
          <td>{{ account.ownerFullName }}</td>
          <td>@{{ account.ownerUsername }}</td>
          <td>
              <span class="badge" :class="account.accountType === 'CHECKING' ? 'bg-primary' : 'bg-success'">
                {{ account.accountType }}
              </span>
          </td>

          <td class="text-end">€{{ account.balance.toFixed(2) }}</td>

          <td>
              <span :class="account.active ? 'text-success' : 'text-danger'">
                {{ account.active ? 'Yes' : 'No' }}
              </span>
          </td>

          <td class="text-end">€{{ account.dayLimit.toFixed(2) }}</td>
          <td class="text-end">€{{ account.absoluteLimit.toFixed(2) }}</td>
          <td class="text-end">€{{ account.transactionLimit.toFixed(2) }}</td>

          <td>
            <button class="btn btn-sm btn-outline-secondary me-1" @click="openEditLimits(account)">
              Edit limits
            </button>
            <button class="btn btn-sm btn-outline-danger" @click="handleCloseAccount(account.iban)" :disabled="!account.active">
              Close
            </button>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- Edit Limits Modal -->
    <div v-if="showEditModal" class="modal d-block" style="background: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              Edit Limits — {{ editingAccount?.ownerFullName }}
              <small class="text-muted">({{ editingAccount?.iban }})</small>
            </h5>
            <button class="btn-close" @click="closeEditModal" :disabled="editLoading"></button>
          </div>

          <div class="modal-body">
            <div v-if="editError" class="alert alert-danger">{{ editError }}</div>
            <div v-if="editSuccess" class="alert alert-success">{{ editSuccess }}</div>

            <div class="mb-3">
              <label class="form-label">Daily limit (€)</label>
              <input v-model.number="editValues.dayLimit" type="number" min="0" step="0.01" class="form-control" />
            </div>

            <div class="mb-3">
              <label class="form-label">Absolute limit (€)</label>
              <input v-model.number="editValues.absoluteLimit" type="number" min="0" step="0.01" class="form-control" />
            </div>

            <div class="mb-3">
              <label class="form-label">Transaction limit (€)</label>
              <input v-model.number="editValues.transactionLimit" type="number" min="0" step="0.01" class="form-control" />
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeEditModal" :disabled="editLoading">Cancel</button>
            <button class="btn btn-primary" @click="saveEditLimits" :disabled="editLoading">
              <span v-if="editLoading" class="spinner-border spinner-border-sm me-1"></span>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Employee Transfer -->
    <div v-if="tab === 'transfer'">
      <div v-if="accountStore.loading" class="text-center">
        <div class="spinner-border text-primary"></div>
      </div>

      <div v-else-if="accountStore.error" class="alert alert-danger">
        {{ accountStore.error }}
      </div>

      <div v-else class="card shadow-sm">
        <div class="card-body">
          <h5 class="card-title mb-4">Transfer Between Customer Accounts</h5>

          <div v-if="transferError" class="alert alert-danger">{{ transferError }}</div>
          <div v-if="transferSuccess" class="alert alert-success">{{ transferSuccess }}</div>

          <form @submit.prevent="handleEmployeeTransfer" class="row g-3">
            <div class="col-md-6">
              <label class="form-label">From Account (CHECKING)</label>
              <select v-model="selectedFromIban" class="form-select" required>
                <option value="">Select source account</option>
                <option v-for="acc in checkingAccounts" :key="acc.iban" :value="acc.iban">
                  {{ acc.ownerFullName }} - {{ acc.iban }} (€{{ acc.balance.toFixed(2) }})
                </option>
              </select>
            </div>

            <div class="col-md-6">
              <label class="form-label">To Account (CHECKING)</label>
              <select v-model="selectedToIban" class="form-select" required>
                <option value="">Select destination account</option>
                <option v-for="acc in checkingAccounts" :key="acc.iban" :value="acc.iban">
                  {{ acc.ownerFullName }} - {{ acc.iban }} (€{{ acc.balance.toFixed(2) }})
                </option>
              </select>
            </div>

            <div class="col-md-4">
              <label class="form-label">Amount (€)</label>
              <input v-model.number="transferAmount" type="number" min="0.01" step="0.01" class="form-control" required />
            </div>

            <div class="col-md-8">
              <label class="form-label">Description</label>
              <input v-model="transferDescription" type="text" class="form-control" placeholder="Transfer description" />
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
    </div>

    <!-- All Transactions -->
    <div v-if="tab === 'transactions'">
      <div v-if="txStore.loading" class="text-center">
        <div class="spinner-border text-primary"></div>
      </div>

      <div v-else-if="txStore.transactions.length === 0" class="alert alert-info">
        No transactions.
      </div>

      <table v-else class="table table-hover shadow-sm">
        <thead class="table-light">
        <tr>
          <th>Reference</th>
          <th>Type</th>
          <th>From</th>
          <th>To</th>
          <th>Amount</th>
          <th>Initiated By</th>
          <th>Date</th>
        </tr>
        </thead>

        <tbody>
        <tr v-for="tx in txStore.transactions" :key="tx.id">
          <td><code>{{ tx.reference }}</code></td>
          <td><span class="badge bg-secondary">{{ tx.type }}</span></td>
          <td>{{ tx.sourceIban ?? '—' }}</td>
          <td>{{ tx.destinationIban ?? '—' }}</td>
          <td>€{{ tx.amount.toFixed(2) }}</td>
          <td>{{ tx.initiatedByUsername }}</td>
          <td>{{ new Date(tx.timestamp).toLocaleString('nl-NL') }}</td>
        </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { Account } from '@/models'
import { useUserStore } from '@/stores/user.store'
import { useTransactionStore } from '@/stores/transaction.store'
import { useAccountStore } from '@/stores/account.store'

const userStore = useUserStore()
const txStore = useTransactionStore()
const accountStore = useAccountStore()

const tab = ref<'pending' | 'users' |'withoutAccounts' | 'accounts' | 'transfer' | 'transactions'>('pending')

const approveLoading = ref<Record<number, boolean>>({})
const approveError = ref<Record<number, string>>({})

const checkingAccounts = computed(() =>
    accountStore.accounts.filter(acc => acc.accountType === 'CHECKING' && acc.active)
)

// Transfer state
const selectedFromIban = ref('')
const selectedToIban = ref('')
const transferAmount = ref(0)
const transferDescription = ref('')
const transferLoading = ref(false)
const transferError = ref<string | null>(null)
const transferSuccess = ref<string | null>(null)

// Edit limits modal state
const showEditModal = ref(false)
const editingAccount = ref<Account | null>(null)
const editValues = ref({ dayLimit: 0, absoluteLimit: 0, transactionLimit: 0 })
const editLoading = ref(false)
const editError = ref<string | null>(null)
const editSuccess = ref<string | null>(null)

onMounted(async () => {
  await Promise.all([userStore.fetchPendingUsers(), userStore.fetchAllUsers()])
})

async function loadAllAccounts() {
  tab.value = 'accounts'
  await accountStore.fetchAllAccounts()
}

async function loadWithoutAccounts() {
  tab.value = 'withoutAccounts'
  await userStore.fetchUsersWithoutAccounts()
}

async function loadTransferTab() {
  tab.value = 'transfer'
  await accountStore.fetchAllAccounts()
}

async function loadAllTransactions() {
  tab.value = 'transactions'
  await txStore.fetchAllTransactions()
}

async function handleApprove(userId: number) {
  approveLoading.value[userId] = true
  approveError.value[userId] = ''
  try {
    await userStore.approveUser(userId)
    // refresh lists
    await Promise.all([userStore.fetchPendingUsers(), userStore.fetchAllUsers(), accountStore.fetchAllAccounts()])
  } catch (e: any) {
    approveError.value[userId] = e.response?.data?.error ?? 'Approval failed'
  } finally {
    approveLoading.value[userId] = false
  }
}

async function handleEmployeeTransfer() {
  transferLoading.value = true
  transferError.value = null
  transferSuccess.value = null

  try {
    if (!selectedFromIban.value || !selectedToIban.value) {
      transferError.value = 'Please select both source and destination accounts'
      return
    }
    if (selectedFromIban.value === selectedToIban.value) {
      transferError.value = 'From and To IBAN cannot be the same'
      return
    }
    if (transferAmount.value <= 0) {
      transferError.value = 'Amount must be greater than 0'
      return
    }

    const tx = await txStore.transfer(
        selectedFromIban.value,
        selectedToIban.value,
        transferAmount.value,
        transferDescription.value
    )

    transferSuccess.value = `Transfer successful! Reference: ${tx.reference}`

    selectedFromIban.value = ''
    selectedToIban.value = ''
    transferAmount.value = 0
    transferDescription.value = ''

    await Promise.all([accountStore.fetchAllAccounts(), txStore.fetchAllTransactions()])
  } catch (e: any) {
    transferError.value = e.response?.data?.error ?? 'Transfer failed'
  } finally {
    transferLoading.value = false
  }
}

// Edit limits
function openEditLimits(account: Account) {
  editingAccount.value = account
  editValues.value = {
    dayLimit: account.dayLimit ?? 0,
    absoluteLimit: account.absoluteLimit ?? 0,
    transactionLimit: account.transactionLimit ?? 0
  }
  editError.value = null
  editSuccess.value = null
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  editingAccount.value = null
  editError.value = null
  editSuccess.value = null
}

async function saveEditLimits() {
  if (!editingAccount.value) return
  editLoading.value = true
  editError.value = null
  editSuccess.value = null

  const payload = {
    dayLimit: Number(editValues.value.dayLimit),
    absoluteLimit: Number(editValues.value.absoluteLimit),
    transactionLimit: Number(editValues.value.transactionLimit)
  }

  try {
    await accountStore.updateAccount(editingAccount.value.iban, payload)
    editSuccess.value = 'Limits updated successfully'
    await Promise.all([accountStore.fetchAllAccounts(), txStore.fetchAllTransactions()])
  } catch (e: any) {
    editError.value = e.response?.data?.error ?? 'Failed to update limits'
  } finally {
    editLoading.value = false
  }
}

async function handleCloseAccount(iban: string) {
  if (!confirm('Are you sure you want to close this account?')) return
  try {
    await accountStore.closeAccount(iban)
    await accountStore.fetchAllAccounts()
  } catch (e: any) {
    alert(e.response?.data?.error ?? 'Failed to close account')
  }
}
</script>