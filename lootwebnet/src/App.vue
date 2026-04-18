<script setup lang="ts">
import { ref, onMounted } from 'vue';
import MarketplacePanel from './components/MarketplacePanel.vue';
import Navbar from "./components/Navbar.vue";
import Login from './components/login.vue';

const isLoggedIn = ref(false);

onMounted(() => {
  const token = localStorage.getItem('token');
  if (token) {
    isLoggedIn.value = true;
  }
});
</script>

<template>
  <Login v-if="!isLoggedIn" @login-success="isLoggedIn = true" />

  <div v-else class="app-wrapper">
    <Navbar />
    <MarketplacePanel />
  </div>
</template>

<style>
body {
  margin: 0;
  padding: 0;
  background-color: #09090b; /* zinc-950 to match your app */
}

.app-wrapper {
  padding: 2rem;
}
</style>