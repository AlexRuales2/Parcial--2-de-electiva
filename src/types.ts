export interface Member {
  id?: number
  name: string
  role?: string
  email?: string
  team_id?: number
}

export interface Project {
  id?: number
  name: string
  description?: string
  budget?: number
  created_at?: string
}

export interface Expense {
  id?: number
  project_id: number
  member_id?: number
  amount: number
  description?: string
  incurred_at?: string
  member_name?: string
  member_role?: string
}
