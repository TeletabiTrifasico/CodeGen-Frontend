<template>
  <div class="container mt-4" style="max-width: 600px;">
    <h2 class="mb-4">ATM</h2>

    <div v-if="result" class="alert" :class="resultSuccess ? 'alert-success' : 'alert-danger'">
      {{ result }}
    </div>

    <div class="card shadow-sm mb-4">
      <div class="card-header"><strong>Select Account</strong></div>
      <div class="card-body">
        <div v-if="accountStore.loading" class="text-center">
          <div class="spinner-border spinner-border-sm"></div>
        </div>
        <select v-else v-model="selectedIban" class="form-select">
          <option value="">-- Select an account --</option>
          <option v-for="acc in accountStore.accounts" :key="acc.iban" :value="acc.iban">
            {{ acc.iban }} ({{ acc.accountType }}) — €{{ acc.balance.toFixed(2) }}
          </option>
        </select>
      </div>
    </div>

    <div class="row g-4">
      <div class="col-md-6">
        <div class="card shadow-sm">
          <div class="card-header bg-success text-white"><strong>Deposit</strong></div>
          <div class="card-body">
            <label class="form-label">Amount (€)</label>
            <input v-model.number="depositAmount" type="number" step="0.01" min="0.01" class="form-control mb-3" />
            <button class="btn btn-success w-100" :disabled="loading || !selectedIban" @click="handleDeposit">
              <span v-if="loading && lastAction === 'deposit'" class="spinner-border spinner-border-sm me-1"></span>
              Deposit
            </button>
          </div>
        </div>
      </div>

      <div class="col-md-6">
        <div class="card shadow-sm">
          <div class="card-header bg-warning text-dark"><strong>Withdraw</strong></div>
          <div class="card-body">
            <label class="form-label">Amount (€)</label>
            <input v-model.number="withdrawAmount" type="number" step="0.01" min="0.01" class="form-control mb-3" />
            <button class="btn btn-warning w-100" :disabled="loading || !selectedIban" @click="handleWithdraw">
              <span v-if="loading && lastAction === 'withdraw'" class="spinner-border spinner-border-sm me-1"></span>
              Withdraw
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAccountStore } from '@/stores/account.store'
import api from '@/services/api'

const accountStore = useAccountStore()

const selectedIban = ref('')
const depositAmount = ref<number>(0)
const withdrawAmount = ref<number>(0)
const loading = ref(false)
const lastAction = ref('')
const result = ref<string | null>(null)
const resultSuccess = ref(false)

onMounted(() => accountStore.fetchMyAccounts())

async function handleDeposit() {
  loading.value = true
  lastAction.value = 'deposit'
  result.value = null
  try {
    const { data } = await api.post('/api/atm/deposit', {
      iban: selectedIban.value,
      amount: depositAmount.value,
      description: 'ATM Deposit'
    })
    result.value = `Deposit successful! Ref: ${data.reference} — New balance: €${data.newBalance.toFixed(2)}`
    resultSuccess.value = true
    depositAmount.value = 0
    await accountStore.fetchMyAccounts()
  } catch (e: any) {
    result.value = e.response?.data?.error ?? 'Deposit failed'
    resultSuccess.value = false
  } finally {
    loading.value = false
  }
}

async function handleWithdraw() {
  loading.value = true
  lastAction.value = 'withdraw'
  result.value = null
  try {
    const { data } = await api.post('/api/atm/withdraw', {
      iban: selectedIban.value,
      amount: withdrawAmount.value,
      description: 'ATM Withdrawal'
    })
    result.value = `Withdrawal successful! Ref: ${data.reference} — New balance: €${data.newBalance.toFixed(2)}`
    resultSuccess.value = true
    withdrawAmount.value = 0
    await accountStore.fetchMyAccounts()
  } catch (e: any) {
    result.value = e.response?.data?.error ?? 'Withdrawal failed'
    resultSuccess.value = false
  } finally {
    loading.value = false
  }
}
</script>
