<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { api } from '../services/api'

const route = useRoute()
const token = computed(() => String(route.query.token ?? ''))
const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const handleReset = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (!token.value) {
    errorMessage.value = 'Password reset token is missing.'
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  isLoading.value = true

  try {
    await api.post<string>('/auth/reset-password-email', {
      token: token.value,
      newPassword: password.value
    })
    successMessage.value = 'Password changed. You can log in now.'
    password.value = ''
    confirmPassword.value = ''
  } catch (error: any) {
    errorMessage.value = typeof error?.message === 'string' ? error.message : 'Password reset failed.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-zinc-950 p-4 font-sans">
    <div class="w-full max-w-md p-8 bg-zinc-900 rounded-lg shadow-2xl border border-zinc-800">
      <h1 class="text-3xl font-bold text-white mb-6 text-center">Set New Password</h1>

      <div v-if="errorMessage" class="mb-4 p-3 bg-red-900/50 border border-red-500 text-red-200 rounded text-sm text-center">
        {{ errorMessage }}
      </div>

      <div v-if="successMessage" class="mb-4 p-3 bg-green-900/50 border border-green-500 text-green-200 rounded text-sm text-center font-semibold">
        {{ successMessage }}
      </div>

      <form @submit.prevent="handleReset" class="flex flex-col gap-4">
        <div>
          <label class="block text-gray-400 mb-1 font-semibold" for="new-password">New password</label>
          <input id="new-password" v-model="password" type="password" required maxlength="128" :disabled="isLoading || !!successMessage" class="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded focus:outline-none focus:border-green-500 transition-colors disabled:opacity-50" placeholder="Enter new password" />
        </div>

        <div>
          <label class="block text-gray-400 mb-1 font-semibold" for="confirm-new-password">Confirm password</label>
          <input id="confirm-new-password" v-model="confirmPassword" type="password" required maxlength="128" :disabled="isLoading || !!successMessage" class="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded focus:outline-none focus:border-green-500 transition-colors disabled:opacity-50" placeholder="Repeat password" />
        </div>

        <button type="submit" :disabled="isLoading || !!successMessage" class="mt-4 w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded transition-colors disabled:opacity-50">
          {{ isLoading ? 'Saving...' : 'Change Password' }}
        </button>
      </form>

      <div class="mt-6 text-center">
        <RouterLink to="/login" class="text-sm text-zinc-300 hover:text-white underline">
          Back to login
        </RouterLink>
      </div>
    </div>
  </div>
</template>
