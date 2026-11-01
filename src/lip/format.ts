export const inr = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);
export const daysUntil = (date: string) => {
  const today = new Date(); today.setHours(0,0,0,0);
  const due = new Date(`${date}T00:00:00`); due.setHours(0,0,0,0);
  return Math.ceil((due.getTime() - today.getTime()) / 86400000);
};
export const ageingLabel = (days: number) => days < 0 ? "Overdue" : days === 0 ? "Due today" : days <= 7 ? "1–7 days" : days <= 15 ? "8–15 days" : days <= 30 ? "16–30 days" : "31+ days";