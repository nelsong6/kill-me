# ============================================================================
# Microsoft "Sign in with Microsoft" — kill-me only
# ============================================================================
# Per-app app registration (separate from the shared infra-bootstrap registration)
# so redirect URIs live with this repo. The shared api middleware and this
# app's own backend both load every `*/microsoft_oauth_client_id` key from
# App Configuration and accept tokens against the union of audiences.

data "azuread_client_config" "current" {}

resource "azuread_application" "microsoft_login" {
  display_name     = "kill-me - Social Login"
  sign_in_audience = "AzureADandPersonalMicrosoftAccount"

  # The azuread provider does NOT auto-add the creating SP as an owner, so
  # `Application.ReadWrite.OwnedBy` (this repo's Graph permission) returns
  # 403 on any subsequent tofu update. Declared explicitly so owners match
  # the tofu-run principal.
  owners = [data.azuread_client_config.current.object_id]

  api {
    requested_access_token_version = 2
  }

  single_page_application {
    redirect_uris = [
      "https://${local.front_app_dns_name}.${local.infra.dns_zone_name}/",
      # Local dev — Vite dev server (:5173) + backend-served frontend (:3000).
      "http://localhost:5173/",
      "http://localhost:3000/",
    ]
  }
}
