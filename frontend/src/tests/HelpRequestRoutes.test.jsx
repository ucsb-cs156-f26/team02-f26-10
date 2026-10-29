import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import App from "../App";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { currentUserFixtures } from "fixtures/currentUserFixtures";

const { mockCurrentUser } = vi.hoisted(() => ({ mockCurrentUser: vi.fn() }));
vi.mock("main/utils/useCurrentUser", async () => ({
  ...(await vi.importActual("main/utils/useCurrentUser")),
  useCurrentUser: mockCurrentUser,
}));
vi.mock("main/layouts/BasicLayout/BasicLayout", () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock("main/utils/useBackend", async () => ({
  ...(await vi.importActual("main/utils/useBackend")),
  useBackend: () => ({ data: [] }),
}));

test.each([
  ["/helprequest", "Index", currentUserFixtures.userOnly],
  ["/helprequest", "Index", currentUserFixtures.adminUser],
  ["/helprequest/create", "Create", currentUserFixtures.adminUser],
  ["/helprequest/edit/1", "Edit", currentUserFixtures.adminUser],
  ["/helprequest/edit/42", "Edit", currentUserFixtures.adminUser],
])("%s renders the %s page for an authorized user", (path, kind, user) => {
  mockCurrentUser.mockReturnValue(user);
  render(
    <MemoryRouter initialEntries={[path]}>
      <QueryClientProvider client={new QueryClient()}>
        <App />
      </QueryClientProvider>
    </MemoryRouter>,
  );
  expect(
    screen.getByRole("heading", {
      name:
        kind === "Index"
          ? "HelpRequests"
          : kind === "Create"
            ? "Create New HelpRequest"
            : `${kind} page not yet implemented`,
    }),
  ).toBeInTheDocument();
});

test.each([
  ["/helprequest", currentUserFixtures.notLoggedIn],
  ["/helprequest/create", currentUserFixtures.notLoggedIn],
  ["/helprequest/edit/1", currentUserFixtures.notLoggedIn],
  ["/helprequest/create", currentUserFixtures.userOnly],
  ["/helprequest/edit/1", currentUserFixtures.userOnly],
])("%s does not render a page for an unauthorized user", (path, user) => {
  mockCurrentUser.mockReturnValue(user);
  const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
  try {
    render(
      <MemoryRouter initialEntries={[path]}>
        <QueryClientProvider client={new QueryClient()}>
          <App />
        </QueryClientProvider>
      </MemoryRouter>,
    );
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  } finally {
    warning.mockRestore();
  }
});
