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
          project_type: string | null
          priority: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category: string
          status: string
          project_type?: string | null
          priority?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: string
          status?: string
          project_type?: string | null
          priority?: string
          created_at?: string
          updated_at?: string
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
          role_id: string | null
          manager_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          email: string
          profile_color?: string
          role_id?: string | null
          manager_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          email?: string
          profile_color?: string
          role_id?: string | null
          manager_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "PMA_Users_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "PMA_Users_role_id_fkey"
            columns: ["role_id"]
            referencedRelation: "PMA_Roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "PMA_Users_manager_id_fkey"
            columns: ["manager_id"]
            referencedRelation: "PMA_Users"
            referencedColumns: ["id"]
          }
        ]
      }
      PMA_Roles: {
        Row: {
          id: string
          name: string
          description: string | null
          permissions: Json | null
          is_system_role: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          permissions?: Json | null
          is_system_role?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          permissions?: Json | null
          is_system_role?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      Manager_Employees: {
        Row: {
          id: string
          manager_id: string
          employee_id: string
          assigned_date: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          manager_id: string
          employee_id: string
          assigned_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          manager_id?: string
          employee_id?: string
          assigned_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Manager_Employees_manager_id_fkey"
            columns: ["manager_id"]
            referencedRelation: "PMA_Users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Manager_Employees_employee_id_fkey"
            columns: ["employee_id"]
            referencedRelation: "PMA_Users"
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