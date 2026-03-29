export type OktaAuthServerId = "default" | "org";
export type OktaScenarioId =
  | "default-query-pkce"
  | "default-form-post"
  | "org-query-pkce"
  | "groups-claims"
  | "invalid-client"
  | "invalid-redirect-uri";

export type OktaBrowserScenario = {
  id: OktaScenarioId;
  title: string;
  summary: string;
  type: "success" | "expected_error";
  authServer: OktaAuthServerId;
  responseMode: "query" | "form_post";
  scope: string;
  clientId: string;
  clientSecret: string;
  usesPkce: boolean;
  redirectVariant: "callback" | "invalid";
  expectedCallbackMethod?: "GET" | "POST";
  expectsGroups: boolean;
  emulatorExpectation: string;
  appExpectation: string;
  errorTitle?: string;
  outcomeLabel: string;
};

const successScope = "openid profile email offline_access";
const groupsScope = "openid profile email groups offline_access";

export const OKTA_BROWSER_SCENARIOS: OktaBrowserScenario[] = [
  {
    id: "default-query-pkce",
    title: "Default AS Query + PKCE",
    summary:
      "Standard authorization code flow against the default authorization server using query redirects.",
    type: "success",
    authServer: "default",
    responseMode: "query",
    scope: successScope,
    clientId: "okta-test-app",
    clientSecret: "test-secret-123",
    usesPkce: true,
    redirectVariant: "callback",
    expectedCallbackMethod: "GET",
    expectsGroups: false,
    emulatorExpectation:
      "The emulator should show the seeded user chooser for the default authorization server.",
    appExpectation:
      "The app should return to a scenario result page with callback method GET and no groups claim.",
    outcomeLabel: "Successful login",
  },
  {
    id: "default-form-post",
    title: "Default AS Form Post",
    summary:
      "Validate the emulator's form_post callback mode through a real browser POST back to the app.",
    type: "success",
    authServer: "default",
    responseMode: "form_post",
    scope: successScope,
    clientId: "okta-test-app",
    clientSecret: "test-secret-123",
    usesPkce: true,
    redirectVariant: "callback",
    expectedCallbackMethod: "POST",
    expectsGroups: false,
    emulatorExpectation:
      "After user selection, the emulator should auto-submit a POST form back to the callback route.",
    appExpectation:
      "The app should complete the flow and show callback method POST on the result page.",
    outcomeLabel: "Successful login",
  },
  {
    id: "org-query-pkce",
    title: "Org Authorization Server",
    summary:
      "Run the same browser login flow against the org issuer at /oauth2/v1/* instead of /oauth2/default/v1/*.",
    type: "success",
    authServer: "org",
    responseMode: "query",
    scope: successScope,
    clientId: "okta-org-test-app",
    clientSecret: "org-secret-123",
    usesPkce: true,
    redirectVariant: "callback",
    expectedCallbackMethod: "GET",
    expectsGroups: false,
    emulatorExpectation:
      "The emulator should serve the org authorization page and issue tokens with the base URL as issuer.",
    appExpectation:
      "The app should land on a result page showing issuer http://localhost:4007 and org endpoints.",
    outcomeLabel: "Successful login",
  },
  {
    id: "groups-claims",
    title: "Groups Scope Claims",
    summary:
      "Use the groups scope so the result page can verify group claims coming back from userinfo.",
    type: "success",
    authServer: "default",
    responseMode: "query",
    scope: groupsScope,
    clientId: "okta-test-app",
    clientSecret: "test-secret-123",
    usesPkce: true,
    redirectVariant: "callback",
    expectedCallbackMethod: "GET",
    expectsGroups: true,
    emulatorExpectation:
      "Selecting Alice or Bob should still use the normal authorize page, but groups should be included after login.",
    appExpectation:
      "The result page should show group claims and note whether the chosen user belongs to Admins, Engineers, or Everyone.",
    outcomeLabel: "Successful login",
  },
  {
    id: "invalid-client",
    title: "Invalid Client Error",
    summary:
      "Deliberately send an unknown client_id to the authorize endpoint and verify the emulator error page.",
    type: "expected_error",
    authServer: "default",
    responseMode: "query",
    scope: successScope,
    clientId: "missing-client",
    clientSecret: "unused-secret",
    usesPkce: false,
    redirectVariant: "callback",
    expectsGroups: false,
    emulatorExpectation:
      "The emulator should stop on its own HTML error page instead of redirecting back to the app.",
    appExpectation:
      "The app should not receive a callback for this scenario.",
    errorTitle: "Application not found",
    outcomeLabel: "Expected emulator error",
  },
  {
    id: "invalid-redirect-uri",
    title: "Invalid Redirect URI Error",
    summary:
      "Use a redirect URI that is not registered for the client and verify the emulator blocks the flow.",
    type: "expected_error",
    authServer: "default",
    responseMode: "query",
    scope: successScope,
    clientId: "okta-test-app",
    clientSecret: "test-secret-123",
    usesPkce: false,
    redirectVariant: "invalid",
    expectsGroups: false,
    emulatorExpectation:
      "The emulator should render a redirect URI mismatch error page before any user can sign in.",
    appExpectation:
      "The app should never receive code or state for this scenario.",
    errorTitle: "Redirect URI mismatch",
    outcomeLabel: "Expected emulator error",
  },
];

export function getOktaScenario(id: string): OktaBrowserScenario | undefined {
  return OKTA_BROWSER_SCENARIOS.find((scenario) => scenario.id === id);
}

export function isSuccessScenario(
  scenario: OktaBrowserScenario,
): scenario is OktaBrowserScenario & { type: "success" } {
  return scenario.type === "success";
}
