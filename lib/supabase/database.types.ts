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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      athlete_managers: {
        Row: {
          athlete_id: string
          created_at: string
          manager_id: string
          relationship_type: Database["public"]["Enums"]["manager_relationship"]
        }
        Insert: {
          athlete_id: string
          created_at?: string
          manager_id: string
          relationship_type: Database["public"]["Enums"]["manager_relationship"]
        }
        Update: {
          athlete_id?: string
          created_at?: string
          manager_id?: string
          relationship_type?: Database["public"]["Enums"]["manager_relationship"]
        }
        Relationships: [
          {
            foreignKeyName: "athlete_managers_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_managers_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      athletes: {
        Row: {
          cpf: string | null
          created_at: string
          data_nascimento: string
          faixa: string
          genero: string
          id: string
          nome_completo: string
          organization_id: string
          peso_kg: number
          possui_necessidade_especial: boolean
          team_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          data_nascimento: string
          faixa: string
          genero: string
          id?: string
          nome_completo: string
          organization_id: string
          peso_kg: number
          possui_necessidade_especial?: boolean
          team_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cpf?: string | null
          created_at?: string
          data_nascimento?: string
          faixa?: string
          genero?: string
          id?: string
          nome_completo?: string
          organization_id?: string
          peso_kg?: number
          possui_necessidade_especial?: boolean
          team_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "athletes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athletes_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athletes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      category_change_requests: {
        Row: {
          created_at: string
          current_category_id: string
          id: string
          reason: string
          registration_id: string
          requested_by: string
          requested_category_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["change_request_status"]
        }
        Insert: {
          created_at?: string
          current_category_id: string
          id?: string
          reason: string
          registration_id: string
          requested_by: string
          requested_category_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["change_request_status"]
        }
        Update: {
          created_at?: string
          current_category_id?: string
          id?: string
          reason?: string
          registration_id?: string
          requested_by?: string
          requested_category_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["change_request_status"]
        }
        Relationships: [
          {
            foreignKeyName: "category_change_requests_current_category_id_fkey"
            columns: ["current_category_id"]
            isOneToOne: false
            referencedRelation: "event_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_change_requests_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_change_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_change_requests_requested_category_id_fkey"
            columns: ["requested_category_id"]
            isOneToOne: false
            referencedRelation: "event_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_change_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      category_rule_sets: {
        Row: {
          ativo: boolean
          created_at: string
          event_id: string
          id: string
          nome: string
          versao: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          event_id: string
          id?: string
          nome: string
          versao: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          event_id?: string
          id?: string
          nome?: string
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "category_rule_sets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          after_data: Json | null
          before_data: Json | null
          created_at: string
          event_id: string | null
          id: number
          organization_id: string
          reason: string | null
          resource_id: string | null
          resource_type: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          event_id?: string | null
          id?: never
          organization_id: string
          reason?: string | null
          resource_id?: string | null
          resource_type: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          event_id?: string | null
          id?: never
          organization_id?: string
          reason?: string | null
          resource_id?: string | null
          resource_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_audit_logs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_categories: {
        Row: {
          ativa: boolean
          created_at: string
          faixa_max_ordem: number
          faixa_min_ordem: number
          genero: string
          id: string
          idade_max: number
          idade_min: number
          nome: string
          ordem: number
          peso_max_kg: number
          peso_min_kg: number
          rule_set_id: string
        }
        Insert: {
          ativa?: boolean
          created_at?: string
          faixa_max_ordem: number
          faixa_min_ordem: number
          genero: string
          id?: string
          idade_max: number
          idade_min: number
          nome: string
          ordem?: number
          peso_max_kg: number
          peso_min_kg?: number
          rule_set_id: string
        }
        Update: {
          ativa?: boolean
          created_at?: string
          faixa_max_ordem?: number
          faixa_min_ordem?: number
          genero?: string
          id?: string
          idade_max?: number
          idade_min?: number
          nome?: string
          ordem?: number
          peso_max_kg?: number
          peso_min_kg?: number
          rule_set_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_categories_rule_set_id_fkey"
            columns: ["rule_set_id"]
            isOneToOne: false
            referencedRelation: "category_rule_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      event_phases: {
        Row: {
          created_at: string
          event_id: string
          fim: string
          id: string
          inicio: string
          tipo: Database["public"]["Enums"]["event_phase_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          fim: string
          id?: string
          inicio: string
          tipo: Database["public"]["Enums"]["event_phase_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          fim?: string
          id?: string
          inicio?: string
          tipo?: Database["public"]["Enums"]["event_phase_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_phases_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          checagem_travada_em: string | null
          created_at: string
          created_by: string
          data_evento: string
          id: string
          imagem_cartaz_url: string | null
          informacoes: string | null
          local: string
          nome: string
          organization_id: string
          regulamento_url: string | null
          results_publicados: boolean
          slug: string
          status: Database["public"]["Enums"]["event_status"]
          tabela_peso_url: string | null
          timezone: string
          updated_at: string
          valor_inscricao: number
        }
        Insert: {
          checagem_travada_em?: string | null
          created_at?: string
          created_by: string
          data_evento: string
          id?: string
          imagem_cartaz_url?: string | null
          informacoes?: string | null
          local: string
          nome: string
          organization_id: string
          regulamento_url?: string | null
          results_publicados?: boolean
          slug: string
          status?: Database["public"]["Enums"]["event_status"]
          tabela_peso_url?: string | null
          timezone?: string
          updated_at?: string
          valor_inscricao?: number
        }
        Update: {
          checagem_travada_em?: string | null
          created_at?: string
          created_by?: string
          data_evento?: string
          id?: string
          imagem_cartaz_url?: string | null
          informacoes?: string | null
          local?: string
          nome?: string
          organization_id?: string
          regulamento_url?: string | null
          results_publicados?: boolean
          slug?: string
          status?: Database["public"]["Enums"]["event_status"]
          tabela_peso_url?: string | null
          timezone?: string
          updated_at?: string
          valor_inscricao?: number
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          organization_id: string
          role: Database["public"]["Enums"]["organization_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          organization_id: string
          role: Database["public"]["Enums"]["organization_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["organization_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          ativo: boolean
          created_at: string
          created_by: string
          id: string
          nome: string
          slug: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          created_by: string
          id?: string
          nome: string
          slug: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          created_by?: string
          id?: string
          nome?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_attempts: {
        Row: {
          boleto_url: string | null
          created_at: string
          expires_at: string | null
          gateway_payment_id: string
          id: string
          payment_id: string
          pix_copia_cola: string | null
          pix_qrcode: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          boleto_url?: string | null
          created_at?: string
          expires_at?: string | null
          gateway_payment_id: string
          id?: string
          payment_id: string
          pix_copia_cola?: string | null
          pix_qrcode?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          boleto_url?: string | null
          created_at?: string
          expires_at?: string | null
          gateway_payment_id?: string
          id?: string
          payment_id?: string
          pix_copia_cola?: string | null
          pix_qrcode?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_attempts_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_customer_provisioning: {
        Row: {
          claimed_at: string
          state: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          claimed_at?: string
          state: string
          token?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          claimed_at?: string
          state?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_customer_provisioning_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_customers: {
        Row: {
          created_at: string
          gateway_customer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          gateway_customer_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          gateway_customer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_issuance_jobs: {
        Row: {
          claimed_at: string
          payment_id: string
          state: string
          token: string
          updated_at: string
        }
        Insert: {
          claimed_at?: string
          payment_id: string
          state: string
          token?: string
          updated_at?: string
        }
        Update: {
          claimed_at?: string
          payment_id?: string
          state?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_issuance_jobs_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: true
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_registrations: {
        Row: {
          amount: number
          payment_id: string
          registration_id: string
        }
        Insert: {
          amount: number
          payment_id: string
          registration_id: string
        }
        Update: {
          amount?: number
          payment_id?: string
          registration_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_registrations_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_registrations_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          created_at: string
          created_by: string
          data_expiracao: string | null
          event_id: string
          external_reference: string | null
          gateway: string
          id: string
          metodo: Database["public"]["Enums"]["payment_method"]
          paid_at: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          valor_total: number
        }
        Insert: {
          created_at?: string
          created_by: string
          data_expiracao?: string | null
          event_id: string
          external_reference?: string | null
          gateway: string
          id?: string
          metodo: Database["public"]["Enums"]["payment_method"]
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          valor_total: number
        }
        Update: {
          created_at?: string
          created_by?: string
          data_expiracao?: string | null
          event_id?: string
          external_reference?: string | null
          gateway?: string
          id?: string
          metodo?: Database["public"]["Enums"]["payment_method"]
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_user_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          role: Database["public"]["Enums"]["platform_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          role: Database["public"]["Enums"]["platform_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          role?: Database["public"]["Enums"]["platform_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_user_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          cpf: string | null
          created_at: string
          data_nascimento: string | null
          id: string
          nome_completo: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          id: string
          nome_completo: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          id?: string
          nome_completo?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      registrations: {
        Row: {
          athlete_id: string
          athlete_snapshot: Json
          category_id: string
          category_snapshot: Json
          created_at: string
          event_id: string
          id: string
          numero: number
          registered_by: string
          rule_set_version: number
          status: Database["public"]["Enums"]["registration_status"]
          terms_accepted_at: string
          terms_version: string
          updated_at: string
          valor: number
        }
        Insert: {
          athlete_id: string
          athlete_snapshot: Json
          category_id: string
          category_snapshot: Json
          created_at?: string
          event_id: string
          id?: string
          numero?: never
          registered_by: string
          rule_set_version: number
          status?: Database["public"]["Enums"]["registration_status"]
          terms_accepted_at: string
          terms_version: string
          updated_at?: string
          valor: number
        }
        Update: {
          athlete_id?: string
          athlete_snapshot?: Json
          category_id?: string
          category_snapshot?: Json
          created_at?: string
          event_id?: string
          id?: string
          numero?: never
          registered_by?: string
          rule_set_version?: number
          status?: Database["public"]["Enums"]["registration_status"]
          terms_accepted_at?: string
          terms_version?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "registrations_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "event_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_registered_by_fkey"
            columns: ["registered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          created_by: string
          id: string
          nome: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          nome: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          nome?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          attempts: number
          event_type: string
          external_event_id: string
          gateway: string
          id: string
          last_error: string | null
          payload: Json
          processed_at: string | null
          received_at: string
          status: Database["public"]["Enums"]["webhook_processing_status"]
        }
        Insert: {
          attempts?: number
          event_type: string
          external_event_id: string
          gateway: string
          id?: string
          last_error?: string | null
          payload: Json
          processed_at?: string | null
          received_at?: string
          status?: Database["public"]["Enums"]["webhook_processing_status"]
        }
        Update: {
          attempts?: number
          event_type?: string
          external_event_id?: string
          gateway?: string
          id?: string
          last_error?: string | null
          payload?: Json
          processed_at?: string | null
          received_at?: string
          status?: Database["public"]["Enums"]["webhook_processing_status"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      belt_order: { Args: { athlete_belt: string }; Returns: number }
      claim_payment_customer: { Args: { actor_id: string }; Returns: Json }
      claim_payment_issuance: {
        Args: { actor_id: string; target_payment_id: string }
        Returns: Json
      }
      complete_payment_customer: {
        Args: { actor_id: string; claim_token: string; gateway_id: string }
        Returns: undefined
      }
      complete_payment_issuance: {
        Args: {
          amount_value: number
          boleto_value: string
          claim_token: string
          gateway_id: string
          method_value: Database["public"]["Enums"]["payment_method"]
          reference_value: string
          target_payment_id: string
        }
        Returns: undefined
      }
      create_event_registrations: {
        Args: {
          accepted_terms_version: string
          target_athlete_ids: string[]
          target_event_id: string
          terms_accepted: boolean
        }
        Returns: {
          athlete_id: string
          category_id: string
          numero: number
          registration_id: string
        }[]
      }
      create_managed_athlete: {
        Args: {
          athlete_belt: string
          athlete_birth_date: string
          athlete_cpf?: string
          athlete_gender: string
          athlete_name: string
          athlete_weight: number
          relationship: Database["public"]["Enums"]["manager_relationship"]
          special_needs?: boolean
          target_team_id: string
        }
        Returns: string
      }
      flag_payment_customer_reconciliation: {
        Args: { actor_id: string; claim_token: string }
        Returns: undefined
      }
      flag_payment_issuance_reconciliation: {
        Args: { claim_token: string; target_payment_id: string }
        Returns: undefined
      }
      has_organization_role: {
        Args: {
          allowed_roles: Database["public"]["Enums"]["organization_role"][]
          target_organization_id: string
        }
        Returns: boolean
      }
      is_platform_admin: { Args: never; Returns: boolean }
      link_athlete_to_current_user: {
        Args: { target_athlete_id: string }
        Returns: undefined
      }
      manages_athlete: { Args: { target_athlete_id: string }; Returns: boolean }
      process_payment_webhook: {
        Args: { target_event_id: string }
        Returns: Json
      }
      release_payment_issuance_claim: {
        Args: { claim_token: string; target_payment_id: string }
        Returns: undefined
      }
      reserve_payment_batch: {
        Args: {
          target_event_id: string
          target_method: Database["public"]["Enums"]["payment_method"]
          target_registration_ids: string[]
        }
        Returns: {
          external_reference: string
          payment_id: string
          registration_count: number
          total: number
        }[]
      }
      settle_payment_manually: {
        Args: { reason_text: string; target_payment_id: string }
        Returns: Json
      }
      update_managed_athlete: {
        Args: {
          athlete_belt: string
          athlete_birth_date: string
          athlete_cpf?: string
          athlete_gender: string
          athlete_name: string
          athlete_weight: number
          change_reason?: string
          special_needs?: boolean
          target_athlete_id: string
          target_team_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      change_request_status: "pendente" | "aprovada" | "recusada"
      event_phase_type: "inscricao" | "pagamento" | "checagem" | "chaves"
      event_status:
        | "rascunho"
        | "publicado"
        | "inscricao"
        | "pagamento"
        | "checagem"
        | "chaves"
        | "em_andamento"
        | "concluido"
        | "cancelado"
      manager_relationship: "professor" | "responsavel"
      organization_role: "owner" | "organizer" | "staff" | "finance"
      payment_method: "pix" | "boleto"
      payment_status:
        | "aguardando"
        | "pago"
        | "expirado"
        | "cancelado"
        | "estornado"
      platform_role: "admin"
      registration_status:
        | "rascunho"
        | "pendente_pagamento"
        | "efetivada"
        | "expirada"
        | "cancelada"
        | "estornada"
      webhook_processing_status:
        | "recebido"
        | "processado"
        | "falhou"
        | "ignorado"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      change_request_status: ["pendente", "aprovada", "recusada"],
      event_phase_type: ["inscricao", "pagamento", "checagem", "chaves"],
      event_status: [
        "rascunho",
        "publicado",
        "inscricao",
        "pagamento",
        "checagem",
        "chaves",
        "em_andamento",
        "concluido",
        "cancelado",
      ],
      manager_relationship: ["professor", "responsavel"],
      organization_role: ["owner", "organizer", "staff", "finance"],
      payment_method: ["pix", "boleto"],
      payment_status: [
        "aguardando",
        "pago",
        "expirado",
        "cancelado",
        "estornado",
      ],
      platform_role: ["admin"],
      registration_status: [
        "rascunho",
        "pendente_pagamento",
        "efetivada",
        "expirada",
        "cancelada",
        "estornada",
      ],
      webhook_processing_status: [
        "recebido",
        "processado",
        "falhou",
        "ignorado",
      ],
    },
  },
} as const
