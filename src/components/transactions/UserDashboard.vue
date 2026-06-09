<script setup lang="ts">
import { reactive, computed } from 'vue'
import { useTransactionStore } from '@/stores/transaction.store'
import { useAccountStore } from '@/stores/account.store'
import type { Transaction, TransactionType } from '@/models'

const txStore = useTransactionStore()
const accountStore = useAccountStore()

// Helpers
function txBadge(type: TransactionType) {
  return {
    'bg-primary bg-opacity-75': type === 'TRANSFER',
    'bg-success': type === 'ATM_DEPOSIT',
    'bg-warning text-dark': type === 'ATM_WITHDRAWAL',
  }
}

function txLabel(type: TransactionType) {
  return { TRANSFER: 'Transfer', ATM_DEPOSIT: 'Deposit', ATM_WITHDRAWAL: 'Withdrawal' }[type]
}

function txAmountClass(tx: Transaction) {
  if (tx.type === 'ATM_DEPOSIT') return 'text-success'
  if (tx.type === 'ATM_WITHDRAWAL') return 'text-danger'
  return tx.sourceIban && accountStore.accounts.some(a => a.iban === tx.sourceIban)
    ? 'text-danger'
    : 'text-success'
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleString('nl-NL')
}

// Filters
const filters = reactive({
  iban: '',
  startDate: '',
  endDate: '',
  amount: null as number | null,
  amountOperator: '<' as '<' | '>' | '=',
})

const filteredTransactions = computed(() =>
  txStore.transactions.filter(tx => {
    if (filters.iban) {
      const q = filters.iban.toLowerCase()
      if (
        !tx.sourceIban?.toLowerCase().includes(q) &&
        !tx.destinationIban?.toLowerCase().includes(q)
      ) return false
    }

    if (filters.startDate && new Date(tx.timestamp) < new Date(filters.startDate)) return false

    if (filters.endDate) {
      const end = new Date(filters.endDate)
      end.setHours(23, 59, 59, 999)
      if (new Date(tx.timestamp) > end) return false
    }

    if (filters.amount != null) {
      if (filters.amountOperator === '<' && tx.amount >= filters.amount) return false
      if (filters.amountOperator === '>' && tx.amount <= filters.amount) return false
      if (filters.amountOperator === '=' && tx.amount !== filters.amount) return false
    }

    return true
  })
)

const hasActiveFilters = computed(() =>
  filters.iban ||
  filters.startDate ||
  filters.endDate ||
  filters.amount != null
)

function clearFilters() {
  filters.iban = ''
  filters.startDate = ''
  filters.endDate = ''
  filters.amount = null
  filters.amountOperator = '<'
}

// Pagination
const pageRange = computed(() => {
  const total = txStore.totalPages
  const current = txStore.currentPage
  const start = Math.max(0, current - 2)
  const end = Math.min(total - 1, current + 2)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

function goToPage(page: number) {
  if (page < 0 || page >= txStore.totalPages) return
  txStore.fetchTransactions("", page)
}
</script>

<template>
  <div class="card border-0 shadow-sm">
    <div class="card-header bg-white border-bottom py-3">
      <h5 class="mb-0">Transaction History</h5>
    </div>

    <div class="card-body">

      <!-- Filter bar -->
      <div class="card mb-3 border shadow-sm">
        <div class="card-body pb-2">
          <div class="row g-2 align-items-end">

            <div class="col-12 col-md-3">
              <label class="form-label small mb-1">IBAN</label>
              <input v-model="filters.iban" type="text" class="form-control form-control-sm" placeholder="NL91ABNA…" />
            </div>

            <div class="col-6 col-md-2">
              <label class="form-label small mb-1">From</label>
              <input v-model="filters.startDate" type="date" class="form-control form-control-sm" />
            </div>

            <div class="col-6 col-md-2">
              <label class="form-label small mb-1">To</label>
              <input v-model="filters.endDate" type="date" class="form-control form-control-sm" />
            </div>

            <div class="col-12 col-md-3">
              <label class="form-label small mb-1">Amount</label>
              <div class="input-group input-group-sm">
                <select v-model="filters.amountOperator" class="form-select form-select-sm" style="max-width: 70px">
                  <option value="<">&lt;</option>
                  <option value=">">&gt;</option>
                  <option value="=">=</option>
                </select>
                <span class="input-group-text">€</span>
                <input v-model.number="filters.amount" type="number" min="0" step="0.01" class="form-control"
                  placeholder="0.00" />
              </div>
            </div>

            <div class="col-12 col-md-2 d-flex align-items-end">
              <button class="btn btn-sm btn-outline-secondary w-100" :disabled="!hasActiveFilters"
                @click="clearFilters">
                ✕ Clear
              </button>
            </div>

          </div>

          <!-- Active badges -->
          <div v-if="hasActiveFilters" class="mt-2 d-flex flex-wrap gap-1">
            <span v-if="filters.iban" class="badge bg-primary">IBAN: {{ filters.iban }}</span>
            <span v-if="filters.startDate" class="badge bg-info text-dark">From: {{ filters.startDate }}</span>
            <span v-if="filters.endDate" class="badge bg-info text-dark">To: {{ filters.endDate }}</span>
            <span v-if="filters.amount != null" class="badge bg-success">
              Amount {{ filters.amountOperator }} €{{ filters.amount }}
            </span>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="txStore.loading" class="text-center p-4">
        <div class="spinner-border text-primary"></div>
      </div>

      <!-- Empty -->
      <div v-else-if="filteredTransactions.length === 0" class="text-center p-4 text-muted">
        {{ hasActiveFilters ? 'No transactions match your filters.' : 'No transactions yet.' }}
      </div>

      <!-- Table -->
      <div v-else class="table-responsive">
        <table class="table table-hover align-middle mb-0">
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
            <tr v-for="tx in filteredTransactions" :key="tx.id">
              <td><code class="text-muted small">{{ tx.reference }}</code></td>
              <td><span class="badge" :class="txBadge(tx.type)">{{ txLabel(tx.type) }}</span></td>
              <td class="text-muted small">{{ tx.sourceIban ?? '—' }}</td>
              <td class="text-muted small">{{ tx.destinationIban ?? '—' }}</td>
              <td class="text-end fw-semibold" :class="txAmountClass(tx)">
                {{ txAmountClass(tx).includes('danger') ? '−' : '+' }} €{{ tx.amount.toFixed(2) }}
              </td>
              <td class="text-muted small">{{ formatDate(tx.timestamp) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <nav v-if="!txStore.loading && filteredTransactions.length > 0"
        class="d-flex justify-content-between align-items-center mt-3">
        <small class="text-muted">
          Page {{ txStore.currentPage + 1 }} of {{ txStore.totalPages }}
          &mdash; {{ filteredTransactions.length }} shown
        </small>
        <ul class="pagination pagination-sm mb-0">
          <li class="page-item" :class="{ disabled: txStore.currentPage === 0 }">
            <button class="page-link" @click="goToPage(txStore.currentPage - 1)">&laquo;</button>
          </li>
          <li v-for="p in pageRange" :key="p" class="page-item" :class="{ active: p === txStore.currentPage }">
            <button class="page-link" @click="goToPage(p)">{{ p + 1 }}</button>
          </li>
          <li class="page-item" :class="{ disabled: txStore.currentPage >= txStore.totalPages - 1 }">
            <button class="page-link" @click="goToPage(txStore.currentPage + 1)">&raquo;</button>
          </li>
        </ul>
      </nav>

    </div>
  </div>
</template>