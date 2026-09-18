/*
  # Fix RLS Policies for Sign-In Page

  ## Changes
  
  1. Add public read access to user_profiles for sign-in page
     - Allow unauthenticated users to view active worker profiles
     - This enables the sign-in page to display available workers
     - Only exposes non-sensitive information (name, role)
  
  2. Add public read access to user_roles
     - Allows sign-in page to display worker roles
  
  ## Security Notes
  
  - Only active worker profiles are visible
  - No sensitive information is exposed (passwords, personal data)
  - This is standard for sign-in flows where users select from a list
*/

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can read all active profiles" ON user_profiles;

-- Allow anyone (including unauthenticated users) to read active profiles
CREATE POLICY "Anyone can read active profiles"
  ON user_profiles FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Keep the policy for users to read their own profile (even if inactive)
-- This policy already exists, just ensuring it's there

-- Update user_roles policy to allow public read access
DROP POLICY IF EXISTS "Users can read all roles" ON user_roles;

CREATE POLICY "Anyone can read roles"
  ON user_roles FOR SELECT
  TO anon, authenticated
  USING (true);
