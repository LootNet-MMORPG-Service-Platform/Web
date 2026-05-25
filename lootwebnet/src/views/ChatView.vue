<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MessageCircle, Send } from 'lucide-vue-next'
import { MarketplaceService } from '../services/marketplaceService'
import { onRealtimeEvent } from '../services/realtimeService'
import { toAssetUrl } from '../services/urls'
import type { ChatConversationDTO, ChatMessageDTO } from '../types/marketplace'

const route = useRoute()
const router = useRouter()
const mode = ref<'global' | 'private'>('global')
const globalMessages = ref<ChatMessageDTO[]>([])
const privateMessages = ref<ChatMessageDTO[]>([])
const conversations = ref<ChatConversationDTO[]>([])
const selectedConversationUserId = ref('')
const draftConversation = ref<ChatConversationDTO | null>(null)
const messageText = ref('')
const errorMessage = ref('')
let off: (() => void) | null = null

const mergedConversations = computed(() => {
  if (!draftConversation.value) return conversations.value
  const existsOnServer = conversations.value.some(c => c.userId === draftConversation.value?.userId)
  if (existsOnServer) return conversations.value
  return [draftConversation.value, ...conversations.value]
})

const activeConversation = computed(() => mergedConversations.value.find(x => x.userId === selectedConversationUserId.value) || null)
const canSendPrivate = computed(() => mode.value !== 'private' || Boolean(selectedConversationUserId.value))

const loadGlobal = async () => {
  const res = await MarketplaceService.getGlobalChat(1, 50)
  globalMessages.value = res.items ?? []
}

const loadConversations = async () => {
  conversations.value = await MarketplaceService.getPrivateConversations()
  if (draftConversation.value && conversations.value.some(c => c.userId === draftConversation.value?.userId)) {
    draftConversation.value = null
  }
}

const loadPrivate = async () => {
  if (!selectedConversationUserId.value) return
  const res = await MarketplaceService.getPrivateChat(selectedConversationUserId.value, 1, 50)
  privateMessages.value = res.items ?? []
}

const openPrivate = async (userId: string) => {
  selectedConversationUserId.value = userId
  mode.value = 'private'
  errorMessage.value = ''

  if (!conversations.value.some(c => c.userId === userId)) {
    try {
      const profile = await MarketplaceService.getUserProfile(userId)
      draftConversation.value = {
        userId: profile.userId,
        username: profile.username,
        profileImagePath: profile.profileImagePath ?? null,
        lastMessageText: 'No messages yet',
        lastMessageAt: new Date().toISOString()
      }
    } catch {
      draftConversation.value = {
        userId,
        username: 'Unknown',
        profileImagePath: null,
        lastMessageText: 'No messages yet',
        lastMessageAt: new Date().toISOString()
      }
    }
  }

  await loadPrivate()
  await router.replace({ path: '/chat', query: { userId } })
}

const send = async () => {
  if (!messageText.value.trim()) return
  if (mode.value === 'private' && !selectedConversationUserId.value) {
    errorMessage.value = 'Select a conversation or open chat from a user profile.'
    return
  }

  try {
    if (mode.value === 'global') {
      await MarketplaceService.sendGlobalChat(messageText.value)
    } else {
      await MarketplaceService.sendPrivateChat(selectedConversationUserId.value, messageText.value)
      await loadConversations()
      await loadPrivate()
    }
    messageText.value = ''
  } catch (e: any) {
    errorMessage.value = e?.message || 'Failed to send message.'
  }
}

onMounted(async () => {
  await Promise.all([loadGlobal(), loadConversations()])
  const fromQuery = String(route.query.userId || '')
  if (fromQuery) await openPrivate(fromQuery)

  off = onRealtimeEvent((payload: any) => {
    if (payload?.domain !== 'chat') return
    if (payload?.action === 'global-message') void loadGlobal()
    if (payload?.action === 'private-message') {
      void loadConversations()
      if (selectedConversationUserId.value) void loadPrivate()
    }
  })
})

watch(mode, async (v) => {
  errorMessage.value = ''
  if (v === 'global') await router.replace({ path: '/chat' })
})

watch(() => route.query.userId, async (val) => {
  const userId = String(val || '')
  if (!userId) return
  await openPrivate(userId)
})

onUnmounted(() => {
  if (off) off()
})
</script>

<template>
  <div class="min-h-screen w-full bg-zinc-950 p-4 text-gray-200 flex justify-center items-center">
    <div class="w-full max-w-7xl mx-auto bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl p-6">
      <div class="flex items-center justify-between gap-3">
        <h1 class="text-2xl font-bold text-white inline-flex items-center gap-2"><MessageCircle class="w-6 h-6 text-blue-400" /> Chat</h1>
        <div class="inline-flex bg-zinc-800 rounded p-1">
          <button class="px-3 py-1.5 rounded" :class="mode==='global' ? 'bg-blue-600 text-white' : 'text-zinc-300'" @click="mode='global'">Global</button>
          <button class="px-3 py-1.5 rounded" :class="mode==='private' ? 'bg-blue-600 text-white' : 'text-zinc-300'" @click="mode='private'">Private</button>
        </div>
      </div>

      <div v-if="errorMessage" class="p-2 rounded bg-red-900/40 border border-red-500 text-red-200 text-sm">{{ errorMessage }}</div>

      <div v-if="mode==='private'" class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <aside class="bg-zinc-800 border border-zinc-700 rounded p-2 space-y-2 max-h-[460px] overflow-auto">
          <button
            v-for="c in mergedConversations"
            :key="c.userId"
            class="w-full text-left p-2 rounded border"
            :class="selectedConversationUserId===c.userId ? 'bg-blue-700/40 border-blue-500' : 'bg-zinc-900/70 border-zinc-700'"
            @click="openPrivate(c.userId)"
          >
            <div class="flex items-center gap-2 text-sm">
              <img v-if="c.profileImagePath" :src="toAssetUrl(c.profileImagePath)" class="w-6 h-6 rounded-full object-cover border border-zinc-600" />
              <RouterLink :to="`/users/${c.userId}`" class="font-semibold text-zinc-100 hover:text-blue-300">{{ c.username }}</RouterLink>
            </div>
            <p class="text-xs text-zinc-400 mt-1 truncate">{{ c.lastMessageText }}</p>
          </button>
        </aside>

        <section class="md:col-span-2 bg-zinc-800 border border-zinc-700 rounded p-3 h-[460px] overflow-auto space-y-2">
          <div v-if="!activeConversation" class="text-zinc-400 text-sm">Select a conversation or open chat from a user profile.</div>
          <article v-for="m in privateMessages" :key="m.id" class="bg-zinc-900/80 border border-zinc-700 rounded p-2">
            <div class="flex items-center gap-2 text-xs text-zinc-400">
              <img v-if="m.senderProfileImagePath" :src="toAssetUrl(m.senderProfileImagePath)" class="w-5 h-5 rounded-full object-cover border border-zinc-600" />
              <RouterLink :to="`/users/${m.senderId}`" class="text-zinc-200 font-semibold hover:text-blue-300">{{ m.senderUsername }}</RouterLink>
              <span>{{ new Date(m.createdAt).toLocaleString() }}</span>
            </div>
            <p class="mt-1 text-sm text-zinc-100 whitespace-pre-wrap">{{ m.text }}</p>
          </article>
        </section>
      </div>

      <div v-else class="bg-zinc-800 border border-zinc-700 rounded p-3 h-[460px] overflow-auto space-y-2">
        <article v-for="m in globalMessages" :key="m.id" class="bg-zinc-900/80 border border-zinc-700 rounded p-2">
          <div class="flex items-center gap-2 text-xs text-zinc-400">
            <img v-if="m.senderProfileImagePath" :src="toAssetUrl(m.senderProfileImagePath)" class="w-5 h-5 rounded-full object-cover border border-zinc-600" />
            <RouterLink :to="`/users/${m.senderId}`" class="text-zinc-200 font-semibold hover:text-blue-300">{{ m.senderUsername }}</RouterLink>
            <span>{{ new Date(m.createdAt).toLocaleString() }}</span>
          </div>
          <p class="mt-1 text-sm text-zinc-100 whitespace-pre-wrap">{{ m.text }}</p>
        </article>
      </div>

      <div class="flex items-center gap-2">
        <input
          v-model="messageText"
          class="flex-1 px-3 py-2 rounded bg-zinc-800 border border-zinc-700 disabled:opacity-50"
          :disabled="!canSendPrivate"
          :placeholder="mode==='private' && !canSendPrivate ? 'Select a conversation first...' : 'Write message...'"
        />
        <button
          class="px-3 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 inline-flex items-center gap-2"
          :disabled="!canSendPrivate"
          @click="send"
        >
          <Send class="w-4 h-4" />Send
        </button>
      </div>
    </div>
  </div>
</template>
