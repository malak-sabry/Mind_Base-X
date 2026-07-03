import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type {
  CrmAccount, CrmContact, CrmDeal, CrmActivity,
  AccountSize, AccountStatus, ContactStatus, DealStage, DealPriority,
  ActivityType, ActivityStatus,
} from "@/types/crm";

const mapAccount = (r: any): CrmAccount => ({
  id: r.id, name: r.name, industry: r.industry || "", website: r.website || "",
  country: r.country || "", city: r.city || "", size: (r.size || "small") as AccountSize,
  annualRevenue: Number(r.annual_revenue || 0), status: (r.status || "active") as AccountStatus,
  ownerEmployeeId: r.owner_employee_id, notes: r.notes || "",
  impactPercent: Number(r.impact_percent || 0),
  outcomeSummary: r.outcome_summary || "",
  onboardedAt: r.onboarded_at || null,
  createdAt: r.created_at,
});

const mapContact = (r: any): CrmContact => ({
  id: r.id, fullName: r.full_name, email: r.email || "", phone: r.phone || "",
  jobTitle: r.job_title || "", accountId: r.account_id, ownerEmployeeId: r.owner_employee_id,
  status: (r.status || "lead") as ContactStatus, source: r.source || "",
  tags: r.tags || [], notes: r.notes || "", lastContactedAt: r.last_contacted_at,
  createdAt: r.created_at,
});

const mapDeal = (r: any): CrmDeal => ({
  id: r.id, title: r.title, description: r.description || "",
  value: Number(r.value || 0), currency: r.currency || "EGP",
  stage: (r.stage || "new") as DealStage, probability: Number(r.probability || 0),
  expectedCloseDate: r.expected_close_date, accountId: r.account_id, contactId: r.contact_id,
  ownerEmployeeId: r.owner_employee_id, priority: (r.priority || "medium") as DealPriority,
  lostReason: r.lost_reason || "", closedAt: r.closed_at, createdAt: r.created_at,
});

const mapActivity = (r: any): CrmActivity => ({
  id: r.id, type: (r.type || "call") as ActivityType, title: r.title,
  description: r.description || "", status: (r.status || "pending") as ActivityStatus,
  scheduledAt: r.scheduled_at, completedAt: r.completed_at,
  durationMinutes: Number(r.duration_minutes || 0),
  accountId: r.account_id, contactId: r.contact_id, dealId: r.deal_id,
  ownerEmployeeId: r.owner_employee_id, outcome: r.outcome || "", createdAt: r.created_at,
});

export function useCrmStore() {
  const [accounts, setAccounts] = useState<CrmAccount[]>([]);
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [deals, setDeals] = useState<CrmDeal[]>([]);
  const [activities, setActivities] = useState<CrmActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const [a, c, d, ac] = await Promise.all([
        supabase.from("crm_accounts").select("*").order("created_at", { ascending: false }),
        supabase.from("crm_contacts").select("*").order("created_at", { ascending: false }),
        supabase.from("crm_deals").select("*").order("created_at", { ascending: false }),
        supabase.from("crm_activities").select("*").order("scheduled_at", { ascending: false, nullsFirst: false }),
      ]);
      setAccounts((a.data || []).map(mapAccount));
      setContacts((c.data || []).map(mapContact));
      setDeals((d.data || []).map(mapDeal));
      setActivities((ac.data || []).map(mapActivity));
    } catch (e) { console.error(e); }
    finally { if (showLoading) setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(true); }, [fetchAll]);

  // Accounts CRUD
  const saveAccount = useCallback(async (a: Partial<CrmAccount> & { id?: string }) => {
    const row = {
      name: a.name, industry: a.industry || "", website: a.website || "",
      country: a.country || "", city: a.city || "", size: a.size || "small",
      annual_revenue: a.annualRevenue || 0, status: a.status || "active",
      owner_employee_id: a.ownerEmployeeId || null, notes: a.notes || "",
      impact_percent: a.impactPercent ?? 0,
      outcome_summary: a.outcomeSummary || "",
      onboarded_at: a.onboardedAt || null,
    };
    if (a.id) await supabase.from("crm_accounts").update(row).eq("id", a.id);
    else await supabase.from("crm_accounts").insert(row);
    await fetchAll();
  }, [fetchAll]);
  const deleteAccount = useCallback(async (id: string) => {
    await supabase.from("crm_accounts").delete().eq("id", id);
    await fetchAll();
  }, [fetchAll]);

  // Contacts CRUD
  const saveContact = useCallback(async (c: Partial<CrmContact> & { id?: string }) => {
    const row = {
      full_name: c.fullName, email: c.email || "", phone: c.phone || "",
      job_title: c.jobTitle || "", account_id: c.accountId || null,
      owner_employee_id: c.ownerEmployeeId || null, status: c.status || "lead",
      source: c.source || "", tags: c.tags || [], notes: c.notes || "",
      last_contacted_at: c.lastContactedAt || null,
    };
    if (c.id) await supabase.from("crm_contacts").update(row).eq("id", c.id);
    else await supabase.from("crm_contacts").insert(row);
    await fetchAll();
  }, [fetchAll]);
  const deleteContact = useCallback(async (id: string) => {
    await supabase.from("crm_contacts").delete().eq("id", id);
    await fetchAll();
  }, [fetchAll]);

  // Deals CRUD
  const saveDeal = useCallback(async (d: Partial<CrmDeal> & { id?: string }) => {
    const row: any = {
      title: d.title, description: d.description || "",
      value: d.value || 0, currency: d.currency || "EGP",
      stage: d.stage || "new", probability: d.probability ?? 10,
      expected_close_date: d.expectedCloseDate || null,
      account_id: d.accountId || null, contact_id: d.contactId || null,
      owner_employee_id: d.ownerEmployeeId || null,
      priority: d.priority || "medium", lost_reason: d.lostReason || "",
    };
    if (d.stage === "won" || d.stage === "lost") row.closed_at = new Date().toISOString();
    if (d.id) await supabase.from("crm_deals").update(row).eq("id", d.id);
    else await supabase.from("crm_deals").insert(row);
    await fetchAll();
  }, [fetchAll]);
  const updateDealStage = useCallback(async (id: string, stage: DealStage) => {
    const upd: any = { stage };
    if (stage === "won" || stage === "lost") upd.closed_at = new Date().toISOString();
    await supabase.from("crm_deals").update(upd).eq("id", id);
    await fetchAll();
  }, [fetchAll]);
  const deleteDeal = useCallback(async (id: string) => {
    await supabase.from("crm_deals").delete().eq("id", id);
    await fetchAll();
  }, [fetchAll]);

  // Activities CRUD
  const saveActivity = useCallback(async (a: Partial<CrmActivity> & { id?: string }) => {
    const row = {
      type: a.type || "call", title: a.title, description: a.description || "",
      status: a.status || "pending",
      scheduled_at: a.scheduledAt || null, completed_at: a.completedAt || null,
      duration_minutes: a.durationMinutes || 0,
      account_id: a.accountId || null, contact_id: a.contactId || null, deal_id: a.dealId || null,
      owner_employee_id: a.ownerEmployeeId || null, outcome: a.outcome || "",
    };
    if (a.id) await supabase.from("crm_activities").update(row).eq("id", a.id);
    else await supabase.from("crm_activities").insert(row);
    await fetchAll();
  }, [fetchAll]);
  const completeActivity = useCallback(async (id: string, outcome?: string) => {
    await supabase.from("crm_activities").update({
      status: "completed", completed_at: new Date().toISOString(), outcome: outcome || "",
    }).eq("id", id);
    await fetchAll();
  }, [fetchAll]);
  const deleteActivity = useCallback(async (id: string) => {
    await supabase.from("crm_activities").delete().eq("id", id);
    await fetchAll();
  }, [fetchAll]);

  const stats = {
    accounts: accounts.length,
    contacts: contacts.length,
    activeDeals: deals.filter(d => d.stage !== "won" && d.stage !== "lost").length,
    wonDeals: deals.filter(d => d.stage === "won").length,
    lostDeals: deals.filter(d => d.stage === "lost").length,
    pipelineValue: deals.filter(d => d.stage !== "won" && d.stage !== "lost").reduce((s, d) => s + d.value, 0),
    wonValue: deals.filter(d => d.stage === "won").reduce((s, d) => s + d.value, 0),
    weightedPipeline: deals.filter(d => d.stage !== "won" && d.stage !== "lost").reduce((s, d) => s + d.value * (d.probability / 100), 0),
    pendingActivities: activities.filter(a => a.status === "pending").length,
    overdueActivities: activities.filter(a => a.status === "pending" && a.scheduledAt && new Date(a.scheduledAt) < new Date()).length,
    winRate: (() => {
      const closed = deals.filter(d => d.stage === "won" || d.stage === "lost").length;
      const won = deals.filter(d => d.stage === "won").length;
      return closed > 0 ? Math.round((won / closed) * 100) : 0;
    })(),
  };

  return {
    accounts, contacts, deals, activities, loading, stats, fetchAll,
    saveAccount, deleteAccount,
    saveContact, deleteContact,
    saveDeal, updateDealStage, deleteDeal,
    saveActivity, completeActivity, deleteActivity,
  };
}