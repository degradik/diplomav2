<script setup>
import { onMounted, ref } from "vue";
import UserShell from "../components/UserShell.vue";
import ToastMessage from "../components/ToastMessage.vue";
import { api, refreshMe } from "../api";

const loading = ref(false);
const actionLoading = ref({});
const error = ref("");
const success = ref("");
const filter = ref("all");
const events = ref([]);

function formatDate(value) {
  return new Date(value).toLocaleString("ru-RU");
}

async function loadEvents() {
  loading.value = true;
  error.value = "";
  try {
    await refreshMe();
    const { data } = await api.get("/events", {
      params: { filter: filter.value },
    });
    events.value = data;
  } catch (err) {
    error.value = err?.response?.data?.message || "Не удалось загрузить мероприятия.";
  } finally {
    loading.value = false;
  }
}

async function registerToEvent(eventId) {
  actionLoading.value[eventId] = true;
  error.value = "";
  success.value = "";
  try {
    await api.post(`/events/${eventId}/register`);
    await loadEvents();
    success.value = "Вы успешно зарегистрировались.";
  } catch (err) {
    error.value = err?.response?.data?.message || "Не удалось зарегистрироваться.";
  } finally {
    actionLoading.value[eventId] = false;
  }
}

async function cancelRegistration(eventId) {
  actionLoading.value[eventId] = true;
  error.value = "";
  success.value = "";
  try {
    await api.delete(`/events/${eventId}/register`);
    await loadEvents();
    success.value = "Регистрация отменена.";
  } catch (err) {
    error.value = err?.response?.data?.message || "Не удалось отменить регистрацию.";
  } finally {
    actionLoading.value[eventId] = false;
  }
}

onMounted(loadEvents);
</script>

<template>
  <UserShell title="Мероприятия">
    <ToastMessage :error="error" :success="success" />

    <div class="section-tabs">
      <button type="button" class="seg-btn" :class="{ active: filter === 'all' }" @click="filter = 'all'; loadEvents()">
        Все
      </button>
      <button
        type="button"
        class="seg-btn"
        :class="{ active: filter === 'upcoming' }"
        @click="filter = 'upcoming'; loadEvents()"
      >
        Предстоящие
      </button>
      <button type="button" class="seg-btn" :class="{ active: filter === 'past' }" @click="filter = 'past'; loadEvents()">
        Прошедшие
      </button>
      <button type="button" class="seg-btn" :class="{ active: filter === 'mine' }" @click="filter = 'mine'; loadEvents()">
        Мои
      </button>
    </div>

    <section v-if="loading" class="block"><p>Загрузка мероприятий...</p></section>
    <section v-else class="block">
      <div v-if="events.length === 0" class="empty-state">Список мероприятий пуст.</div>
      <div v-else class="events-grid">
        <article v-for="item in events" :key="item.id" class="event-card">
          <div class="event-top">
            <span class="badge">{{ item.isPublic ? "Публичное" : "Для УЗ" }}</span>
            <strong>{{ item.title }}</strong>
          </div>
          <p>{{ formatDate(item.startAt) }} - {{ formatDate(item.endAt) }}</p>
          <p>Статус: {{ item.status }}</p>
          <p>УЗ: {{ item.institution?.name || "Общее мероприятие" }}</p>
          <p>Участников: {{ item.participantsCount }}</p>
          <p class="event-content" v-html="item.content"></p>
          <p v-if="!item.isAccessible" class="field-error">Событие недоступно для вашего профиля.</p>
          <p v-else-if="item.isPast" class="field-error">Запись закрыта: мероприятие уже началось.</p>
          <button
            v-if="!item.isRegistered"
            type="button"
            class="action-btn"
            :disabled="!item.canRegister || actionLoading[item.id]"
            @click="registerToEvent(item.id)"
          >
            {{ actionLoading[item.id] ? "Записываем..." : "Записаться" }}
          </button>
          <button
            v-else
            type="button"
            class="action-btn action-btn-danger"
            :disabled="actionLoading[item.id]"
            @click="cancelRegistration(item.id)"
          >
            {{ actionLoading[item.id] ? "Отменяем..." : "Отменить запись" }}
          </button>
        </article>
      </div>
    </section>
  </UserShell>
</template>
