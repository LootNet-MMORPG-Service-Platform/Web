<script setup lang="ts">
// Import the component you just made
import MarketplacePanel from './components/MarketplacePanel.vue';
</script>

<template>
  <div class="app-wrapper">
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