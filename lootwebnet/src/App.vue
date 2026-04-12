<script setup lang="ts">
// Import the component you just made
import MarketplacePanel from './components/MarketplacePanel.vue';
import Navbar from "@/components/Navbar.vue";
</script>

<template>
  <div class="app-wrapper">
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