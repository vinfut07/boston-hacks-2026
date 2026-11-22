/**
 * Allowed values for text columns that the database restricts with CHECK
 * constraints. Postgres reports these columns as plain `string`, so the
 * generated database.types.ts can't express them; use these types instead.
 * Keep in sync with supabase/migrations/ when a constraint changes.
 */

/** sidequests.status */
export type SidequestStatus = 'draft' | 'published' | 'archived'

/** user_sidequests.status: a user's progress on one sidequest */
export type UserSidequestStatus = 'saved' | 'signed_up' | 'in_progress' | 'completed' | 'aborted'

/** experiences.category and sidequests.category */
export type Category = 'food_drink' | 'outdoors' | 'arts_culture' | 'shopping' | 'attractions' | 'affordable'

/** sidequest_stops.travel_mode_to_stop */
export type TravelMode = 'walk' | 'bike' | 'bus' | 'train'

/** sidequests.primary_line: main T line, sets the card colour */
export type TransitLine = 'rl' | 'gl' | 'bl' | 'ol' | 'sl' | 'cr'

/** checklist_items.item_type */
export type ChecklistItemType = 'see' | 'do'
