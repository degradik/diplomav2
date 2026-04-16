<script setup>
import { RouterLink, useRoute } from "vue-router";

const props = defineProps({
  title: {
    type: String,
    default: "",
  },
  sidebarTitle: {
    type: String,
    default: "Навигация",
  },
  userName: {
    type: String,
    default: "Пользователь",
  },
  userAvatarUrl: {
    type: String,
    default: "",
  },
  userInitial: {
    type: String,
    default: "U",
  },
  navItems: {
    type: Array,
    default: () => [],
  },
  sidebarVariant: {
    type: String,
    default: "user",
  },
});

const emit = defineEmits(["logout"]);
const route = useRoute();

function onLogout() {
  emit("logout");
}
</script>

<template>
  <div class="dashboard">
    <aside class="sidebar" :class="{ 'admin-sidebar': sidebarVariant === 'admin' }">
      <div class="sidebar-head">
        <p class="sidebar-head__title">{{ title }}</p>
        <p class="sidebar-head__caption">{{ sidebarTitle }}</p>
      </div>

      <nav class="menu-list">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="menu-item"
          :class="{ active: route.path === item.to }"
        >
          {{ item.label }}
        </RouterLink>
      </nav>

      <button type="button" class="menu-item sidebar-logout" @click="onLogout">Выход</button>
    </aside>

    <div class="workspace">
      <header class="topbar">
        <h1>{{ title }}</h1>
        <div class="topbar-right">
          <div class="user-chip">
            <div class="avatar">
              <img v-if="userAvatarUrl" :src="userAvatarUrl" alt="Аватар пользователя" />
              <span v-else>{{ userInitial }}</span>
            </div>
            <span>{{ userName }}</span>
          </div>
        </div>
      </header>

      <main class="content-panel">
        <slot />
      </main>
    </div>
  </div>
</template>
