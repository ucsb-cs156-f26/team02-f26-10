package edu.ucsb.cs156.example.controllers;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import edu.ucsb.cs156.example.ControllerTestCase;
import edu.ucsb.cs156.example.entities.RecommendationRequest;
import edu.ucsb.cs156.example.repositories.RecommendationRequestRepository;
import edu.ucsb.cs156.example.repositories.UserRepository;
import edu.ucsb.cs156.example.testconfig.TestConfig;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MvcResult;

@WebMvcTest(controllers = RecommendationRequestController.class)
@Import(TestConfig.class)
public class RecommendationRequestControllerTests extends ControllerTestCase {

  @MockitoBean RecommendationRequestRepository recommendationRequestRepository;

  @MockitoBean UserRepository userRepository;

  private RecommendationRequest sample(long id, boolean done) {
    return RecommendationRequest.builder()
        .id(id)
        .requesterEmail("student@ucsb.edu")
        .professorEmail("prof@ucsb.edu")
        .explanation("Grad school application")
        .dateRequested(LocalDateTime.parse("2026-10-01T10:00:00"))
        .dateNeeded(LocalDateTime.parse("2026-12-01T17:00:00"))
        .done(done)
        .build();
  }

  // GET /all

  @Test
  public void logged_out_users_cannot_get_all() throws Exception {
    mockMvc.perform(get("/api/recommendationrequests/all")).andExpect(status().isForbidden());
  }

  @WithMockUser(roles = {"USER"})
  @Test
  public void logged_in_users_can_get_all() throws Exception {
    mockMvc.perform(get("/api/recommendationrequests/all")).andExpect(status().isOk());
  }

  @WithMockUser(roles = {"USER"})
  @Test
  public void logged_in_user_can_get_all_recommendation_requests() throws Exception {
    RecommendationRequest first = sample(1L, false);
    RecommendationRequest second =
        RecommendationRequest.builder()
            .id(2L)
            .requesterEmail("another@ucsb.edu")
            .professorEmail("advisor@ucsb.edu")
            .explanation("Scholarship")
            .dateRequested(LocalDateTime.parse("2026-10-05T09:00:00"))
            .dateNeeded(LocalDateTime.parse("2026-11-15T12:00:00"))
            .done(true)
            .build();

    List<RecommendationRequest> expected = Arrays.asList(first, second);
    when(recommendationRequestRepository.findAll()).thenReturn(expected);

    MvcResult response =
        mockMvc
            .perform(get("/api/recommendationrequests/all"))
            .andExpect(status().isOk())
            .andReturn();

    verify(recommendationRequestRepository, times(1)).findAll();
    assertEquals(mapper.writeValueAsString(expected), response.getResponse().getContentAsString());
  }

  // GET by id

  @Test
  public void logged_out_users_cannot_get_by_id() throws Exception {
    mockMvc
        .perform(get("/api/recommendationrequests").param("id", "7"))
        .andExpect(status().isForbidden());
  }

  @WithMockUser(roles = {"USER"})
  @Test
  public void logged_in_user_can_get_by_id_when_id_exists() throws Exception {
    RecommendationRequest request = sample(7L, false);
    when(recommendationRequestRepository.findById(eq(7L))).thenReturn(Optional.of(request));

    MvcResult response =
        mockMvc
            .perform(get("/api/recommendationrequests").param("id", "7"))
            .andExpect(status().isOk())
            .andReturn();

    verify(recommendationRequestRepository, times(1)).findById(eq(7L));
    assertEquals(mapper.writeValueAsString(request), response.getResponse().getContentAsString());
  }

  @WithMockUser(roles = {"USER"})
  @Test
  public void logged_in_user_cannot_get_by_id_when_id_does_not_exist() throws Exception {
    when(recommendationRequestRepository.findById(eq(7L))).thenReturn(Optional.empty());

    MvcResult response =
        mockMvc
            .perform(get("/api/recommendationrequests").param("id", "7"))
            .andExpect(status().isNotFound())
            .andReturn();

    verify(recommendationRequestRepository, times(1)).findById(eq(7L));
    Map<String, Object> json = responseToJson(response);
    assertEquals("EntityNotFoundException", json.get("type"));
    assertEquals("RecommendationRequest with id 7 not found", json.get("message"));
  }

  // POST

  @Test
  public void logged_out_users_cannot_post() throws Exception {
    mockMvc
        .perform(
            post("/api/recommendationrequests/post")
                .param("requesterEmail", "student@ucsb.edu")
                .param("professorEmail", "prof@ucsb.edu")
                .param("explanation", "Grad school application")
                .param("dateRequested", "2026-10-01T10:00:00")
                .param("dateNeeded", "2026-12-01T17:00:00")
                .param("done", "false")
                .with(csrf()))
        .andExpect(status().isForbidden());
  }

  @WithMockUser(roles = {"USER"})
  @Test
  public void regular_users_cannot_post() throws Exception {
    mockMvc
        .perform(
            post("/api/recommendationrequests/post")
                .param("requesterEmail", "student@ucsb.edu")
                .param("professorEmail", "prof@ucsb.edu")
                .param("explanation", "Grad school application")
                .param("dateRequested", "2026-10-01T10:00:00")
                .param("dateNeeded", "2026-12-01T17:00:00")
                .param("done", "false")
                .with(csrf()))
        .andExpect(status().isForbidden());
  }

  @WithMockUser(roles = {"ADMIN", "USER"})
  @Test
  public void admin_can_post_a_new_recommendation_request() throws Exception {
    RecommendationRequest unsaved = sample(0L, true);
    RecommendationRequest saved = sample(1L, true);

    when(recommendationRequestRepository.save(eq(unsaved))).thenReturn(saved);

    MvcResult response =
        mockMvc
            .perform(
                post("/api/recommendationrequests/post")
                    .param("requesterEmail", "student@ucsb.edu")
                    .param("professorEmail", "prof@ucsb.edu")
                    .param("explanation", "Grad school application")
                    .param("dateRequested", "2026-10-01T10:00:00")
                    .param("dateNeeded", "2026-12-01T17:00:00")
                    .param("done", "true")
                    .with(csrf()))
            .andExpect(status().isOk())
            .andReturn();

    verify(recommendationRequestRepository, times(1)).save(eq(unsaved));
    assertEquals(mapper.writeValueAsString(saved), response.getResponse().getContentAsString());
  }

  // PUT

  @WithMockUser(roles = {"ADMIN", "USER"})
  @Test
  public void admin_can_edit_existing_recommendation_request() throws Exception {
    RecommendationRequest original = sample(67L, false);
    RecommendationRequest edited =
        RecommendationRequest.builder()
            .id(67L)
            .requesterEmail("updated@ucsb.edu")
            .professorEmail("newprof@ucsb.edu")
            .explanation("Internship")
            .dateRequested(LocalDateTime.parse("2026-10-02T11:00:00"))
            .dateNeeded(LocalDateTime.parse("2026-12-15T18:00:00"))
            .done(true)
            .build();

    when(recommendationRequestRepository.findById(eq(67L))).thenReturn(Optional.of(original));

    MvcResult response =
        mockMvc
            .perform(
                put("/api/recommendationrequests")
                    .param("id", "67")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(edited))
                    .with(csrf()))
            .andExpect(status().isOk())
            .andReturn();

    verify(recommendationRequestRepository, times(1)).findById(eq(67L));
    verify(recommendationRequestRepository, times(1)).save(eq(edited));
    assertEquals(mapper.writeValueAsString(edited), response.getResponse().getContentAsString());
  }

  @WithMockUser(roles = {"ADMIN", "USER"})
  @Test
  public void admin_can_change_done_from_true_to_false() throws Exception {
    RecommendationRequest original = sample(1L, true);
    RecommendationRequest incoming = sample(1L, false);

    when(recommendationRequestRepository.findById(eq(1L))).thenReturn(Optional.of(original));

    mockMvc
        .perform(
            put("/api/recommendationrequests")
                .param("id", "1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(incoming))
                .with(csrf()))
        .andExpect(status().isOk());

    verify(recommendationRequestRepository).save(eq(incoming));
  }

  @WithMockUser(roles = {"ADMIN", "USER"})
  @Test
  public void admin_cannot_edit_recommendation_request_that_does_not_exist() throws Exception {
    RecommendationRequest incoming = sample(67L, false);
    when(recommendationRequestRepository.findById(eq(67L))).thenReturn(Optional.empty());

    MvcResult response =
        mockMvc
            .perform(
                put("/api/recommendationrequests")
                    .param("id", "67")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(incoming))
                    .with(csrf()))
            .andExpect(status().isNotFound())
            .andReturn();

    verify(recommendationRequestRepository, times(1)).findById(eq(67L));
    verify(recommendationRequestRepository, never()).save(any(RecommendationRequest.class));
    Map<String, Object> json = responseToJson(response);
    assertEquals("EntityNotFoundException", json.get("type"));
    assertEquals("RecommendationRequest with id 67 not found", json.get("message"));
  }

  // DELETE

  @WithMockUser(roles = {"ADMIN", "USER"})
  @Test
  public void admin_can_delete_a_recommendation_request() throws Exception {
    RecommendationRequest request = sample(15L, false);
    when(recommendationRequestRepository.findById(eq(15L))).thenReturn(Optional.of(request));

    MvcResult response =
        mockMvc
            .perform(delete("/api/recommendationrequests").param("id", "15").with(csrf()))
            .andExpect(status().isOk())
            .andReturn();

    verify(recommendationRequestRepository, times(1)).findById(eq(15L));
    verify(recommendationRequestRepository, times(1)).delete(eq(request));
    Map<String, Object> json = responseToJson(response);
    assertEquals("RecommendationRequest with id 15 deleted", json.get("message"));
  }

  @WithMockUser(roles = {"ADMIN", "USER"})
  @Test
  public void admin_tries_to_delete_non_existant_recommendation_request_and_gets_right_error()
      throws Exception {
    when(recommendationRequestRepository.findById(eq(15L))).thenReturn(Optional.empty());

    MvcResult response =
        mockMvc
            .perform(delete("/api/recommendationrequests").param("id", "15").with(csrf()))
            .andExpect(status().isNotFound())
            .andReturn();

    verify(recommendationRequestRepository, times(1)).findById(eq(15L));
    verify(recommendationRequestRepository, never()).delete(any(RecommendationRequest.class));
    Map<String, Object> json = responseToJson(response);
    assertEquals("EntityNotFoundException", json.get("type"));
    assertEquals("RecommendationRequest with id 15 not found", json.get("message"));
  }
}
