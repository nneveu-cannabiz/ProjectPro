-- Function to create updates when project or task fields change
CREATE OR REPLACE FUNCTION create_field_change_updates()
RETURNS TRIGGER AS $$
DECLARE
    update_message TEXT;
    entity_name TEXT;
    user_id_to_use TEXT;
BEGIN
    -- Get the entity name (project or task name)
    IF TG_TABLE_NAME = 'PMA_Projects' THEN
        entity_name := COALESCE(NEW.name, OLD.name);
        -- Use the current assignee, or try to get a system user, or use NULL
        user_id_to_use := COALESCE(NEW.assignee_id, OLD.assignee_id);
        -- If still no user, try to get the first admin user or use NULL
        IF user_id_to_use IS NULL THEN
            SELECT id INTO user_id_to_use FROM "PMA_Users" LIMIT 1;
        END IF;
    ELSIF TG_TABLE_NAME = 'PMA_Tasks' THEN
        entity_name := COALESCE(NEW.name, OLD.name);
        -- Use the current assignee, or try to get a system user, or use NULL
        user_id_to_use := COALESCE(NEW.assignee_id, OLD.assignee_id);
        -- If still no user, try to get the first admin user or use NULL
        IF user_id_to_use IS NULL THEN
            SELECT id INTO user_id_to_use FROM "PMA_Users" LIMIT 1;
        END IF;
    END IF;

    -- Handle INSERT operations (new records)
    IF TG_OP = 'INSERT' THEN
        update_message := 'Created ' || LOWER(REPLACE(TG_TABLE_NAME, 'PMA_', '')) || ': ' || entity_name;
        
        INSERT INTO "PMA_Updates" (
            id, message, user_id, entity_type, entity_id, created_at
        ) VALUES (
            gen_random_uuid(),
            update_message,
            user_id_to_use,
            CASE 
                WHEN TG_TABLE_NAME = 'PMA_Projects' THEN 'project'
                WHEN TG_TABLE_NAME = 'PMA_Tasks' THEN 'task'
            END,
            NEW.id,
            NOW()
        );
        
        RETURN NEW;
    END IF;

    -- Handle UPDATE operations (field changes)
    IF TG_OP = 'UPDATE' THEN
        -- Check for assignee changes
        IF OLD.assignee_id IS DISTINCT FROM NEW.assignee_id THEN
            IF NEW.assignee_id IS NULL THEN
                update_message := 'Removed assignee from ' || LOWER(REPLACE(TG_TABLE_NAME, 'PMA_', '')) || ': ' || entity_name;
            ELSIF OLD.assignee_id IS NULL THEN
                update_message := 'Assigned ' || LOWER(REPLACE(TG_TABLE_NAME, 'PMA_', '')) || ' to user: ' || entity_name;
            ELSE
                update_message := 'Changed assignee for ' || LOWER(REPLACE(TG_TABLE_NAME, 'PMA_', '')) || ': ' || entity_name;
            END IF;
            
            INSERT INTO "PMA_Updates" (
                id, message, user_id, entity_type, entity_id, created_at
            ) VALUES (
                gen_random_uuid(),
                update_message,
                user_id_to_use,
                CASE 
                    WHEN TG_TABLE_NAME = 'PMA_Projects' THEN 'project'
                    WHEN TG_TABLE_NAME = 'PMA_Tasks' THEN 'task'
                END,
                NEW.id,
                NOW()
            );
        END IF;

        -- Check for multi-assignee changes (projects only)
        IF TG_TABLE_NAME = 'PMA_Projects' AND OLD.multi_assignee_id IS DISTINCT FROM NEW.multi_assignee_id THEN
            update_message := 'Updated team members for project: ' || entity_name;
            
            INSERT INTO "PMA_Updates" (
                id, message, user_id, entity_type, entity_id, created_at
            ) VALUES (
                gen_random_uuid(),
                update_message,
                user_id_to_use,
                'project',
                NEW.id,
                NOW()
            );
        END IF;

        -- Check for status changes
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            update_message := 'Changed status from "' || 
                CASE OLD.status 
                    WHEN 'todo' THEN 'To Do'
                    WHEN 'in-progress' THEN 'In Progress' 
                    WHEN 'done' THEN 'Done'
                    ELSE OLD.status 
                END || '" to "' || 
                CASE NEW.status 
                    WHEN 'todo' THEN 'To Do'
                    WHEN 'in-progress' THEN 'In Progress' 
                    WHEN 'done' THEN 'Done'
                    ELSE NEW.status 
                END || '" for ' || LOWER(REPLACE(TG_TABLE_NAME, 'PMA_', '')) || ': ' || entity_name;
            
            INSERT INTO "PMA_Updates" (
                id, message, user_id, entity_type, entity_id, created_at
            ) VALUES (
                gen_random_uuid(),
                update_message,
                user_id_to_use,
                CASE 
                    WHEN TG_TABLE_NAME = 'PMA_Projects' THEN 'project'
                    WHEN TG_TABLE_NAME = 'PMA_Tasks' THEN 'task'
                END,
                NEW.id,
                NOW()
            );
        END IF;

        -- Check for priority changes (tasks only)
        IF TG_TABLE_NAME = 'PMA_Tasks' AND OLD.priority IS DISTINCT FROM NEW.priority THEN
            IF NEW.priority IS NULL THEN
                update_message := 'Removed priority from task: ' || entity_name;
            ELSIF OLD.priority IS NULL THEN
                update_message := 'Set priority to "' || NEW.priority || '" for task: ' || entity_name;
            ELSE
                update_message := 'Changed priority from "' || OLD.priority || '" to "' || NEW.priority || '" for task: ' || entity_name;
            END IF;
            
            INSERT INTO "PMA_Updates" (
                id, message, user_id, entity_type, entity_id, created_at
            ) VALUES (
                gen_random_uuid(),
                update_message,
                user_id_to_use,
                'task',
                NEW.id,
                NOW()
            );
        END IF;

        -- Check for project type changes (projects only)
        IF TG_TABLE_NAME = 'PMA_Projects' AND OLD.project_type IS DISTINCT FROM NEW.project_type THEN
            update_message := 'Changed project type from "' || 
                COALESCE(OLD.project_type, 'None') || '" to "' || 
                COALESCE(NEW.project_type, 'None') || '" for project: ' || entity_name;
            
            INSERT INTO "PMA_Updates" (
                id, message, user_id, entity_type, entity_id, created_at
            ) VALUES (
                gen_random_uuid(),
                update_message,
                user_id_to_use,
                'project',
                NEW.id,
                NOW()
            );
        END IF;

        -- Check for start date changes
        IF OLD.start_date IS DISTINCT FROM NEW.start_date THEN
            IF NEW.start_date IS NULL THEN
                update_message := 'Removed start date from ' || LOWER(REPLACE(TG_TABLE_NAME, 'PMA_', '')) || ': ' || entity_name;
            ELSIF OLD.start_date IS NULL THEN
                update_message := 'Set start date to ' || TO_CHAR(NEW.start_date, 'Mon DD, YYYY') || ' for ' || LOWER(REPLACE(TG_TABLE_NAME, 'PMA_', '')) || ': ' || entity_name;
            ELSE
                update_message := 'Changed start date from ' || TO_CHAR(OLD.start_date, 'Mon DD, YYYY') || ' to ' || TO_CHAR(NEW.start_date, 'Mon DD, YYYY') || ' for ' || LOWER(REPLACE(TG_TABLE_NAME, 'PMA_', '')) || ': ' || entity_name;
            END IF;
            
            INSERT INTO "PMA_Updates" (
                id, message, user_id, entity_type, entity_id, created_at
            ) VALUES (
                gen_random_uuid(),
                update_message,
                user_id_to_use,
                CASE 
                    WHEN TG_TABLE_NAME = 'PMA_Projects' THEN 'project'
                    WHEN TG_TABLE_NAME = 'PMA_Tasks' THEN 'task'
                END,
                NEW.id,
                NOW()
            );
        END IF;

        -- Check for end date changes
        IF OLD.end_date IS DISTINCT FROM NEW.end_date THEN
            IF NEW.end_date IS NULL THEN
                update_message := 'Removed end date from ' || LOWER(REPLACE(TG_TABLE_NAME, 'PMA_', '')) || ': ' || entity_name;
            ELSIF OLD.end_date IS NULL THEN
                update_message := 'Set end date to ' || TO_CHAR(NEW.end_date, 'Mon DD, YYYY') || ' for ' || LOWER(REPLACE(TG_TABLE_NAME, 'PMA_', '')) || ': ' || entity_name;
            ELSE
                update_message := 'Changed end date from ' || TO_CHAR(OLD.end_date, 'Mon DD, YYYY') || ' to ' || TO_CHAR(NEW.end_date, 'Mon DD, YYYY') || ' for ' || LOWER(REPLACE(TG_TABLE_NAME, 'PMA_', '')) || ': ' || entity_name;
            END IF;
            
            INSERT INTO "PMA_Updates" (
                id, message, user_id, entity_type, entity_id, created_at
            ) VALUES (
                gen_random_uuid(),
                update_message,
                user_id_to_use,
                CASE 
                    WHEN TG_TABLE_NAME = 'PMA_Projects' THEN 'project'
                    WHEN TG_TABLE_NAME = 'PMA_Tasks' THEN 'task'
                END,
                NEW.id,
                NOW()
            );
        END IF;

        -- Check for deadline changes
        IF OLD.deadline IS DISTINCT FROM NEW.deadline THEN
            IF NEW.deadline IS NULL THEN
                update_message := 'Removed deadline from ' || LOWER(REPLACE(TG_TABLE_NAME, 'PMA_', '')) || ': ' || entity_name;
            ELSIF OLD.deadline IS NULL THEN
                update_message := 'Set deadline to ' || TO_CHAR(NEW.deadline, 'Mon DD, YYYY') || ' for ' || LOWER(REPLACE(TG_TABLE_NAME, 'PMA_', '')) || ': ' || entity_name;
            ELSE
                update_message := 'Changed deadline from ' || TO_CHAR(OLD.deadline, 'Mon DD, YYYY') || ' to ' || TO_CHAR(NEW.deadline, 'Mon DD, YYYY') || ' for ' || LOWER(REPLACE(TG_TABLE_NAME, 'PMA_', '')) || ': ' || entity_name;
            END IF;
            
            INSERT INTO "PMA_Updates" (
                id, message, user_id, entity_type, entity_id, created_at
            ) VALUES (
                gen_random_uuid(),
                update_message,
                user_id_to_use,
                CASE 
                    WHEN TG_TABLE_NAME = 'PMA_Projects' THEN 'project'
                    WHEN TG_TABLE_NAME = 'PMA_Tasks' THEN 'task'
                END,
                NEW.id,
                NOW()
            );
        END IF;

        -- Check for progress changes
        IF OLD.progress IS DISTINCT FROM NEW.progress THEN
            IF NEW.progress IS NULL THEN
                update_message := 'Removed progress from ' || LOWER(REPLACE(TG_TABLE_NAME, 'PMA_', '')) || ': ' || entity_name;
            ELSIF OLD.progress IS NULL THEN
                update_message := 'Set progress to ' || NEW.progress || '% for ' || LOWER(REPLACE(TG_TABLE_NAME, 'PMA_', '')) || ': ' || entity_name;
            ELSE
                update_message := 'Updated progress from ' || OLD.progress || '% to ' || NEW.progress || '% for ' || LOWER(REPLACE(TG_TABLE_NAME, 'PMA_', '')) || ': ' || entity_name;
            END IF;
            
            INSERT INTO "PMA_Updates" (
                id, message, user_id, entity_type, entity_id, created_at
            ) VALUES (
                gen_random_uuid(),
                update_message,
                user_id_to_use,
                CASE 
                    WHEN TG_TABLE_NAME = 'PMA_Projects' THEN 'project'
                    WHEN TG_TABLE_NAME = 'PMA_Tasks' THEN 'task'
                END,
                NEW.id,
                NOW()
            );
        END IF;

        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for PMA_Projects table
DROP TRIGGER IF EXISTS projects_field_changes_trigger ON "PMA_Projects";
CREATE TRIGGER projects_field_changes_trigger
    AFTER INSERT OR UPDATE ON "PMA_Projects"
    FOR EACH ROW
    EXECUTE FUNCTION create_field_change_updates();

-- Create triggers for PMA_Tasks table
DROP TRIGGER IF EXISTS tasks_field_changes_trigger ON "PMA_Tasks";
CREATE TRIGGER tasks_field_changes_trigger
    AFTER INSERT OR UPDATE ON "PMA_Tasks"
    FOR EACH ROW
    EXECUTE FUNCTION create_field_change_updates();

-- Optional: Create a similar trigger for subtasks if needed
DROP TRIGGER IF EXISTS subtasks_field_changes_trigger ON "PMA_SubTasks";
CREATE TRIGGER subtasks_field_changes_trigger
    AFTER INSERT OR UPDATE ON "PMA_SubTasks"
    FOR EACH ROW
    EXECUTE FUNCTION create_field_change_updates();

-- Test the triggers with some sample updates (optional - comment out if not needed for testing)
/*
-- Example test queries (uncomment to test):
UPDATE "PMA_Projects" 
SET status = 'in-progress' 
WHERE id = (SELECT id FROM "PMA_Projects" LIMIT 1);

UPDATE "PMA_Tasks" 
SET priority = 'High', deadline = '2024-12-31' 
WHERE id = (SELECT id FROM "PMA_Tasks" LIMIT 1);
*/

