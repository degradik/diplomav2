<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { getEventAudienceLabel, getEventStatusLabel, getEventStatusTone } from "../../utils/eventView";

const props = defineProps({
  event: {
    type: Object,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["register", "cancel"]);
const router = useRouter();

const imageBroken = ref(false);

const displayStatus = computed(() => getEventStatusLabel(props.event.status));
const statusTone = computed(() => getEventStatusTone(props.event.status));
const audienceLabel = computed(() => getEventAudienceLabel(props.event));
const hasImage = computed(() => Boolean(props.event.imageUrl) && !imageBroken.value);
const previewText = computed(() => {
  const raw = String(props.event.content || "");
  const plain = raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!plain) return "Описание мероприятия пока не добавлено.";
  return plain.length > 180 ? `${plain.slice(0, 177)}...` : plain;
});

function formatDate(value) {
  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function onImageError() {
  imageBroken.value = true;
}

function onRegister() {
  emit("register", props.event.id);
}

function onCancel() {
  emit("cancel", props.event.id);
}

function openDetails() {
  router.push(`/events/${props.event.id}`);
}
</script>

<template>
  <article
    class="event-card event-card--wide event-card--clickable"
    role="link"
    tabindex="0"
    @click="openDetails"
    @keydown.enter.prevent="openDetails"
    @keydown.space.prevent="openDetails"
  >
    <span class="event-card__go" aria-hidden="true">→</span>
    <div class="event-card__media">
      <img v-if="hasImage" :src="event.imageUrl" :alt="`Изображение мероприятия ${event.title}`" @error="onImageError" />
      <div v-else class="event-card__placeholder">
        <strong>{{ event.title.slice(0, 1).toUpperCase() }}</strong>
        <span>Нет изображения</span>
      </div>
    </div>

    <div class="event-card__body">
      <header class="event-card__header">
        <div class="event-card__title-wrap">
          <h3>{{ event.title }}</h3>
          <span class="event-badge" :class="`event-badge--${statusTone}`">{{ displayStatus }}</span>
        </div>
        <p class="event-card__audience">{{ audienceLabel }}</p>
      </header>

      <div class="event-card__meta">
        <p>
          <span>Начало:</span>
          <strong>{{ formatDate(event.startAt) }}</strong>
        </p>
        <p>
          <span>Окончание:</span>
          <strong>{{ formatDate(event.endAt) }}</strong>
        </p>
        <p>
          <span>Участников:</span>
          <strong>{{ event.participantsCount }}</strong>
        </p>
      </div>

      <p class="event-card__content">{{ previewText }}</p>
      <p v-if="event.isPast" class="event-card__hint">Регистрация закрыта: мероприятие уже началось.</p>

      <div class="event-card__actions">
        <button
          v-if="!event.isRegistered"
          type="button"
          class="action-btn"
          :disabled="!event.canRegister || loading"
          @click.stop="onRegister"
        >
          {{ loading ? "Записываем..." : "Записаться" }}
        </button>
        <button
          v-else
          type="button"
          class="action-btn action-btn-danger"
          :disabled="loading"
          @click.stop="onCancel"
        >
          {{ loading ? "Отменяем..." : "Отменить запись" }}
        </button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.event-card--wide {
  position: relative;
  border-radius: 26px;
  border: 1px solid #dbe4f0;
  background: linear-gradient(180deg, #ffffff, #f8fafe);
  box-shadow: 0 16px 34px rgba(37, 56, 86, 0.1);
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(240px, 340px) 1fr;
}

.event-card--clickable {
  cursor: pointer;
  transition: transform 0.16s ease, box-shadow 0.16s ease;
}

.event-card--clickable:hover,
.event-card--clickable:focus-visible {
  transform: translateY(-2px);
  box-shadow: 0 18px 36px rgba(37, 56, 86, 0.14);
  outline: none;
}

.event-card__go {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: #e8effa;
  color: #2e4c77;
  font-size: 20px;
  font-weight: 800;
  z-index: 3;
  pointer-events: none;
}

.event-card__media {
  min-height: 250px;
  background: #edf3fb;
}

.event-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.event-card__placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  gap: 8px;
  text-align: center;
  background:
    radial-gradient(circle at 20% 20%, rgba(121, 170, 245, 0.4), transparent 40%),
    radial-gradient(circle at 75% 80%, rgba(66, 207, 183, 0.34), transparent 42%),
    linear-gradient(135deg, #dfe9f7, #eff4fb);
  color: #455a78;
}

.event-card__placeholder strong {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 28px;
  background: #ffffff;
  color: #294368;
  box-shadow: 0 8px 18px rgba(41, 67, 104, 0.18);
}

.event-card__placeholder span {
  font-size: 14px;
  font-weight: 600;
}

.event-card__body {
  padding: 20px 22px;
  display: grid;
  gap: 14px;
}

.event-card__header {
  display: grid;
  gap: 8px;
}

.event-card__title-wrap {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.event-card__title-wrap h3 {
  margin: 0;
  color: #1a2d48;
  font-size: clamp(22px, 2.6vw, 30px);
  line-height: 1.18;
}

.event-card__audience {
  margin: 0;
  color: #4e627f;
  font-weight: 600;
}

.event-card__meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 10px;
}

.event-card__meta p {
  margin: 0;
  border: 1px solid #e0e8f4;
  background: #f4f8fe;
  border-radius: 14px;
  padding: 10px 12px;
  display: grid;
  gap: 4px;
}

.event-card__meta span {
  color: #617693;
  font-size: 12px;
}

.event-card__meta strong {
  color: #203451;
  font-size: 14px;
}

.event-card__content {
  margin: 0;
  color: #2a3d5a;
  line-height: 1.55;
}

.event-card__hint {
  margin: 0;
  color: #9f4949;
  font-size: 13px;
  font-weight: 600;
}

.event-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.event-badge {
  width: fit-content;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.event-badge--success {
  background: #def4e9;
  color: #1f7750;
}

.event-badge--neutral {
  background: #e7edf8;
  color: #36537a;
}

.event-badge--muted {
  background: #eceff4;
  color: #59677f;
}

@media (max-width: 980px) {
  .event-card--wide {
    grid-template-columns: 1fr;
  }

  .event-card__media {
    min-height: 220px;
  }
}
</style>
