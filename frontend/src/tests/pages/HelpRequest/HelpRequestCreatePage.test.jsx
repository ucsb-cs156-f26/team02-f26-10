import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import HelpRequestCreatePage from "main/pages/HelpRequest/HelpRequestCreatePage";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import { helpRequestFixtures } from "fixtures/helpRequestFixtures";
import * as backend from "main/utils/useBackend";

const { mockToast } = vi.hoisted(() => ({ mockToast: vi.fn() }));
vi.mock("react-toastify", async (importOriginal) => ({
  ...(await importOriginal()),
  toast: mockToast,
}));

let axiosMock;
let queryClient;
const { id: _id, ...params } = helpRequestFixtures.oneHelpRequest;
const expectedParams = { ...params, requestTime: "2026-10-28T15:20" };

function renderPage(props = {}) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter
        initialEntries={["/helprequest", "/helprequest/create"]}
        initialIndex={1}
      >
        <Routes>
          <Route
            path="/helprequest/create"
            element={<HelpRequestCreatePage {...props} />}
          />
          <Route
            path="/helprequest"
            element={<h1>HelpRequest index destination</h1>}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
function fillForm(solved = false) {
  for (const field of [
    "requesterEmail",
    "teamId",
    "tableOrBreakoutRoom",
    "requestTime",
    "explanation",
  ]) {
    fireEvent.change(screen.getByTestId(`HelpRequestForm-${field}`), {
      target: { value: params[field] },
    });
  }
  if (solved) fireEvent.click(screen.getByLabelText("Solved"));
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
    screen.getByRole("heading", { name: "Create New HelpRequest" }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Requester Email")).toHaveValue("");
  expect(screen.queryByLabelText("Id")).not.toBeInTheDocument();
  expect(screen.getByLabelText("Solved")).not.toBeChecked();
  expect(
    screen.queryByText("HelpRequest index destination"),
  ).not.toBeInTheDocument();
});

test.each([false, true])(
  "valid submission sends all fields with solved=%s, invalidates the list, and redirects",
  async (solved) => {
    const hookSpy = vi.spyOn(backend, "useBackendMutation");
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    axiosMock
      .onPost("/api/helprequests/post")
      .reply(200, { ...expectedParams, solved, id: 17 });
    renderPage();
    expect(hookSpy).toHaveBeenCalledWith(
      expect.any(Function),
      { onSuccess: expect.any(Function) },
      ["/api/helprequests/all"],
    );
    fillForm(solved);
    submit();
    await screen.findByRole("heading", {
      name: "HelpRequest index destination",
    });
    expect(axiosMock.history.post).toHaveLength(1);
    expect(axiosMock.history.post[0].params).toEqual({
      ...expectedParams,
      solved,
    });
    expect(axiosMock.history.post[0].url).toBe("/api/helprequests/post");
    expect(mockToast).toHaveBeenCalledWith("New HelpRequest created - id: 17");
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["/api/helprequests/all"],
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
    "Team ID",
    "Table or Breakout Room",
    "Request Time",
    "Explanation",
  ]) {
    expect(screen.getByText(`${label} is required.`)).toBeInTheDocument();
  }
  expect(axiosMock.history.post).toHaveLength(0);
  expect(
    screen.getByRole("heading", { name: "Create New HelpRequest" }),
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
    screen.queryByText("HelpRequest index destination"),
  ).not.toBeInTheDocument();
});

test("backend failure shows an error and preserves the form instead of redirecting", async () => {
  axiosMock.onPost("/api/helprequests/post").reply(500);
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
    screen.getByRole("heading", { name: "Create New HelpRequest" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByText("HelpRequest index destination"),
  ).not.toBeInTheDocument();
});

test("Storybook mode submits successfully but keeps the form on screen", async () => {
  axiosMock
    .onPost("/api/helprequests/post")
    .reply(200, { ...expectedParams, id: 17 });
  renderPage({ storybook: true });
  fillForm();
  submit();
  await waitFor(() =>
    expect(mockToast).toHaveBeenCalledWith("New HelpRequest created - id: 17"),
  );
  expect(
    screen.getByRole("heading", { name: "Create New HelpRequest" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByText("HelpRequest index destination"),
  ).not.toBeInTheDocument();
});

test("Cancel returns to the previous page without posting", async () => {
  renderPage();
  fillForm();
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(
    await screen.findByRole("heading", {
      name: "HelpRequest index destination",
    }),
  ).toBeInTheDocument();
  expect(axiosMock.history.post).toHaveLength(0);
});
