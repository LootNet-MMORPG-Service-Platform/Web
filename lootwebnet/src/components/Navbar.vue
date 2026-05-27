<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Coins, UserCircle2 } from 'lucide-vue-next'
import { fetchPlayerData, userBalance } from '../store'
import { api } from '../services/api'
import { MarketplaceService } from '../services/marketplaceService'
import { stopRealtime } from '../services/realtimeService'
import { toAssetUrl } from '../services/urls'

const router = useRouter()
const route = useRoute() 
const isMobileMenuOpen = ref(false)
const profileImagePath = ref('')
const isDailyLoading = ref(false)
const profileImageUrl = computed(() => {
  const path = toAssetUrl(profileImagePath.value)
  return path ? `${path}${path.includes('?') ? '&' : '?'}t=${profileImageVersion.value}` : ''
})
const profileImageVersion = ref(Date.now())

const loadNavbarData = async () => {
  await fetchPlayerData()
  try {
    const me = await MarketplaceService.getProfile()
    profileImagePath.value = String(me?.profileImagePath ?? '')
    profileImageVersion.value = Date.now()
  } catch {
    profileImagePath.value = ''
  }
}

const handleProfileImageUpdated = (event: Event) => {
  const detail = (event as CustomEvent<{ profileImagePath?: string }>).detail
  profileImagePath.value = String(detail?.profileImagePath ?? '')
  profileImageVersion.value = Date.now()
}

onMounted(() => {
  void loadNavbarData()
  window.addEventListener('lootnet:profile-image-updated', handleProfileImageUpdated)
})

onUnmounted(() => {
  window.removeEventListener('lootnet:profile-image-updated', handleProfileImageUpdated)
})

const toggleMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMenu = () => {
  isMobileMenuOpen.value = false
}

const claimDaily = async () => {
  isDailyLoading.value = true
  try {
    const reward = await MarketplaceService.claimDaily()
    await fetchPlayerData()
    window.alert(`Daily claimed: ${Number(reward.currencyReward).toLocaleString()} gold.`)
  } catch (e: any) {
    window.alert(e?.message || 'Daily already claimed or unavailable.')
  } finally {
    isDailyLoading.value = false
  }
}

const handleLogout = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken')
    if (refreshToken) {
      await api.post('/auth/logout', refreshToken)
    }
  } catch (e) {
    console.error('Logout error', e)
  } finally {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    void stopRealtime()
    await router.push('/login')
  }
}
</script>

<template>
  <nav class="bg-zinc-900 border-b-2 border-zinc-800 text-gray-200 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 h-[70px] flex justify-between items-center">
      <div class="flex items-center gap-2 text-2xl font-bold text-white cursor-pointer">
        <span>Lootnet</span>
      </div>

      <div class="hidden md:flex items-center gap-6">
        <RouterLink
            to="/market/buy"
            :class="['font-semibold transition-colors', route.path.startsWith('/market') ? 'text-green-500 drop-shadow-[0_0_5px_rgba(34,197,94,0.3)]' : 'text-gray-400 hover:text-green-500']"
        >Market</RouterLink>
        <RouterLink
            to="/dashboard"
            :class="['font-semibold transition-colors', route.path.startsWith('/dashboard') ? 'text-green-500 drop-shadow-[0_0_5px_rgba(34,197,94,0.3)]' : 'text-gray-400 hover:text-green-500']"
        >Player Dashboard</RouterLink>
        <RouterLink
            to="/chat"
            :class="['font-semibold transition-colors', route.path.startsWith('/chat') ? 'text-green-500 drop-shadow-[0_0_5px_rgba(34,197,94,0.3)]' : 'text-gray-400 hover:text-green-500']"
        >Chat</RouterLink>

        <div class="flex items-center gap-4 ml-5 pl-5 border-l border-zinc-700">
          <span class="text-yellow-400 font-bold transition-all duration-300 inline-flex items-center gap-1">
            <Coins class="w-4 h-4" aria-hidden="true" />
            {{ userBalance.toLocaleString() }}
          </span>
          <button
              class="px-3 py-1.5 rounded bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-sm font-semibold text-zinc-950"
              :disabled="isDailyLoading"
              @click="claimDaily"
          >
            Daily
          </button>
          <div class="w-9 h-9 rounded-full border-2 border-zinc-500 overflow-hidden flex items-center justify-center bg-zinc-800">
            <img v-if="profileImageUrl" :src="profileImageUrl" alt="PFP" class="w-full h-full object-cover" />
            <UserCircle2 v-else class="w-6 h-6 text-zinc-400" />
          </div>

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
      <RouterLink
          to="/market/buy"
          @click="closeMenu"
          :class="['px-5 py-4 font-semibold border-b border-zinc-700 hover:bg-zinc-700 hover:text-green-500 transition-colors', route.path.startsWith('/market') ? 'text-green-500 bg-zinc-700/50' : 'text-gray-200']"
      >Market</RouterLink>
      <RouterLink
          to="/dashboard"
          @click="closeMenu"
          :class="['px-5 py-4 font-semibold border-b border-zinc-700 hover:bg-zinc-700 hover:text-green-500 transition-colors', route.path.startsWith('/dashboard') ? 'text-green-500 bg-zinc-700/50' : 'text-gray-200']"
      >Player Dashboard</RouterLink>
      <RouterLink
          to="/chat"
          @click="closeMenu"
          :class="['px-5 py-4 font-semibold border-b border-zinc-700 hover:bg-zinc-700 hover:text-green-500 transition-colors', route.path.startsWith('/chat') ? 'text-green-500 bg-zinc-700/50' : 'text-gray-200']"
      >Chat</RouterLink>

      <div class="px-5 py-4 border-b border-zinc-700 flex justify-between items-center">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full border-2 border-zinc-500 overflow-hidden flex items-center justify-center bg-zinc-900">
            <img v-if="profileImageUrl" :src="profileImageUrl" alt="PFP" class="w-full h-full object-cover" />
            <UserCircle2 v-else class="w-6 h-6 text-zinc-400" />
          </div>
          <span class="text-yellow-400 font-bold inline-flex items-center gap-1">
            <Coins class="w-4 h-4" aria-hidden="true" />
            {{ userBalance.toLocaleString() }}
          </span>
        </div>
        <button class="px-3 py-1.5 rounded bg-yellow-600 disabled:opacity-50 text-zinc-950 font-semibold" :disabled="isDailyLoading" @click="claimDaily">
          Daily
        </button>
        <button @click="handleLogout" class="text-red-400 hover:text-red-300 font-semibold transition-colors">Logout</button>
      </div>
    </div>
  </nav>
</template>
