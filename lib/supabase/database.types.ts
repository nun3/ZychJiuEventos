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
      bracket_entries: {
        Row: {
          bracket_id: string
          created_at: string
          group_id: string
          id: string
          participant_id: string
          slot: number
        }
        Insert: {
          bracket_id: string
          created_at?: string
          group_id: string
          id?: string
          participant_id: string
          slot: number
        }
        Update: {
          bracket_id?: string
          created_at?: string
          group_id?: string
          id?: string
          participant_id?: string
          slot?: number
        }
        Relationships: [
          {
            foreignKeyName: "bracket_entries_group_id_bracket_id_fkey"
            columns: ["group_id", "bracket_id"]
            isOneToOne: false
            referencedRelation: "bracket_groups"
            referencedColumns: ["id", "bracket_id"]
          },
          {
            foreignKeyName: "bracket_entries_participant_id_bracket_id_fkey"
            columns: ["participant_id", "bracket_id"]
            isOneToOne: false
            referencedRelation: "bracket_participants"
            referencedColumns: ["id", "bracket_id"]
          },
        ]
      }
      bracket_groups: {
        Row: {
          bracket_id: string
          created_at: string
          id: string
          label: string
          sort_order: number
          topology: Database["public"]["Enums"]["bracket_topology"]
        }
        Insert: {
          bracket_id: string
          created_at?: string
          id?: string
          label: string
          sort_order: number
          topology: Database["public"]["Enums"]["bracket_topology"]
        }
        Update: {
          bracket_id?: string
          created_at?: string
          id?: string
          label?: string
          sort_order?: number
          topology?: Database["public"]["Enums"]["bracket_topology"]
        }
        Relationships: [
          {
            foreignKeyName: "bracket_groups_bracket_id_fkey"
            columns: ["bracket_id"]
            isOneToOne: false
            referencedRelation: "category_brackets"
            referencedColumns: ["id"]
          },
        ]
      }
      bracket_group_operations: {
        Row: {
          awards_confirmed_at: string | null
          awards_confirmed_by: string | null
          group_id: string
          updated_at: string
          weigh_in_confirmed_at: string | null
          weigh_in_confirmed_by: string | null
        }
        Insert: {
          awards_confirmed_at?: string | null
          awards_confirmed_by?: string | null
          group_id: string
          updated_at?: string
          weigh_in_confirmed_at?: string | null
          weigh_in_confirmed_by?: string | null
        }
        Update: {
          awards_confirmed_at?: string | null
          awards_confirmed_by?: string | null
          group_id?: string
          updated_at?: string
          weigh_in_confirmed_at?: string | null
          weigh_in_confirmed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bracket_group_operations_awards_confirmed_by_fkey"
            columns: ["awards_confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bracket_group_operations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: true
            referencedRelation: "bracket_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bracket_group_operations_weigh_in_confirmed_by_fkey"
            columns: ["weigh_in_confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bracket_matches: {
        Row: {
          created_at: string
          group_id: string
          id: string
          pair_index: number
          round: Database["public"]["Enums"]["match_round"]
          side_a_entry_id: string | null
          side_a_source_match_id: string | null
          side_b_entry_id: string | null
          side_b_source_match_id: string | null
          status: Database["public"]["Enums"]["match_status"]
          winner_entry_id: string | null
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          pair_index: number
          round: Database["public"]["Enums"]["match_round"]
          side_a_entry_id?: string | null
          side_a_source_match_id?: string | null
          side_b_entry_id?: string | null
          side_b_source_match_id?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          winner_entry_id?: string | null
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          pair_index?: number
          round?: Database["public"]["Enums"]["match_round"]
          side_a_entry_id?: string | null
          side_a_source_match_id?: string | null
          side_b_entry_id?: string | null
          side_b_source_match_id?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          winner_entry_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bracket_matches_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "bracket_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bracket_matches_side_a_entry_fk"
            columns: ["side_a_entry_id", "group_id"]
            isOneToOne: false
            referencedRelation: "bracket_entries"
            referencedColumns: ["id", "group_id"]
          },
          {
            foreignKeyName: "bracket_matches_side_a_source_fk"
            columns: ["side_a_source_match_id", "group_id"]
            isOneToOne: false
            referencedRelation: "bracket_matches"
            referencedColumns: ["id", "group_id"]
          },
          {
            foreignKeyName: "bracket_matches_side_b_entry_fk"
            columns: ["side_b_entry_id", "group_id"]
            isOneToOne: false
            referencedRelation: "bracket_entries"
            referencedColumns: ["id", "group_id"]
          },
          {
            foreignKeyName: "bracket_matches_side_b_source_fk"
            columns: ["side_b_source_match_id", "group_id"]
            isOneToOne: false
            referencedRelation: "bracket_matches"
            referencedColumns: ["id", "group_id"]
          },
          {
            foreignKeyName: "bracket_matches_winner_entry_fk"
            columns: ["winner_entry_id", "group_id"]
            isOneToOne: false
            referencedRelation: "bracket_entries"
            referencedColumns: ["id", "group_id"]
          },
        ]
      }
      bracket_participants: {
        Row: {
          athlete_id: string
          bracket_id: string
          created_at: string
          id: string
          nome_exibido: string
          registration_id: string
          source_order: number
          team_id: string | null
          team_name: string | null
        }
        Insert: {
          athlete_id: string
          bracket_id: string
          created_at?: string
          id?: string
          nome_exibido: string
          registration_id: string
          source_order: number
          team_id?: string | null
          team_name?: string | null
        }
        Update: {
          athlete_id?: string
          bracket_id?: string
          created_at?: string
          id?: string
          nome_exibido?: string
          registration_id?: string
          source_order?: number
          team_id?: string | null
          team_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bracket_participants_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bracket_participants_bracket_id_fkey"
            columns: ["bracket_id"]
            isOneToOne: false
            referencedRelation: "category_brackets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bracket_participants_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bracket_participants_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      category_brackets: {
        Row: {
          category_id: string
          created_at: string
          event_id: string
          generated_at: string
          generated_by: string
          id: string
          mode: Database["public"]["Enums"]["bracket_mode"]
          published_at: string | null
          published_by: string | null
          regeneration_reason: string | null
          source_checagem_travada_em: string
          status: Database["public"]["Enums"]["bracket_status"]
          supersedes_id: string | null
          updated_at: string
          version: number
        }
        Insert: {
          category_id: string
          created_at?: string
          event_id: string
          generated_at?: string
          generated_by: string
          id?: string
          mode: Database["public"]["Enums"]["bracket_mode"]
          published_at?: string | null
          published_by?: string | null
          regeneration_reason?: string | null
          source_checagem_travada_em: string
          status: Database["public"]["Enums"]["bracket_status"]
          supersedes_id?: string | null
          updated_at?: string
          version: number
        }
        Update: {
          category_id?: string
          created_at?: string
          event_id?: string
          generated_at?: string
          generated_by?: string
          id?: string
          mode?: Database["public"]["Enums"]["bracket_mode"]
          published_at?: string | null
          published_by?: string | null
          regeneration_reason?: string | null
          source_checagem_travada_em?: string
          status?: Database["public"]["Enums"]["bracket_status"]
          supersedes_id?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "category_brackets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "event_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_brackets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_brackets_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_brackets_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_brackets_supersedes_id_fkey"
            columns: ["supersedes_id"]
            isOneToOne: false
            referencedRelation: "category_brackets"
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
      event_areas: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          number: number
          schedule_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          number: number
          schedule_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          number?: number
          schedule_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_areas_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "event_schedules"
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
          fight_duration_minutes: number | null
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
          fight_duration_minutes?: number | null
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
          fight_duration_minutes?: number | null
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
      event_platform_fees: {
        Row: {
          event_id: string
          fee_cents: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          event_id: string
          fee_cents?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          event_id?: string
          fee_cents?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_platform_fees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_platform_fees_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      event_schedule_groups: {
        Row: {
          area_id: string
          assigned_at: string
          group_id: string
          schedule_id: string
          updated_at: string
        }
        Insert: {
          area_id: string
          assigned_at?: string
          group_id: string
          schedule_id: string
          updated_at?: string
        }
        Update: {
          area_id?: string
          assigned_at?: string
          group_id?: string
          schedule_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_schedule_groups_area_id_schedule_id_fkey"
            columns: ["area_id", "schedule_id"]
            isOneToOne: false
            referencedRelation: "event_areas"
            referencedColumns: ["id", "schedule_id"]
          },
          {
            foreignKeyName: "event_schedule_groups_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: true
            referencedRelation: "bracket_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_schedule_groups_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "event_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      event_schedule_matches: {
        Row: {
          created_at: string
          fight_number: number
          match_id: string
          schedule_id: string
        }
        Insert: {
          created_at?: string
          fight_number: number
          match_id: string
          schedule_id: string
        }
        Update: {
          created_at?: string
          fight_number?: number
          match_id?: string
          schedule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_schedule_matches_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "bracket_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_schedule_matches_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "event_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      event_schedules: {
        Row: {
          created_at: string
          created_by: string
          event_id: string
          id: string
          published_at: string | null
          published_by: string | null
          status: Database["public"]["Enums"]["event_schedule_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          event_id: string
          id?: string
          published_at?: string | null
          published_by?: string | null
          status?: Database["public"]["Enums"]["event_schedule_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          event_id?: string
          id?: string
          published_at?: string | null
          published_by?: string | null
          status?: Database["public"]["Enums"]["event_schedule_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_schedules_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_schedules_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          platform_fee_cents: number | null
          registration_id: string
        }
        Insert: {
          amount: number
          payment_id: string
          platform_fee_cents?: number | null
          registration_id: string
        }
        Update: {
          amount?: number
          payment_id?: string
          platform_fee_cents?: number | null
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
          current_category_id: string | null
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
          current_category_id?: string | null
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
          current_category_id?: string | null
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
            foreignKeyName: "registrations_current_category_id_fkey"
            columns: ["current_category_id"]
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
      apply_suggested_bracket_composition: {
        Args: { target_bracket_id: string }
        Returns: undefined
      }
      assert_bracket_structure: {
        Args: { target_bracket_id: string }
        Returns: undefined
      }
      assert_event_schedule_complete: {
        Args: { target_schedule_id: string }
        Returns: undefined
      }
      assert_registration_can_request_category_change: {
        Args: {
          target_registration: Database["public"]["Tables"]["registrations"]["Row"]
        }
        Returns: undefined
      }
      assign_schedule_group: {
        Args: { target_area_id: string; target_group_id: string }
        Returns: Json
      }
      belt_order: { Args: { athlete_belt: string }; Returns: number }
      bracket_entry_to_json: {
        Args: { include_internal_id?: boolean; target_entry_id: string }
        Returns: Json
      }
      bracket_group_checklist_prepare: {
        Args: { target_group_id: string }
        Returns: {
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
        SetofOptions: {
          from: "*"
          to: "events"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      bracket_group_checklist_to_json: {
        Args: { target_group_id: string }
        Returns: Json
      }
      bracket_group_has_completed_result: {
        Args: { target_group_id: string }
        Returns: boolean
      }
      bracket_group_placements_to_json: {
        Args: { include_internal_ids?: boolean; target_group_id: string }
        Returns: Json
      }
      bracket_has_results: {
        Args: { target_bracket_id: string }
        Returns: boolean
      }
      bracket_partition_sizes: {
        Args: { athlete_count: number }
        Returns: number[]
      }
      bracket_resolve_match_side: {
        Args: { target_match_id: string; target_side: string }
        Returns: string
      }
      bracket_same_team_warnings: {
        Args: { target_bracket_id: string }
        Returns: Json
      }
      bracket_topology_size: {
        Args: {
          target_topology: Database["public"]["Enums"]["bracket_topology"]
        }
        Returns: number
      }
      category_belongs_to_event: {
        Args: { target_category_id: string; target_event_id: string }
        Returns: boolean
      }
      category_bracket_load_event: {
        Args: { target_event_id: string }
        Returns: {
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
        SetofOptions: {
          from: "*"
          to: "events"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      category_bracket_lock: {
        Args: { target_category_id: string; target_event_id: string }
        Returns: undefined
      }
      category_bracket_operation_to_json: {
        Args: { target_bracket_id: string }
        Returns: Json
      }
      category_bracket_require_staff: {
        Args: { target_event: Database["public"]["Tables"]["events"]["Row"] }
        Returns: undefined
      }
      category_bracket_to_json: {
        Args: { result_kind: string; target_bracket_id: string }
        Returns: Json
      }
      category_is_eligible_for_checking_reallocation: {
        Args: {
          current_category: Database["public"]["Tables"]["event_categories"]["Row"]
          target_category: Database["public"]["Tables"]["event_categories"]["Row"]
        }
        Returns: boolean
      }
      category_is_eligible_for_registration: {
        Args: {
          event_date: string
          target_category: Database["public"]["Tables"]["event_categories"]["Row"]
          target_registration: Database["public"]["Tables"]["registrations"]["Row"]
        }
        Returns: boolean
      }
      claim_payment_customer: { Args: { actor_id: string }; Returns: Json }
      claim_payment_issuance: {
        Args: { actor_id: string; target_payment_id: string }
        Returns: Json
      }
      confirm_bracket_group_awards: {
        Args: { target_group_id: string }
        Returns: Json
      }
      confirm_bracket_group_weigh_in: {
        Args: { target_group_id: string }
        Returns: Json
      }
      clear_bracket_composition: {
        Args: { target_bracket_id: string }
        Returns: undefined
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
      copy_bracket_participants: {
        Args: { source_bracket_id: string; target_bracket_id: string }
        Returns: number
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
      create_managed_team: {
        Args: { team_name: string }
        Returns: string
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
      ensure_event_schedule: {
        Args: { target_event_id: string }
        Returns: {
          created_at: string
          created_by: string
          event_id: string
          id: string
          published_at: string | null
          published_by: string | null
          status: Database["public"]["Enums"]["event_schedule_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "event_schedules"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      event_schedule_load_event: {
        Args: { require_editable?: boolean; target_event_id: string }
        Returns: {
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
        SetofOptions: {
          from: "*"
          to: "events"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      event_schedule_require_operator: {
        Args: { target_event: Database["public"]["Tables"]["events"]["Row"] }
        Returns: undefined
      }
      event_schedule_require_viewer: {
        Args: { target_event: Database["public"]["Tables"]["events"]["Row"] }
        Returns: undefined
      }
      flag_payment_customer_reconciliation: {
        Args: { actor_id: string; claim_token: string }
        Returns: undefined
      }
      flag_payment_issuance_reconciliation: {
        Args: { claim_token: string; target_payment_id: string }
        Returns: undefined
      }
      freeze_bracket_participants: {
        Args: {
          target_bracket_id: string
          target_category_id: string
          target_event_id: string
        }
        Returns: number
      }
      generate_category_bracket: {
        Args: { target_category_id: string; target_event_id: string }
        Returns: Json
      }
      get_category_bracket_operation: {
        Args: { target_bracket_id: string }
        Returns: Json
      }
      get_event_group_checklists: {
        Args: { target_event_id: string }
        Returns: Json
      }
      get_event_schedule_operation: {
        Args: { target_event_id: string }
        Returns: Json
      }
      get_public_event_brackets: {
        Args: { target_event_id: string }
        Returns: Json
      }
      get_public_event_checking: {
        Args: { target_event_id: string }
        Returns: Json
      }
      get_public_event_schedule: {
        Args: { target_event_id: string }
        Returns: Json
      }
      has_organization_role: {
        Args: {
          allowed_roles: Database["public"]["Enums"]["organization_role"][]
          target_organization_id: string
        }
        Returns: boolean
      }
      insert_group_entries: {
        Args: {
          member_ids: string[]
          target_bracket_id: string
          target_group_id: string
        }
        Returns: undefined
      }
      insert_group_matches: {
        Args: { target_group_id: string }
        Returns: undefined
      }
      is_platform_admin: { Args: never; Returns: boolean }
      link_athlete_to_current_user: {
        Args: { target_athlete_id: string }
        Returns: undefined
      }
      list_eligible_category_changes: {
        Args: { target_registration_id: string }
        Returns: {
          id: string
          nome: string
        }[]
      }
      lock_event_checagem: { Args: { target_event_id: string }; Returns: Json }
      manages_athlete: { Args: { target_athlete_id: string }; Returns: boolean }
      process_payment_webhook: {
        Args: { target_event_id: string }
        Returns: Json
      }
      protect_bracket_group_operations: { Args: never; Returns: unknown }
      public_category_bracket_to_json: {
        Args: { target_bracket_id: string }
        Returns: Json
      }
      public_schedule_side_to_json: {
        Args: { target_match_id: string; target_side: string }
        Returns: Json
      }
      publish_category_bracket: {
        Args: { target_bracket_id: string }
        Returns: Json
      }
      publish_event_schedule: {
        Args: { target_event_id: string }
        Returns: Json
      }
      reconcile_event_schedule: {
        Args: { target_schedule_id: string }
        Returns: undefined
      }
      record_bracket_match_outcome: {
        Args: {
          outcome: Database["public"]["Enums"]["match_status"]
          target_match_id: string
          target_winner_entry_id: string
        }
        Returns: Json
      }
      regenerate_category_bracket: {
        Args: { reason: string; target_bracket_id: string }
        Returns: Json
      }
      registration_current_category_id: {
        Args: { target: Database["public"]["Tables"]["registrations"]["Row"] }
        Returns: string
      }
      release_payment_issuance_claim: {
        Args: { claim_token: string; target_payment_id: string }
        Returns: undefined
      }
      reorder_event_schedule: {
        Args: { ordered_match_ids: string[]; target_event_id: string }
        Returns: Json
      }
      replace_bracket_composition: {
        Args: { groups_payload: Json; target_bracket_id: string }
        Returns: undefined
      }
      request_category_change: {
        Args: {
          reason_text: string
          requested_category_id: string
          target_registration_id: string
        }
        Returns: Json
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
      restore_category_bracket_suggestion: {
        Args: { target_bracket_id: string }
        Returns: Json
      }
      review_category_change: {
        Args: { approve_request: boolean; target_request_id: string }
        Returns: Json
      }
      save_category_bracket_composition: {
        Args: { groups_payload: Json; target_bracket_id: string }
        Returns: Json
      }
      save_event_area: {
        Args: {
          area_name: string
          area_number: number
          target_area_id: string | null
          target_event_id: string
        }
        Returns: Json
      }
      set_event_area_active: {
        Args: { next_active: boolean; target_area_id: string }
        Returns: Json
      }
      set_event_category_duration: {
        Args: { duration_minutes: number | null; target_category_id: string }
        Returns: Json
      }
      set_event_platform_fee: {
        Args: { fee_cents: number; target_event_id: string }
        Returns: Json
      }
      settle_payment_manually: {
        Args: { reason_text: string; target_payment_id: string }
        Returns: Json
      }
      start_category_bracket: {
        Args: { target_bracket_id: string }
        Returns: Json
      }
      unassign_schedule_group: {
        Args: { target_group_id: string }
        Returns: Json
      }
      undo_bracket_group_awards: {
        Args: { target_group_id: string }
        Returns: Json
      }
      undo_bracket_group_weigh_in: {
        Args: { target_group_id: string }
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
      bracket_mode: "competicao" | "sem_confronto"
      bracket_status:
        | "draft"
        | "publicada"
        | "em_andamento"
        | "concluida"
        | "substituida"
      bracket_topology: "final_2" | "copo_3" | "semi_4"
      change_request_status: "pendente" | "aprovada" | "recusada"
      event_phase_type: "inscricao" | "pagamento" | "checagem" | "chaves"
      event_schedule_status: "draft" | "publicada"
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
      match_round: "semifinal" | "final"
      match_status: "pendente" | "concluido" | "wo"
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
      bracket_mode: ["competicao", "sem_confronto"],
      bracket_status: [
        "draft",
        "publicada",
        "em_andamento",
        "concluida",
        "substituida",
      ],
      bracket_topology: ["final_2", "copo_3", "semi_4"],
      change_request_status: ["pendente", "aprovada", "recusada"],
      event_phase_type: ["inscricao", "pagamento", "checagem", "chaves"],
      event_schedule_status: ["draft", "publicada"],
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
      match_round: ["semifinal", "final"],
      match_status: ["pendente", "concluido", "wo"],
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
