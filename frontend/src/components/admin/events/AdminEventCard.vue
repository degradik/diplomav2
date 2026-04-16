<script setup>
import { computed, ref } from "vue";
import { getEventAudienceLabel, getEventStatusLabel, getEventStatusTone } from "../../../utils/eventView";

const props = defineProps({
  event: {
    type: Object,
    required: true,
  },
  selected: {
    type: Boolean,
    default: false,
  },
  archiving: {
    type: Boolean,
    default: false,
  },
  deleting: {
    type: Boolean,
    default: false,
  },
  restoring: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["edit", "archive", "restore", "delete", "participants"]);

const imageBroken = ref(false);

const audienceLabel = computed(() => getEventAudienceLabel(props.event));
const statusLabel = computed(() => getEventStatusLabel(props.event.status));
const statusTone = computed(() => getEventStatusTone(props.event.status));
const hasImage = computed(() => Boolean(props.event.imageUrl) && !imageBroken.value);
const archiveDisabled = computed(() => props.event.status === "ARCHIVED" || props.archiving || props.deleting);
const isArchived = computed(() => props.event.status === "ARCHIVED");

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

function onEdit() {
  emit("edit", props.event);
}

function onArchive() {
  emit("archive", props.event.id);
}

function onDelete() {
  emit("delete", props.event.id);
}

function onRestore() {
  emit("restore", props.event.id);
}

function onParticipants() {
  emit("participants", props.event.id);
}
</script>

<template>
  <article class="event-card" :class="{ 'event-card--selected': selected }">
    <div class="event-card__media">
      <img
        v-if="hasImage"
        :src="event.imageUrl"
        :alt="`Обложка мероприятия ${event.title}`"
        @error="onImageError"
      />
      <div v-else class="event-card__placeholder">
        <strong>{{ event.title.slice(0, 1).toUpperCase() }}</strong>
        <span>Нет изображения</span>
      </div>
    </div>

    <div class="event-card__body">
      <header class="event-card__header">
        <div class="event-card__status">
          <span class="status-pill" :class="`status-pill--${statusTone}`">{{ statusLabel }}</span>
          <span class="event-card__count">Участников: {{ event._count?.participants ?? 0 }}</span>
        </div>
        <h3>{{ event.title }}</h3>
        <p class="event-card__audience">{{ audienceLabel }}</p>
      </header>

      <div class="event-card__meta">
        <p>
          <span>Начало</span>
          <strong>{{ formatDate(event.startAt) }}</strong>
        </p>
        <p>
          <span>Окончание</span>
          <strong>{{ formatDate(event.endAt) }}</strong>
        </p>
      </div>

      <div class="event-card__actions">
        <button type="button" class="action-btn" @click="onEdit">Редактировать</button>
        <button
          type="button"
          class="action-btn action-btn-soft"
          :class="{ 'action-btn-soft--active': selected }"
          @click="onParticipants"
        >
          Участники
        </button>
        <button
          v-if="isArchived"
          type="button"
          class="action-btn action-btn-soft"
          :disabled="restoring || deleting"
          @click="onRestore"
        >
          {{ restoring ? "Восстанавливаем..." : "Восстановить" }}
        </button>
        <button v-else type="button" class="action-btn action-btn-soft" :disabled="archiveDisabled" @click="onArchive">
          {{ archiving ? "Архивируем..." : "В архив" }}
        </button>
        <button type="button" class="action-btn action-btn-danger" :disabled="deleting" @click="onDelete">
          {{ deleting ? "Удаляем..." : "Удалить" }}
        </button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.event-card {
  border: 1px solid #d9e2ef;
  border-radius: 24px;
  overflow: hidden;
  background: linear-gradient(180deg, #ffffff, #f6f9ff);
  box-shadow: 0 12px 28px rgba(33, 51, 80, 0.1);
  display: grid;
  grid-template-columns: minmax(210px, 240px) 1fr;
}

.event-card--selected {
  border-color: #84a8df;
  box-shadow: 0 14px 30px rgba(30, 62, 106, 0.2);
}

.event-card__media {
  min-height: 200px;
  background: #e9f0fb;
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
    radial-gradient(circle at 14% 16%, rgba(126, 173, 241, 0.34), transparent 40%),
    radial-gradient(circle at 84% 82%, rgba(84, 209, 180, 0.28), transparent 40%),
    linear-gradient(135deg, #dce8f8, #eef4fd);
}

.event-card__placeholder strong {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #ffffff;
  color: #2b466e;
  font-size: 24px;
  box-shadow: 0 8px 18px rgba(28, 44, 69, 0.16);
}

.event-card__placeholder span {
  color: #536781;
  font-weight: 600;
  font-size: 13px;
}

.event-card__body {
  padding: 16px;
  display: grid;
  gap: 12px;
}

.event-card__header {
  display: grid;
  gap: 8px;
}

.event-card__status {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
}

.event-card__count {
  color: #607390;
  font-size: 13px;
  font-weight: 600;
}

.status-pill {
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 800;
}

.status-pill--success {
  background: #dff4e8;
  color: #21764f;
}

.status-pill--neutral {
  background: #e6edf9;
  color: #365178;
}

.status-pill--muted {
  background: #eceff4;
  color: #5b687f;
}

.event-card h3 {
  margin: 0;
  color: #1c2f4d;
  font-size: 24px;
  line-height: 1.18;
}

.event-card__audience {
  margin: 0;
  color: #4f6382;
  font-size: 14px;
  font-weight: 600;
}

.event-card__meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 8px;
}

.event-card__meta p {
  margin: 0;
  background: #eef4fd;
  border: 1px solid #d9e5f4;
  border-radius: 14px;
  padding: 10px 12px;
  display: grid;
  gap: 4px;
}

.event-card__meta span {
  font-size: 12px;
  color: #607492;
}

.event-card__meta strong {
  color: #243753;
  font-size: 13px;
}

.event-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.action-btn-soft {
  background: #e7eef9;
  color: #1f3658;
}

.action-btn-soft:hover:not(:disabled) {
  background: #dbe7f8;
}

.action-btn-soft--active {
  background: #cfdff7;
}

@media (max-width: 980px) {
  .event-card {
    grid-template-columns: 1fr;
  }

  .event-card__media {
    min-height: 180px;
  }
}
</style>
