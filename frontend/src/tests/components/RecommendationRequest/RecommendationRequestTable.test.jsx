import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import RecommendationRequestTable from "main/components/RecommendationRequest/RecommendationRequestTable";
import { recommendationRequestFixtures } from "fixtures/recommendationRequestFixtures";
import { currentUserFixtures } from "fixtures/currentUserFixtures";
import * as backend from "main/utils/useBackend";
import {
  cellToAxiosParamsDelete,
  onDeleteSuccess,
} from "main/utils/recommendationRequestUtils";

const mockedNavigate = vi.fn();
vi.mock("react-router", async () => ({
  ...(await vi.importActual("react-router")),
  useNavigate: () => mockedNavigate,
}));

const fields = {
  id: "ID",
  requesterEmail: "Requester Email",
  professorEmail: "Professor Email",
  explanation: "Explanation",
  dateRequested: "Date Requested",
  dateNeeded: "Date Needed",
  done: "Done",
};
const records = recommendationRequestFixtures.threeRecommendationRequests;
let queryClient;
let axiosMock;

function renderTable(props = {}) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <RecommendationRequestTable
          recommendationRequests={records}
          currentUser={currentUserFixtures.adminUser}
          {...props}
        />
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
});
afterEach(() => {
  axiosMock.restore();
  queryClient.clear();
  vi.restoreAllMocks();
});

test("empty table shows all headings and no data rows", () => {
  renderTable({
    recommendationRequests: [],
    currentUser: currentUserFixtures.userOnly,
  });
  for (const label of Object.values(fields))
    expect(
      screen.getByRole("columnheader", { name: label }),
    ).toBeInTheDocument();
  expect(screen.getAllByRole("row")).toHaveLength(1);
  expect(
    screen.queryByRole("button", { name: "Edit" }),
  ).not.toBeInTheDocument();
});

test("ordinary users see every field and readable done states, with no actions", () => {
  renderTable({ currentUser: currentUserFixtures.userOnly });
  for (const [index, record] of records.entries()) {
    for (const field of Object.keys(fields)) {
      const value =
        field === "done" ? (record.done ? "Yes" : "No") : String(record[field]);
      expect(
        screen.getByTestId(
          `RecommendationRequestTable-cell-row-${index}-col-${field}`,
        ),
      ).toHaveTextContent(value);
    }
  }
  expect(
    screen.queryByRole("columnheader", { name: "Edit" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("columnheader", { name: "Delete" }),
  ).not.toBeInTheDocument();
});

test("admins see styled Edit and Delete buttons for every record", () => {
  renderTable();
  expect(screen.getByTestId("RecommendationRequestTable")).toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: "Edit" })).toHaveLength(3);
  expect(screen.getAllByRole("button", { name: "Delete" })).toHaveLength(3);
  expect(screen.getAllByRole("button", { name: "Edit" })[0]).toHaveClass(
    "btn-primary",
  );
  expect(screen.getAllByRole("button", { name: "Delete" })[0]).toHaveClass(
    "btn-danger",
  );
});

test("custom test ID prefix applies to the table and action buttons", () => {
  renderTable({ testIdPrefix: "CustomRecommendationRequests" });
  expect(
    screen.getByTestId("CustomRecommendationRequests"),
  ).toBeInTheDocument();
  expect(
    screen.getByTestId(
      "CustomRecommendationRequests-cell-row-0-col-Edit-button",
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByTestId(
      "CustomRecommendationRequests-cell-row-0-col-Delete-button",
    ),
  ).toBeInTheDocument();
});

test("edit uses the clicked record ID in the frontend route", () => {
  renderTable();
  fireEvent.click(
    screen.getByTestId("RecommendationRequestTable-cell-row-1-col-Edit-button"),
  );
  expect(mockedNavigate).toHaveBeenCalledExactlyOnceWith(
    "/recommendationrequest/edit/2",
  );
});

test("delete sends the clicked ID and invalidates the RecommendationRequest list query", async () => {
  const hookSpy = vi.spyOn(backend, "useBackendMutation");
  const invalidate = vi.spyOn(queryClient, "invalidateQueries");
  axiosMock
    .onDelete("/api/recommendationrequests", { params: { id: 2 } })
    .reply(200, "RecommendationRequest with id 2 deleted");
  renderTable();
  expect(hookSpy).toHaveBeenCalledWith(
    cellToAxiosParamsDelete,
    { onSuccess: onDeleteSuccess },
    ["/api/recommendationrequests/all"],
  );
  fireEvent.click(
    screen.getByTestId(
      "RecommendationRequestTable-cell-row-1-col-Delete-button",
    ),
  );
  await waitFor(() => expect(axiosMock.history.delete).toHaveLength(1));
  expect(axiosMock.history.delete[0].url).toBe("/api/recommendationrequests");
  expect(axiosMock.history.delete[0].params).toEqual({ id: 2 });
  await waitFor(() =>
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["/api/recommendationrequests/all"],
    }),
  );
});

test("sorting changes visible order while Edit still targets the correct record", () => {
  renderTable();
  fireEvent.click(
    screen.getByTestId("RecommendationRequestTable-header-id-sort-header"),
  );
  const rows = screen.getAllByRole("row");
  expect(rows[1]).toHaveTextContent(records[2].requesterEmail);
  fireEvent.click(
    screen.getByTestId("RecommendationRequestTable-cell-row-2-col-Edit-button"),
  );
  expect(mockedNavigate).toHaveBeenCalledWith("/recommendationrequest/edit/3");
});
