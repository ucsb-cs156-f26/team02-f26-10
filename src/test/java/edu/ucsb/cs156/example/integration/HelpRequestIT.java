package edu.ucsb.cs156.example.integration;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import edu.ucsb.cs156.example.entities.HelpRequest;
import edu.ucsb.cs156.example.repositories.HelpRequestRepository;
import edu.ucsb.cs156.example.repositories.UserRepository;
import edu.ucsb.cs156.example.testconfig.TestConfig;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.annotation.DirtiesContext.ClassMode;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("integration")
@Import(TestConfig.class)
@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
public class HelpRequestIT {
  @Autowired HelpRequestRepository helpRequestRepository;

  @Autowired MockMvc mockMvc;

  @MockitoBean UserRepository userRepository;

  @Test
  @WithMockUser(roles = {"ADMIN", "USER"})
  public void admin_can_delete_an_existing_help_request() throws Exception {
    // Arrange: save a real record and confirm it exists before deletion.
    HelpRequest helpRequest =
        helpRequestRepository.save(
            HelpRequest.builder()
                .requesterEmail("student@ucsb.edu")
                .teamId("f26-10")
                .tableOrBreakoutRoom("7")
                .requestTime(LocalDateTime.parse("2026-11-03T15:30:00"))
                .explanation("Need help with integration testing")
                .solved(false)
                .build());
    long id = helpRequest.getId();
    assertTrue(helpRequestRepository.findById(id).isPresent());

    // Act: delete through the controller as an admin.
    mockMvc
        .perform(delete("/api/helprequests").param("id", String.valueOf(id)).with(csrf()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.message").value("HelpRequest with id %s deleted".formatted(id)));

    // Assert: query the real database to confirm the record is gone.
    assertFalse(helpRequestRepository.findById(id).isPresent());
  }
}
