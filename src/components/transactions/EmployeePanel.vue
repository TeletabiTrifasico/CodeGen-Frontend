<script setup lang="ts">
import { reactive, computed } from 'vue'
import { useTransactionStore } from '@/stores/transaction.store'

const txStore = useTransactionStore()

const filters = reactive({
  iban: '',
  startDate: '',
  endDate: '',
  amount: null as number | null,
  amountOperator: '<' as '<' | '>' | '=',
})

const filteredTransactions = computed(() => {
  return txStore.transactions.filter(tx => {
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
})

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

const pageRange = computed(() => {
  const total = txStore.totalPages
  const current = txStore.currentPage
  const delta = 2
  const start = Math.max(0, current - delta)
  const end = Math.min(total - 1, current + delta)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

function goToPage(page: number) {
  if (page < 0 || page >= txStore.totalPages) return
  txStore.fetchTransactions("", page)
}
</script>

<template>
  <div>
    <div v-if="txStore.loading" class="text-center py-4">
      <div class="spinner-border text-primary"></div>
    </div>

    <template v-else>
      <!-- Filter bar -->
      <div class="card mb-3 shadow-sm">
        <div class="card-body pb-2">
          <div class="row g-2 align-items-end">

            <!-- IBAN -->
            <div class="col-12 col-md-3">
              <label class="form-label small mb-1">IBAN</label>
              <input v-model="filters.iban" type="text" class="form-control form-control-sm" placeholder="NL91ABNA…" />
            </div>

            <!-- Date range -->
            <div class="col-6 col-md-2">
              <label class="form-label small mb-1">From</label>
              <input v-model="filters.startDate" type="date" class="form-control form-control-sm" />
            </div>
            <div class="col-6 col-md-2">
              <label class="form-label small mb-1">To</label>
              <input v-model="filters.endDate" type="date" class="form-control form-control-sm" />
            </div>

            <!-- Amount operator + value -->
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

            <!-- Clear -->
            <div class="col-12 col-md-2 d-flex align-items-end">
              <button class="btn btn-sm btn-outline-secondary w-100" :disabled="!hasActiveFilters"
                @click="clearFilters">
                ✕ Clear
              </button>
            </div>
          </div>

          <!-- Active filter badges -->
          <div v-if="hasActiveFilters" class="mt-2 d-flex flex-wrap gap-1">
            <span v-if="filters.iban" class="badge bg-primary">IBAN: {{ filters.iban }}</span>
            <span v-if="filters.startDate" class="badge bg-info text-dark">From: {{ filters.startDate
              }}</span>
            <span v-if="filters.endDate" class="badge bg-info text-dark">To: {{ filters.endDate }}</span>
            <span v-if="filters.amount != null" class="badge bg-success">Amount {{ filters.amountOperator }}
              €{{ filters.amount }}</span>
          </div>

        </div>
      </div>

      <!-- Empty state -->
      <div v-if="filteredTransactions.length === 0" class="alert alert-info">
        {{ hasActiveFilters ? 'No transactions match your filters.' : 'No transactions.' }}
      </div>

      <!-- Table -->
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
          <tr v-for="tx in filteredTransactions" :key="tx.id">
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

      <!-- Pagination -->
      <nav class="d-flex justify-content-between align-items-center mt-2">
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

    </template>
  </div>

</template>