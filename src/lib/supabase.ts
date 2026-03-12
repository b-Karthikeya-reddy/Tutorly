import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://fjunktsgswfdhnolhjck.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqdW5rdHNnc3dmZGhub2xoamNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNjY3MDYsImV4cCI6MjA4ODg0MjcwNn0.4cN4Vo-7_dxP-xcpP5aECepbl-1AvHaYDQbrSoEtq-8";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);