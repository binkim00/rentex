// src/main/java/com/rentex/penalty/service/AdminPenaltyService.java
package com.rentex.penalty.service;

import com.rentex.penalty.domain.PenaltyStatus;
import com.rentex.penalty.domain.Penalty;
import com.rentex.penalty.dto.AdminPenaltyEntryDTO;
import com.rentex.penalty.dto.AdminPenaltyUserDTO;
import com.rentex.penalty.dto.GrantPenaltyRequest;
import com.rentex.penalty.repository.UserPenaltyRepository;
import com.rentex.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminPenaltyService {

    private final UserPenaltyRepository penaltyRepo;
    private final UserRepository userRepo;

    // 유저만 조회
    @Transactional(readOnly = true)
    public List<AdminPenaltyUserDTO> listOnlyUsers(String q, int page, int size) {
        int limit = Math.max(1, size);
        int offset = Math.max(0, page) * limit;

        return penaltyRepo.searchUserSummariesOnlyUsers(q, limit, offset).stream()
                .map(p -> AdminPenaltyUserDTO.builder()
                        .userId(p.getUserId())
                        .name(p.getName())
                        .email(p.getEmail())
                        .penaltyPoints(p.getPenaltyPoints())
                        .activeEntries(p.getActiveEntries())
                        .lastGivenAt(p.getLastGivenAt() == null ? null : p.getLastGivenAt().toLocalDateTime())
                        .build())
                .toList();
    }

    // 전체 계정 조회
    @Transactional(readOnly = true)
    public List<AdminPenaltyUserDTO> listAllAccounts(String q, String role, int page, int size) {
        int limit = Math.max(1, size);
        int offset = Math.max(0, page) * limit;

        return penaltyRepo.searchUserSummariesAll(q, role, limit, offset).stream()
                .map(p -> AdminPenaltyUserDTO.builder()
                        .userId(p.getUserId())
                        .name(p.getName())
                        .email(p.getEmail())
                        .penaltyPoints(p.getPenaltyPoints())
                        .activeEntries(p.getActiveEntries())
                        .lastGivenAt(p.getLastGivenAt() == null ? null : p.getLastGivenAt().toLocalDateTime())
                        .role(p.getRole())
                        .build())
                .toList();
    }


    /** 특정 사용자 벌점 엔트리 목록 */
    @Transactional(readOnly = true)
    public List<AdminPenaltyEntryDTO> entries(Long userId) {
        return penaltyRepo.findByUser_IdOrderByIdDesc(userId).stream()
                .map(e -> AdminPenaltyEntryDTO.builder()
                        .id(e.getId())
                        .reason(e.getReason())
                        .points(e.getPoint())
                        .status(e.getStatus().name())
                        .givenAt(e.getGivenAt())
                        .build())
                .toList();
    }

    /** 관리자 수동 벌점 부여 */
    @Transactional
    public void grant(Long userId, GrantPenaltyRequest req) {
        // 존재 확인
        userRepo.findById(userId).orElseThrow();

        int point = (req == null || req.getPoints() == null || req.getPoints() <= 0) ? 1 : req.getPoints();
        String reason = (req == null || req.getReason() == null || req.getReason().isBlank())
                ? "벌점 사유입력" : req.getReason();

        // 로그 저장
        penaltyRepo.save(Penalty.builder()
                .user(userRepo.getReferenceById(userId))
                .reason(reason)
                .point(point)
                .status(PenaltyStatus.VALID)
                .build());

        // 사용자 컬럼 가산 (영향 0이면 재계산 보정)
        int updated = userRepo.increasePenaltyPoints(userId, point);
        if (updated == 0) {
            userRepo.recalcPenaltyPoints(userId);
        }
    }

    /** 벌점 엔트리 개별 삭제(회수) */
    @Transactional
    public void deleteEntry(Long entryId) {
        Penalty entry = penaltyRepo.findById(entryId).orElseThrow();
        if (entry.getStatus() != PenaltyStatus.VALID) return;

        entry.markDeleted();
        penaltyRepo.save(entry);

        int updated = userRepo.decreasePenaltyPoints(entry.getUser().getId(), entry.getPoint());
        if (updated == 0) {
            userRepo.recalcPenaltyPoints(entry.getUser().getId());
        }
    }

    /** 사용자 벌점 전체 초기화 */
    @Transactional
    public void reset(Long userId) {
        // 존재 확인
        userRepo.findById(userId).orElseThrow();

        List<Penalty> valids = penaltyRepo.findByUser_IdAndStatusOrderByIdDesc(userId, PenaltyStatus.VALID);
        if (!valids.isEmpty()) {
            LocalDateTime now = LocalDateTime.now();
            valids.forEach(e -> e.markCleared(now)); // 상태 변경
            penaltyRepo.saveAll(valids);
        }

        int updated = userRepo.resetPenaltyPoints(userId);
        if (updated == 0) {
            userRepo.recalcPenaltyPoints(userId);
        }
    }

    /** 상세 화면 상단 요약 */
    @Transactional(readOnly = true)
    public AdminPenaltyUserDTO userSummary(Long userId) {
        var p = penaltyRepo.findUserSummary(userId);
        if (p == null) return null;
        return AdminPenaltyUserDTO.builder()
                .userId(p.getUserId())
                .name(p.getName())
                .email(p.getEmail())
                .penaltyPoints(p.getPenaltyPoints())
                .activeEntries(p.getActiveEntries())
                .lastGivenAt(p.getLastGivenAt() == null ? null : p.getLastGivenAt().toLocalDateTime())
                .role(p.getRole()) // Projection에 추가해둔 경우
                .build();
    }
}
