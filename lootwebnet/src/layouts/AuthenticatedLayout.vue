<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { RouterView } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import { onRealtimeEvent, startRealtime, stopRealtime } from '../services/realtimeService'
import { fetchPlayerData } from '../store'
import { navigateToLogin } from '../router/navigation'

let offRealtime: (() => void) | null = null

const currentUserId = () => {
  try {
    const payload = localStorage.getItem('token')?.split('.')?.[1]
    if (!payload)
      return ''

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const parsed = JSON.parse(atob(normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), '=')))
    return String(parsed?.sub || parsed?.nameid || parsed?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || '').toLowerCase()
  } catch {
    return ''
  }
}

const isCurrentUserEvent = (payload: any) => {
  const userId = currentUserId()
  const ids = [
    payload?.userId,
    payload?.data?.userId,
    payload?.data?.buyerId,
    payload?.data?.sellerId
  ]

  return ids.some(id => String(id || '').toLowerCase() === userId)
}

const forceLogout = (message?: string) => {
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  void stopRealtime()
  if (message)
    window.alert(message)
  navigateToLogin()
}

onMounted(() => {
  void startRealtime()
  offRealtime = onRealtimeEvent((payload: any) => {
    if (payload?.domain === 'admin.user' && payload?.action === 'blocked' && isCurrentUserEvent(payload)) {
      forceLogout('Your account has been blocked. You have been signed out.')
      return
    }

    if (
      isCurrentUserEvent(payload)
      && (payload?.domain === 'reward'
        || payload?.domain === 'market'
        || payload?.domain === 'inventory'
        || payload?.domain === 'profile')
    ) {
      void fetchPlayerData()
    }
  })
})

onUnmounted(() => {
  offRealtime?.()
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
