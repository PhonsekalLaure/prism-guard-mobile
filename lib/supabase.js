// lib/supabase.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://axykkbumcoxoevoxcurw.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4eWtrYnVtY294b2V2b3hjdXJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyOTI1NTAsImV4cCI6MjA5MDg2ODU1MH0.X0kdYZassL4fGskcJIMBcR8YQ-dEdtcEOL_a7Stf8ik";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);