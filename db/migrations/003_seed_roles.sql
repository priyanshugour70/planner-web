INSERT INTO roles (slug, name, description) VALUES
  ('user', 'User', 'Default application user'),
  ('admin', 'Administrator', 'Administrative access'),
  ('super_admin', 'Super Admin', 'Full platform access')
ON CONFLICT (slug) DO NOTHING;
