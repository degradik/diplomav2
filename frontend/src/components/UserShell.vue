<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { clearAuthSession, getStoredUser } from "../api";
import AppShell from "./layout/AppShell.vue";

defineProps({
  title: {
    type: String,
    default: "",
  },
});

const router = useRouter();
const me = computed(() => getStoredUser());
const userInitial = computed(() => (me.value?.fullName || "U").slice(0, 1).toUpperCase());
const navItems = [
  { to: "/events", label: "Мероприятия" },
  { to: "/profile", label: "Профиль" },
];

function logout() {
  clearAuthSession();
  router.push("/login");
}
</script>

<template>
  <AppShell
    :title="title"
    sidebar-title="Пользовательская зона"
    :user-name="me?.fullName || 'Пользователь'"
    :user-avatar-url="me?.avatarUrl || ''"
    :user-initial="userInitial"
    :nav-items="navItems"
    @logout="logout"
  >
    <slot />
  </AppShell>
</template>
