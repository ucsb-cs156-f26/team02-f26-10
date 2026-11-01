package edu.ucsb.cs156.example.web;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.options.AriaRole;
import edu.ucsb.cs156.example.WebTestCase;
import java.util.UUID;
import java.util.regex.Pattern;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.annotation.DirtiesContext.ClassMode;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit.jupiter.SpringExtension;

@ExtendWith(SpringExtension.class)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT)
@ActiveProfiles("integration")
@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
public class UCSBOrganizationWebIT extends WebTestCase {

  @Test
  public void admin_can_create_an_organization_and_see_it_after_reload() throws Exception {

    // Log in through the mock OAuth provider as an administrator.
    setupUser(true);

    String orgCode = "E2E-" + UUID.randomUUID();
    String shortName = "E2E TEST CLUB";
    String fullName = "E2E TEST CLUB AT UCSB";

    // Open the organization index page.
    page.getByRole(
            AriaRole.LINK,
            new com.microsoft.playwright.Page.GetByRoleOptions()
                .setName("UCSBOrganization")
                .setExact(true))
        .click();

    // Open the create form.
    page.getByText("Create UCSBOrganization").click();
    assertThat(page.getByText("Create New UCSBOrganization")).isVisible();

    // Enter valid organization data.
    page.getByTestId("UCSBOrganizationForm-orgCode").fill(orgCode);
    page.getByTestId("UCSBOrganizationForm-orgTranslationShort").fill(shortName);
    page.getByTestId("UCSBOrganizationForm-orgTranslation").fill(fullName);
    page.getByTestId("UCSBOrganizationForm-inactive").uncheck();

    // Submit the form.
    page.getByTestId("UCSBOrganizationForm-submit").click();

    // Verify that the application returns to the index page.
    assertThat(page).hasURL(Pattern.compile(".*/ucsborganization/?$"));

    // Find the new record by its unique organization code.
    Locator row =
        page.getByTestId("UCSBOrganizationTable")
            .getByRole(AriaRole.ROW)
            .filter(new Locator.FilterOptions().setHasText(orgCode));

    assertThat(row).hasCount(1);
    assertThat(row).containsText(shortName);
    assertThat(row).containsText(fullName);

    assertThat(
            row.getByRole(
                AriaRole.CELL, new Locator.GetByRoleOptions().setName("false").setExact(true)))
        .isVisible();

    // Reload to verify that the saved record is still available.
    page.reload();

    assertThat(row).hasCount(1);
    assertThat(row).containsText(shortName);
    assertThat(row).containsText(fullName);
  }
}
