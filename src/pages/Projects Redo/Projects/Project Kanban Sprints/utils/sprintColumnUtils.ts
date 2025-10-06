import { supabase } from '../../../../../lib/supabase';

export interface ProjectSprintUpdate {
  id: string;
  sprint_plan_column: string;
}

/**
 * Update a project's sprint_plan_column in the database
 */
export async function updateProjectSprintColumn(
  projectId: string, 
  columnType: string
): Promise<boolean> {
  try {
    const { data, error } = await (supabase as any)
      .from('PMA_Projects')
      .update({ 
        sprint_plan_column: columnType,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select();

    if (error) {
      console.error('Error updating project sprint column:', error);
      throw error;
    }

    console.log('Successfully updated project sprint column:', data);
    return true;
  } catch (error) {
    console.error('Failed to update project sprint column:', error);
    return false;
  }
}

/**
 * Fetch all Product Development projects that don't have a sprint column assigned (null or empty)
 */
export async function fetchProductDevelopmentProjects(): Promise<any[]> {
  try {
    // Fetch all Product Development projects
    const { data, error } = await (supabase as any)
      .from('PMA_Projects')
      .select(`
        id,
        name,
        description,
        priority,
        assignee_id,
        created_at,
        updated_at,
        start_date,
        end_date,
        deadline,
        progress,
        status,
        sprint_plan_column
      `)
      .eq('flow_chart', 'Product Development')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching Product Development projects:', error);
      throw error;
    }

    // Filter for projects with null or empty sprint_plan_column
    const filteredData = (data || []).filter((project: any) => 
      !project.sprint_plan_column || project.sprint_plan_column.trim() === ''
    );

    console.log(`Fetched ${filteredData.length} Product Development projects without sprint column assignment`);
    return filteredData;
  } catch (error) {
    console.error('Failed to fetch Product Development projects:', error);
    return [];
  }
}

/**
 * Fetch projects by sprint column type
 */
export async function fetchProjectsBySprintColumn(columnType: string): Promise<any[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('PMA_Projects')
      .select(`
        id,
        name,
        description,
        priority,
        assignee_id,
        created_at,
        updated_at,
        start_date,
        end_date,
        deadline,
        progress,
        status,
        sprint_plan_column
      `)
      .eq('flow_chart', 'Product Development')
      .eq('sprint_plan_column', columnType)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects by sprint column:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch projects by sprint column:', error);
    return [];
  }
}

/**
 * Fetch all projects organized by sprint columns
 */
export async function fetchAllSprintProjects(): Promise<Record<string, any[]>> {
  try {
    const { data, error } = await (supabase as any)
      .from('PMA_Projects')
      .select(`
        id,
        name,
        description,
        priority,
        assignee_id,
        created_at,
        updated_at,
        start_date,
        end_date,
        deadline,
        progress,
        status,
        sprint_plan_column
      `)
      .eq('flow_chart', 'Product Development')
      .not('sprint_plan_column', 'is', null)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching all sprint projects:', error);
      throw error;
    }

    // Group projects by sprint column
    const groupedProjects: Record<string, any[]> = {
      ongoing: [],
      parkinglot: [],
      sprint1: [],
      sprint2: [],
      inprogress: [],
      stuck: [],
      readyforqa: [],
      readyforrelease: [],
      done: []
    };

    (data || []).forEach((project: any) => {
      const dbColumn = project.sprint_plan_column?.toLowerCase();
      
      // Map database column values to frontend keys
      let frontendKey: string | null = null;
      
      switch (dbColumn) {
        case 'ongoing':
          frontendKey = 'ongoing';
          break;
        case 'parking_lot':
          frontendKey = 'parkinglot';
          break;
        case 'sprint_1':
          frontendKey = 'sprint1';
          break;
        case 'sprint_2':
          frontendKey = 'sprint2';
          break;
        case 'in_progress':
          frontendKey = 'inprogress';
          break;
        case 'stuck':
          frontendKey = 'stuck';
          break;
        case 'ready_for_qa':
          frontendKey = 'readyforqa';
          break;
        case 'ready_for_release':
          frontendKey = 'readyforrelease';
          break;
        case 'done':
          frontendKey = 'done';
          break;
      }
      
      if (frontendKey && groupedProjects[frontendKey]) {
        groupedProjects[frontendKey].push(project);
      }
    });

    return groupedProjects;
  } catch (error) {
    console.error('Failed to fetch all sprint projects:', error);
    return {
      ongoing: [],
      parkinglot: [],
      sprint1: [],
      sprint2: [],
      inprogress: [],
      stuck: [],
      readyforqa: [],
      readyforrelease: [],
      done: []
    };
  }
}

/**
 * Column type mappings for database values
 */
export const SPRINT_COLUMN_TYPES = {
  ongoing: 'ongoing',
  parkinglot: 'parking_lot',
  sprint1: 'sprint_1',
  sprint2: 'sprint_2',
  inprogress: 'in_progress',
  stuck: 'stuck',
  readyforqa: 'ready_for_qa',
  readyforrelease: 'ready_for_release',
  done: 'done'
} as const;

export type SprintColumnType = keyof typeof SPRINT_COLUMN_TYPES;
