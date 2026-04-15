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
        <button class="nav-link" :class="{ active: tab === 'users' }" @click="tab = 'users'">All Users</button>
      </li>
      <li class="nav-item">
        <button class="nav-link" :class="{ active: tab === 'transactions' }" @click="loadAllTransactions">
          All Transactions
        </button>
      </li>
    </ul>

    <!-- Pending Approvals -->
    <div v-if="tab === 'pending'">
      <div v-if="userStore.loading" class="text-center"><div class="spinner-border text-primary"></div></div>
      <div v-else-if="userStore.pendingUsers.length === 0" class="alert alert-info">No pending approvals.</div>
      <div v-else class="row g-3">
        <div v-for="user in userStore.pendingUsers" :key="user.id" class="col-md-6">
          <div class="card shadow-sm">
            <div class="card-body">
              <h5 class="card-title">{{ user.firstName }} {{ user.lastName }}</h5>
              <p class="text-muted mb-1">@{{ user.username }} · {{ user.email }}</p>
              <p class="mb-1"><strong>BSN:</strong> {{ user.bsn }}</p>
              <p class="mb-1"><strong>DOB:</strong> {{ user.dateOfBirth }}</p>
              <p class="mb-3"><strong>Phone:</strong> {{ user.phoneNumber }}</p>
              <div v-if="approveError[user.id]" class="alert alert-danger py-1 small">{{ approveError[user.id] }}</div>
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
      <div v-if="userStore.loading" class="text-center"><div class="spinner-border text-primary"></div></div>
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
            <td><span class="badge" :class="user.role === 'EMPLOYEE' ? 'bg-dark' : 'bg-primary'">{{ user.role }}</span></td>
            <td>
              <span v-if="user.role === 'CUSTOMER'" class="badge"
                    :class="user.approved ? 'bg-success' : 'bg-warning text-dark'">
                {{ user.approved ? 'Approved' : 'Pending' }}
              </span>
              <span v-else class="badge bg-secondary">N/A</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- All Transactions -->
    <div v-if="tab === 'transactions'">
      <div v-if="txStore.loading" class="text-center"><div class="spinner-border text-primary"></div></div>
      <div v-else-if="txStore.transactions.length === 0" class="alert alert-info">No transactions.</div>
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
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user.store'
import { useTransactionStore } from '@/stores/transaction.store'

const userStore = useUserStore()
const txStore = useTransactionStore()

const tab = ref('pending')
const approveLoading = ref<Record<number, boolean>>({})
const approveError = ref<Record<number, string>>({})

onMounted(async () => {
  await Promise.all([userStore.fetchPendingUsers(), userStore.fetchAllUsers()])
})

async function handleApprove(userId: number) {
  approveLoading.value[userId] = true
  approveError.value[userId] = ''
  try {
    await userStore.approveUser(userId)
  } catch (e: any) {
    approveError.value[userId] = e.response?.data?.error ?? 'Approval failed'
  } finally {
    approveLoading.value[userId] = false
  }
}

async function loadAllTransactions() {
  tab.value = 'transactions'
  await txStore.fetchAllTransactions()
}
</script>
