import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guestOnly: true }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { guestOnly: true }
    },
    {
      path: '/welcome',
      name: 'welcome',
      component: () => import('@/views/WelcomeView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true, requiresApproval: true, requiresCustomer: true }
    },
    {
      path: '/atm',
      name: 'atm',
      component: () => import('@/views/AtmView.vue'),
      meta: { requiresAuth: true, requiresApproval: true, requiresCustomer: true }
    },
    {
      path: '/employee',
      name: 'employee',
      component: () => import('@/views/EmployeePanelView.vue'),
      meta: { requiresAuth: true, requiresEmployee: true }
    }
  ]
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    return next('/login')
  }
  if (to.meta.guestOnly && authStore.isLoggedIn) {
    return next(authStore.isEmployee ? '/employee' : authStore.isApproved ? '/dashboard' : '/welcome')
  }
  if (to.meta.requiresEmployee && !authStore.isEmployee) {
    return next('/')
  }
  if (to.meta.requiresCustomer && !authStore.isCustomer) {
    return next('/employee')
  }
  if (to.meta.requiresApproval && authStore.isCustomer && !authStore.isApproved) {
    return next('/welcome')
  }

  next()
})

export default router
