import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import RecommendationRequestIndexPage from "main/pages/RecommendationRequest/RecommendationRequestIndexPage";
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
const records = recommendationRequestFixtures.threeRecommendationRequests;
const fields = [
  "id",
  "requesterEmail",
  "professorEmail",
  "explanation",
  "dateRequested",
  "dateNeeded",
  "done",
];

function renderPage(user = apiCurrentUserFixtures.userOnly) {
  axiosMock.onGet("/api/currentUser").reply(200, user);
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/recommendationrequest"]}>
        <Routes>
          <Route
            path="/recommendationrequest"
            element={<RecommendationRequestIndexPage />}
          />
          <Route
            path="/recommendationrequest/edit/:id"
            element={<h1>RecommendationRequest edit destination</h1>}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  axiosMock = new AxiosMockAdapter(axios);
  axiosMock
    .onGet("/api/systemInfo")
    .reply(200, systemInfoFixtures.showingNeither);
});
afterEach(() => {
  axiosMock.restore();
  queryClient.clear();
  vi.restoreAllMocks();
});

test("admin sees the Create link and an empty table with all columns", async () => {
  const hookSpy = vi.spyOn(backend, "useBackend");
  axiosMock.onGet("/api/recommendationrequests/all").reply(200, []);
  renderPage(apiCurrentUserFixtures.adminUser);
  const create = await screen.findByRole("button", {
    name: "Create RecommendationRequest",
  });
  expect(create).toHaveAttribute("href", "/recommendationrequest/create");
  expect(create).toHaveClass("btn-primary");
  expect(create).toHaveStyle({ float: "right" });
  expect(
    screen.getByRole("heading", { name: "RecommendationRequests" }),
  ).toBeInTheDocument();
  expect(screen.getByTestId("RecommendationRequestTable")).toBeInTheDocument();
  expect(screen.getAllByRole("row")).toHaveLength(1);
  expect(hookSpy).toHaveBeenCalledWith(
    ["/api/recommendationrequests/all"],
    { method: "GET", url: "/api/recommendationrequests/all" },
    [],
  );
});

test("ordinary users see every returned field but no Create, Edit, or Delete actions", async () => {
  axiosMock.onGet("/api/recommendationrequests/all").reply(200, records);
  renderPage();
  await screen.findByTestId("RecommendationRequestTable-cell-row-2-col-id");
  await screen.findByText("Welcome, pconrad.cis@gmail.com");
  for (const [index, record] of records.entries()) {
    for (const field of fields) {
      const expected =
        field === "done" ? (record.done ? "Yes" : "No") : String(record[field]);
      expect(
        screen.getByTestId(
          `RecommendationRequestTable-cell-row-${index}-col-${field}`,
        ),
      ).toHaveTextContent(expected);
    }
  }
  expect(
    screen.queryByRole("button", { name: "Create RecommendationRequest" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Edit", exact: true }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Delete", exact: true }),
  ).not.toBeInTheDocument();
});

test("admin sees per-record actions and Edit reaches the selected record route", async () => {
  axiosMock.onGet("/api/recommendationrequests/all").reply(200, records);
  renderPage(apiCurrentUserFixtures.adminUser);
  const edit = await screen.findByTestId(
    "RecommendationRequestTable-cell-row-1-col-Edit-button",
  );
  expect(
    screen.getAllByRole("button", { name: "Edit", exact: true }),
  ).toHaveLength(3);
  expect(
    screen.getAllByRole("button", { name: "Delete", exact: true }),
  ).toHaveLength(3);
  fireEvent.click(edit);
  expect(
    await screen.findByRole("heading", {
      name: "RecommendationRequest edit destination",
    }),
  ).toBeInTheDocument();
});

test("delete sends the selected ID, refetches the list, and removes the row", async () => {
  let savedRecords = [...records];
  axiosMock
    .onGet("/api/recommendationrequests/all")
    .reply(() => [200, savedRecords]);
  axiosMock.onDelete("/api/recommendationrequests").reply((config) => {
    savedRecords = savedRecords.filter(
      (record) => record.id !== config.params.id,
    );
    return [200, "RecommendationRequest with id 2 deleted"];
  });
  renderPage(apiCurrentUserFixtures.adminUser);
  const deletedEmail = records[1].requesterEmail;
  await screen.findByText(deletedEmail);
  fireEvent.click(
    await screen.findByTestId(
      "RecommendationRequestTable-cell-row-1-col-Delete-button",
    ),
  );
  await waitFor(() =>
    expect(screen.queryByText(deletedEmail)).not.toBeInTheDocument(),
  );
  expect(axiosMock.history.delete).toHaveLength(1);
  expect(axiosMock.history.delete[0].params).toEqual({ id: 2 });
  expect(
    axiosMock.history.get.filter(
      (request) => request.url === "/api/recommendationrequests/all",
    ).length,
  ).toBeGreaterThanOrEqual(2);
  expect(screen.getByText(records[0].requesterEmail)).toBeInTheDocument();
  expect(screen.getByText(records[2].requesterEmail)).toBeInTheDocument();
  expect(mockToast).toHaveBeenCalledWith(
    "RecommendationRequest with id 2 deleted",
  );
});

test("a failed deletion shows an error and retains the existing record", async () => {
  axiosMock.onGet("/api/recommendationrequests/all").reply(200, records);
  axiosMock.onDelete("/api/recommendationrequests").reply(500);
  renderPage(apiCurrentUserFixtures.adminUser);
  fireEvent.click(
    await screen.findByTestId(
      "RecommendationRequestTable-cell-row-1-col-Delete-button",
    ),
  );
  await waitFor(() =>
    expect(mockToast).toHaveBeenCalledWith(expect.stringContaining("500")),
  );
  expect(screen.getByText(records[1].requesterEmail)).toBeInTheDocument();
});

test("failed GET uses the safe empty list and reports the backend error", async () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  axiosMock.onGet("/api/recommendationrequests/all").timeout();
  renderPage();
  await waitFor(() =>
    expect(mockToast).toHaveBeenCalledWith(
      "Error communicating with backend via GET on /api/recommendationrequests/all",
    ),
  );
  expect(log).toHaveBeenCalled();
  expect(screen.getByTestId("RecommendationRequestTable")).toBeInTheDocument();
  expect(screen.getAllByRole("row")).toHaveLength(1);
});
