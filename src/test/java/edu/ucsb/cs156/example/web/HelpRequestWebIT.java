package edu.ucsb.cs156.example.web;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.AriaRole;
import edu.ucsb.cs156.example.WebTestCase;
import edu.ucsb.cs156.example.entities.HelpRequest;
import edu.ucsb.cs156.example.repositories.HelpRequestRepository;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.annotation.DirtiesContext.ClassMode;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT)
@ActiveProfiles("integration")
@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
public class HelpRequestWebIT extends WebTestCase {
  @Autowired HelpRequestRepository helpRequestRepository;

  @Test
  public void admin_can_delete_a_help_request_and_it_stays_deleted_after_reload() {
    // Arrange: seed the request to delete and another request that should remain.
    String explanation = "Need help with integration testing";
    String remainingExplanation = "Need help with deployment";
    helpRequestRepository.save(
        HelpRequest.builder()
            .requesterEmail("student@ucsb.edu")
            .teamId("f26-10")
            .tableOrBreakoutRoom("7")
            .requestTime(LocalDateTime.parse("2026-11-03T15:30:00"))
            .explanation(explanation)
            .solved(false)
            .build());
    helpRequestRepository.save(
        HelpRequest.builder()
            .requesterEmail("another.student@ucsb.edu")
            .teamId("f26-10")
            .tableOrBreakoutRoom("8")
            .requestTime(LocalDateTime.parse("2026-11-03T15:35:00"))
            .explanation(remainingExplanation)
            .solved(false)
            .build());

    setupUser(true);
    page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("HelpRequest").setExact(true))
        .click();

    Locator requestRow =
        page.getByRole(AriaRole.ROW).filter(new Locator.FilterOptions().setHasText(explanation));
    assertThat(requestRow).isVisible();
    assertThat(page.getByText(remainingExplanation, new Page.GetByTextOptions().setExact(true)))
        .isVisible();

    // Act: use the Delete button in the target request's row.
    requestRow
        .getByRole(AriaRole.BUTTON, new Locator.GetByRoleOptions().setName("Delete").setExact(true))
        .click();

    // Assert: deletion updates the table and persists after a fresh page load.
    assertThat(requestRow).hasCount(0);
    page.reload();

    // The remaining record proves the table has loaded, rather than merely being empty while
    // loading.
    assertThat(page.getByText(remainingExplanation, new Page.GetByTextOptions().setExact(true)))
        .isVisible();
    assertThat(requestRow).hasCount(0);
  }
}
