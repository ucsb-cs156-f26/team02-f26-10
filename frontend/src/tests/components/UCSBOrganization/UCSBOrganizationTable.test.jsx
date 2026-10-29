import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";

import UCSBOrganizationTable from "main/components/UCSBOrganization/UCSBOrganizationTable";
import { ucsbOrganizationFixtures } from "fixtures/ucsbOrganizationFixtures";
import { currentUserFixtures } from "fixtures/currentUserFixtures";

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

function renderTable(
  organizations,
  currentUser = currentUserFixtures.userOnly,
) {
  const queryClient = new QueryClient();

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <UCSBOrganizationTable
          organizations={organizations}
          currentUser={currentUser}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );

  return queryClient;
}

describe("UCSBOrganizationTable tests", () => {
  const axiosMock = new AxiosMockAdapter(axios);
  const testId = "UCSBOrganizationTable";
  const expectedHeaders = [
    "Organization Code",
    "Short Name",
    "Full Name",
    "Inactive",
  ];
  const expectedFields = [
    "orgCode",
    "orgTranslationShort",
    "orgTranslation",
    "inactive",
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    axiosMock.reset();
    axiosMock.resetHistory();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(() => {
    axiosMock.restore();
  });

  test("renders an empty table with the expected headers", () => {
    renderTable([]);

    expect(screen.getByTestId(testId)).toBeInTheDocument();
    expectedHeaders.forEach((header) => {
      expect(screen.getByText(header)).toBeInTheDocument();
    });
    expect(screen.getAllByRole("columnheader")).toHaveLength(4);
    expect(screen.getAllByRole("row")).toHaveLength(1);

    expectedFields.forEach((field) => {
      expect(
        screen.queryByTestId(`${testId}-cell-row-0-col-${field}`),
      ).not.toBeInTheDocument();
    });
  });

  test("renders every field without action buttons for an ordinary user", () => {
    const organizations = ucsbOrganizationFixtures.threeOrganizations;
    renderTable(organizations);

    expectedHeaders.forEach((header) => {
      expect(screen.getByText(header)).toBeInTheDocument();
    });
    expect(screen.getAllByRole("columnheader")).toHaveLength(4);
    expect(screen.getAllByRole("row")).toHaveLength(4);

    organizations.forEach((organization, rowIndex) => {
      expectedFields.forEach((field) => {
        expect(
          screen.getByTestId(`${testId}-cell-row-${rowIndex}-col-${field}`),
        ).toHaveTextContent(String(organization[field]));
      });
    });

    expect(
      screen.queryByRole("button", { name: "Edit" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete" }),
    ).not.toBeInTheDocument();
  });

  test("shows Edit and Delete buttons for every row for an administrator", () => {
    renderTable(
      ucsbOrganizationFixtures.threeOrganizations,
      currentUserFixtures.adminUser,
    );

    expect(screen.getAllByRole("columnheader")).toHaveLength(6);
    expect(screen.getAllByRole("button", { name: "Edit" })).toHaveLength(3);
    expect(screen.getAllByRole("button", { name: "Delete" })).toHaveLength(3);
    expect(
      screen.getByTestId(`${testId}-cell-row-0-col-Edit-button`),
    ).toHaveClass("btn-primary");
    expect(
      screen.getByTestId(`${testId}-cell-row-0-col-Delete-button`),
    ).toHaveClass("btn-danger");
  });

  test.each([
    ["ZPR", "/ucsborganization/edit/ZPR"],
    ["A/B C", "/ucsborganization/edit/A%2FB%20C"],
  ])("edits the row identified by orgCode %s", (orgCode, expectedPath) => {
    renderTable(
      [{ ...ucsbOrganizationFixtures.oneOrganization, orgCode }],
      currentUserFixtures.adminUser,
    );

    fireEvent.click(screen.getByTestId(`${testId}-cell-row-0-col-Edit-button`));

    expect(mockNavigate).toHaveBeenCalledWith(expectedPath);
  });

  test("deletes by orgCode, displays the response message, and refreshes the list cache", async () => {
    const organization = ucsbOrganizationFixtures.oneOrganization;
    const message = `UCSBOrganization with id ${organization.orgCode} deleted`;
    axiosMock.onDelete("/api/ucsborganizations").reply(200, { message });

    const queryClient = renderTable(
      [organization],
      currentUserFixtures.adminUser,
    );
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");

    fireEvent.click(
      screen.getByTestId(`${testId}-cell-row-0-col-Delete-button`),
    );

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(message);
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["/api/ucsborganizations/all"],
      });
    });

    expect(axiosMock.history.delete).toHaveLength(1);
    expect(axiosMock.history.delete[0].url).toBe("/api/ucsborganizations");
    expect(axiosMock.history.delete[0].params).toEqual({
      orgCode: organization.orgCode,
    });
  });
});
