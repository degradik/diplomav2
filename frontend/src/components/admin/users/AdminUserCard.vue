<script setup>
import { computed } from "vue";

const props = defineProps({
  user: {
    type: Object,
    required: true,
  },
});

const roleLabel = computed(() => (props.user.role === "ADMIN" ? "Администратор" : "Пользователь"));
const roleClass = computed(() => (props.user.role === "ADMIN" ? "role-pill--admin" : "role-pill--user"));
</script>

<template>
  <article class="user-card">
    <div class="user-card__head">
      <div class="user-avatar">
        <img v-if="user.avatarUrl" :src="user.avatarUrl" :alt="`Аватар пользователя ${user.fullName}`" />
        <span v-else>{{ user.fullName?.slice(0, 1)?.toUpperCase() || "П" }}</span>
      </div>
      <div class="user-card__title">
        <h3>{{ user.fullName }}</h3>
        <span class="role-pill" :class="roleClass">{{ roleLabel }}</span>
      </div>
    </div>

    <div class="user-card__meta">
      <p>
        <span>Email</span>
        <strong>{{ user.email }}</strong>
      </p>
      <p>
        <span>Телефон</span>
        <strong>{{ user.phone || "Не указан" }}</strong>
      </p>
      <p>
        <span>Учебное заведение</span>
        <strong>{{ user.institution?.name || "Не указано" }}</strong>
      </p>
      <p>
        <span>Регистраций</span>
        <strong>{{ user._count?.registrations ?? 0 }}</strong>
      </p>
    </div>
  </article>
</template>

<style scoped>
.user-card {
  border: 1px solid #d8e2ef;
  border-radius: 20px;
  background: linear-gradient(180deg, #ffffff, #f7faff);
  box-shadow: 0 10px 24px rgba(31, 47, 74, 0.08);
  padding: 14px;
  display: grid;
  gap: 12px;
}

.user-card__head {
  display: flex;
  gap: 10px;
  align-items: center;
}

.user-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #122540, #2b4e82);
  color: #f4f8ff;
  display: grid;
  place-items: center;
  font-weight: 800;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.user-card__title {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.user-card__title h3 {
  margin: 0;
  color: #1c2f4d;
  font-size: 20px;
}

.role-pill {
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 800;
}

.role-pill--admin {
  background: #ffe9cd;
  color: #8b4b00;
}

.role-pill--user {
  background: #e3edf9;
  color: #355179;
}

.user-card__meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 8px;
}

.user-card__meta p {
  margin: 0;
  border: 1px solid #dbe6f5;
  border-radius: 12px;
  background: #eef4fd;
  padding: 8px 10px;
  display: grid;
  gap: 2px;
}

.user-card__meta span {
  color: #607492;
  font-size: 12px;
}

.user-card__meta strong {
  color: #263b59;
  font-size: 13px;
}
</style>
