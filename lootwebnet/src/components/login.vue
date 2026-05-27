<script setup lang="ts">
import { computed, ref } from 'vue'
import { api } from '../services/api'

const emit = defineEmits(['login-success'])

interface AuthResponse {
  token?: string
  refreshToken?: string
}

type AuthMode = 'login' | 'register' | 'forgot'

const mode = ref<AuthMode>('login')
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const loginForm = ref({
  email: '',
  password: ''
})

const registerForm = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const forgotEmail = ref('')

const title = computed(() => {
  if (mode.value === 'register') return 'Create Lootnet Account'
  if (mode.value === 'forgot') return 'Reset Password'
  return 'Login to Lootnet'
})

const switchMode = (next: AuthMode) => {
  mode.value = next
  errorMessage.value = ''
  successMessage.value = ''
}

const extractMessage = (error: unknown) => {
  const raw = error as { message?: string }
  return typeof raw?.message === 'string' ? raw.message : ''
}

const handleLogin = async () => {
  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await api.post<AuthResponse>('/auth/login', {
      email: loginForm.value.email,
      password: loginForm.value.password
    })

    if (!response?.token) {
      throw new Error('No token received')
    }

    localStorage.setItem('token', response.token)
    localStorage.setItem('refreshToken', response.refreshToken!)

    successMessage.value = 'Access granted. Entering Lootnet...'

    setTimeout(() => {
      emit('login-success')
    }, 800)
  } catch (error: any) {
    const status = Number(error?.status ?? 0)
    const rawMessage = extractMessage(error)

    if (status === 401) {
      errorMessage.value = 'Invalid username or password. Please try again.'
    } else if (status === 403) {
      errorMessage.value = rawMessage || 'Your account is blocked or email is not verified.'
    } else if (status >= 500) {
      errorMessage.value = 'Server error. Please try again in a moment.'
    } else {
      errorMessage.value = rawMessage || 'Login failed. Please try again.'
    }
  } finally {
    isLoading.value = false
  }
}

const handleRegister = async () => {
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await api.post<string>('/auth/register', {
      username: registerForm.value.username,
      email: registerForm.value.email,
      password: registerForm.value.password,
      verificationClient: 0
    })

    successMessage.value = 'Account created. Check your email to verify it before logging in.'
    registerForm.value = { username: '', email: '', password: '', confirmPassword: '' }
    mode.value = 'login'
  } catch (error) {
    errorMessage.value = extractMessage(error) || 'Registration failed. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const handleForgotPassword = async () => {
  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await api.post<string>('/auth/forgot-password', {
      email: forgotEmail.value
    })

    successMessage.value = 'If the email exists, a password reset link has been sent.'
  } catch (error) {
    errorMessage.value = extractMessage(error) || 'Could not request password reset.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-zinc-950 p-4 font-sans">
    <div class="w-full max-w-md p-8 bg-zinc-900 rounded-lg shadow-2xl border border-zinc-800 transition-all">
      <h2 class="text-3xl font-bold text-white mb-6 text-center">{{ title }}</h2>

      <div class="grid grid-cols-3 mb-6 rounded bg-zinc-800 p-1 text-sm font-semibold">
        <button type="button" class="py-2 rounded transition-colors" :class="mode === 'login' ? 'bg-green-600 text-white' : 'text-zinc-300 hover:text-white'" @click="switchMode('login')">Login</button>
        <button type="button" class="py-2 rounded transition-colors" :class="mode === 'register' ? 'bg-green-600 text-white' : 'text-zinc-300 hover:text-white'" @click="switchMode('register')">Register</button>
        <button type="button" class="py-2 rounded transition-colors" :class="mode === 'forgot' ? 'bg-green-600 text-white' : 'text-zinc-300 hover:text-white'" @click="switchMode('forgot')">Reset</button>
      </div>

      <div v-if="errorMessage" class="mb-4 p-3 bg-red-900/50 border border-red-500 text-red-200 rounded text-sm text-center">
        {{ errorMessage }}
      </div>

      <div v-if="successMessage" class="mb-4 p-3 bg-green-900/50 border border-green-500 text-green-200 rounded text-sm text-center font-semibold">
        {{ successMessage }}
      </div>

      <form v-if="mode === 'login'" @submit.prevent="handleLogin" class="flex flex-col gap-4">
        <div>
          <label class="block text-gray-400 mb-1 font-semibold" for="email">Email</label>
          <input id="email" v-model="loginForm.email" type="email" required maxlength="256" :disabled="isLoading || !!successMessage" class="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded focus:outline-none focus:border-green-500 transition-colors disabled:opacity-50" placeholder="you@example.com" />
        </div>

        <div>
          <label class="block text-gray-400 mb-1 font-semibold" for="password">Password</label>
          <input id="password" v-model="loginForm.password" type="password" required :disabled="isLoading || !!successMessage" class="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded focus:outline-none focus:border-green-500 transition-colors disabled:opacity-50" placeholder="Enter your password" />
        </div>

        <button type="submit" :disabled="isLoading || !!successMessage" class="mt-4 w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded transition-colors disabled:opacity-50 flex justify-center items-center">
          <span v-if="isLoading && !successMessage">Authenticating...</span>
          <span v-else-if="successMessage">Redirecting...</span>
          <span v-else>Enter Realm</span>
        </button>
      </form>

      <form v-else-if="mode === 'register'" @submit.prevent="handleRegister" class="flex flex-col gap-4">
        <div>
          <label class="block text-gray-400 mb-1 font-semibold" for="register-username">Username</label>
          <input id="register-username" v-model="registerForm.username" type="text" required minlength="3" maxlength="32" :disabled="isLoading" class="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded focus:outline-none focus:border-green-500 transition-colors disabled:opacity-50" placeholder="Choose username" />
        </div>

        <div>
          <label class="block text-gray-400 mb-1 font-semibold" for="register-email">Email</label>
          <input id="register-email" v-model="registerForm.email" type="email" required maxlength="256" :disabled="isLoading" class="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded focus:outline-none focus:border-green-500 transition-colors disabled:opacity-50" placeholder="you@example.com" />
        </div>

        <div>
          <label class="block text-gray-400 mb-1 font-semibold" for="register-password">Password</label>
          <input id="register-password" v-model="registerForm.password" type="password" required maxlength="128" :disabled="isLoading" class="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded focus:outline-none focus:border-green-500 transition-colors disabled:opacity-50" placeholder="Enter password" />
        </div>

        <div>
          <label class="block text-gray-400 mb-1 font-semibold" for="confirm-password">Confirm password</label>
          <input id="confirm-password" v-model="registerForm.confirmPassword" type="password" required maxlength="128" :disabled="isLoading" class="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded focus:outline-none focus:border-green-500 transition-colors disabled:opacity-50" placeholder="Repeat password" />
        </div>

        <button type="submit" :disabled="isLoading" class="mt-4 w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded transition-colors disabled:opacity-50">
          {{ isLoading ? 'Creating...' : 'Create Account' }}
        </button>
      </form>

      <form v-else @submit.prevent="handleForgotPassword" class="flex flex-col gap-4">
        <div>
          <label class="block text-gray-400 mb-1 font-semibold" for="forgot-email">Email</label>
          <input id="forgot-email" v-model="forgotEmail" type="email" required maxlength="256" :disabled="isLoading" class="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded focus:outline-none focus:border-green-500 transition-colors disabled:opacity-50" placeholder="you@example.com" />
        </div>

        <button type="submit" :disabled="isLoading" class="mt-4 w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded transition-colors disabled:opacity-50">
          {{ isLoading ? 'Sending...' : 'Send Reset Link' }}
        </button>

      </form>
    </div>
  </div>
</template>
