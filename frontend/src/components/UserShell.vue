<script setup>
import { computed } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { clearAuthSession, getStoredUser } from "../api";

defineProps({
  title: {
    type: String,
    default: "",
  },
});

const route = useRoute();
const router = useRouter();
const me = computed(() => getStoredUser());
const userInitial = computed(() => (me.value?.fullName || "U").slice(0, 1).toUpperCase());

function logout() {
  clearAuthSession();
  router.push("/login");
}
</script>

<template>
  <div class="dashboard">
    <aside class="sidebar">
      <div class="logo">AURE<span>STA</span></div>
      <p class="sidebar-title">МЕНЮ</p>
      <nav class="menu-list">
        <RouterLink class="menu-item" :class="{ active: route.path === '/events' }" to="/events">
          Мероприятия
        </RouterLink>
        <RouterLink class="menu-item" :class="{ active: route.path === '/profile' }" to="/profile">
          Профиль
        </RouterLink>
      </nav>
      <button type="button" class="menu-item sidebar-logout" @click="logout">Выход</button>
    </aside>

    <div class="workspace">
      <header class="topbar">
        <h1>{{ title }}</h1>
        <div class="topbar-right">
          <div class="user-chip">
            <div class="avatar">{{ userInitial }}</div>
            <span>{{ me?.fullName || "Пользователь" }}</span>
          </div>
        </div>
      </header>
      <main class="content-panel">
        <slot />
      </main>
    </div>
  </div>
</template>
