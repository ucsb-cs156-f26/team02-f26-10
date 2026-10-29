import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";

import UCSBOrganizationEditPage from "main/pages/UCSBOrganization/UCSBOrganizationEditPage";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";

const mockToast = vi.fn();

vi.mock("react-toastify", async (importOriginal) => {
  const originalModule = await importOriginal();
  return { ...originalModule, toast: vi.fn((message) => mockToast(message)) };
});

const organization = {
  orgCode: "SKY",
  orgTranslationShort: "SKYDIVING CLUB",
  orgTranslation: "SKYDIVING CLUB AT UCSB",
  inactive: false,
};

const endpoint = "/api/ucsborganizations";
const queryKey = ["/api/ucsborganizations?orgCode=SKY"];

function renderPage(props = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter
        initialEntries={["/previous", "/ucsborganization/edit/SKY"]}
        initialIndex={1}
      >
        <Routes>
          <Route path="/previous" element={<h1>Previous page</h1>} />
          <Route
            path="/ucsborganization"
            element={<h1>Organization index</h1>}
          />
          <Route
            path="/ucsborganization/edit/:id"
            element={<UCSBOrganizationEditPage {...props} />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

  return queryClient;
}

function changeNames(shortName, fullName) {
  fireEvent.change(screen.getByLabelText("Short Name"), {
    target: { value: shortName },
  });
  fireEvent.change(screen.getByLabelText("Full Name"), {
    target: { value: fullName },
  });
}

describe("UCSBOrganizationEditPage tests", () => {
  const axiosMock = new AxiosMockAdapter(axios);

  beforeEach(() => {
    vi.clearAllMocks();
    axiosMock.reset();
    axiosMock.resetHistory();
    axiosMock
      .onGet("/api/currentUser")
      .reply(200, apiCurrentUserFixtures.adminUser);
    axiosMock
      .onGet("/api/systemInfo")
      .reply(200, systemInfoFixtures.showingNeither);
    axiosMock
      .onGet(endpoint, { params: { orgCode: "SKY" } })
      .reply(200, organization);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(() => {
    axiosMock.restore();
  });

  test("loads the record identified by the route and populates the form", async () => {
    const queryClient = renderPage();

    expect(
      screen.getByRole("heading", { name: "Edit UCSBOrganization" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Organization Code"),
    ).not.toBeInTheDocument();

    const code = await screen.findByLabelText("Organization Code");
    expect(code).toHaveValue("SKY");
    expect(code).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Short Name")).toHaveValue(
      organization.orgTranslationShort,
    );
    expect(screen.getByLabelText("Full Name")).toHaveValue(
      organization.orgTranslation,
    );
    expect(screen.getByLabelText("Inactive")).not.toBeChecked();
    expect(screen.getByRole("button", { name: "Update" })).toBeInTheDocument();
    expect(queryClient.getQueryData(queryKey)).toEqual(organization);
    const request = axiosMock.history.get.find((item) => item.url === endpoint);
    expect(request.params).toEqual({ orgCode: "SKY" });
  });

  test.each([false, true])(
    "saves valid changes with inactive=%s and returns to the index page",
    async (inactive) => {
      axiosMock
        .onGet(endpoint, { params: { orgCode: "SKY" } })
        .reply(200, { ...organization, inactive: !inactive });

      const changes = {
        orgTranslationShort: "UPDATED CLUB",
        orgTranslation: "UPDATED CLUB AT UCSB",
        inactive,
      };
      // Use the response's code to verify that the success message uses backend data.
      const response = { orgCode: "SERVER_CODE", ...changes };
      axiosMock.onPut(endpoint).reply(200, response);
      const queryClient = renderPage();
      const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");

      await screen.findByLabelText("Short Name");
      expect(screen.getByLabelText("Inactive").checked).toBe(!inactive);
      changeNames(changes.orgTranslationShort, changes.orgTranslation);
      fireEvent.click(screen.getByLabelText("Inactive"));
      fireEvent.click(screen.getByRole("button", { name: "Update" }));

      expect(
        await screen.findByRole("heading", { name: "Organization index" }),
      ).toBeInTheDocument();
      expect(axiosMock.history.put).toHaveLength(1);
      expect(axiosMock.history.put[0].url).toBe(endpoint);
      expect(axiosMock.history.put[0].params).toEqual({ orgCode: "SKY" });
      expect(JSON.parse(axiosMock.history.put[0].data)).toEqual(changes);
      expect(mockToast).toHaveBeenCalledWith(
        "UCSBOrganization Updated - orgCode: SERVER_CODE",
      );
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey });
    },
  );

  test.each([
    ["", "Short name is required.", "Full name is required."],
    ["   ", "Short name cannot be blank.", "Full name cannot be blank."],
    [
      "X".repeat(256),
      "Short name must be 255 characters or fewer.",
      "Full name must be 255 characters or fewer.",
    ],
  ])(
    "does not save invalid names: %j",
    async (value, shortError, fullError) => {
      axiosMock.onPut(endpoint).reply(200, organization);
      renderPage();
      await screen.findByLabelText("Short Name");

      changeNames(value, value);
      fireEvent.click(screen.getByRole("button", { name: "Update" }));

      expect(await screen.findByText(shortError)).toBeInTheDocument();
      expect(await screen.findByText(fullError)).toBeInTheDocument();
      expect(axiosMock.history.put).toHaveLength(0);
      expect(mockToast).not.toHaveBeenCalled();
      expect(
        screen.getByRole("heading", { name: "Edit UCSBOrganization" }),
      ).toBeInTheDocument();
      expect(screen.queryByText("Organization index")).not.toBeInTheDocument();
    },
  );

  test("cancels unsaved changes and goes back to the previous page", async () => {
    axiosMock.onPut(endpoint).reply(200, organization);
    renderPage();
    await screen.findByLabelText("Short Name");
    changeNames("UNSAVED CLUB", "UNSAVED CLUB AT UCSB");
    fireEvent.click(screen.getByLabelText("Inactive"));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      await screen.findByRole("heading", { name: "Previous page" }),
    ).toBeInTheDocument();
    expect(axiosMock.history.put).toHaveLength(0);
    expect(mockToast).not.toHaveBeenCalled();
  });

  test("stays on the edit page after a successful save in Storybook mode", async () => {
    axiosMock.onPut(endpoint).reply(200, organization);
    const queryClient = renderPage({ storybook: true });
    await screen.findByLabelText("Short Name");
    changeNames("STORY CLUB", "STORY CLUB AT UCSB");
    fireEvent.click(screen.getByRole("button", { name: "Update" }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        "UCSBOrganization Updated - orgCode: SKY",
      );
      expect(queryClient.isMutating()).toBe(0);
    });
    expect(axiosMock.history.put).toHaveLength(1);
    expect(
      screen.getByRole("heading", { name: "Edit UCSBOrganization" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Organization index")).not.toBeInTheDocument();
  });

  test("keeps the form hidden when loading the record fails", async () => {
    axiosMock.onGet(endpoint, { params: { orgCode: "SKY" } }).timeout();
    vi.spyOn(console, "error").mockImplementation(() => {});
    renderPage();

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        "Error communicating with backend via GET on /api/ucsborganizations",
      );
    });
    expect(
      screen.getByRole("heading", { name: "Edit UCSBOrganization" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Organization Code"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Update" }),
    ).not.toBeInTheDocument();
    expect(axiosMock.history.put).toHaveLength(0);
  });

  test("keeps the user's changes on the page when saving fails", async () => {
    axiosMock.onPut(endpoint).reply(500, { message: "Save failed" });
    const queryClient = renderPage();
    await screen.findByLabelText("Short Name");
    changeNames("RETRY CLUB", "RETRY CLUB AT UCSB");
    fireEvent.click(screen.getByRole("button", { name: "Update" }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        "Error: Request failed with status code 500",
      );
      expect(queryClient.isMutating()).toBe(0);
    });
    expect(axiosMock.history.put).toHaveLength(1);
    expect(screen.getByLabelText("Short Name")).toHaveValue("RETRY CLUB");
    expect(screen.getByLabelText("Full Name")).toHaveValue(
      "RETRY CLUB AT UCSB",
    );
    expect(
      screen.getByRole("heading", { name: "Edit UCSBOrganization" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Organization index")).not.toBeInTheDocument();
  });
});
