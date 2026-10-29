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

vi.mock("main/utils/useBackend", async () => {
  const { recommendationRequestFixtures } =
    await import("fixtures/recommendationRequestFixtures");
  return {
    ...(await vi.importActual("main/utils/useBackend")),
    useBackend: (_key, request) => ({
      data: request.params?.id
        ? {
            ...recommendationRequestFixtures.oneRecommendationRequest,
            id: Number(request.params.id),
          }
        : [],
    }),
  };
});

test.each([
  ["/recommendationrequest", "Index", currentUserFixtures.userOnly],
  ["/recommendationrequest", "Index", currentUserFixtures.adminUser],
  ["/recommendationrequest/create", "Create", currentUserFixtures.adminUser],
  ["/recommendationrequest/edit/1", "Edit", currentUserFixtures.adminUser],
  ["/recommendationrequest/edit/42", "Edit", currentUserFixtures.adminUser],
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
          ? "RecommendationRequests"
          : kind === "Create"
            ? "Create New RecommendationRequest"
            : "Edit RecommendationRequest",
    }),
  ).toBeInTheDocument();
});

test.each([
  ["/recommendationrequest", currentUserFixtures.notLoggedIn],
  ["/recommendationrequest/create", currentUserFixtures.notLoggedIn],
  ["/recommendationrequest/edit/1", currentUserFixtures.notLoggedIn],
  ["/recommendationrequest/create", currentUserFixtures.userOnly],
  ["/recommendationrequest/edit/1", currentUserFixtures.userOnly],
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
