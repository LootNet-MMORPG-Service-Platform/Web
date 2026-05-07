<template>
  <div class="min-h-screen w-full flex items-center justify-center bg-zinc-950 p-4 text-gray-200">
    <div class="w-full max-w-xl p-8 bg-zinc-900 rounded-lg border border-zinc-800 shadow-2xl">
      <h1 class="text-3xl font-bold text-red-300 mb-3">Server Error</h1>
      <p class="text-zinc-300 mb-6">
        The backend is unavailable or returned a critical error. Please try again in a moment.
      </p>

      <div class="flex">
        <RouterLink
          to="/login"
          class="px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded border border-blue-600 text-white transition-colors text-center"
        >
          Go to Login
        </RouterLink>
      </div>
    </div>
  </div>
</template>
