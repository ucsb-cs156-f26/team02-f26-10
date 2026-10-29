import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import RecommendationRequestCreatePage from "main/pages/RecommendationRequest/RecommendationRequestCreatePage";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import { recommendationRequestFixtures } from "fixtures/recommendationRequestFixtures";
import * as backend from "main/utils/useBackend";

const { mockToast } = vi.hoisted(() => ({ mockToast: vi.fn() }));
vi.mock("react-toastify", async (importOriginal) => ({
  ...(await importOriginal()),
  toast: mockToast,
}));

let axiosMock;
let queryClient;
const { id: _id, ...params } =
  recommendationRequestFixtures.oneRecommendationRequest;
const expectedParams = {
  ...params,
  dateRequested: "2026-10-01T10:00",
  dateNeeded: "2026-12-01T17:00",
};

function renderPage(props = {}) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter
        initialEntries={[
          "/recommendationrequest",
          "/recommendationrequest/create",
        ]}
        initialIndex={1}
      >
        <Routes>
          <Route
            path="/recommendationrequest/create"
            element={<RecommendationRequestCreatePage {...props} />}
          />
          <Route
            path="/recommendationrequest"
            element={<h1>RecommendationRequest index destination</h1>}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
function fillForm(done = false) {
  for (const field of [
    "requesterEmail",
    "professorEmail",
    "explanation",
    "dateRequested",
    "dateNeeded",
  ]) {
    fireEvent.change(screen.getByTestId(`RecommendationRequestForm-${field}`), {
      target: { value: params[field] },
    });
  }
  if (done) fireEvent.click(screen.getByLabelText("Done"));
}
function submit() {
  fireEvent.click(screen.getByRole("button", { name: "Create", exact: true }));
}

beforeEach(() => {
  vi.clearAllMocks();
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  axiosMock = new AxiosMockAdapter(axios);
  axiosMock
    .onGet("/api/currentUser")
    .reply(200, apiCurrentUserFixtures.adminUser);
  axiosMock
    .onGet("/api/systemInfo")
    .reply(200, systemInfoFixtures.showingNeither);
});
afterEach(() => {
  axiosMock.restore();
  queryClient.clear();
  vi.restoreAllMocks();
});

test("renders the create form with blank fields and no generated ID", async () => {
  renderPage();
  expect(
    screen.getByRole("heading", { name: "Create New RecommendationRequest" }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Requester Email")).toHaveValue("");
  expect(screen.queryByLabelText("Id")).not.toBeInTheDocument();
  expect(screen.getByLabelText("Done")).not.toBeChecked();
  expect(
    screen.queryByText("RecommendationRequest index destination"),
  ).not.toBeInTheDocument();
});

test.each([false, true])(
  "valid submission sends all fields with done=%s, invalidates the list, and redirects",
  async (done) => {
    const hookSpy = vi.spyOn(backend, "useBackendMutation");
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    axiosMock
      .onPost("/api/recommendationrequests/post")
      .reply(200, { ...expectedParams, done, id: 17 });
    renderPage();
    expect(hookSpy).toHaveBeenCalledWith(
      expect.any(Function),
      { onSuccess: expect.any(Function) },
      ["/api/recommendationrequests/all"],
    );
    fillForm(done);
    submit();
    await screen.findByRole("heading", {
      name: "RecommendationRequest index destination",
    });
    expect(axiosMock.history.post).toHaveLength(1);
    expect(axiosMock.history.post[0].params).toEqual({
      ...expectedParams,
      done,
    });
    expect(axiosMock.history.post[0].url).toBe(
      "/api/recommendationrequests/post",
    );
    expect(mockToast).toHaveBeenCalledWith(
      "New RecommendationRequest created - id: 17",
    );
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["/api/recommendationrequests/all"],
    });
  },
);

test("empty form displays validation errors without sending a request or navigating", async () => {
  renderPage();
  submit();
  expect(
    await screen.findByText("Requester Email is required."),
  ).toBeInTheDocument();
  for (const label of [
    "Professor Email",
    "Explanation",
    "Date Requested",
    "Date Needed",
  ]) {
    expect(screen.getByText(`${label} is required.`)).toBeInTheDocument();
  }
  expect(axiosMock.history.post).toHaveLength(0);
  expect(
    screen.getByRole("heading", { name: "Create New RecommendationRequest" }),
  ).toBeInTheDocument();
});

test("invalid email blocks the backend request", async () => {
  renderPage();
  fillForm();
  fireEvent.change(screen.getByLabelText("Requester Email"), {
    target: { value: "bad-email" },
  });
  submit();
  expect(
    await screen.findByText("Enter a valid email address."),
  ).toBeInTheDocument();
  expect(axiosMock.history.post).toHaveLength(0);
  expect(
    screen.queryByText("RecommendationRequest index destination"),
  ).not.toBeInTheDocument();
});

test("backend failure shows an error and preserves the form instead of redirecting", async () => {
  axiosMock.onPost("/api/recommendationrequests/post").reply(500);
  renderPage();
  fillForm();
  submit();
  await waitFor(() =>
    expect(mockToast).toHaveBeenCalledWith(expect.stringContaining("500")),
  );
  expect(axiosMock.history.post).toHaveLength(1);
  expect(screen.getByLabelText("Requester Email")).toHaveValue(
    params.requesterEmail,
  );
  expect(
    screen.getByRole("heading", { name: "Create New RecommendationRequest" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByText("RecommendationRequest index destination"),
  ).not.toBeInTheDocument();
});

test("Storybook mode submits successfully but keeps the form on screen", async () => {
  axiosMock
    .onPost("/api/recommendationrequests/post")
    .reply(200, { ...expectedParams, id: 17 });
  renderPage({ storybook: true });
  fillForm();
  submit();
  await waitFor(() =>
    expect(mockToast).toHaveBeenCalledWith(
      "New RecommendationRequest created - id: 17",
    ),
  );
  expect(
    screen.getByRole("heading", { name: "Create New RecommendationRequest" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByText("RecommendationRequest index destination"),
  ).not.toBeInTheDocument();
});

test("Cancel returns to the previous page without posting", async () => {
  renderPage();
  fillForm();
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(
    await screen.findByRole("heading", {
      name: "RecommendationRequest index destination",
    }),
  ).toBeInTheDocument();
  expect(axiosMock.history.post).toHaveLength(0);
});
