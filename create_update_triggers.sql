-- Function to create updates when project or task fields change
CREATE OR REPLACE FUNCTION create_field_change_updates()
RETURNS TRIGGER AS $$
DECLARE
    update_message TEXT;
    entity_name TEXT;
    user_id_to_use TEXT;
BEGIN
    -- Add error handling to prevent trigger from failing silently
    BEGIN
    -- Get the entity name (project or task name)
    IF TG_TABLE_NAME = 'PMA_Projects' THEN
        entity_name := COALESCE(NEW.name, COALESCE(OLD.name, 'Unknown Project'));
    ELSIF TG_TABLE_NAME = 'PMA_Tasks' THEN
        entity_name := COALESCE(NEW.name, COALESCE(OLD.name, 'Unknown Task'));
    END IF;
    
    -- Get the current user who is making the update
    -- Try to get from current session, otherwise use a fallback
    BEGIN
        -- Try to get the current user from the session
        user_id_to_use := current_setting('app.current_user_id', true);
        
        -- If not set in session, try to get from auth.uid() (Supabase function)
        IF user_id_to_use IS NULL OR user_id_to_use = '' THEN
            user_id_to_use := auth.uid()::text;
        END IF;
        
        -- If still no user, use a system fallback
        IF user_id_to_use IS NULL OR user_id_to_use = '' THEN
            SELECT id::text INTO user_id_to_use FROM "PMA_Users" LIMIT 1;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            -- Fallback to first user if all else fails
            SELECT id::text INTO user_id_to_use FROM "PMA_Users" LIMIT 1;
    END;

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
        -- Check for assignee changes (handle NULL values safely)
        IF (TG_TABLE_NAME = 'PMA_Projects' AND 
            COALESCE(OLD.assignee_id::text, '') IS DISTINCT FROM COALESCE(NEW.assignee_id::text, '')) OR
           (TG_TABLE_NAME = 'PMA_Tasks' AND 
            COALESCE(OLD.assignee_id, '') IS DISTINCT FROM COALESCE(NEW.assignee_id, '')) THEN
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

        -- Check for multi-assignee changes (projects only - field doesn't exist in tasks)
        IF TG_TABLE_NAME = 'PMA_Projects' THEN
            BEGIN
                IF COALESCE(OLD.multi_assignee_id::text, '') IS DISTINCT FROM COALESCE(NEW.multi_assignee_id::text, '') THEN
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
            EXCEPTION
                WHEN OTHERS THEN
                    -- Field doesn't exist or other error, skip this check
                    NULL;
            END;
        END IF;

        -- Check for status changes (defensive)
        BEGIN
            IF COALESCE(OLD.status, '') IS DISTINCT FROM COALESCE(NEW.status, '') THEN
                update_message := 'Changed status from "' || 
                    CASE COALESCE(OLD.status, '')
                        WHEN 'todo' THEN 'To Do'
                        WHEN 'in-progress' THEN 'In Progress' 
                        WHEN 'done' THEN 'Done'
                        WHEN '' THEN 'None'
                        ELSE COALESCE(OLD.status, 'Unknown')
                    END || '" to "' || 
                    CASE COALESCE(NEW.status, '')
                        WHEN 'todo' THEN 'To Do'
                        WHEN 'in-progress' THEN 'In Progress' 
                        WHEN 'done' THEN 'Done'
                        WHEN '' THEN 'None'
                        ELSE COALESCE(NEW.status, 'Unknown')
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
        EXCEPTION
            WHEN OTHERS THEN
                -- Field doesn't exist or other error, skip this check
                NULL;
        END;

        -- Check for priority changes (tasks only - field may not exist in all tables)
        IF TG_TABLE_NAME = 'PMA_Tasks' THEN
            BEGIN
                IF COALESCE(OLD.priority, '') IS DISTINCT FROM COALESCE(NEW.priority, '') THEN
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
            EXCEPTION
                WHEN OTHERS THEN
                    -- Field doesn't exist or other error, skip this check
                    NULL;
            END;
        END IF;

        -- Check for project type changes (projects only - field doesn't exist in tasks)
        IF TG_TABLE_NAME = 'PMA_Projects' THEN
            BEGIN
                IF COALESCE(OLD.project_type, '') IS DISTINCT FROM COALESCE(NEW.project_type, '') THEN
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
            EXCEPTION
                WHEN OTHERS THEN
                    -- Field doesn't exist or other error, skip this check
                    NULL;
            END;
        END IF;

        -- Check for start date changes (defensive)
        BEGIN
            IF COALESCE(OLD.start_date::text, '') IS DISTINCT FROM COALESCE(NEW.start_date::text, '') THEN
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
        EXCEPTION
            WHEN OTHERS THEN
                -- Field doesn't exist or other error, skip this check
                NULL;
        END;

        -- Check for end date changes (defensive)
        BEGIN
            IF COALESCE(OLD.end_date::text, '') IS DISTINCT FROM COALESCE(NEW.end_date::text, '') THEN
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
        EXCEPTION
            WHEN OTHERS THEN
                -- Field doesn't exist or other error, skip this check
                NULL;
        END;

        -- Check for deadline changes (defensive)
        BEGIN
            IF COALESCE(OLD.deadline::text, '') IS DISTINCT FROM COALESCE(NEW.deadline::text, '') THEN
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
        EXCEPTION
            WHEN OTHERS THEN
                -- Field doesn't exist or other error, skip this check
                NULL;
        END;

        -- Check for progress changes (defensive)
        BEGIN
            IF COALESCE(OLD.progress, -1) IS DISTINCT FROM COALESCE(NEW.progress, -1) THEN
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
        EXCEPTION
            WHEN OTHERS THEN
                -- Field doesn't exist or other error, skip this check
                NULL;
        END;

        RETURN NEW;
    END IF;

    RETURN NULL;
    
    EXCEPTION
        WHEN OTHERS THEN
            -- Log the error but don't fail the original operation
            RAISE WARNING 'Error in create_field_change_updates trigger: %, SQLSTATE: %', SQLERRM, SQLSTATE;
            -- Return the appropriate record to continue the operation
            IF TG_OP = 'DELETE' THEN
                RETURN OLD;
            ELSE
                RETURN NEW;
            END IF;
    END; -- End of BEGIN block for error handling
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

