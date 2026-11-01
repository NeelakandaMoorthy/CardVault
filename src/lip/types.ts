export type CreditCard = {
  id: string;
  user_id?: string;
  card_name: string;
  bank_name: string;
  credit_limit: number;
  outstanding: number;
  statement_amount: number;
  minimum_due: number;
  amount_due: number;
  billing_day: number;
  due_day: number;
  due_date: string;
  notes?: string | null;
  created_at?: string;
};
export type CardInput = Omit<CreditCard, "id" | "user_id" | "created_at">;