package edu.ucsb.cs156.example.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import edu.ucsb.cs156.example.entities.RecommendationRequest;
import edu.ucsb.cs156.example.repositories.RecommendationRequestRepository;
import edu.ucsb.cs156.example.repositories.UserRepository;
import edu.ucsb.cs156.example.testconfig.TestConfig;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.StreamSupport;
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
public class RecommendationRequestIT {
  @Autowired RecommendationRequestRepository recommendationRequestRepository;

  @Autowired MockMvc mockMvc;

  @MockitoBean UserRepository userRepository;

  @Test
  @WithMockUser(roles = {"ADMIN", "USER"})
  public void admin_can_post_a_new_recommendation_request_and_it_is_saved_in_the_database()
      throws Exception {
    // Arrange: the real database starts with no recommendation requests.
    assertEquals(0, recommendationRequestRepository.count());

    // Act: create one through the controller as an admin.
    mockMvc
        .perform(
            post("/api/recommendationrequests/post")
                .param("requesterEmail", "student@ucsb.edu")
                .param("professorEmail", "prof@ucsb.edu")
                .param("explanation", "Letter for grad school")
                .param("dateRequested", "2026-11-01T10:00:00")
                .param("dateNeeded", "2026-12-01T17:00:00")
                .param("done", "false")
                .with(csrf()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.requesterEmail").value("student@ucsb.edu"))
        .andExpect(jsonPath("$.professorEmail").value("prof@ucsb.edu"))
        .andExpect(jsonPath("$.explanation").value("Letter for grad school"))
        .andExpect(jsonPath("$.done").value(false));

    // Assert: query the real database to confirm exactly one matching record was stored.
    List<RecommendationRequest> saved =
        StreamSupport.stream(recommendationRequestRepository.findAll().spliterator(), false)
            .toList();
    assertEquals(1, saved.size());

    RecommendationRequest request = saved.get(0);
    assertEquals("student@ucsb.edu", request.getRequesterEmail());
    assertEquals("prof@ucsb.edu", request.getProfessorEmail());
    assertEquals("Letter for grad school", request.getExplanation());
    assertEquals(LocalDateTime.parse("2026-11-01T10:00:00"), request.getDateRequested());
    assertEquals(LocalDateTime.parse("2026-12-01T17:00:00"), request.getDateNeeded());
    assertFalse(request.isDone());
  }
}
