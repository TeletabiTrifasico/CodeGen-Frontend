<template>
  <div class="container mt-5" style="max-width: 450px;">
    <div class="card shadow-sm">
      <div class="card-body p-4">
        <h3 class="card-title mb-4 text-center">Login</h3>

        <div v-if="error" class="alert alert-danger">{{ error }}</div>

        <form @submit.prevent="handleLogin">
          <div class="mb-3">
            <label class="form-label">Username</label>
            <input v-model="form.username" type="text" class="form-control" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Password</label>
            <input v-model="form.password" type="password" class="form-control" required />
          </div>
          <button type="submit" class="btn btn-primary w-100" :disabled="loading">
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            Login
          </button>
        </form>

        <p class="text-center mt-3 mb-0">
          No account? <RouterLink to="/register">Register here</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const authStore = useAuthStore()
const router = useRouter()

const form = ref({ username: '', password: '' })
const loading = ref(false)
const error = ref<string | null>(null)

async function handleLogin() {
  loading.value = true
  error.value = null
  try {
    await authStore.login(form.value.username, form.value.password)
    if (authStore.isEmployee) {
      router.push('/employee')
    } else if (authStore.isApproved) {
      router.push('/dashboard')
    } else {
      router.push('/welcome')
    }
  } catch (e: any) {
    error.value = e.response?.data?.error ?? 'Login failed. Please check your credentials.'
  } finally {
    loading.value = false
  }
}
</script>
