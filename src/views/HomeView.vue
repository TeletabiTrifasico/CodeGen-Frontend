<template>
  <div class="container mt-5 text-center">
    <h1 class="display-4 mb-3">Welcome to BankApp</h1>
    <p class="lead text-muted mb-4">
      Your trusted online banking platform. Manage your accounts, make transfers, and more.
    </p>
    <div class="d-flex justify-content-center gap-3">
      <RouterLink to="/login" class="btn btn-primary btn-lg">Login</RouterLink>
      <RouterLink to="/register" class="btn btn-outline-primary btn-lg">Open an Account</RouterLink>
    </div>
  </div>
</template>
