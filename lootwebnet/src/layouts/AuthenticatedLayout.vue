<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { RouterView } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import { startRealtime, stopRealtime } from '../services/realtimeService'

onMounted(() => {
  void startRealtime()
})

onUnmounted(() => {
  void stopRealtime()
})
</script>

<template>
  <div class="app-wrapper">
    <Navbar />
    <RouterView />
  </div>
</template>

<style scoped>
.app-wrapper {
  padding: 0;
}
</style>
