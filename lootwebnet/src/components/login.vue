<template>
  <div class="min-h-screen flex items-center justify-center bg-zinc-950 p-4 font-sans">
    <div class="w-full max-w-md p-8 bg-zinc-900 rounded-lg shadow-2xl border border-zinc-800">
      <h2 class="text-3xl font-bold text-white mb-6 text-center">Login to Lootnet</h2>

      <div v-if="errorMessage" class="mb-4 p-3 bg-red-900/50 border border-red-500 text-red-200 rounded">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleLogin" class="flex flex-col gap-4">
        <div>
          <label class="block text-gray-400 mb-1 font-semibold" for="username">Username</label>
          <input
              id="username"
              v-model="loginForm.username"
              type="text"
              required
              class="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded focus:outline-none focus:border-green-500 transition-colors"
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
              class="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded focus:outline-none focus:border-green-500 transition-colors"
              placeholder="••••••••"
          />
        </div>

        <button
            type="submit"
            :disabled="isLoading"
            class="mt-4 w-full py-3 bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 text-white font-bold rounded transition-colors"
        >
          {{ isLoading ? 'Logging in...' : 'Login' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { api } from '../components/api'; // Adjust this path to where your api.ts file is

// Define the structure of the response we expect from AuthController.cs
interface AuthResponse {
  token: string;
  refreshToken: string;
}

const loginForm = ref({
  username: '',
  password: ''
});

const isLoading = ref(false);
const errorMessage = ref('');

const handleLogin = async () => {
  isLoading.value = true;
  errorMessage.value = ''; // Clear previous errors

  try {
    // 1. Send the login request to the AuthController backend
    const response = await api.post<AuthResponse>('/auth/login', {
      username: loginForm.value.username,
      password: loginForm.value.password
    });

    // 2. Save BOTH tokens to localStorage
    // The standard 'token' is used for normal API calls
    localStorage.setItem('token', response.token);
    // The 'refreshToken' is used to get a new token when the standard one expires
    localStorage.setItem('refreshToken', response.refreshToken);

    // 3. Success! You can redirect the user or reload the page to apply the token
    alert("Login successful!");

    // If you use Vue Router, use router.push('/dashboard')
    // Otherwise, forcing a reload will re-initialize the app and pick up the new token:
    window.location.reload();

  } catch (error: any) {
    // If the backend returns Unauthorized, show a friendly message
    errorMessage.value = "Invalid username or password. Please try again.";
    console.error("Login Error:", error);
  } finally {
    isLoading.value = false;
  }
};
</script>