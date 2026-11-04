package edu.ucsb.cs156.example.web;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.AriaRole;
import edu.ucsb.cs156.example.WebTestCase;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.annotation.DirtiesContext.ClassMode;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT)
@ActiveProfiles("integration")
@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
public class RecommendationRequestWebIT extends WebTestCase {

  @Test
  public void admin_can_create_a_recommendation_request_and_it_persists_after_reload() {
    String explanation = "Letter for grad school";

    setupUser(true);
    page.getByRole(
            AriaRole.LINK,
            new Page.GetByRoleOptions().setName("Recommendation Request").setExact(true))
        .click();

    // Act: open the create form and fill it in like a real user.
    page.getByText("Create RecommendationRequest").click();
    assertThat(page.getByText("Create New RecommendationRequest")).isVisible();

    page.getByTestId("RecommendationRequestForm-requesterEmail").fill("student@ucsb.edu");
    page.getByTestId("RecommendationRequestForm-professorEmail").fill("prof@ucsb.edu");
    page.getByTestId("RecommendationRequestForm-explanation").fill(explanation);
    // datetime-local inputs accept fill() with yyyy-MM-ddTHH:mm, so no date picker is needed.
    page.getByTestId("RecommendationRequestForm-dateRequested").fill("2026-11-01T10:00");
    page.getByTestId("RecommendationRequestForm-dateNeeded").fill("2026-12-01T17:00");
    page.getByTestId("RecommendationRequestForm-submit").click();

    // Assert: we land back on the index page and the new row is in the table.
    Locator requestRow =
        page.getByRole(AriaRole.ROW).filter(new Locator.FilterOptions().setHasText(explanation));
    assertThat(requestRow).hasCount(1);
    assertThat(page.getByTestId("RecommendationRequestTable-cell-row-0-col-requesterEmail"))
        .hasText("student@ucsb.edu");
    assertThat(page.getByTestId("RecommendationRequestTable-cell-row-0-col-professorEmail"))
        .hasText("prof@ucsb.edu");
    assertThat(page.getByTestId("RecommendationRequestTable-cell-row-0-col-done")).hasText("No");

    // The row is still there after a fresh load, so it really was saved in the database.
    page.reload();
    assertThat(requestRow).hasCount(1);
  }

  @Test
  public void regular_user_cannot_create_a_recommendation_request() {
    setupUser(false);
    page.getByRole(
            AriaRole.LINK,
            new Page.GetByRoleOptions().setName("Recommendation Request").setExact(true))
        .click();

    assertThat(page.getByText("RecommendationRequests", new Page.GetByTextOptions().setExact(true)))
        .isVisible();
    assertThat(page.getByText("Create RecommendationRequest")).hasCount(0);
  }
}
