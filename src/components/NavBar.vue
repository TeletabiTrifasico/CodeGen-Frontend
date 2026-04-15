<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
    <div class="container">
      <RouterLink class="navbar-brand fw-bold" to="/">🏦 BankApp</RouterLink>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ms-auto align-items-center">
          <template v-if="!authStore.isLoggedIn">
            <li class="nav-item"><RouterLink class="nav-link" to="/login">Login</RouterLink></li>
            <li class="nav-item"><RouterLink class="nav-link" to="/register">Register</RouterLink></li>
          </template>
          <template v-else>
            <template v-if="authStore.isCustomer && authStore.isApproved">
              <li class="nav-item"><RouterLink class="nav-link" to="/dashboard">Dashboard</RouterLink></li>
              <li class="nav-item"><RouterLink class="nav-link" to="/atm">ATM</RouterLink></li>
            </template>
            <li v-if="authStore.isEmployee" class="nav-item">
              <RouterLink class="nav-link" to="/employee">Employee Panel</RouterLink>
            </li>
            <li class="nav-item ms-2">
              <span class="navbar-text me-3 text-white-50">{{ authStore.user?.username }}</span>
              <button class="btn btn-outline-light btn-sm" @click="handleLogout">Logout</button>
            </li>
          </template>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth.store'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>
