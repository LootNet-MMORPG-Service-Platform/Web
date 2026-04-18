<script setup lang="ts">
import { ref, onMounted } from 'vue';

// Import your components
import MarketplacePanel from './components/MarketplacePanel.vue';
import Navbar from "@/components/Navbar.vue";
import Login from './components/login.vue'; // <-- Import the new Login component

// Create a state to track if the user is logged in
const isLoggedIn = ref(false);

// Check for the token when the app first loads
onMounted(() => {
  const token = localStorage.getItem('token');
  if (token) {
    isLoggedIn.value = true;
  }
});
</script>

<template>
  <Login v-if="!isLoggedIn" />

  <div v-else class="app-wrapper">
    <Navbar />
    <MarketplacePanel />
  </div>
</template>

<style>
/* Optional: Basic reset to make it look nice fullscreen */
body {
  margin: 0;
  padding: 0;
  background-color: #121212; /* Dark theme background */
}

.app-wrapper {
  padding: 2rem;
}
</style>