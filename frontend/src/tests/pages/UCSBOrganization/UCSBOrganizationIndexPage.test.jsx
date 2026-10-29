import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";

import UCSBOrganizationIndexPage from "main/pages/UCSBOrganization/UCSBOrganizationIndexPage";
import { ucsbOrganizationFixtures } from "fixtures/ucsbOrganizationFixtures";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";

const mockNavigate = vi.fn();
const mockToast = vi.fn();

vi.mock("react-router", async (importOriginal) => {
  const originalModule = await importOriginal();
  return { ...originalModule, useNavigate: () => mockNavigate };
});

vi.mock("react-toastify", async (importOriginal) => {
  const originalModule = await importOriginal();
  return { ...originalModule, toast: vi.fn((message) => mockToast(message)) };
});

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <UCSBOrganizationIndexPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("UCSBOrganizationIndexPage tests", () => {
  const axiosMock = new AxiosMockAdapter(axios);
  const testId = "UCSBOrganizationTable";
  const listUrl = "/api/ucsborganizations/all";
  const fields = [
    "orgCode",
    "orgTranslationShort",
    "orgTranslation",
    "inactive",
  ];

  function setupUser(user) {
    axiosMock.onGet("/api/currentUser").reply(200, user);
  }

  beforeEach(() => {
    vi.clearAllMocks();
    axiosMock.reset();
    axiosMock.resetHistory();
    axiosMock
      .onGet("/api/systemInfo")
      .reply(200, systemInfoFixtures.showingNeither);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(() => {
    axiosMock.restore();
  });

  test("shows the create link and an empty table for an administrator", async () => {
    setupUser(apiCurrentUserFixtures.adminUser);
    axiosMock.onGet(listUrl).reply(200, []);
    renderPage();

    const createButton = await screen.findByRole("button", {
      name: "Create UCSBOrganization",
    });

    expect(createButton).toHaveAttribute("href", "/ucsborganization/create");
    expect(createButton).toHaveAttribute("style", "float: right;");
    expect(createButton).toHaveClass("btn-primary");
    expect(
      screen.getByRole("heading", { name: "UCSB Organizations" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId(testId)).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")).toHaveLength(6);
    expect(screen.queryByTestId(`${testId}-row-0`)).not.toBeInTheDocument();
  });

  test("loads all records and hides create, edit, and delete for an ordinary user", async () => {
    setupUser(apiCurrentUserFixtures.userOnly);
    const organizations = ucsbOrganizationFixtures.threeOrganizations;
    axiosMock.onGet(listUrl).reply(200, organizations);
    renderPage();

    await screen.findByText("Welcome, pconrad.cis@gmail.com");
    await screen.findByTestId(`${testId}-cell-row-0-col-orgCode`);

    organizations.forEach((organization, rowIndex) => {
      fields.forEach((field) => {
        expect(
          screen.getByTestId(`${testId}-cell-row-${rowIndex}-col-${field}`),
        ).toHaveTextContent(String(organization[field]));
      });
    });

    expect(screen.getAllByRole("columnheader")).toHaveLength(4);
    expect(
      screen.queryByRole("button", { name: "Create UCSBOrganization" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete" }),
    ).not.toBeInTheDocument();
  });

  test("renders an empty list for an ordinary user", async () => {
    setupUser(apiCurrentUserFixtures.userOnly);
    axiosMock.onGet(listUrl).reply(200, []);
    renderPage();

    await screen.findByText("Welcome, pconrad.cis@gmail.com");
    expect(screen.getByTestId(testId)).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")).toHaveLength(4);
    expect(screen.getAllByRole("row")).toHaveLength(1);
  });

  test("shows the administrator row actions and edits the selected organization", async () => {
    setupUser(apiCurrentUserFixtures.adminUser);
    axiosMock
      .onGet(listUrl)
      .reply(200, ucsbOrganizationFixtures.threeOrganizations);
    renderPage();

    const editButton = await screen.findByTestId(
      `${testId}-cell-row-0-col-Edit-button`,
    );
    expect(screen.getAllByRole("button", { name: "Edit" })).toHaveLength(3);
    expect(screen.getAllByRole("button", { name: "Delete" })).toHaveLength(3);

    fireEvent.click(editButton);
    expect(mockNavigate).toHaveBeenCalledWith("/ucsborganization/edit/ZPR");
  });

  test("deletes the selected record and reloads the table without that row", async () => {
    setupUser(apiCurrentUserFixtures.adminUser);
    let organizations = [...ucsbOrganizationFixtures.threeOrganizations];
    const message = "UCSBOrganization with id ZPR deleted";

    axiosMock.onGet(listUrl).reply(() => [200, organizations]);
    axiosMock.onDelete("/api/ucsborganizations").reply((config) => {
      organizations = organizations.filter(
        (organization) => organization.orgCode !== config.params.orgCode,
      );
      return [200, { message }];
    });

    renderPage();

    expect(await screen.findByText("ZPR", { exact: true })).toBeInTheDocument();
    const deleteButton = await screen.findByTestId(
      `${testId}-cell-row-0-col-Delete-button`,
    );
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(
        screen.queryByText("ZPR", { exact: true }),
      ).not.toBeInTheDocument();
      expect(screen.getAllByRole("row")).toHaveLength(3);
    });

    expect(screen.getByText("GGG", { exact: true })).toBeInTheDocument();
    expect(screen.getByText("HHH", { exact: true })).toBeInTheDocument();
    expect(mockToast).toHaveBeenCalledWith(message);
    expect(axiosMock.history.delete).toHaveLength(1);
    expect(axiosMock.history.delete[0].url).toBe("/api/ucsborganizations");
    expect(axiosMock.history.delete[0].params).toEqual({ orgCode: "ZPR" });
    expect(
      axiosMock.history.get.filter((request) => request.url === listUrl).length,
    ).toBeGreaterThanOrEqual(2);
  });

  test("keeps an empty table when the list request fails", async () => {
    setupUser(apiCurrentUserFixtures.userOnly);
    axiosMock.onGet(listUrl).timeout();
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    renderPage();

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        "Error communicating with backend via GET on /api/ucsborganizations/all",
      );
    });

    expect(consoleError).toHaveBeenCalled();
    expect(screen.getByTestId(testId)).toBeInTheDocument();
    expect(screen.queryByTestId(`${testId}-row-0`)).not.toBeInTheDocument();
  });
});
