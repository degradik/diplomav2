<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import UserShell from "../components/UserShell.vue";
import ToastMessage from "../components/ToastMessage.vue";
import { api } from "../api";
import { getEventAudienceLabel, getEventStatusLabel, getEventStatusTone } from "../utils/eventView";

const route = useRoute();

const loading = ref(false);
const actionLoading = ref(false);
const error = ref("");
const success = ref("");
const event = ref(null);
const imageBroken = ref(false);

const statusLabel = computed(() => getEventStatusLabel(event.value?.status));
const statusTone = computed(() => getEventStatusTone(event.value?.status));
const audienceLabel = computed(() => (event.value ? getEventAudienceLabel(event.value) : ""));
const hasImage = computed(() => Boolean(event.value?.imageUrl) && !imageBroken.value);

function formatDate(value) {
  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function loadEvent() {
  loading.value = true;
  error.value = "";
  imageBroken.value = false;
  try {
    const { data } = await api.get(`/events/${route.params.id}`);
    event.value = data;
  } catch (err) {
    event.value = null;
    error.value = err?.response?.data?.message || "Не удалось загрузить мероприятие.";
  } finally {
    loading.value = false;
  }
}

async function registerToEvent() {
  if (!event.value) return;
  actionLoading.value = true;
  error.value = "";
  success.value = "";
  try {
    await api.post(`/events/${event.value.id}/register`);
    await loadEvent();
    success.value = "Вы успешно зарегистрировались.";
  } catch (err) {
    error.value = err?.response?.data?.message || "Не удалось зарегистрироваться.";
  } finally {
    actionLoading.value = false;
  }
}

async function cancelRegistration() {
  if (!event.value) return;
  actionLoading.value = true;
  error.value = "";
  success.value = "";
  try {
    await api.delete(`/events/${event.value.id}/register`);
    await loadEvent();
    success.value = "Регистрация отменена.";
  } catch (err) {
    error.value = err?.response?.data?.message || "Не удалось отменить регистрацию.";
  } finally {
    actionLoading.value = false;
  }
}

watch(
  () => route.params.id,
  () => loadEvent()
);

onMounted(loadEvent);
</script>

<template>
  <UserShell title="Мероприятие">
    <ToastMessage :error="error" :success="success" />

    <section v-if="loading" class="block">
      <p>Загружаем страницу мероприятия...</p>
    </section>

    <section v-else-if="event" class="block event-detail">
      <RouterLink class="event-detail__back-link" to="/events">← Назад</RouterLink>

      <article class="event-detail__hero">
        <div class="event-detail__image-wrap">
          <img
            v-if="hasImage"
            :src="event.imageUrl"
            :alt="`Изображение мероприятия ${event.title}`"
            @error="imageBroken = true"
          />
          <div v-else class="event-detail__placeholder">
            <strong>{{ event.title.slice(0, 1).toUpperCase() }}</strong>
            <span>Изображение отсутствует</span>
          </div>
        </div>

        <div class="event-detail__info">
          <span class="event-detail__badge" :class="`event-detail__badge--${statusTone}`">{{ statusLabel }}</span>
          <h2>{{ event.title }}</h2>
          <p class="event-detail__audience">{{ audienceLabel }}</p>

          <div class="event-detail__meta">
            <p>
              <span>Начало</span>
              <strong>{{ formatDate(event.startAt) }}</strong>
            </p>
            <p>
              <span>Окончание</span>
              <strong>{{ formatDate(event.endAt) }}</strong>
            </p>
            <p>
              <span>Участников</span>
              <strong>{{ event.participantsCount }}</strong>
            </p>
          </div>

          <div class="event-detail__actions">
            <button
              v-if="!event.isRegistered"
              type="button"
              class="action-btn"
              :disabled="!event.canRegister || actionLoading"
              @click="registerToEvent"
            >
              {{ actionLoading ? "Записываем..." : "Записаться" }}
            </button>
            <button
              v-else
              type="button"
              class="action-btn action-btn-danger"
              :disabled="actionLoading"
              @click="cancelRegistration"
            >
              {{ actionLoading ? "Отменяем..." : "Отменить запись" }}
            </button>
          </div>
        </div>
      </article>

      <article class="event-detail__content prose" v-html="event.content" />
    </section>
  </UserShell>
</template>

<style scoped>
.event-detail {
  display: grid;
  gap: 14px;
}

.event-detail__hero {
  border: 1px solid #d8e2f0;
  border-radius: 24px;
  overflow: hidden;
  background: linear-gradient(180deg, #ffffff, #f3f8ff);
  display: grid;
  grid-template-columns: minmax(280px, 420px) 1fr;
}

.event-detail__image-wrap {
  min-height: 320px;
  background: #ebf2fb;
}

.event-detail__image-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.event-detail__placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  gap: 10px;
  background:
    radial-gradient(circle at 18% 18%, rgba(120, 168, 242, 0.35), transparent 44%),
    radial-gradient(circle at 80% 75%, rgba(95, 212, 188, 0.3), transparent 44%),
    linear-gradient(145deg, #e2ebf9, #f0f5fc);
  color: #496082;
}

.event-detail__placeholder strong {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 30px;
  background: #fff;
  color: #244067;
  box-shadow: 0 10px 18px rgba(36, 64, 103, 0.16);
}

.event-detail__info {
  padding: 22px;
  display: grid;
  gap: 12px;
}

.event-detail__badge {
  width: fit-content;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.event-detail__badge--success {
  background: #def4e9;
  color: #1f7750;
}

.event-detail__badge--neutral {
  background: #e7edf8;
  color: #36537a;
}

.event-detail__badge--muted {
  background: #eceff4;
  color: #59677f;
}

.event-detail__info h2 {
  margin: 0;
  font-size: clamp(28px, 3vw, 42px);
  line-height: 1.1;
}

.event-detail__audience {
  margin: 0;
  color: #566b8b;
  font-weight: 600;
}

.event-detail__meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 10px;
}

.event-detail__meta p {
  margin: 0;
  border: 1px solid #dee7f4;
  border-radius: 14px;
  background: #f4f8ff;
  padding: 10px 12px;
  display: grid;
  gap: 4px;
}

.event-detail__meta span {
  color: #627793;
  font-size: 12px;
}

.event-detail__meta strong {
  color: #1f3554;
}

.event-detail__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 2px;
}

.event-detail__back-link {
  justify-self: start;
  color: #35527b;
  font-weight: 700;
  text-decoration: none;
  padding: 2px 2px 4px;
}

.event-detail__back-link:hover {
  color: #243e62;
  text-decoration: underline;
}

.event-detail__content {
  border: 1px solid #d8e2f0;
  border-radius: 24px;
  padding: 22px;
  background: #fff;
}

.prose :deep(h1),
.prose :deep(h2),
.prose :deep(h3) {
  margin: 0 0 10px;
  color: #152947;
}

.prose :deep(p) {
  margin: 0 0 12px;
  line-height: 1.65;
  color: #2a3d5b;
}

.prose :deep(ul),
.prose :deep(ol) {
  margin: 0 0 12px;
  padding-left: 20px;
  color: #2a3d5b;
}

.prose :deep(blockquote) {
  margin: 0 0 12px;
  border-left: 3px solid #c3d3ec;
  padding-left: 12px;
  color: #4b6282;
}

@media (max-width: 980px) {
  .event-detail__hero {
    grid-template-columns: 1fr;
  }

  .event-detail__image-wrap {
    min-height: 250px;
  }
}
</style>
