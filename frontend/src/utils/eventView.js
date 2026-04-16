const statusLabels = {
  DRAFT: "Черновик",
  PUBLISHED: "Опубликовано",
  ARCHIVED: "В архиве",
};

export function getEventStatusLabel(status) {
  return statusLabels[status] || "Неизвестный статус";
}

export function getEventAudienceLabel(event) {
  if (event.isPublic) {
    return "Публичное мероприятие";
  }
  if (event.institution?.name) {
    return `Для учебного заведения: ${event.institution.name}`;
  }
  return "Для выбранного учебного заведения";
}

export function getEventStatusTone(status) {
  if (status === "PUBLISHED") return "success";
  if (status === "DRAFT") return "neutral";
  if (status === "ARCHIVED") return "muted";
  return "neutral";
}
