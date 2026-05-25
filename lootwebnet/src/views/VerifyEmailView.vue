<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { api } from '../services/api'

const route = useRoute()
const isLoading = ref(true)
const message = ref('')
const errorMessage = ref('')

onMounted(async () => {
  const token = String(route.query.token ?? '')

  if (!token) {
    errorMessage.value = 'Verification token is missing.'
    isLoading.value = false
    return
  }

  try {
    await api.get<string>(`/auth/verify-email?token=${encodeURIComponent(token)}`)
    message.value = 'Email verified. You can log in now.'
  } catch (error: any) {
    errorMessage.value = typeof error?.message === 'string' ? error.message : 'Email verification failed.'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-zinc-950 p-4 font-sans">
    <div class="w-full max-w-md p-8 bg-zinc-900 rounded-lg shadow-2xl border border-zinc-800 text-center">
      <h1 class="text-3xl font-bold text-white mb-4">Email Verification</h1>
      <p v-if="isLoading" class="text-zinc-300">Verifying...</p>
      <p v-else-if="message" class="p-3 bg-green-900/50 border border-green-500 text-green-200 rounded text-sm font-semibold">{{ message }}</p>
      <p v-else class="p-3 bg-red-900/50 border border-red-500 text-red-200 rounded text-sm">{{ errorMessage }}</p>
      <RouterLink to="/login" class="inline-flex mt-6 px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded transition-colors">
        Back to login
      </RouterLink>
    </div>
  </div>
</template>
