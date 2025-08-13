export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      Example_AR: {
        Row: {
          id: number
          State: string | null
          Current: string | null
          "1 - 30": string | null
          "31-60": string | null
          "61-90": string | null
          "91+": string | null
          Date: string | null
        }
        Insert: {
          id: number
          State?: string | null
          Current?: string | null
          "1 - 30"?: string | null
          "31-60"?: string | null
          "61-90"?: string | null
          "91+"?: string | null
          Date?: string | null
        }
        Update: {
          id?: number
          State?: string | null
          Current?: string | null
          "1 - 30"?: string | null
          "31-60"?: string | null
          "61-90"?: string | null
          "91+"?: string | null
          Date?: string | null
        }
        Relationships: []
      }
      PMA_Projects: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string
          status: string
          created_at: string
          updated_at: string
          project_type: string | null
          priority: string
                  flow_chart: string | null
        start_date: string | null
        end_date: string | null
        assignee_id: string | null
        deadline: string | null
        tags: Json | null
        progress: number | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category: string
          status: string
          created_at?: string
          updated_at?: string
          project_type?: string | null
          priority?: string
          flow_chart?: string | null
          start_date?: string | null
          end_date?: string | null
          assignee_id?: string | null
          deadline?: string | null
          tags?: Json | null
          progress?: number | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: string
          status?: string
          created_at?: string
          updated_at?: string
          project_type?: string | null
          priority?: string
          flow_chart?: string | null
          start_date?: string | null
          end_date?: string | null
          assignee_id?: string | null
          deadline?: string | null
          tags?: Json | null
          progress?: number | null
        }
        Relationships: []
      }
      PMA_Tasks: {
        Row: {
          id: string
          project_id: string
          name: string
          description: string | null
          task_type: string
          status: string
          assignee_id: string | null
          created_at: string
          updated_at: string
          start_date: string | null
          end_date: string | null
          deadline: string | null
          tags: Json | null
          progress: number | null
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          description?: string | null
          task_type: string
          status: string
          assignee_id?: string | null
          created_at?: string
          updated_at?: string
          start_date?: string | null
          end_date?: string | null
          deadline?: string | null
          tags?: Json | null
          progress?: number | null
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          description?: string | null
          task_type?: string
          status?: string
          assignee_id?: string | null
          created_at?: string
          updated_at?: string
          start_date?: string | null
          end_date?: string | null
          deadline?: string | null
          tags?: Json | null
          progress?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "PMA_Tasks_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "PMA_Projects"
            referencedColumns: ["id"]
          }
        ]
      }
      PMA_SubTasks: {
        Row: {
          id: string
          task_id: string
          name: string
          description: string | null
          task_type: string
          status: string
          assignee_id: string | null
          created_at: string
          updated_at: string
          start_date: string | null
          end_date: string | null
          deadline: string | null
          tags: Json | null
          progress: number | null
        }
        Insert: {
          id?: string
          task_id: string
          name: string
          description?: string | null
          task_type: string
          status: string
          assignee_id?: string | null
          created_at?: string
          updated_at?: string
          start_date?: string | null
          end_date?: string | null
          deadline?: string | null
          tags?: Json | null
          progress?: number | null
        }
        Update: {
          id?: string
          task_id?: string
          name?: string
          description?: string | null
          task_type?: string
          status?: string
          assignee_id?: string | null
          created_at?: string
          updated_at?: string
          start_date?: string | null
          end_date?: string | null
          deadline?: string | null
          tags?: Json | null
          progress?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "PMA_SubTasks_task_id_fkey"
            columns: ["task_id"]
            referencedRelation: "PMA_Tasks"
            referencedColumns: ["id"]
          }
        ]
      }
      PMA_Updates: {
        Row: {
          id: string
          message: string
          user_id: string
          entity_type: string
          entity_id: string
          created_at: string
        }
        Insert: {
          id?: string
          message: string
          user_id: string
          entity_type: string
          entity_id: string
          created_at?: string
        }
        Update: {
          id?: string
          message?: string
          user_id?: string
          entity_type?: string
          entity_id?: string
          created_at?: string
        }
        Relationships: []
      }
      PMA_Users: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
                  email: string
        profile_color: string
        department: string | null
        flow_chart: string | null
        created_at: string
        updated_at: string
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          email: string
          profile_color?: string
          department?: string | null
          flow_chart?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          email?: string
          profile_color?: string
          department?: string | null
          flow_chart?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "PMA_Users_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}