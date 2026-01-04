/**
 * Database TypeScript types
 *
 * This file will be auto-generated when you run:
 * supabase gen types typescript --local > src/types/database.ts
 *
 * For now, this is a placeholder. After creating migrations and starting
 * Supabase locally or linking to a cloud project, regenerate this file.
 */

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
      // Tables will be auto-generated after running migrations
      [key: string]: any
    }
    Views: {
      [key: string]: any
    }
    Functions: {
      [key: string]: any
    }
    Enums: {
      [key: string]: string
    }
  }
}
