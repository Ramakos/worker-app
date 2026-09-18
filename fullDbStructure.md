| table_schema        | table_name                 | column_name                  | ordinal_position | data_type                   | is_nullable | column_default                                  |
| ------------------- | -------------------------- | ---------------------------- | ---------------- | --------------------------- | ----------- | ----------------------------------------------- |
| auth                | audit_log_entries          | instance_id                  | 1                | uuid                        | YES         | null                                            |
| auth                | audit_log_entries          | id                           | 2                | uuid                        | NO          | null                                            |
| auth                | audit_log_entries          | payload                      | 3                | json                        | YES         | null                                            |
| auth                | audit_log_entries          | created_at                   | 4                | timestamp with time zone    | YES         | null                                            |
| auth                | audit_log_entries          | ip_address                   | 5                | character varying           | NO          | ''::character varying                           |
| auth                | custom_oauth_providers     | id                           | 1                | uuid                        | NO          | gen_random_uuid()                               |
| auth                | custom_oauth_providers     | provider_type                | 2                | text                        | NO          | null                                            |
| auth                | custom_oauth_providers     | identifier                   | 3                | text                        | NO          | null                                            |
| auth                | custom_oauth_providers     | name                         | 4                | text                        | NO          | null                                            |
| auth                | custom_oauth_providers     | client_id                    | 5                | text                        | NO          | null                                            |
| auth                | custom_oauth_providers     | client_secret                | 6                | text                        | NO          | null                                            |
| auth                | custom_oauth_providers     | acceptable_client_ids        | 7                | ARRAY                       | NO          | '{}'::text[]                                    |
| auth                | custom_oauth_providers     | scopes                       | 8                | ARRAY                       | NO          | '{}'::text[]                                    |
| auth                | custom_oauth_providers     | pkce_enabled                 | 9                | boolean                     | NO          | true                                            |
| auth                | custom_oauth_providers     | attribute_mapping            | 10               | jsonb                       | NO          | '{}'::jsonb                                     |
| auth                | custom_oauth_providers     | authorization_params         | 11               | jsonb                       | NO          | '{}'::jsonb                                     |
| auth                | custom_oauth_providers     | enabled                      | 12               | boolean                     | NO          | true                                            |
| auth                | custom_oauth_providers     | email_optional               | 13               | boolean                     | NO          | false                                           |
| auth                | custom_oauth_providers     | issuer                       | 14               | text                        | YES         | null                                            |
| auth                | custom_oauth_providers     | discovery_url                | 15               | text                        | YES         | null                                            |
| auth                | custom_oauth_providers     | skip_nonce_check             | 16               | boolean                     | NO          | false                                           |
| auth                | custom_oauth_providers     | cached_discovery             | 17               | jsonb                       | YES         | null                                            |
| auth                | custom_oauth_providers     | discovery_cached_at          | 18               | timestamp with time zone    | YES         | null                                            |
| auth                | custom_oauth_providers     | authorization_url            | 19               | text                        | YES         | null                                            |
| auth                | custom_oauth_providers     | token_url                    | 20               | text                        | YES         | null                                            |
| auth                | custom_oauth_providers     | userinfo_url                 | 21               | text                        | YES         | null                                            |
| auth                | custom_oauth_providers     | jwks_uri                     | 22               | text                        | YES         | null                                            |
| auth                | custom_oauth_providers     | created_at                   | 23               | timestamp with time zone    | NO          | now()                                           |
| auth                | custom_oauth_providers     | updated_at                   | 24               | timestamp with time zone    | NO          | now()                                           |
| auth                | flow_state                 | id                           | 1                | uuid                        | NO          | null                                            |
| auth                | flow_state                 | user_id                      | 2                | uuid                        | YES         | null                                            |
| auth                | flow_state                 | auth_code                    | 3                | text                        | YES         | null                                            |
| auth                | flow_state                 | code_challenge_method        | 4                | USER-DEFINED                | YES         | null                                            |
| auth                | flow_state                 | code_challenge               | 5                | text                        | YES         | null                                            |
| auth                | flow_state                 | provider_type                | 6                | text                        | NO          | null                                            |
| auth                | flow_state                 | provider_access_token        | 7                | text                        | YES         | null                                            |
| auth                | flow_state                 | provider_refresh_token       | 8                | text                        | YES         | null                                            |
| auth                | flow_state                 | created_at                   | 9                | timestamp with time zone    | YES         | null                                            |
| auth                | flow_state                 | updated_at                   | 10               | timestamp with time zone    | YES         | null                                            |
| auth                | flow_state                 | authentication_method        | 11               | text                        | NO          | null                                            |
| auth                | flow_state                 | auth_code_issued_at          | 12               | timestamp with time zone    | YES         | null                                            |
| auth                | flow_state                 | invite_token                 | 13               | text                        | YES         | null                                            |
| auth                | flow_state                 | referrer                     | 14               | text                        | YES         | null                                            |
| auth                | flow_state                 | oauth_client_state_id        | 15               | uuid                        | YES         | null                                            |
| auth                | flow_state                 | linking_target_id            | 16               | uuid                        | YES         | null                                            |
| auth                | flow_state                 | email_optional               | 17               | boolean                     | NO          | false                                           |
| auth                | identities                 | provider_id                  | 1                | text                        | NO          | null                                            |
| auth                | identities                 | user_id                      | 2                | uuid                        | NO          | null                                            |
| auth                | identities                 | identity_data                | 3                | jsonb                       | NO          | null                                            |
| auth                | identities                 | provider                     | 4                | text                        | NO          | null                                            |
| auth                | identities                 | last_sign_in_at              | 5                | timestamp with time zone    | YES         | null                                            |
| auth                | identities                 | created_at                   | 6                | timestamp with time zone    | YES         | null                                            |
| auth                | identities                 | updated_at                   | 7                | timestamp with time zone    | YES         | null                                            |
| auth                | identities                 | email                        | 8                | text                        | YES         | null                                            |
| auth                | identities                 | id                           | 9                | uuid                        | NO          | gen_random_uuid()                               |
| auth                | instances                  | id                           | 1                | uuid                        | NO          | null                                            |
| auth                | instances                  | uuid                         | 2                | uuid                        | YES         | null                                            |
| auth                | instances                  | raw_base_config              | 3                | text                        | YES         | null                                            |
| auth                | instances                  | created_at                   | 4                | timestamp with time zone    | YES         | null                                            |
| auth                | instances                  | updated_at                   | 5                | timestamp with time zone    | YES         | null                                            |
| auth                | mfa_amr_claims             | session_id                   | 1                | uuid                        | NO          | null                                            |
| auth                | mfa_amr_claims             | created_at                   | 2                | timestamp with time zone    | NO          | null                                            |
| auth                | mfa_amr_claims             | updated_at                   | 3                | timestamp with time zone    | NO          | null                                            |
| auth                | mfa_amr_claims             | authentication_method        | 4                | text                        | NO          | null                                            |
| auth                | mfa_amr_claims             | id                           | 5                | uuid                        | NO          | null                                            |
| auth                | mfa_challenges             | id                           | 1                | uuid                        | NO          | null                                            |
| auth                | mfa_challenges             | factor_id                    | 2                | uuid                        | NO          | null                                            |
| auth                | mfa_challenges             | created_at                   | 3                | timestamp with time zone    | NO          | null                                            |
| auth                | mfa_challenges             | verified_at                  | 4                | timestamp with time zone    | YES         | null                                            |
| auth                | mfa_challenges             | ip_address                   | 5                | inet                        | NO          | null                                            |
| auth                | mfa_challenges             | otp_code                     | 6                | text                        | YES         | null                                            |
| auth                | mfa_challenges             | web_authn_session_data       | 7                | jsonb                       | YES         | null                                            |
| auth                | mfa_factors                | id                           | 1                | uuid                        | NO          | null                                            |
| auth                | mfa_factors                | user_id                      | 2                | uuid                        | NO          | null                                            |
| auth                | mfa_factors                | friendly_name                | 3                | text                        | YES         | null                                            |
| auth                | mfa_factors                | factor_type                  | 4                | USER-DEFINED                | NO          | null                                            |
| auth                | mfa_factors                | status                       | 5                | USER-DEFINED                | NO          | null                                            |
| auth                | mfa_factors                | created_at                   | 6                | timestamp with time zone    | NO          | null                                            |
| auth                | mfa_factors                | updated_at                   | 7                | timestamp with time zone    | NO          | null                                            |
| auth                | mfa_factors                | secret                       | 8                | text                        | YES         | null                                            |
| auth                | mfa_factors                | phone                        | 9                | text                        | YES         | null                                            |
| auth                | mfa_factors                | last_challenged_at           | 10               | timestamp with time zone    | YES         | null                                            |
| auth                | mfa_factors                | web_authn_credential         | 11               | jsonb                       | YES         | null                                            |
| auth                | mfa_factors                | web_authn_aaguid             | 12               | uuid                        | YES         | null                                            |
| auth                | mfa_factors                | last_webauthn_challenge_data | 13               | jsonb                       | YES         | null                                            |
| auth                | oauth_authorizations       | id                           | 1                | uuid                        | NO          | null                                            |
| auth                | oauth_authorizations       | authorization_id             | 2                | text                        | NO          | null                                            |
| auth                | oauth_authorizations       | client_id                    | 3                | uuid                        | NO          | null                                            |
| auth                | oauth_authorizations       | user_id                      | 4                | uuid                        | YES         | null                                            |
| auth                | oauth_authorizations       | redirect_uri                 | 5                | text                        | NO          | null                                            |
| auth                | oauth_authorizations       | scope                        | 6                | text                        | NO          | null                                            |
| auth                | oauth_authorizations       | state                        | 7                | text                        | YES         | null                                            |
| auth                | oauth_authorizations       | resource                     | 8                | text                        | YES         | null                                            |
| auth                | oauth_authorizations       | code_challenge               | 9                | text                        | YES         | null                                            |
| auth                | oauth_authorizations       | code_challenge_method        | 10               | USER-DEFINED                | YES         | null                                            |
| auth                | oauth_authorizations       | response_type                | 11               | USER-DEFINED                | NO          | 'code'::auth.oauth_response_type                |
| auth                | oauth_authorizations       | status                       | 12               | USER-DEFINED                | NO          | 'pending'::auth.oauth_authorization_status      |
| auth                | oauth_authorizations       | authorization_code           | 13               | text                        | YES         | null                                            |
| auth                | oauth_authorizations       | created_at                   | 14               | timestamp with time zone    | NO          | now()                                           |
| auth                | oauth_authorizations       | expires_at                   | 15               | timestamp with time zone    | NO          | (now() + '00:03:00'::interval)                  |
| auth                | oauth_authorizations       | approved_at                  | 16               | timestamp with time zone    | YES         | null                                            |
| auth                | oauth_authorizations       | nonce                        | 17               | text                        | YES         | null                                            |
| auth                | oauth_client_states        | id                           | 1                | uuid                        | NO          | null                                            |
| auth                | oauth_client_states        | provider_type                | 2                | text                        | NO          | null                                            |
| auth                | oauth_client_states        | code_verifier                | 3                | text                        | YES         | null                                            |
| auth                | oauth_client_states        | created_at                   | 4                | timestamp with time zone    | NO          | null                                            |
| auth                | oauth_clients              | id                           | 1                | uuid                        | NO          | null                                            |
| auth                | oauth_clients              | client_secret_hash           | 3                | text                        | YES         | null                                            |
| auth                | oauth_clients              | registration_type            | 4                | USER-DEFINED                | NO          | null                                            |
| auth                | oauth_clients              | redirect_uris                | 5                | text                        | NO          | null                                            |
| auth                | oauth_clients              | grant_types                  | 6                | text                        | NO          | null                                            |
| auth                | oauth_clients              | client_name                  | 7                | text                        | YES         | null                                            |
| auth                | oauth_clients              | client_uri                   | 8                | text                        | YES         | null                                            |
| auth                | oauth_clients              | logo_uri                     | 9                | text                        | YES         | null                                            |
| auth                | oauth_clients              | created_at                   | 10               | timestamp with time zone    | NO          | now()                                           |
| auth                | oauth_clients              | updated_at                   | 11               | timestamp with time zone    | NO          | now()                                           |
| auth                | oauth_clients              | deleted_at                   | 12               | timestamp with time zone    | YES         | null                                            |
| auth                | oauth_clients              | client_type                  | 13               | USER-DEFINED                | NO          | 'confidential'::auth.oauth_client_type          |
| auth                | oauth_clients              | token_endpoint_auth_method   | 14               | text                        | NO          | null                                            |
| auth                | oauth_consents             | id                           | 1                | uuid                        | NO          | null                                            |
| auth                | oauth_consents             | user_id                      | 2                | uuid                        | NO          | null                                            |
| auth                | oauth_consents             | client_id                    | 3                | uuid                        | NO          | null                                            |
| auth                | oauth_consents             | scopes                       | 4                | text                        | NO          | null                                            |
| auth                | oauth_consents             | granted_at                   | 5                | timestamp with time zone    | NO          | now()                                           |
| auth                | oauth_consents             | revoked_at                   | 6                | timestamp with time zone    | YES         | null                                            |
| auth                | one_time_tokens            | id                           | 1                | uuid                        | NO          | null                                            |
| auth                | one_time_tokens            | user_id                      | 2                | uuid                        | NO          | null                                            |
| auth                | one_time_tokens            | token_type                   | 3                | USER-DEFINED                | NO          | null                                            |
| auth                | one_time_tokens            | token_hash                   | 4                | text                        | NO          | null                                            |
| auth                | one_time_tokens            | relates_to                   | 5                | text                        | NO          | null                                            |
| auth                | one_time_tokens            | created_at                   | 6                | timestamp without time zone | NO          | now()                                           |
| auth                | one_time_tokens            | updated_at                   | 7                | timestamp without time zone | NO          | now()                                           |
| auth                | refresh_tokens             | instance_id                  | 1                | uuid                        | YES         | null                                            |
| auth                | refresh_tokens             | id                           | 2                | bigint                      | NO          | nextval('auth.refresh_tokens_id_seq'::regclass) |
| auth                | refresh_tokens             | token                        | 3                | character varying           | YES         | null                                            |
| auth                | refresh_tokens             | user_id                      | 4                | character varying           | YES         | null                                            |
| auth                | refresh_tokens             | revoked                      | 5                | boolean                     | YES         | null                                            |
| auth                | refresh_tokens             | created_at                   | 6                | timestamp with time zone    | YES         | null                                            |
| auth                | refresh_tokens             | updated_at                   | 7                | timestamp with time zone    | YES         | null                                            |
| auth                | refresh_tokens             | parent                       | 8                | character varying           | YES         | null                                            |
| auth                | refresh_tokens             | session_id                   | 9                | uuid                        | YES         | null                                            |
| auth                | saml_providers             | id                           | 1                | uuid                        | NO          | null                                            |
| auth                | saml_providers             | sso_provider_id              | 2                | uuid                        | NO          | null                                            |
| auth                | saml_providers             | entity_id                    | 3                | text                        | NO          | null                                            |
| auth                | saml_providers             | metadata_xml                 | 4                | text                        | NO          | null                                            |
| auth                | saml_providers             | metadata_url                 | 5                | text                        | YES         | null                                            |
| auth                | saml_providers             | attribute_mapping            | 6                | jsonb                       | YES         | null                                            |
| auth                | saml_providers             | created_at                   | 7                | timestamp with time zone    | YES         | null                                            |
| auth                | saml_providers             | updated_at                   | 8                | timestamp with time zone    | YES         | null                                            |
| auth                | saml_providers             | name_id_format               | 9                | text                        | YES         | null                                            |
| auth                | saml_relay_states          | id                           | 1                | uuid                        | NO          | null                                            |
| auth                | saml_relay_states          | sso_provider_id              | 2                | uuid                        | NO          | null                                            |
| auth                | saml_relay_states          | request_id                   | 3                | text                        | NO          | null                                            |
| auth                | saml_relay_states          | for_email                    | 4                | text                        | YES         | null                                            |
| auth                | saml_relay_states          | redirect_to                  | 5                | text                        | YES         | null                                            |
| auth                | saml_relay_states          | created_at                   | 6                | timestamp with time zone    | YES         | null                                            |
| auth                | saml_relay_states          | updated_at                   | 7                | timestamp with time zone    | YES         | null                                            |
| auth                | saml_relay_states          | flow_state_id                | 8                | uuid                        | YES         | null                                            |
| auth                | schema_migrations          | version                      | 1                | character varying           | NO          | null                                            |
| auth                | sessions                   | id                           | 1                | uuid                        | NO          | null                                            |
| auth                | sessions                   | user_id                      | 2                | uuid                        | NO          | null                                            |
| auth                | sessions                   | created_at                   | 3                | timestamp with time zone    | YES         | null                                            |
| auth                | sessions                   | updated_at                   | 4                | timestamp with time zone    | YES         | null                                            |
| auth                | sessions                   | factor_id                    | 5                | uuid                        | YES         | null                                            |
| auth                | sessions                   | aal                          | 6                | USER-DEFINED                | YES         | null                                            |
| auth                | sessions                   | not_after                    | 7                | timestamp with time zone    | YES         | null                                            |
| auth                | sessions                   | refreshed_at                 | 8                | timestamp without time zone | YES         | null                                            |
| auth                | sessions                   | user_agent                   | 9                | text                        | YES         | null                                            |
| auth                | sessions                   | ip                           | 10               | inet                        | YES         | null                                            |
| auth                | sessions                   | tag                          | 11               | text                        | YES         | null                                            |
| auth                | sessions                   | oauth_client_id              | 12               | uuid                        | YES         | null                                            |
| auth                | sessions                   | refresh_token_hmac_key       | 13               | text                        | YES         | null                                            |
| auth                | sessions                   | refresh_token_counter        | 14               | bigint                      | YES         | null                                            |
| auth                | sessions                   | scopes                       | 15               | text                        | YES         | null                                            |
| auth                | sso_domains                | id                           | 1                | uuid                        | NO          | null                                            |
| auth                | sso_domains                | sso_provider_id              | 2                | uuid                        | NO          | null                                            |
| auth                | sso_domains                | domain                       | 3                | text                        | NO          | null                                            |
| auth                | sso_domains                | created_at                   | 4                | timestamp with time zone    | YES         | null                                            |
| auth                | sso_domains                | updated_at                   | 5                | timestamp with time zone    | YES         | null                                            |
| auth                | sso_providers              | id                           | 1                | uuid                        | NO          | null                                            |
| auth                | sso_providers              | resource_id                  | 2                | text                        | YES         | null                                            |
| auth                | sso_providers              | created_at                   | 3                | timestamp with time zone    | YES         | null                                            |
| auth                | sso_providers              | updated_at                   | 4                | timestamp with time zone    | YES         | null                                            |
| auth                | sso_providers              | disabled                     | 5                | boolean                     | YES         | null                                            |
| auth                | users                      | instance_id                  | 1                | uuid                        | YES         | null                                            |
| auth                | users                      | id                           | 2                | uuid                        | NO          | null                                            |
| auth                | users                      | aud                          | 3                | character varying           | YES         | null                                            |
| auth                | users                      | role                         | 4                | character varying           | YES         | null                                            |
| auth                | users                      | email                        | 5                | character varying           | YES         | null                                            |
| auth                | users                      | encrypted_password           | 6                | character varying           | YES         | null                                            |
| auth                | users                      | email_confirmed_at           | 7                | timestamp with time zone    | YES         | null                                            |
| auth                | users                      | invited_at                   | 8                | timestamp with time zone    | YES         | null                                            |
| auth                | users                      | confirmation_token           | 9                | character varying           | YES         | null                                            |
| auth                | users                      | confirmation_sent_at         | 10               | timestamp with time zone    | YES         | null                                            |
| auth                | users                      | recovery_token               | 11               | character varying           | YES         | null                                            |
| auth                | users                      | recovery_sent_at             | 12               | timestamp with time zone    | YES         | null                                            |
| auth                | users                      | email_change_token_new       | 13               | character varying           | YES         | null                                            |
| auth                | users                      | email_change                 | 14               | character varying           | YES         | null                                            |
| auth                | users                      | email_change_sent_at         | 15               | timestamp with time zone    | YES         | null                                            |
| auth                | users                      | last_sign_in_at              | 16               | timestamp with time zone    | YES         | null                                            |
| auth                | users                      | raw_app_meta_data            | 17               | jsonb                       | YES         | null                                            |
| auth                | users                      | raw_user_meta_data           | 18               | jsonb                       | YES         | null                                            |
| auth                | users                      | is_super_admin               | 19               | boolean                     | YES         | null                                            |
| auth                | users                      | created_at                   | 20               | timestamp with time zone    | YES         | null                                            |
| auth                | users                      | updated_at                   | 21               | timestamp with time zone    | YES         | null                                            |
| auth                | users                      | phone                        | 22               | text                        | YES         | NULL::character varying                         |
| auth                | users                      | phone_confirmed_at           | 23               | timestamp with time zone    | YES         | null                                            |
| auth                | users                      | phone_change                 | 24               | text                        | YES         | ''::character varying                           |
| auth                | users                      | phone_change_token           | 25               | character varying           | YES         | ''::character varying                           |
| auth                | users                      | phone_change_sent_at         | 26               | timestamp with time zone    | YES         | null                                            |
| auth                | users                      | confirmed_at                 | 27               | timestamp with time zone    | YES         | null                                            |
| auth                | users                      | email_change_token_current   | 28               | character varying           | YES         | ''::character varying                           |
| auth                | users                      | email_change_confirm_status  | 29               | smallint                    | YES         | 0                                               |
| auth                | users                      | banned_until                 | 30               | timestamp with time zone    | YES         | null                                            |
| auth                | users                      | reauthentication_token       | 31               | character varying           | YES         | ''::character varying                           |
| auth                | users                      | reauthentication_sent_at     | 32               | timestamp with time zone    | YES         | null                                            |
| auth                | users                      | is_sso_user                  | 33               | boolean                     | NO          | false                                           |
| auth                | users                      | deleted_at                   | 34               | timestamp with time zone    | YES         | null                                            |
| auth                | users                      | is_anonymous                 | 35               | boolean                     | NO          | false                                           |
| auth                | webauthn_challenges        | id                           | 1                | uuid                        | NO          | gen_random_uuid()                               |
| auth                | webauthn_challenges        | user_id                      | 2                | uuid                        | YES         | null                                            |
| auth                | webauthn_challenges        | challenge_type               | 3                | text                        | NO          | null                                            |
| auth                | webauthn_challenges        | session_data                 | 4                | jsonb                       | NO          | null                                            |
| auth                | webauthn_challenges        | created_at                   | 5                | timestamp with time zone    | NO          | now()                                           |
| auth                | webauthn_challenges        | expires_at                   | 6                | timestamp with time zone    | NO          | null                                            |
| auth                | webauthn_credentials       | id                           | 1                | uuid                        | NO          | gen_random_uuid()                               |
| auth                | webauthn_credentials       | user_id                      | 2                | uuid                        | NO          | null                                            |
| auth                | webauthn_credentials       | credential_id                | 3                | bytea                       | NO          | null                                            |
| auth                | webauthn_credentials       | public_key                   | 4                | bytea                       | NO          | null                                            |
| auth                | webauthn_credentials       | attestation_type             | 5                | text                        | NO          | ''::text                                        |
| auth                | webauthn_credentials       | aaguid                       | 6                | uuid                        | YES         | null                                            |
| auth                | webauthn_credentials       | sign_count                   | 7                | bigint                      | NO          | 0                                               |
| auth                | webauthn_credentials       | transports                   | 8                | jsonb                       | NO          | '[]'::jsonb                                     |
| auth                | webauthn_credentials       | backup_eligible              | 9                | boolean                     | NO          | false                                           |
| auth                | webauthn_credentials       | backed_up                    | 10               | boolean                     | NO          | false                                           |
| auth                | webauthn_credentials       | friendly_name                | 11               | text                        | NO          | ''::text                                        |
| auth                | webauthn_credentials       | created_at                   | 12               | timestamp with time zone    | NO          | now()                                           |
| auth                | webauthn_credentials       | updated_at                   | 13               | timestamp with time zone    | NO          | now()                                           |
| auth                | webauthn_credentials       | last_used_at                 | 14               | timestamp with time zone    | YES         | null                                            |
| public              | customers                  | id                           | 1                | uuid                        | NO          | gen_random_uuid()                               |
| public              | customers                  | name                         | 2                | text                        | NO          | null                                            |
| public              | customers                  | phone                        | 3                | text                        | YES         | null                                            |
| public              | customers                  | email                        | 4                | text                        | YES         | null                                            |
| public              | customers                  | address                      | 5                | text                        | YES         | null                                            |
| public              | customers                  | notes                        | 6                | text                        | YES         | null                                            |
| public              | customers                  | created_at                   | 7                | timestamp with time zone    | NO          | now()                                           |
| public              | customers                  | updated_at                   | 8                | timestamp with time zone    | NO          | now()                                           |
| public              | customers                  | auth_id                      | 9                | uuid                        | YES         | null                                            |
| public              | customers                  | is_verified                  | 10               | boolean                     | YES         | false                                           |
| public              | daily_reconciliation       | id                           | 1                | uuid                        | NO          | gen_random_uuid()                               |
| public              | daily_reconciliation       | date                         | 2                | date                        | NO          | CURRENT_DATE                                    |
| public              | daily_reconciliation       | total_sales                  | 3                | numeric                     | NO          | 0                                               |
| public              | daily_reconciliation       | total_cash                   | 4                | numeric                     | NO          | 0                                               |
| public              | daily_reconciliation       | total_momo                   | 5                | numeric                     | NO          | 0                                               |
| public              | daily_reconciliation       | total_card                   | 6                | numeric                     | NO          | 0                                               |
| public              | daily_reconciliation       | total_expenses               | 7                | numeric                     | NO          | 0                                               |
| public              | daily_reconciliation       | expected_cash                | 8                | numeric                     | NO          | 0                                               |
| public              | daily_reconciliation       | actual_cash                  | 9                | numeric                     | YES         | null                                            |
| public              | daily_reconciliation       | discrepancy                  | 10               | numeric                     | YES         | null                                            |
| public              | daily_reconciliation       | floats_taken                 | 11               | numeric                     | NO          | 0                                               |
| public              | daily_reconciliation       | floats_returned              | 12               | numeric                     | NO          | 0                                               |
| public              | daily_reconciliation       | notes                        | 13               | text                        | YES         | null                                            |
| public              | daily_reconciliation       | reconciled_by                | 14               | uuid                        | YES         | null                                            |
| public              | daily_reconciliation       | created_at                   | 15               | timestamp with time zone    | NO          | now()                                           |
| public              | daily_reconciliation       | updated_at                   | 16               | timestamp with time zone    | NO          | now()                                           |
| public              | deal_redemptions           | id                           | 1                | uuid                        | NO          | gen_random_uuid()                               |
| public              | deal_redemptions           | deal_id                      | 2                | uuid                        | NO          | null                                            |
| public              | deal_redemptions           | user_id                      | 3                | uuid                        | YES         | null                                            |
| public              | deal_redemptions           | device_hash                  | 4                | text                        | YES         | null                                            |
| public              | deal_redemptions           | order_id                     | 5                | integer                     | YES         | null                                            |
| public              | deal_redemptions           | status                       | 6                | text                        | NO          | 'pending'::text                                 |
| public              | deal_redemptions           | created_at                   | 7                | timestamp with time zone    | NO          | now()                                           |
| public              | deal_redemptions           | confirmed_at                 | 8                | timestamp with time zone    | YES         | null                                            |
| public              | deals                      | id                           | 1                | uuid                        | NO          | gen_random_uuid()                               |
| public              | deals                      | slug                         | 2                | text                        | NO          | null                                            |
| public              | deals                      | title                        | 3                | text                        | NO          | null                                            |
| public              | deals                      | subtitle                     | 4                | text                        | YES         | null                                            |
| public              | deals                      | description                  | 5                | text                        | YES         | null                                            |
| public              | deals                      | image_url                    | 6                | text                        | YES         | null                                            |
| public              | deals                      | cta_label                    | 7                | text                        | YES         | 'Apply'::text                                   |
| public              | deals                      | active                       | 8                | boolean                     | NO          | true                                            |
| public              | deals                      | starts_at                    | 9                | timestamp with time zone    | YES         | null                                            |
| public              | deals                      | ends_at                      | 10               | timestamp with time zone    | YES         | null                                            |
| public              | deals                      | priority                     | 11               | integer                     | NO          | 100                                             |
| public              | deals                      | deal_kind                    | 12               | text                        | NO          | null                                            |
| public              | deals                      | value                        | 13               | numeric                     | YES         | null                                            |
| public              | deals                      | min_subtotal                 | 14               | numeric                     | YES         | 0                                               |
| public              | deals                      | conditions                   | 15               | jsonb                       | YES         | '{}'::jsonb                                     |
| public              | deals                      | max_redemptions_total        | 16               | integer                     | YES         | null                                            |
| public              | deals                      | max_redemptions_per_user     | 17               | integer                     | YES         | 1                                               |
| public              | deals                      | created_at                   | 18               | timestamp with time zone    | NO          | now()                                           |
| public              | deals                      | updated_at                   | 19               | timestamp with time zone    | NO          | now()                                           |
| public              | delivery_logs              | id                           | 1                | uuid                        | NO          | gen_random_uuid()                               |
| public              | delivery_logs              | order_id                     | 2                | integer                     | NO          | null                                            |
| public              | delivery_logs              | rider_id                     | 3                | uuid                        | NO          | null                                            |
| public              | delivery_logs              | status                       | 4                | USER-DEFINED                | NO          | null                                            |
| public              | delivery_logs              | location                     | 5                | text                        | YES         | null                                            |
| public              | delivery_logs              | notes                        | 6                | text                        | YES         | null                                            |
| public              | delivery_logs              | created_at                   | 7                | timestamp with time zone    | NO          | now()                                           |
| public              | delivery_zones             | id                           | 1                | uuid                        | NO          | gen_random_uuid()                               |
| public              | delivery_zones             | name                         | 2                | text                        | NO          | null                                            |
| public              | delivery_zones             | fee                          | 3                | numeric                     | NO          | 0                                               |
| public              | delivery_zones             | min_order                    | 4                | numeric                     | YES         | 0                                               |
| public              | delivery_zones             | is_active                    | 5                | boolean                     | YES         | true                                            |
| public              | delivery_zones             | created_at                   | 6                | timestamp with time zone    | NO          | now()                                           |
| public              | expense_categories         | id                           | 1                | uuid                        | NO          | gen_random_uuid()                               |
| public              | expense_categories         | name                         | 2                | text                        | NO          | null                                            |
| public              | expense_categories         | is_active                    | 3                | boolean                     | NO          | true                                            |
| public              | expense_categories         | created_at                   | 4                | timestamp with time zone    | YES         | now()                                           |
| public              | expenses                   | id                           | 1                | uuid                        | NO          | gen_random_uuid()                               |
| public              | expenses                   | date                         | 2                | date                        | NO          | CURRENT_DATE                                    |
| public              | expenses                   | category_id                  | 3                | uuid                        | YES         | null                                            |
| public              | expenses                   | amount                       | 4                | numeric                     | NO          | null                                            |
| public              | expenses                   | description                  | 5                | text                        | YES         | null                                            |
| public              | expenses                   | created_by                   | 6                | uuid                        | YES         | null                                            |
| public              | expenses                   | created_at                   | 7                | timestamp with time zone    | YES         | now()                                           |
| public              | expenses                   | updated_at                   | 8                | timestamp with time zone    | YES         | now()                                           |
| public              | kitchen_needs              | id                           | 1                | uuid                        | NO          | gen_random_uuid()                               |
| public              | kitchen_needs              | item_name                    | 2                | text                        | NO          | null                                            |
| public              | kitchen_needs              | quantity                     | 3                | numeric                     | YES         | null                                            |
| public              | kitchen_needs              | unit                         | 4                | text                        | YES         | null                                            |
| public              | kitchen_needs              | notes                        | 5                | text                        | YES         | null                                            |
| public              | kitchen_needs              | status                       | 6                | text                        | NO          | 'pending'::text                                 |
| public              | kitchen_needs              | requested_by                 | 7                | uuid                        | YES         | null                                            |
| public              | kitchen_needs              | approved_by                  | 8                | uuid                        | YES         | null                                            |
| public              | kitchen_needs              | date                         | 9                | date                        | NO          | CURRENT_DATE                                    |
| public              | kitchen_needs              | created_at                   | 10               | timestamp with time zone    | NO          | now()                                           |
| public              | kitchen_needs              | updated_at                   | 11               | timestamp with time zone    | NO          | now()                                           |
| public              | kitchen_notes              | id                           | 1                | integer                     | NO          | nextval('kitchen_notes_id_seq'::regclass)       |
| public              | kitchen_notes              | date                         | 2                | date                        | NO          | CURRENT_DATE                                    |
| public              | kitchen_notes              | notes                        | 3                | text                        | NO          | null                                            |
| public              | kitchen_notes              | created_at                   | 4                | timestamp with time zone    | YES         | now()                                           |
| public              | kitchen_orders             | id                           | 1                | uuid                        | NO          | gen_random_uuid()                               |
| public              | kitchen_orders             | order_id                     | 2                | integer                     | NO          | null                                            |
| public              | kitchen_orders             | status                       | 3                | USER-DEFINED                | NO          | 'new'::kitchen_order_status                     |
| public              | kitchen_orders             | priority                     | 4                | integer                     | YES         | 0                                               |
| public              | kitchen_orders             | notes                        | 5                | text                        | YES         | null                                            |
| public              | kitchen_orders             | started_at                   | 6                | timestamp with time zone    | YES         | null                                            |
| public              | kitchen_orders             | completed_at                 | 7                | timestamp with time zone    | YES         | null                                            |
| public              | kitchen_orders             | created_at                   | 8                | timestamp with time zone    | NO          | now()                                           |
| public              | kitchen_orders             | updated_at                   | 9                | timestamp with time zone    | NO          | now()                                           |
| public              | menu_items                 | id                           | 1                | integer                     | NO          | null                                            |
| public              | menu_items                 | name                         | 2                | text                        | NO          | null                                            |
| public              | menu_items                 | description                  | 3                | text                        | YES         | null                                            |
| public              | menu_items                 | category                     | 4                | text                        | NO          | null                                            |
| public              | menu_items                 | img_url                      | 5                | text                        | YES         | null                                            |
| public              | menu_items                 | spicy_level                  | 6                | integer                     | YES         | 0                                               |
| public              | menu_items                 | variants                     | 7                | jsonb                       | NO          | '[]'::jsonb                                     |
| public              | menu_items                 | price                        | 8                | numeric                     | YES         | null                                            |
| public              | menu_items                 | is_active                    | 9                | boolean                     | YES         | true                                            |
| public              | menu_items                 | created_at                   | 10               | timestamp with time zone    | YES         | now()                                           |
| public              | order_items                | id                           | 1                | integer                     | NO          | nextval('order_items_id_seq'::regclass)         |
| public              | order_items                | order_id                     | 2                | integer                     | NO          | null                                            |
| public              | order_items                | menu_item_name               | 3                | text                        | NO          | null                                            |
| public              | order_items                | quantity                     | 4                | integer                     | NO          | 1                                               |
| public              | order_items                | modifiers                    | 5                | text                        | YES         | null                                            |
| public              | order_items                | created_at                   | 6                | timestamp with time zone    | YES         | now()                                           |
| public              | order_items                | menu_item_id                 | 7                | integer                     | YES         | null                                            |
| public              | order_items                | unit_price                   | 8                | numeric                     | YES         | null                                            |
| public              | order_items                | subtotal                     | 9                | numeric                     | YES         | null                                            |
| public              | order_items                | notes                        | 10               | text                        | YES         | null                                            |
| public              | orders                     | id                           | 1                | integer                     | NO          | nextval('orders_id_seq'::regclass)              |
| public              | orders                     | status                       | 2                | text                        | NO          | 'pending'::text                                 |
| public              | orders                     | order_type                   | 3                | text                        | NO          | 'dinein'::text                                  |
| public              | orders                     | items                        | 4                | jsonb                       | NO          | '[]'::jsonb                                     |
| public              | orders                     | created_at                   | 5                | timestamp with time zone    | NO          | now()                                           |
| public              | orders                     | ready_at                     | 6                | timestamp with time zone    | YES         | null                                            |
| public              | orders                     | customer_name                | 7                | text                        | YES         | null                                            |
| public              | orders                     | payment_method               | 8                | text                        | YES         | null                                            |
| public              | orders                     | cash_received                | 9                | numeric                     | YES         | null                                            |
| public              | orders                     | momo_received                | 10               | numeric                     | YES         | null                                            |
| public              | orders                     | total_paid                   | 11               | numeric                     | YES         | null                                            |
| public              | orders                     | created_by                   | 12               | uuid                        | YES         | null                                            |
| public              | orders                     | claimed_by                   | 13               | uuid                        | YES         | null                                            |
| public              | orders                     | claimed_at                   | 14               | timestamp with time zone    | YES         | null                                            |
| public              | orders                     | order_number                 | 15               | integer                     | NO          | nextval('orders_order_number_seq'::regclass)    |
| public              | orders                     | source                       | 16               | text                        | YES         | 'pos'::text                                     |
| public              | orders                     | mode                         | 17               | text                        | YES         | 'dine_in'::text                                 |
| public              | orders                     | tax                          | 18               | numeric                     | YES         | 0                                               |
| public              | orders                     | delivery_fee                 | 19               | numeric                     | YES         | 0                                               |
| public              | orders                     | delivery_address             | 20               | text                        | YES         | null                                            |
| public              | orders                     | customer_id                  | 21               | uuid                        | YES         | null                                            |
| public              | orders                     | counter_worker_id            | 22               | uuid                        | YES         | null                                            |
| public              | orders                     | rider_id                     | 23               | uuid                        | YES         | null                                            |
| public              | orders                     | updated_at                   | 24               | timestamp with time zone    | YES         | now()                                           |
| public              | payments                   | id                           | 1                | uuid                        | NO          | gen_random_uuid()                               |
| public              | payments                   | order_id                     | 2                | integer                     | NO          | null                                            |
| public              | payments                   | method                       | 3                | USER-DEFINED                | NO          | null                                            |
| public              | payments                   | amount                       | 4                | numeric                     | NO          | null                                            |
| public              | payments                   | reference                    | 5                | text                        | YES         | null                                            |
| public              | payments                   | status                       | 6                | text                        | NO          | 'completed'::text                               |
| public              | payments                   | received_by                  | 7                | uuid                        | YES         | null                                            |
| public              | payments                   | created_at                   | 8                | timestamp with time zone    | NO          | now()                                           |
| public              | sales_summary              | id                           | 1                | integer                     | NO          | nextval('sales_summary_id_seq'::regclass)       |
| public              | sales_summary              | order_no                     | 2                | integer                     | NO          | null                                            |
| public              | sales_summary              | name                         | 3                | text                        | NO          | null                                            |
| public              | sales_summary              | category                     | 4                | text                        | YES         | null                                            |
| public              | sales_summary              | price                        | 5                | numeric                     | NO          | null                                            |
| public              | sales_summary              | qty                          | 6                | integer                     | NO          | null                                            |
| public              | sales_summary              | date                         | 7                | date                        | NO          | now()                                           |
| public              | sales_summary              | created_at                   | 8                | timestamp with time zone    | NO          | now()                                           |
| public              | system_settings            | id                           | 1                | uuid                        | NO          | gen_random_uuid()                               |
| public              | system_settings            | key                          | 2                | text                        | NO          | null                                            |
| public              | system_settings            | value                        | 3                | jsonb                       | NO          | '{}'::jsonb                                     |
| public              | system_settings            | updated_at                   | 4                | timestamp with time zone    | NO          | now()                                           |
| public              | system_settings            | updated_by                   | 5                | uuid                        | YES         | null                                            |
| public              | user_profiles              | id                           | 1                | uuid                        | NO          | null                                            |
| public              | user_profiles              | full_name                    | 2                | text                        | YES         | null                                            |
| public              | user_profiles              | worker_id                    | 3                | text                        | YES         | null                                            |
| public              | user_profiles              | created_at                   | 4                | timestamp with time zone    | YES         | now()                                           |
| public              | user_profiles              | is_active                    | 5                | boolean                     | YES         | true                                            |
| public              | user_profiles              | username                     | 6                | text                        | NO          | null                                            |
| public              | user_roles                 | id                           | 1                | uuid                        | NO          | gen_random_uuid()                               |
| public              | user_roles                 | user_id                      | 2                | uuid                        | NO          | null                                            |
| public              | user_roles                 | role                         | 3                | USER-DEFINED                | NO          | null                                            |
| public              | worker_orders              | id                           | 1                | uuid                        | NO          | gen_random_uuid()                               |
| public              | worker_orders              | order_id                     | 2                | integer                     | NO          | null                                            |
| public              | worker_orders              | worker_id                    | 3                | uuid                        | NO          | null                                            |
| public              | worker_orders              | action                       | 4                | text                        | NO          | 'served'::text                                  |
| public              | worker_orders              | created_at                   | 5                | timestamp with time zone    | NO          | now()                                           |
| public              | worker_shifts              | id                           | 1                | uuid                        | NO          | gen_random_uuid()                               |
| public              | worker_shifts              | user_id                      | 2                | uuid                        | NO          | null                                            |
| public              | worker_shifts              | started_at                   | 3                | timestamp with time zone    | NO          | now()                                           |
| public              | worker_shifts              | ended_at                     | 4                | timestamp with time zone    | YES         | null                                            |
| public              | worker_shifts              | amount_taken_float           | 5                | numeric                     | YES         | null                                            |
| public              | worker_shifts              | amount_returned_float        | 6                | numeric                     | YES         | null                                            |
| public              | worker_shifts              | notes                        | 7                | text                        | YES         | null                                            |
| public              | worker_shifts              | created_by                   | 8                | uuid                        | YES         | null                                            |
| public              | worker_shifts              | created_at                   | 9                | timestamp with time zone    | YES         | now()                                           |
| public              | worker_shifts              | active                       | 10               | boolean                     | YES         | true                                            |
| realtime            | messages                   | topic                        | 1                | text                        | NO          | null                                            |
| realtime            | messages                   | extension                    | 2                | text                        | NO          | null                                            |
| realtime            | messages                   | payload                      | 3                | jsonb                       | YES         | null                                            |
| realtime            | messages                   | event                        | 4                | text                        | YES         | null                                            |
| realtime            | messages                   | private                      | 5                | boolean                     | YES         | false                                           |
| realtime            | messages                   | updated_at                   | 6                | timestamp without time zone | NO          | now()                                           |
| realtime            | messages                   | inserted_at                  | 7                | timestamp without time zone | NO          | now()                                           |
| realtime            | messages                   | id                           | 8                | uuid                        | NO          | gen_random_uuid()                               |
| realtime            | messages_2026_04_08        | topic                        | 1                | text                        | NO          | null                                            |
| realtime            | messages_2026_04_08        | extension                    | 2                | text                        | NO          | null                                            |
| realtime            | messages_2026_04_08        | payload                      | 3                | jsonb                       | YES         | null                                            |
| realtime            | messages_2026_04_08        | event                        | 4                | text                        | YES         | null                                            |
| realtime            | messages_2026_04_08        | private                      | 5                | boolean                     | YES         | false                                           |
| realtime            | messages_2026_04_08        | updated_at                   | 6                | timestamp without time zone | NO          | now()                                           |
| realtime            | messages_2026_04_08        | inserted_at                  | 7                | timestamp without time zone | NO          | now()                                           |
| realtime            | messages_2026_04_08        | id                           | 8                | uuid                        | NO          | gen_random_uuid()                               |
| realtime            | messages_2026_04_09        | topic                        | 1                | text                        | NO          | null                                            |
| realtime            | messages_2026_04_09        | extension                    | 2                | text                        | NO          | null                                            |
| realtime            | messages_2026_04_09        | payload                      | 3                | jsonb                       | YES         | null                                            |
| realtime            | messages_2026_04_09        | event                        | 4                | text                        | YES         | null                                            |
| realtime            | messages_2026_04_09        | private                      | 5                | boolean                     | YES         | false                                           |
| realtime            | messages_2026_04_09        | updated_at                   | 6                | timestamp without time zone | NO          | now()                                           |
| realtime            | messages_2026_04_09        | inserted_at                  | 7                | timestamp without time zone | NO          | now()                                           |
| realtime            | messages_2026_04_09        | id                           | 8                | uuid                        | NO          | gen_random_uuid()                               |
| realtime            | messages_2026_04_10        | topic                        | 1                | text                        | NO          | null                                            |
| realtime            | messages_2026_04_10        | extension                    | 2                | text                        | NO          | null                                            |
| realtime            | messages_2026_04_10        | payload                      | 3                | jsonb                       | YES         | null                                            |
| realtime            | messages_2026_04_10        | event                        | 4                | text                        | YES         | null                                            |
| realtime            | messages_2026_04_10        | private                      | 5                | boolean                     | YES         | false                                           |
| realtime            | messages_2026_04_10        | updated_at                   | 6                | timestamp without time zone | NO          | now()                                           |
| realtime            | messages_2026_04_10        | inserted_at                  | 7                | timestamp without time zone | NO          | now()                                           |
| realtime            | messages_2026_04_10        | id                           | 8                | uuid                        | NO          | gen_random_uuid()                               |
| realtime            | messages_2026_04_11        | topic                        | 1                | text                        | NO          | null                                            |
| realtime            | messages_2026_04_11        | extension                    | 2                | text                        | NO          | null                                            |
| realtime            | messages_2026_04_11        | payload                      | 3                | jsonb                       | YES         | null                                            |
| realtime            | messages_2026_04_11        | event                        | 4                | text                        | YES         | null                                            |
| realtime            | messages_2026_04_11        | private                      | 5                | boolean                     | YES         | false                                           |
| realtime            | messages_2026_04_11        | updated_at                   | 6                | timestamp without time zone | NO          | now()                                           |
| realtime            | messages_2026_04_11        | inserted_at                  | 7                | timestamp without time zone | NO          | now()                                           |
| realtime            | messages_2026_04_11        | id                           | 8                | uuid                        | NO          | gen_random_uuid()                               |
| realtime            | messages_2026_04_12        | topic                        | 1                | text                        | NO          | null                                            |
| realtime            | messages_2026_04_12        | extension                    | 2                | text                        | NO          | null                                            |
| realtime            | messages_2026_04_12        | payload                      | 3                | jsonb                       | YES         | null                                            |
| realtime            | messages_2026_04_12        | event                        | 4                | text                        | YES         | null                                            |
| realtime            | messages_2026_04_12        | private                      | 5                | boolean                     | YES         | false                                           |
| realtime            | messages_2026_04_12        | updated_at                   | 6                | timestamp without time zone | NO          | now()                                           |
| realtime            | messages_2026_04_12        | inserted_at                  | 7                | timestamp without time zone | NO          | now()                                           |
| realtime            | messages_2026_04_12        | id                           | 8                | uuid                        | NO          | gen_random_uuid()                               |
| realtime            | messages_2026_04_13        | topic                        | 1                | text                        | NO          | null                                            |
| realtime            | messages_2026_04_13        | extension                    | 2                | text                        | NO          | null                                            |
| realtime            | messages_2026_04_13        | payload                      | 3                | jsonb                       | YES         | null                                            |
| realtime            | messages_2026_04_13        | event                        | 4                | text                        | YES         | null                                            |
| realtime            | messages_2026_04_13        | private                      | 5                | boolean                     | YES         | false                                           |
| realtime            | messages_2026_04_13        | updated_at                   | 6                | timestamp without time zone | NO          | now()                                           |
| realtime            | messages_2026_04_13        | inserted_at                  | 7                | timestamp without time zone | NO          | now()                                           |
| realtime            | messages_2026_04_13        | id                           | 8                | uuid                        | NO          | gen_random_uuid()                               |
| realtime            | schema_migrations          | version                      | 1                | bigint                      | NO          | null                                            |
| realtime            | schema_migrations          | inserted_at                  | 2                | timestamp without time zone | YES         | null                                            |
| realtime            | subscription               | id                           | 1                | bigint                      | NO          | null                                            |
| realtime            | subscription               | subscription_id              | 2                | uuid                        | NO          | null                                            |
| realtime            | subscription               | entity                       | 3                | regclass                    | NO          | null                                            |
| realtime            | subscription               | filters                      | 4                | ARRAY                       | NO          | '{}'::realtime.user_defined_filter[]            |
| realtime            | subscription               | claims                       | 5                | jsonb                       | NO          | null                                            |
| realtime            | subscription               | claims_role                  | 6                | regrole                     | NO          | null                                            |
| realtime            | subscription               | created_at                   | 7                | timestamp without time zone | NO          | timezone('utc'::text, now())                    |
| realtime            | subscription               | action_filter                | 8                | text                        | YES         | '*'::text                                       |
| storage             | buckets                    | id                           | 1                | text                        | NO          | null                                            |
| storage             | buckets                    | name                         | 2                | text                        | NO          | null                                            |
| storage             | buckets                    | owner                        | 3                | uuid                        | YES         | null                                            |
| storage             | buckets                    | created_at                   | 4                | timestamp with time zone    | YES         | now()                                           |
| storage             | buckets                    | updated_at                   | 5                | timestamp with time zone    | YES         | now()                                           |
| storage             | buckets                    | public                       | 6                | boolean                     | YES         | false                                           |
| storage             | buckets                    | avif_autodetection           | 7                | boolean                     | YES         | false                                           |
| storage             | buckets                    | file_size_limit              | 8                | bigint                      | YES         | null                                            |
| storage             | buckets                    | allowed_mime_types           | 9                | ARRAY                       | YES         | null                                            |
| storage             | buckets                    | owner_id                     | 10               | text                        | YES         | null                                            |
| storage             | buckets                    | type                         | 11               | USER-DEFINED                | NO          | 'STANDARD'::storage.buckettype                  |
| storage             | buckets_analytics          | name                         | 1                | text                        | NO          | null                                            |
| storage             | buckets_analytics          | type                         | 2                | USER-DEFINED                | NO          | 'ANALYTICS'::storage.buckettype                 |
| storage             | buckets_analytics          | format                       | 3                | text                        | NO          | 'ICEBERG'::text                                 |
| storage             | buckets_analytics          | created_at                   | 4                | timestamp with time zone    | NO          | now()                                           |
| storage             | buckets_analytics          | updated_at                   | 5                | timestamp with time zone    | NO          | now()                                           |
| storage             | buckets_analytics          | id                           | 6                | uuid                        | NO          | gen_random_uuid()                               |
| storage             | buckets_analytics          | deleted_at                   | 7                | timestamp with time zone    | YES         | null                                            |
| storage             | buckets_vectors            | id                           | 1                | text                        | NO          | null                                            |
| storage             | buckets_vectors            | type                         | 2                | USER-DEFINED                | NO          | 'VECTOR'::storage.buckettype                    |
| storage             | buckets_vectors            | created_at                   | 3                | timestamp with time zone    | NO          | now()                                           |
| storage             | buckets_vectors            | updated_at                   | 4                | timestamp with time zone    | NO          | now()                                           |
| storage             | migrations                 | id                           | 1                | integer                     | NO          | null                                            |
| storage             | migrations                 | name                         | 2                | character varying           | NO          | null                                            |
| storage             | migrations                 | hash                         | 3                | character varying           | NO          | null                                            |
| storage             | migrations                 | executed_at                  | 4                | timestamp without time zone | YES         | CURRENT_TIMESTAMP                               |
| storage             | objects                    | id                           | 1                | uuid                        | NO          | gen_random_uuid()                               |
| storage             | objects                    | bucket_id                    | 2                | text                        | YES         | null                                            |
| storage             | objects                    | name                         | 3                | text                        | YES         | null                                            |
| storage             | objects                    | owner                        | 4                | uuid                        | YES         | null                                            |
| storage             | objects                    | created_at                   | 5                | timestamp with time zone    | YES         | now()                                           |
| storage             | objects                    | updated_at                   | 6                | timestamp with time zone    | YES         | now()                                           |
| storage             | objects                    | last_accessed_at             | 7                | timestamp with time zone    | YES         | now()                                           |
| storage             | objects                    | metadata                     | 8                | jsonb                       | YES         | null                                            |
| storage             | objects                    | path_tokens                  | 9                | ARRAY                       | YES         | null                                            |
| storage             | objects                    | version                      | 10               | text                        | YES         | null                                            |
| storage             | objects                    | owner_id                     | 11               | text                        | YES         | null                                            |
| storage             | objects                    | user_metadata                | 12               | jsonb                       | YES         | null                                            |
| storage             | s3_multipart_uploads       | id                           | 1                | text                        | NO          | null                                            |
| storage             | s3_multipart_uploads       | in_progress_size             | 2                | bigint                      | NO          | 0                                               |
| storage             | s3_multipart_uploads       | upload_signature             | 3                | text                        | NO          | null                                            |
| storage             | s3_multipart_uploads       | bucket_id                    | 4                | text                        | NO          | null                                            |
| storage             | s3_multipart_uploads       | key                          | 5                | text                        | NO          | null                                            |
| storage             | s3_multipart_uploads       | version                      | 6                | text                        | NO          | null                                            |
| storage             | s3_multipart_uploads       | owner_id                     | 7                | text                        | YES         | null                                            |
| storage             | s3_multipart_uploads       | created_at                   | 8                | timestamp with time zone    | NO          | now()                                           |
| storage             | s3_multipart_uploads       | user_metadata                | 9                | jsonb                       | YES         | null                                            |
| storage             | s3_multipart_uploads_parts | id                           | 1                | uuid                        | NO          | gen_random_uuid()                               |
| storage             | s3_multipart_uploads_parts | upload_id                    | 2                | text                        | NO          | null                                            |
| storage             | s3_multipart_uploads_parts | size                         | 3                | bigint                      | NO          | 0                                               |
| storage             | s3_multipart_uploads_parts | part_number                  | 4                | integer                     | NO          | null                                            |
| storage             | s3_multipart_uploads_parts | bucket_id                    | 5                | text                        | NO          | null                                            |
| storage             | s3_multipart_uploads_parts | key                          | 6                | text                        | NO          | null                                            |
| storage             | s3_multipart_uploads_parts | etag                         | 7                | text                        | NO          | null                                            |
| storage             | s3_multipart_uploads_parts | owner_id                     | 8                | text                        | YES         | null                                            |
| storage             | s3_multipart_uploads_parts | version                      | 9                | text                        | NO          | null                                            |
| storage             | s3_multipart_uploads_parts | created_at                   | 10               | timestamp with time zone    | NO          | now()                                           |
| storage             | vector_indexes             | id                           | 1                | text                        | NO          | gen_random_uuid()                               |
| storage             | vector_indexes             | name                         | 2                | text                        | NO          | null                                            |
| storage             | vector_indexes             | bucket_id                    | 3                | text                        | NO          | null                                            |
| storage             | vector_indexes             | data_type                    | 4                | text                        | NO          | null                                            |
| storage             | vector_indexes             | dimension                    | 5                | integer                     | NO          | null                                            |
| storage             | vector_indexes             | distance_metric              | 6                | text                        | NO          | null                                            |
| storage             | vector_indexes             | metadata_configuration       | 7                | jsonb                       | YES         | null                                            |
| storage             | vector_indexes             | created_at                   | 8                | timestamp with time zone    | NO          | now()                                           |
| storage             | vector_indexes             | updated_at                   | 9                | timestamp with time zone    | NO          | now()                                           |
| supabase_migrations | schema_migrations          | version                      | 1                | text                        | NO          | null                                            |
| supabase_migrations | schema_migrations          | statements                   | 2                | ARRAY                       | YES         | null                                            |
| supabase_migrations | schema_migrations          | name                         | 3                | text                        | YES         | null                                            |
| supabase_migrations | schema_migrations          | created_by                   | 4                | text                        | YES         | null                                            |
| supabase_migrations | schema_migrations          | idempotency_key              | 5                | text                        | YES         | null                                            |
| supabase_migrations | schema_migrations          | rollback                     | 6                | ARRAY                       | YES         | null                                            |
| vault               | secrets                    | id                           | 1                | uuid                        | NO          | gen_random_uuid()                               |
| vault               | secrets                    | name                         | 2                | text                        | YES         | null                                            |
| vault               | secrets                    | description                  | 3                | text                        | NO          | ''::text                                        |
| vault               | secrets                    | secret                       | 4                | text                        | NO          | null                                            |
| vault               | secrets                    | key_id                       | 5                | uuid                        | YES         | null                                            |
| vault               | secrets                    | nonce                        | 6                | bytea                       | YES         | vault._crypto_aead_det_noncegen()               |
| vault               | secrets                    | created_at                   | 7                | timestamp with time zone    | NO          | CURRENT_TIMESTAMP                               |
| vault               | secrets                    | updated_at                   | 8                | timestamp with time zone    | NO          | CURRENT_TIMESTAMP                               |