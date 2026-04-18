<script setup lang="ts">
import { ref } from 'vue';
import { userBalance } from '../store';
import { api } from './api'; // Adjust this path to where your api.ts is actually located

const isMobileMenuOpen = ref(false);

const toggleMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const closeMenu = () => {
  isMobileMenuOpen.value = false;
};

const handleLogout = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      // Tell the C# backend to revoke the refresh token in the database
      await api.post('/auth/logout', refreshToken);
    }
  } catch (e) {
    console.error("Logout error", e);
  } finally {
    // Purge local storage and reload the app to trigger the <Login /> component
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    window.location.reload();
  }
};
</script>

<template>
  <nav class="bg-zinc-900 border-b-2 border-zinc-800 text-gray-200 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 h-[70px] flex justify-between items-center">

      <div class="flex items-center gap-2 text-2xl font-bold text-white cursor-pointer">
        <span>⚔️</span>
        <span>Lootnet</span>
      </div>

      <div class="hidden md:flex items-center gap-6">
        <a href="#market" class="text-green-500 font-semibold transition-colors">Market</a>
        <a href="#dashboard" class="text-gray-400 hover:text-green-500 font-semibold transition-colors">Player Dashboard</a>

        <div class="flex items-center gap-4 ml-5 pl-5 border-l border-zinc-700">
          <span class="text-yellow-400 font-bold transition-all duration-300">🪙 {{ userBalance.toLocaleString() }}</span>
          <div class="w-9 h-9 bg-zinc-700 rounded-full border-2 border-zinc-500 cursor-pointer hover:border-gray-300 transition-colors"></div>

          <button @click="handleLogout" class="text-sm text-red-400 hover:text-red-300 font-semibold ml-2 transition-colors">
            Logout
          </button>
        </div>
      </div>

      <button
          class="md:hidden flex flex-col justify-around w-7 h-6 bg-transparent border-none cursor-pointer z-10"
          @click="toggleMenu"
          aria-label="Toggle menu"
      >
        <span class="w-full h-[3px] bg-gray-200 rounded transition-all duration-300 origin-[1px]" :class="{ 'rotate-45': isMobileMenuOpen }"></span>
        <span class="w-full h-[3px] bg-gray-200 rounded transition-all duration-300" :class="{ 'opacity-0 translate-x-5': isMobileMenuOpen }"></span>
        <span class="w-full h-[3px] bg-gray-200 rounded transition-all duration-300 origin-[1px]" :class="{ '-rotate-45': isMobileMenuOpen }"></span>
      </button>
    </div>

    <div
        class="md:hidden flex flex-col bg-zinc-800 overflow-hidden transition-all duration-300 ease-in-out"
        :class="isMobileMenuOpen ? 'max-h-64 border-b border-zinc-700' : 'max-h-0'"
    >
      <a href="#market" class="px-5 py-4 text-gray-200 font-semibold border-b border-zinc-700 hover:bg-zinc-700 hover:text-green-500" @click="closeMenu">Market</a>
      <a href="#dashboard" class="px-5 py-4 text-gray-200 font-semibold border-b border-zinc-700 hover:bg-zinc-700 hover:text-green-500" @click="closeMenu">Player Dashboard</a>

      <div class="px-5 py-4 border-b border-zinc-700 flex justify-between items-center">
        <span class="text-yellow-400 font-bold">🪙 {{ userBalance.toLocaleString() }}</span>
        <button @click="handleLogout" class="text-red-400 hover:text-red-300 font-semibold transition-colors">Logout</button>
      </div>
    </div>
  </nav>
</template>