import { supabase } from "../config/supabase"

export function subscribeLocations(userId, callback) {

  return supabase
    .channel('locations')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        table: 'locations'
      },
      payload => callback(payload.new)
    )
    .subscribe()
}