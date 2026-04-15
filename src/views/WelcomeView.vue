<template>
  <div class="container mt-5 text-center">
    <div class="card shadow-sm p-5" style="max-width: 600px; margin: 0 auto;">
      <div class="mb-4">
        <span style="font-size: 4rem;">⏳</span>
      </div>
      <h2>Application Pending</h2>
      <p class="text-muted mt-3">
        Hi <strong>{{ authStore.user?.firstName }}</strong>, your account is currently under review.
        An employee will approve your application soon. Once approved, you'll have full access to your
        accounts and banking features.
      </p>
      <hr />
      <p class="text-muted small">
        Need help? Contact support at <strong>support@bankapp.nl</strong>
      </p>
      <button class="btn btn-outline-secondary" @click="logout">Logout</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth.store'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

async function logout() {
  await authStore.logout()
  router.push('/login')
}
</script>
