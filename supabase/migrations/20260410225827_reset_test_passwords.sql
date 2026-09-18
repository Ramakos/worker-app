/*
  # Reset Test User Passwords
  
  This migration resets all test user passwords to 'password123'
  for debugging purposes.
*/

-- Update passwords for test users
UPDATE auth.users 
SET 
  encrypted_password = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm',
  updated_at = now()
WHERE email IN ('server1@test.com', 'server2@test.com', 'manager@test.com', 'cook1@test.com', 'counter1@test.com');
