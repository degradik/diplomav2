<script setup>
import { computed } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { clearAuthSession, getStoredUser } from "../api";

defineProps({
  title: {
    type: String,
    default: "Админка",
  },
});

const route = useRoute();
const router = useRouter();
const me = computed(() => getStoredUser());

function logout() {
  clearAuthSession();
  router.push("/admin");
}
</script>

<template>
  <div class="dashboard">
    <aside class="sidebar admin-sidebar">
      <div class="logo">ADMIN<span>PANEL</span></div>
      <p class="sidebar-title">РАЗДЕЛЫ</p>
      <nav class="menu-list">
        <RouterLink class="menu-item" :class="{ active: route.path === '/admin/events' }" to="/admin/events">
          Мероприятия
        </RouterLink>
        <RouterLink
          class="menu-item"
          :class="{ active: route.path === '/admin/institutions' }"
          to="/admin/institutions"
        >
          Учебные заведения
        </RouterLink>
        <RouterLink class="menu-item" :class="{ active: route.path === '/admin/users' }" to="/admin/users">
          Пользователи
        </RouterLink>
      </nav>
      <button type="button" class="menu-item sidebar-logout" @click="logout">Выход</button>
    </aside>

    <div class="workspace">
      <header class="topbar">
        <h1>{{ title }}</h1>
        <div class="topbar-right">
          <div class="user-chip">
            <div class="avatar">A</div>
            <span>{{ me?.fullName || "Администратор" }}</span>
          </div>
        </div>
      </header>
      <main class="content-panel">
        <slot />
      </main>
    </div>
  </div>
</template>
