<script setup lang="ts">
import { ref } from 'vue';
import { api } from '../services/api';

const emit = defineEmits(['login-success']);

interface AuthResponse {
  token?: string; 
  refreshToken?: string;
}

const loginForm = ref({
  username: '',
  password: ''
});

const isLoading = ref(false);
const errorMessage = ref(''); 
const successMessage = ref(''); 

const handleLogin = async () => {
  isLoading.value = true;

  
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const response = await api.post<AuthResponse>('/auth/login', {
      username: loginForm.value.username,
      password: loginForm.value.password
    });

    
    if (!response || !response.token) {
      
      throw new Error("No token received");
    }

    
    localStorage.setItem('token', response.token);
    localStorage.setItem('refreshToken', response.refreshToken!);

    successMessage.value = "Access granted. Entering Lootnet...";

    setTimeout(() => {
      emit('login-success'); 
    }, 800);

  } catch (error: any) {
    const status = Number(error?.status ?? 0);
    const rawMessage = typeof error?.message === 'string' ? error.message : '';

    if (status === 401) {
      errorMessage.value = "Invalid username or password. Please try again.";
    } else if (status === 403) {
      errorMessage.value = rawMessage || "Your account is blocked.";
    } else if (status >= 500) {
      errorMessage.value = "Server error. Please try again in a moment.";
    } else {
      errorMessage.value = rawMessage || "Login failed. Please try again.";
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-zinc-950 p-4 font-sans">
    <div class="w-full max-w-md p-8 bg-zinc-900 rounded-lg shadow-2xl border border-zinc-800 transition-all">
      <h2 class="text-3xl font-bold text-white mb-6 text-center">Login to Lootnet</h2>

      <div v-if="errorMessage" class="mb-4 p-3 bg-red-900/50 border border-red-500 text-red-200 rounded text-sm text-center animate-pulse">
        {{ errorMessage }}
      </div>

      <div v-if="successMessage" class="mb-4 p-3 bg-green-900/50 border border-green-500 text-green-200 rounded text-sm text-center font-semibold">
        {{ successMessage }}
      </div>

      <form @submit.prevent="handleLogin" class="flex flex-col gap-4">
        <div>
          <label class="block text-gray-400 mb-1 font-semibold" for="username">Username</label>
          <input
              id="username"
              v-model="loginForm.username"
              type="text"
              required
              :disabled="isLoading || !!successMessage"
              class="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded focus:outline-none focus:border-green-500 transition-colors disabled:opacity-50"
              placeholder="Enter your username"
          />
        </div>

        <div>
          <label class="block text-gray-400 mb-1 font-semibold" for="password">Password</label>
          <input
              id="password"
              v-model="loginForm.password"
              type="password"
              required
              :disabled="isLoading || !!successMessage"
              class="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded focus:outline-none focus:border-green-500 transition-colors disabled:opacity-50"
              placeholder="Enter your password"
          />
        </div>

        <button
            type="submit"
            :disabled="isLoading || !!successMessage"
            class="mt-4 w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded transition-colors disabled:opacity-50 flex justify-center items-center"
        >
          <span v-if="isLoading && !successMessage">Authenticating...</span>
          <span v-else-if="successMessage">Redirecting...</span>
          <span v-else>Enter Realm</span>
        </button>
      </form>
    </div>
  </div>
</template>


