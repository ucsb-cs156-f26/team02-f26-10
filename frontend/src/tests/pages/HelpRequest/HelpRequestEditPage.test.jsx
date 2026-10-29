import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import HelpRequestEditPage from "main/pages/HelpRequest/HelpRequestEditPage";
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
const record = { ...helpRequestFixtures.oneHelpRequest, id: 17 };
const labels = {
  requesterEmail: "Requester Email",
  teamId: "Team ID",
  tableOrBreakoutRoom: "Table or Breakout Room",
  requestTime: "Request Time",
  explanation: "Explanation",
};

function renderPage(props = {}, id = 17) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter
        initialEntries={["/helprequest", `/helprequest/edit/${id}`]}
        initialIndex={1}
      >
        <Routes>
          <Route
            path="/helprequest/edit/:id"
            element={<HelpRequestEditPage {...props} />}
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
function mockRecord(data = record) {
  axiosMock
    .onGet("/api/helprequests", { params: { id: String(data.id) } })
    .reply(200, data);
}
function submit() {
  fireEvent.click(screen.getByRole("button", { name: "Update", exact: true }));
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

test.each([17, 42])(
  "fetches URL id %s and prefills every field with a disabled ID",
  async (id) => {
    const hookSpy = vi.spyOn(backend, "useBackend");
    mockRecord({ ...record, id });
    renderPage({}, id);
    expect(await screen.findByLabelText("Id")).toHaveValue(String(id));
    expect(screen.getByLabelText("Id")).toBeDisabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    for (const [field, label] of Object.entries(labels)) {
      expect(screen.getByLabelText(label)).toHaveValue(
        field === "requestTime" ? "2026-10-28T15:20" : record[field],
      );
    }
    expect(screen.getByLabelText("Solved")).not.toBeChecked();
    expect(hookSpy).toHaveBeenCalledWith([`/api/helprequests?id=${id}`], {
      method: "GET",
      url: "/api/helprequests",
      params: { id: String(id) },
    });
    expect(
      screen.getByRole("heading", { name: "Edit HelpRequest" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("HelpRequest index destination"),
    ).not.toBeInTheDocument();
  },
);

test.each([false, true])(
  "PUT sends all changed fields with solved=%s, updates caches, and redirects",
  async (solved) => {
    mockRecord({ ...record, solved: !solved });
    const hookSpy = vi.spyOn(backend, "useBackendMutation");
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const changed = {
      requesterEmail: "updated@ucsb.edu",
      teamId: "f26-05",
      tableOrBreakoutRoom: "Breakout 5",
      requestTime: "2026-10-29T14:30",
      explanation: "Updated help request",
      solved,
    };
    const saved = { ...changed, id: 17 };
    axiosMock.onPut("/api/helprequests").reply(200, saved);
    renderPage();
    await screen.findByLabelText("Id");
    for (const [field, label] of Object.entries(labels))
      fireEvent.change(screen.getByLabelText(label), {
        target: { value: changed[field] },
      });
    fireEvent.click(screen.getByLabelText("Solved"));
    submit();
    await screen.findByRole("heading", {
      name: "HelpRequest index destination",
    });
    expect(axiosMock.history.put).toHaveLength(1);
    expect(axiosMock.history.put[0].params).toEqual({ id: "17" });
    expect(JSON.parse(axiosMock.history.put[0].data)).toEqual(changed);
    expect(mockToast).toHaveBeenCalledWith("HelpRequest updated - id: 17");
    expect(queryClient.getQueryData(["/api/helprequests?id=17"])).toEqual(
      saved,
    );
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["/api/helprequests/all"],
    });
    expect(hookSpy).toHaveBeenCalledWith(
      expect.any(Function),
      { onSuccess: expect.any(Function) },
      ["/api/helprequests/all"],
    );
  },
);

test("invalid changes show feedback, send no PUT, and remain on the edit page", async () => {
  mockRecord();
  renderPage();
  await screen.findByLabelText("Id");
  fireEvent.change(screen.getByLabelText("Requester Email"), {
    target: { value: "invalid" },
  });
  fireEvent.change(screen.getByLabelText("Explanation"), {
    target: { value: "" },
  });
  submit();
  expect(
    await screen.findByText("Enter a valid email address."),
  ).toBeInTheDocument();
  expect(screen.getByText("Explanation is required.")).toBeInTheDocument();
  expect(axiosMock.history.put).toHaveLength(0);
  expect(
    screen.getByRole("heading", { name: "Edit HelpRequest" }),
  ).toBeInTheDocument();
});

test("Cancel discards unsaved edits and returns to the previous page", async () => {
  mockRecord();
  renderPage();
  await screen.findByLabelText("Id");
  fireEvent.change(screen.getByLabelText("Explanation"), {
    target: { value: "Do not save this" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(
    await screen.findByRole("heading", {
      name: "HelpRequest index destination",
    }),
  ).toBeInTheDocument();
  expect(axiosMock.history.put).toHaveLength(0);
  expect(queryClient.getQueryData(["/api/helprequests?id=17"])).toEqual(record);
});

test.each([404, 500])(
  "failed GET (%s) shows an error and no edit form",
  async (status) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    axiosMock.onGet("/api/helprequests").reply(status);
    renderPage();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to load this HelpRequest.",
    );
    expect(screen.queryByLabelText("Id")).not.toBeInTheDocument();
    expect(axiosMock.history.put).toHaveLength(0);
  },
);

test("failed PUT preserves edited values and does not redirect", async () => {
  mockRecord();
  axiosMock.onPut("/api/helprequests").reply(500);
  renderPage();
  await screen.findByLabelText("Id");
  fireEvent.change(screen.getByLabelText("Explanation"), {
    target: { value: "Keep my changes" },
  });
  submit();
  await waitFor(() =>
    expect(mockToast).toHaveBeenCalledWith(expect.stringContaining("500")),
  );
  expect(screen.getByLabelText("Explanation")).toHaveValue("Keep my changes");
  expect(
    screen.getByRole("heading", { name: "Edit HelpRequest" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByText("HelpRequest index destination"),
  ).not.toBeInTheDocument();
});

test("Storybook mode keeps the page visible after a successful update", async () => {
  mockRecord();
  axiosMock.onPut("/api/helprequests").reply(200, record);
  renderPage({ storybook: true });
  await screen.findByLabelText("Id");
  submit();
  await waitFor(() =>
    expect(mockToast).toHaveBeenCalledWith("HelpRequest updated - id: 17"),
  );
  expect(
    screen.getByRole("heading", { name: "Edit HelpRequest" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByText("HelpRequest index destination"),
  ).not.toBeInTheDocument();
});
