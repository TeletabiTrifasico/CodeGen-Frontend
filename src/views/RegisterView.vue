<template>
  <div class="container mt-5" style="max-width: 600px;">
    <div class="card shadow-sm">
      <div class="card-body p-4">
        <h3 class="card-title mb-4 text-center">Open a Bank Account</h3>

        <div v-if="error" class="alert alert-danger">{{ error }}</div>
        <div v-if="success" class="alert alert-success">
          Registration successful! An employee will review your application.
          <RouterLink to="/login"> Login here</RouterLink>.
        </div>

        <form v-if="!success" @submit.prevent="handleRegister">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">First Name</label>
              <input v-model="form.firstName" type="text" class="form-control" required />
            </div>
            <div class="col-md-6">
              <label class="form-label">Last Name</label>
              <input v-model="form.lastName" type="text" class="form-control" required />
            </div>
            <div class="col-12">
              <label class="form-label">Username</label>
              <input v-model="form.username" type="text" class="form-control" required minlength="3" />
            </div>
            <div class="col-12">
              <label class="form-label">Email</label>
              <input v-model="form.email" type="email" class="form-control" required />
            </div>
            <div class="col-12">
              <label class="form-label">Password</label>
              <input v-model="form.password" type="password" class="form-control" required minlength="8" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Phone Number</label>
              <input v-model="form.phoneNumber" type="tel" class="form-control" placeholder="+31612345678" required />
            </div>
            <div class="col-md-6">
              <label class="form-label">BSN (9 digits)</label>
              <input v-model="form.bsn" type="text" class="form-control" pattern="\d{9}" maxlength="9" required />
            </div>
            <div class="col-12">
              <label class="form-label">Date of Birth</label>
              <input v-model="form.dateOfBirth" type="date" class="form-control" required />
            </div>
          </div>
          <button type="submit" class="btn btn-primary w-100 mt-4" :disabled="loading">
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            Register
          </button>
        </form>

        <p class="text-center mt-3 mb-0" v-if="!success">
          Already have an account? <RouterLink to="/login">Login</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import api from '@/services/api'

const form = ref({
  username: '',
  password: '',
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  bsn: '',
  dateOfBirth: ''
})
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref(false)

async function handleRegister() {
  loading.value = true
  error.value = null
  try {
    await api.post('/api/auth/register', form.value)
    success.value = true
  } catch (e: any) {
    const data = e.response?.data
    if (data?.fieldErrors) {
      error.value = Object.values(data.fieldErrors).join(', ')
    } else {
      error.value = data?.error ?? 'Registration failed. Please try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>
