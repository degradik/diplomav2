<script setup>
import { computed, onMounted, ref } from "vue";
import UserShell from "../components/UserShell.vue";
import ToastMessage from "../components/ToastMessage.vue";
import UiSegmentTabs from "../components/ui/UiSegmentTabs.vue";
import UserEventCard from "../components/events/UserEventCard.vue";
import { api, refreshMe } from "../api";

const loading = ref(false);
const actionLoading = ref({});
const error = ref("");
const success = ref("");
const filter = ref("all");
const search = ref("");
const events = ref([]);

const filterItems = [
  { value: "all", label: "Все" },
  { value: "upcoming", label: "Предстоящие" },
  { value: "past", label: "Завершенные" },
  { value: "mine", label: "Мои регистрации" },
];

const filteredEvents = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) return events.value;
  return events.value.filter((event) => event.title.toLowerCase().includes(query));
});

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

    <section class="events-toolbar">
      <UiSegmentTabs v-model="filter" :items="filterItems" @change="loadEvents" />
      <label class="events-search">
        <span>Поиск по названию</span>
        <input v-model.trim="search" type="text" placeholder="Введите название мероприятия" />
      </label>
    </section>

    <section v-if="loading" class="block">
      <p>Загружаем актуальные мероприятия...</p>
    </section>
    <section v-else class="block">
      <div v-if="filteredEvents.length === 0" class="empty-state">
        Сейчас нет мероприятий по выбранным условиям.
      </div>
      <div v-else class="events-grid">
        <UserEventCard
          v-for="item in filteredEvents"
          :key="item.id"
          :event="item"
          :loading="Boolean(actionLoading[item.id])"
          @register="registerToEvent"
          @cancel="cancelRegistration"
        />
      </div>
    </section>
  </UserShell>
</template>
