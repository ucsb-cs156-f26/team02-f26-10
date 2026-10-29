import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import RecommendationRequestEditPage from "main/pages/RecommendationRequest/RecommendationRequestEditPage";
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
const record = {
  ...recommendationRequestFixtures.oneRecommendationRequest,
  id: 17,
};
const labels = {
  requesterEmail: "Requester Email",
  professorEmail: "Professor Email",
  explanation: "Explanation",
  dateRequested: "Date Requested",
  dateNeeded: "Date Needed",
};

function renderPage(props = {}, id = 17) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter
        initialEntries={[
          "/recommendationrequest",
          `/recommendationrequest/edit/${id}`,
        ]}
        initialIndex={1}
      >
        <Routes>
          <Route
            path="/recommendationrequest/edit/:id"
            element={<RecommendationRequestEditPage {...props} />}
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
function mockRecord(data = record) {
  axiosMock
    .onGet("/api/recommendationrequests", { params: { id: String(data.id) } })
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
        field === "dateRequested"
          ? "2026-10-01T10:00"
          : field === "dateNeeded"
            ? "2026-12-01T17:00"
            : record[field],
      );
    }
    expect(screen.getByLabelText("Done")).not.toBeChecked();
    expect(hookSpy).toHaveBeenCalledWith(
      [`/api/recommendationrequests?id=${id}`],
      {
        method: "GET",
        url: "/api/recommendationrequests",
        params: { id: String(id) },
      },
    );
    expect(
      screen.getByRole("heading", { name: "Edit RecommendationRequest" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("RecommendationRequest index destination"),
    ).not.toBeInTheDocument();
  },
);

test.each([false, true])(
  "PUT sends all changed fields with done=%s, updates caches, and redirects",
  async (done) => {
    mockRecord({ ...record, done: !done });
    const hookSpy = vi.spyOn(backend, "useBackendMutation");
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const changed = {
      requesterEmail: "updated@ucsb.edu",
      professorEmail: "newprof@ucsb.edu",
      explanation: "Updated recommendation request",
      dateRequested: "2026-10-29T14:30",
      dateNeeded: "2026-12-20T09:15",
      done,
    };
    const saved = { ...changed, id: 17 };
    axiosMock.onPut("/api/recommendationrequests").reply(200, saved);
    renderPage();
    await screen.findByLabelText("Id");
    for (const [field, label] of Object.entries(labels))
      fireEvent.change(screen.getByLabelText(label), {
        target: { value: changed[field] },
      });
    fireEvent.click(screen.getByLabelText("Done"));
    submit();
    await screen.findByRole("heading", {
      name: "RecommendationRequest index destination",
    });
    expect(axiosMock.history.put).toHaveLength(1);
    expect(axiosMock.history.put[0].params).toEqual({ id: "17" });
    expect(JSON.parse(axiosMock.history.put[0].data)).toEqual(changed);
    expect(mockToast).toHaveBeenCalledWith(
      "RecommendationRequest updated - id: 17",
    );
    expect(
      queryClient.getQueryData(["/api/recommendationrequests?id=17"]),
    ).toEqual(saved);
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["/api/recommendationrequests/all"],
    });
    expect(hookSpy).toHaveBeenCalledWith(
      expect.any(Function),
      { onSuccess: expect.any(Function) },
      ["/api/recommendationrequests/all"],
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
    screen.getByRole("heading", { name: "Edit RecommendationRequest" }),
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
      name: "RecommendationRequest index destination",
    }),
  ).toBeInTheDocument();
  expect(axiosMock.history.put).toHaveLength(0);
  expect(
    queryClient.getQueryData(["/api/recommendationrequests?id=17"]),
  ).toEqual(record);
});

test.each([404, 500])(
  "failed GET (%s) shows an error and no edit form",
  async (status) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    axiosMock.onGet("/api/recommendationrequests").reply(status);
    renderPage();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to load this RecommendationRequest.",
    );
    expect(screen.queryByLabelText("Id")).not.toBeInTheDocument();
    expect(axiosMock.history.put).toHaveLength(0);
  },
);

test("failed PUT preserves edited values and does not redirect", async () => {
  mockRecord();
  axiosMock.onPut("/api/recommendationrequests").reply(500);
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
    screen.getByRole("heading", { name: "Edit RecommendationRequest" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByText("RecommendationRequest index destination"),
  ).not.toBeInTheDocument();
});

test("Storybook mode keeps the page visible after a successful update", async () => {
  mockRecord();
  axiosMock.onPut("/api/recommendationrequests").reply(200, record);
  renderPage({ storybook: true });
  await screen.findByLabelText("Id");
  submit();
  await waitFor(() =>
    expect(mockToast).toHaveBeenCalledWith(
      "RecommendationRequest updated - id: 17",
    ),
  );
  expect(
    screen.getByRole("heading", { name: "Edit RecommendationRequest" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByText("RecommendationRequest index destination"),
  ).not.toBeInTheDocument();
});
