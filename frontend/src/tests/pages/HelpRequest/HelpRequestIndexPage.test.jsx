import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import HelpRequestIndexPage from "main/pages/HelpRequest/HelpRequestIndexPage";
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
const records = helpRequestFixtures.threeHelpRequests;
const fields = [
  "id",
  "requesterEmail",
  "teamId",
  "tableOrBreakoutRoom",
  "requestTime",
  "explanation",
  "solved",
];

function renderPage(user = apiCurrentUserFixtures.userOnly) {
  axiosMock.onGet("/api/currentUser").reply(200, user);
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/helprequest"]}>
        <Routes>
          <Route path="/helprequest" element={<HelpRequestIndexPage />} />
          <Route
            path="/helprequest/edit/:id"
            element={<h1>HelpRequest edit destination</h1>}
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
  axiosMock.onGet("/api/helprequests/all").reply(200, []);
  renderPage(apiCurrentUserFixtures.adminUser);
  const create = await screen.findByRole("button", {
    name: "Create HelpRequest",
  });
  expect(create).toHaveAttribute("href", "/helprequest/create");
  expect(create).toHaveClass("btn-primary");
  expect(create).toHaveStyle({ float: "right" });
  expect(
    screen.getByRole("heading", { name: "HelpRequests" }),
  ).toBeInTheDocument();
  expect(screen.getByTestId("HelpRequestTable")).toBeInTheDocument();
  expect(screen.getAllByRole("row")).toHaveLength(1);
  expect(hookSpy).toHaveBeenCalledWith(
    ["/api/helprequests/all"],
    { method: "GET", url: "/api/helprequests/all" },
    [],
  );
});

test("ordinary users see every returned field but no Create, Edit, or Delete actions", async () => {
  axiosMock.onGet("/api/helprequests/all").reply(200, records);
  renderPage();
  await screen.findByTestId("HelpRequestTable-cell-row-2-col-id");
  await screen.findByText("Welcome, pconrad.cis@gmail.com");
  for (const [index, record] of records.entries()) {
    for (const field of fields) {
      const expected =
        field === "solved"
          ? record.solved
            ? "Yes"
            : "No"
          : String(record[field]);
      expect(
        screen.getByTestId(`HelpRequestTable-cell-row-${index}-col-${field}`),
      ).toHaveTextContent(expected);
    }
  }
  expect(
    screen.queryByRole("button", { name: "Create HelpRequest" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Edit", exact: true }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Delete", exact: true }),
  ).not.toBeInTheDocument();
});

test("admin sees per-record actions and Edit reaches the selected record route", async () => {
  axiosMock.onGet("/api/helprequests/all").reply(200, records);
  renderPage(apiCurrentUserFixtures.adminUser);
  const edit = await screen.findByTestId(
    "HelpRequestTable-cell-row-1-col-Edit-button",
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
      name: "HelpRequest edit destination",
    }),
  ).toBeInTheDocument();
});

test("delete sends the selected ID, refetches the list, and removes the row", async () => {
  let savedRecords = [...records];
  axiosMock.onGet("/api/helprequests/all").reply(() => [200, savedRecords]);
  axiosMock.onDelete("/api/helprequests").reply((config) => {
    savedRecords = savedRecords.filter(
      (record) => record.id !== config.params.id,
    );
    return [200, "HelpRequest with id 2 deleted"];
  });
  renderPage(apiCurrentUserFixtures.adminUser);
  const deletedEmail = records[1].requesterEmail;
  await screen.findByText(deletedEmail);
  fireEvent.click(
    await screen.findByTestId("HelpRequestTable-cell-row-1-col-Delete-button"),
  );
  await waitFor(() =>
    expect(screen.queryByText(deletedEmail)).not.toBeInTheDocument(),
  );
  expect(axiosMock.history.delete).toHaveLength(1);
  expect(axiosMock.history.delete[0].params).toEqual({ id: 2 });
  expect(
    axiosMock.history.get.filter(
      (request) => request.url === "/api/helprequests/all",
    ).length,
  ).toBeGreaterThanOrEqual(2);
  expect(screen.getByText(records[0].requesterEmail)).toBeInTheDocument();
  expect(screen.getByText(records[2].requesterEmail)).toBeInTheDocument();
  expect(mockToast).toHaveBeenCalledWith("HelpRequest with id 2 deleted");
});

test("a failed deletion shows an error and retains the existing record", async () => {
  axiosMock.onGet("/api/helprequests/all").reply(200, records);
  axiosMock.onDelete("/api/helprequests").reply(500);
  renderPage(apiCurrentUserFixtures.adminUser);
  fireEvent.click(
    await screen.findByTestId("HelpRequestTable-cell-row-1-col-Delete-button"),
  );
  await waitFor(() =>
    expect(mockToast).toHaveBeenCalledWith(expect.stringContaining("500")),
  );
  expect(screen.getByText(records[1].requesterEmail)).toBeInTheDocument();
});

test("failed GET uses the safe empty list and reports the backend error", async () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  axiosMock.onGet("/api/helprequests/all").timeout();
  renderPage();
  await waitFor(() =>
    expect(mockToast).toHaveBeenCalledWith(
      "Error communicating with backend via GET on /api/helprequests/all",
    ),
  );
  expect(log).toHaveBeenCalled();
  expect(screen.getByTestId("HelpRequestTable")).toBeInTheDocument();
  expect(screen.getAllByRole("row")).toHaveLength(1);
});
