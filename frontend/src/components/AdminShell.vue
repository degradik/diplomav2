<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { clearAuthSession, getStoredUser } from "../api";
import AppShell from "./layout/AppShell.vue";

defineProps({
  title: {
    type: String,
    default: "Админка",
  },
});

const router = useRouter();
const me = computed(() => getStoredUser());
const userInitial = computed(() => (me.value?.fullName || "A").slice(0, 1).toUpperCase());
const navItems = [
  { to: "/admin/events", label: "Мероприятия" },
  { to: "/admin/institutions", label: "Учебные заведения" },
  { to: "/admin/users", label: "Пользователи" },
];

function logout() {
  clearAuthSession();
  router.push("/admin");
}
</script>

<template>
  <AppShell
    :title="title"
    sidebar-title="Административная зона"
    :user-name="me?.fullName || 'Администратор'"
    :user-avatar-url="me?.avatarUrl || ''"
    :user-initial="userInitial"
    :nav-items="navItems"
    sidebar-variant="admin"
    @logout="logout"
  >
    <slot />
  </AppShell>
</template>
