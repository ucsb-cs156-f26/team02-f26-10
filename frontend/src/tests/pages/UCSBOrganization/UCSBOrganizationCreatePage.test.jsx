import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UCSBOrganizationCreatePage from "main/pages/UCSBOrganization/UCSBOrganizationCreatePage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";

import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";

import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";

const mockToast = vi.fn();

vi.mock("react-toastify", async (importOriginal) => {
  const originalModule = await importOriginal();

  return {
    ...originalModule,
    toast: vi.fn((message) => mockToast(message)),
  };
});

const mockNavigate = vi.fn();

vi.mock("react-router", async (importOriginal) => {
  const originalModule = await importOriginal();

  return {
    ...originalModule,
    Navigate: vi.fn((props) => {
      mockNavigate(props);
      return null;
    }),
  };
});

const organization = {
  orgCode: "CREATE_TEST",
  orgTranslationShort: "TEST CLUB",
  orgTranslation: "TEST CLUB AT UCSB",
  inactive: false,
};

function renderPage(props = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <UCSBOrganizationCreatePage {...props} />
      </MemoryRouter>
    </QueryClientProvider>,
  );

  return queryClient;
}

function fillValidForm(inactive = false) {
  fireEvent.change(screen.getByLabelText("Organization Code"), {
    target: { value: organization.orgCode },
  });

  fireEvent.change(screen.getByLabelText("Short Name"), {
    target: { value: organization.orgTranslationShort },
  });

  fireEvent.change(screen.getByLabelText("Full Name"), {
    target: { value: organization.orgTranslation },
  });

  if (inactive) {
    fireEvent.click(screen.getByLabelText("Inactive"));
  }
}

describe("UCSBOrganizationCreatePage tests", () => {
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
  });

  test("renders the create page", () => {
    renderPage();

    expect(
      screen.getByRole("heading", {
        name: "Create New UCSBOrganization",
      }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Organization Code")).toBeInTheDocument();
    expect(screen.getByLabelText("Short Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Full Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Inactive")).toBeInTheDocument();

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test.each([false, true])(
    "creates a record and redirects with inactive=%s",
    async (inactive) => {
      const expectedOrganization = { ...organization, inactive };

      axiosMock
        .onPost("/api/ucsborganizations/post")
        .reply(200, expectedOrganization);

      const queryClient = renderPage();
      const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");

      fillValidForm(inactive);
      fireEvent.click(screen.getByRole("button", { name: "Create" }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith({
          to: "/ucsborganization",
        });
      });

      expect(axiosMock.history.post).toHaveLength(1);
      expect(axiosMock.history.post[0].params).toEqual(expectedOrganization);

      expect(mockToast).toHaveBeenCalledWith(
        "New UCSBOrganization created - orgCode: CREATE_TEST",
      );

      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["/api/ucsborganizations/all"],
      });
    },
  );

  test.each(["", "   "])(
    "does not send invalid form data: %j",
    async (value) => {
      axiosMock.onPost("/api/ucsborganizations/post").reply(200, organization);

      renderPage();

      fireEvent.change(screen.getByLabelText("Organization Code"), {
        target: { value },
      });
      fireEvent.change(screen.getByLabelText("Short Name"), {
        target: { value },
      });
      fireEvent.change(screen.getByLabelText("Full Name"), {
        target: { value },
      });

      fireEvent.click(screen.getByRole("button", { name: "Create" }));

      const messages =
        value === ""
          ? [
              "Organization code is required.",
              "Short name is required.",
              "Full name is required.",
            ]
          : [
              "Organization code cannot be blank.",
              "Short name cannot be blank.",
              "Full name cannot be blank.",
            ];

      for (const message of messages) {
        expect(await screen.findByText(message)).toBeInTheDocument();
      }

      expect(axiosMock.history.post).toHaveLength(0);
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(mockToast).not.toHaveBeenCalled();

      expect(
        screen.getByRole("heading", {
          name: "Create New UCSBOrganization",
        }),
      ).toBeInTheDocument();
    },
  );

  test("stays on the page after success in Storybook mode", async () => {
    axiosMock.onPost("/api/ucsborganizations/post").reply(200, organization);

    const queryClient = renderPage({ storybook: true });

    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(axiosMock.history.post).toHaveLength(1);
    });

    await waitFor(() => {
      expect(queryClient.isMutating()).toBe(0);
      expect(mockToast).toHaveBeenCalledWith(
        "New UCSBOrganization created - orgCode: CREATE_TEST",
      );
    });

    expect(mockNavigate).not.toHaveBeenCalled();

    expect(
      screen.getByRole("heading", {
        name: "Create New UCSBOrganization",
      }),
    ).toBeInTheDocument();
  });
});
