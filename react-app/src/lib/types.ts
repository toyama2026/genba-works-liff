import type { PhotoType } from "./constants";

export type GenbaSite = {
  id: string;
  name: string;
  address?: string | null;
  status?: string | null;
};

export type GenbaToday = {
  status?: "in" | "out" | null;
  site_id?: string | null;
  first_in?: string | null;
  last_out?: string | null;
  elapsed_min?: number | null;
};

export type GenbaHistoryRow = {
  date: string;
  site_id?: string | null;
  first_in?: string | null;
  last_out?: string | null;
  has_report?: boolean;
};

export type GenbaReport = {
  date: string;
  site_id: string;
  body?: string | null;
  photos?: { url: string; type: PhotoType }[];
};

export type GenbaScheduleDay = {
  date: string;
  status?: string | null;
};

export type GenbaSchedule = {
  id: string;
  site_id: string;
  site?: string | null;
  trade?: string | null;
  start_date: string;
  end_date: string;
  headcount?: number | null;
  days?: GenbaScheduleDay[];
};

export type GenbaMeResponse = {
  ok: boolean;
  env?: string;
  error?: string;
  companies?: string[];
  worker?: { name?: string | null };
  month?: { ninku?: number | string; hours?: number | string; days?: number | string };
  today?: GenbaToday;
  sites?: GenbaSite[];
  history?: GenbaHistoryRow[];
  reports?: GenbaReport[];
  unread?: { site_id: string; count: number }[];
  today_counts?: { site_id: string; workers: number }[];
};

export type ChatMessage = {
  created_at: string;
  body: string;
  sender_role?: string;
  sender_worker_id?: string | null;
  sender_name?: string | null;
};

export type DmWorker = {
  id: string;
  name: string;
  company_name?: string | null;
  trade?: string | null;
};

export type DmConversation = {
  worker_id: string;
  name: string;
  company_name?: string | null;
  last_body: string;
  last_at: string | null;
  unread: number;
};

export type DmMessage = {
  id: string;
  sender_worker_id: string;
  recipient_worker_id: string;
  body: string;
  created_at: string;
};

export type ReportPhoto = { data: string; type: PhotoType };

export type ViewKey = "home" | "punch" | "sites" | "site" | "report" | "chat" | "my";

export type TabKey = "home" | "sites" | "report" | "chat" | "me";

export type SiteTabKey = "ov" | "photo" | "plan" | "chat" | "report";
