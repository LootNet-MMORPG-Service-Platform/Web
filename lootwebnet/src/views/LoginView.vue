<script setup lang="ts">
import { useRouter } from 'vue-router'
import Login from '../components/login.vue'

const router = useRouter()

const handleLoginSuccess = () => {
  void router.push('/market')
}
</script>

<template>
  <Login @login-success="handleLoginSuccess" />
</template>
