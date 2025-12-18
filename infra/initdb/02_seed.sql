-- USERS
INSERT INTO users (email, name, phone_number, role)
VALUES
  ('alice@example.com', 'Alice Martin', '+33600000001', 'admin'),
  ('bob@example.com',   'Bob Dupont',   '+33600000002', 'user'),
  ('chloe@example.com', 'Chloé Leroy',  '+33600000003', 'user');

-- TEAMS
INSERT INTO teams (name, description)
VALUES
  ('Platform', 'Infra, Kubernetes, bases de données'),
  ('Frontend', 'UI web et expérience utilisateur');

-- TEAM_MEMBERS
INSERT INTO team_members (team_id, user_id, is_manager)
VALUES
  (1, 1, TRUE),  -- Alice manager Platform
  (1, 2, FALSE), -- Bob dans Platform
  (2, 1, TRUE),  -- Alice manager Frontend
  (2, 3, FALSE); -- Chloé dans Frontend

-- SERVICES
INSERT INTO services (name, description, team_id)
VALUES
  ('api-gateway', 'Gateway HTTP principale', 1),
  ('billing',     'Service de facturation',  1),
  ('web-app',     'Frontend React public',   2);

-- INCIDENTS
INSERT INTO incidents (title, description, status, severity, service_id, acknowledged_at, resolved_at, acknowledged_by)
VALUES
  ('API 5xx spike', 'Pic de 5xx sur /api/v1/incidents', 'ACKED', 1, 1,
   NOW() - INTERVAL '20 minutes', NULL, 1),
  ('Billing latency', 'Latence élevée sur les paiements', 'OPEN', 2, 2,
   NULL, NULL, NULL),
  ('Homepage down', 'Erreur 500 sur /', 'RESOLVED', 1, 3,
   NOW() - INTERVAL '2 hours', NOW() - INTERVAL '90 minutes', 3);

-- ALERTS
INSERT INTO alerts (incident_id, source, external_id, payload, status)
VALUES
  (1, 'prometheus', 'alert-123', '{"metric":"http_5xx_rate","value":0.42}'::jsonb, 'OPEN'),
  (1, 'prometheus', 'alert-124', '{"metric":"http_5xx_rate","value":0.37}'::jsonb, 'OPEN'),
  (2, 'custom',     'billing-001', '{"metric":"latency_p95","value":1800}'::jsonb, 'OPEN'),
  (3, 'uptime',     'ping-01', '{"status":"down"}'::jsonb, 'CLOSED');

-- ESCALATION_POLICIES
INSERT INTO escalation_policies (name, description, service_id)
VALUES
  ('API critical policy', 'Escalade rapide sur incidents API critiques', 1),
  ('Billing policy',      'Escalade standard pour la facturation',       2);

-- ESCALATION_POLICY_LEVELS
INSERT INTO escalation_policy_levels (escalation_policy_id, level_index, delay_minutes, user_id, team_id)
VALUES
  (1, 1, 0, 1, NULL),  -- API: notifie Alice directement
  (1, 2, 15, NULL, 1), -- API: après 15 min, notifie toute la team Platform
  (2, 1, 0, 2, NULL),  -- Billing: Bob en premier niveau
  (2, 2, 20, 1, NULL); -- puis Alice

-- ONCALL_SCHEDULES
INSERT INTO oncall_schedules (name, description, team_id)
VALUES
  ('Platform primary', 'Astreinte principale team Platform', 1),
  ('Frontend primary', 'Astreinte principale Frontend',      2);

-- ONCALL_SHIFTS
INSERT INTO oncall_shifts (schedule_id, user_id, starts_at, ends_at)
VALUES
  -- Platform: Alice est on-call maintenant
  (1, 1, NOW() - INTERVAL '4 hours', NOW() + INTERVAL '20 hours'),
  -- Frontend: Chloé est on-call maintenant
  (2, 3, NOW() - INTERVAL '2 hours', NOW() + INTERVAL '22 hours');

-- NOTIFICATIONS
INSERT INTO notifications (incident_id, user_id, channel, status, error_message)
VALUES
  (1, 1, 'sms',   'SENT',   NULL),
  (1, 1, 'email', 'SENT',   NULL),
  (2, 2, 'sms',   'FAILED', 'Twilio timeout'),
  (3, 3, 'email', 'SENT',   NULL);

-- INCIDENT_NOTES
INSERT INTO incident_notes (incident_id, author_id, body)
VALUES
  (1, 1, 'Investigating spike on api-gateway, looks related to deploy #102.'),
  (1, 2, 'Rolled back to previous version, errors starting to decrease.'),
  (3, 3, 'Issue was due to misconfigured Nginx rule, fixed and monitored 30 minutes.');
