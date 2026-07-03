export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          company_name: string
          company_tagline: string
          id: number
          updated_at: string
        }
        Insert: {
          company_name?: string
          company_tagline?: string
          id?: number
          updated_at?: string
        }
        Update: {
          company_name?: string
          company_tagline?: string
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          created_at: string
          date: string
          employee_id: string
          id: string
          note: string | null
          present: boolean
        }
        Insert: {
          created_at?: string
          date: string
          employee_id: string
          id?: string
          note?: string | null
          present?: boolean
        }
        Update: {
          created_at?: string
          date?: string
          employee_id?: string
          id?: string
          note?: string | null
          present?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          scope: string
          sender_employee_id: string | null
          sender_name: string
          sender_role: string
          sender_user_id: string | null
          task_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          scope?: string
          sender_employee_id?: string | null
          sender_name?: string
          sender_role?: string
          sender_user_id?: string | null
          task_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          scope?: string
          sender_employee_id?: string | null
          sender_name?: string
          sender_role?: string
          sender_user_id?: string | null
          task_id?: string | null
        }
        Relationships: []
      }
      crm_accounts: {
        Row: {
          annual_revenue: number | null
          city: string | null
          country: string | null
          created_at: string
          id: string
          impact_percent: number
          industry: string | null
          name: string
          notes: string | null
          onboarded_at: string | null
          outcome_summary: string
          owner_employee_id: string | null
          size: string | null
          status: string
          updated_at: string
          website: string | null
        }
        Insert: {
          annual_revenue?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          impact_percent?: number
          industry?: string | null
          name: string
          notes?: string | null
          onboarded_at?: string | null
          outcome_summary?: string
          owner_employee_id?: string | null
          size?: string | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          annual_revenue?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          impact_percent?: number
          industry?: string | null
          name?: string
          notes?: string | null
          onboarded_at?: string | null
          outcome_summary?: string
          owner_employee_id?: string | null
          size?: string | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      crm_activities: {
        Row: {
          account_id: string | null
          completed_at: string | null
          contact_id: string | null
          created_at: string
          deal_id: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          outcome: string | null
          owner_employee_id: string | null
          scheduled_at: string | null
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          deal_id?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          outcome?: string | null
          owner_employee_id?: string | null
          scheduled_at?: string | null
          status?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          deal_id?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          outcome?: string | null
          owner_employee_id?: string | null
          scheduled_at?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "crm_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contacts: {
        Row: {
          account_id: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          job_title: string | null
          last_contacted_at: string | null
          notes: string | null
          owner_employee_id: string | null
          phone: string | null
          source: string | null
          status: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          job_title?: string | null
          last_contacted_at?: string | null
          notes?: string | null
          owner_employee_id?: string | null
          phone?: string | null
          source?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          job_title?: string | null
          last_contacted_at?: string | null
          notes?: string | null
          owner_employee_id?: string | null
          phone?: string | null
          source?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "crm_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_deals: {
        Row: {
          account_id: string | null
          closed_at: string | null
          contact_id: string | null
          created_at: string
          currency: string
          description: string | null
          expected_close_date: string | null
          id: string
          lost_reason: string | null
          owner_employee_id: string | null
          priority: string
          probability: number
          stage: string
          title: string
          updated_at: string
          value: number
        }
        Insert: {
          account_id?: string | null
          closed_at?: string | null
          contact_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          expected_close_date?: string | null
          id?: string
          lost_reason?: string | null
          owner_employee_id?: string | null
          priority?: string
          probability?: number
          stage?: string
          title: string
          updated_at?: string
          value?: number
        }
        Update: {
          account_id?: string | null
          closed_at?: string | null
          contact_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          expected_close_date?: string | null
          id?: string
          lost_reason?: string | null
          owner_employee_id?: string | null
          priority?: string
          probability?: number
          stage?: string
          title?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "crm_deals_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "crm_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_history: {
        Row: {
          action: string
          changed_at: string
          changed_by_name: string
          changed_by_user_id: string | null
          entity_id: string
          entity_type: string
          field_name: string | null
          id: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          action: string
          changed_at?: string
          changed_by_name?: string
          changed_by_user_id?: string | null
          entity_id: string
          entity_type: string
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          action?: string
          changed_at?: string
          changed_by_name?: string
          changed_by_user_id?: string | null
          entity_id?: string
          entity_type?: string
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: []
      }
      crm_notes: {
        Row: {
          author_name: string
          author_role: string
          author_user_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          note: string
        }
        Insert: {
          author_name?: string
          author_role?: string
          author_user_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          note: string
        }
        Update: {
          author_name?: string
          author_role?: string
          author_user_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          note?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          access_level: string
          address: string | null
          created_at: string
          department: string
          email: string
          full_name: string
          gender: string
          id: string
          is_online: boolean
          join_date: string
          languages: string[] | null
          last_login_at: string | null
          last_logout_at: string | null
          must_change_password: boolean
          nationality: string | null
          phone: string
          photo: string | null
          role: string
          salary: number
          skills: string[] | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          access_level?: string
          address?: string | null
          created_at?: string
          department?: string
          email?: string
          full_name: string
          gender?: string
          id?: string
          is_online?: boolean
          join_date?: string
          languages?: string[] | null
          last_login_at?: string | null
          last_logout_at?: string | null
          must_change_password?: boolean
          nationality?: string | null
          phone?: string
          photo?: string | null
          role?: string
          salary?: number
          skills?: string[] | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          access_level?: string
          address?: string | null
          created_at?: string
          department?: string
          email?: string
          full_name?: string
          gender?: string
          id?: string
          is_online?: boolean
          join_date?: string
          languages?: string[] | null
          last_login_at?: string | null
          last_logout_at?: string | null
          must_change_password?: boolean
          nationality?: string | null
          phone?: string
          photo?: string | null
          role?: string
          salary?: number
          skills?: string[] | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      erp_machines: {
        Row: {
          cost: number
          created_at: string
          expected_life_years: number
          hourly_output: number
          id: string
          name: string
          notes: string | null
          purchase_date: string
          responsible_employee_id: string | null
          serial_number: string | null
          spare_part_cost: number
          spare_part_life_months: number
          spare_part_name: string | null
          status: string
          updated_at: string
          warranty_months: number
        }
        Insert: {
          cost?: number
          created_at?: string
          expected_life_years?: number
          hourly_output?: number
          id?: string
          name: string
          notes?: string | null
          purchase_date?: string
          responsible_employee_id?: string | null
          serial_number?: string | null
          spare_part_cost?: number
          spare_part_life_months?: number
          spare_part_name?: string | null
          status?: string
          updated_at?: string
          warranty_months?: number
        }
        Update: {
          cost?: number
          created_at?: string
          expected_life_years?: number
          hourly_output?: number
          id?: string
          name?: string
          notes?: string | null
          purchase_date?: string
          responsible_employee_id?: string | null
          serial_number?: string | null
          spare_part_cost?: number
          spare_part_life_months?: number
          spare_part_name?: string | null
          status?: string
          updated_at?: string
          warranty_months?: number
        }
        Relationships: []
      }
      erp_production_logs: {
        Row: {
          created_at: string
          created_by: string | null
          downtime_hours: number
          hours_operated: number
          id: string
          log_date: string
          machine_id: string
          notes: string | null
          units_produced: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          downtime_hours?: number
          hours_operated?: number
          id?: string
          log_date?: string
          machine_id: string
          notes?: string | null
          units_produced?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          downtime_hours?: number
          hours_operated?: number
          id?: string
          log_date?: string
          machine_id?: string
          notes?: string | null
          units_produced?: number
          updated_at?: string
        }
        Relationships: []
      }
      erp_spare_parts: {
        Row: {
          cost: number
          created_at: string
          id: string
          installed_at: string | null
          life_months: number
          machine_id: string
          name: string
          notes: string | null
          part_number: string | null
          quantity: number
          supplier: string | null
          updated_at: string
        }
        Insert: {
          cost?: number
          created_at?: string
          id?: string
          installed_at?: string | null
          life_months?: number
          machine_id: string
          name: string
          notes?: string | null
          part_number?: string | null
          quantity?: number
          supplier?: string | null
          updated_at?: string
        }
        Update: {
          cost?: number
          created_at?: string
          id?: string
          installed_at?: string | null
          life_months?: number
          machine_id?: string
          name?: string
          notes?: string | null
          part_number?: string | null
          quantity?: number
          supplier?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      leave_requests: {
        Row: {
          created_at: string
          employee_id: string
          end_date: string
          id: string
          leave_type: string
          manager_note: string | null
          reason: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          end_date: string
          id?: string
          leave_type?: string
          manager_note?: string | null
          reason?: string
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: string
          manager_note?: string | null
          reason?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          target_employee_id: string | null
          target_role: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          target_employee_id?: string | null
          target_role?: string
          title: string
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          target_employee_id?: string | null
          target_role?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_target_employee_id_fkey"
            columns: ["target_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      task_deadline_reminders: {
        Row: {
          created_at: string
          days_before: number
          deadline_date: string
          employee_id: string
          id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          days_before: number
          deadline_date: string
          employee_id: string
          id?: string
          task_id: string
        }
        Update: {
          created_at?: string
          days_before?: number
          deadline_date?: string
          employee_id?: string
          id?: string
          task_id?: string
        }
        Relationships: []
      }
      task_stages: {
        Row: {
          stage: string
          task_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          stage?: string
          task_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          stage?: string
          task_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string
          completed_at: string | null
          created_at: string
          deadline: string
          description: string | null
          id: string
          notes: string | null
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to: string
          completed_at?: string | null
          created_at?: string
          deadline: string
          description?: string | null
          id?: string
          notes?: string | null
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string
          completed_at?: string | null
          created_at?: string
          deadline?: string
          description?: string | null
          id?: string
          notes?: string | null
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_crm_entity: {
        Args: { _entity_id: string; _entity_type: string }
        Returns: boolean
      }
      can_access_note: {
        Args: { _entity_id: string; _entity_type: string }
        Returns: boolean
      }
      can_manage_task: { Args: { _task_id: string }; Returns: boolean }
      current_employee_id: { Args: never; Returns: string }
      ensure_due_task_reminders: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "manager" | "hr" | "supervisor" | "employee"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["manager", "hr", "supervisor", "employee"],
    },
  },
} as const
