package com.rentex.rental.repository;

import com.rentex.item.domain.Item;
import com.rentex.rental.domain.Rental;
import com.rentex.rental.domain.RentalStatus;
import com.rentex.user.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface RentalRepository extends JpaRepository<Rental, Long> {

    boolean existsByItemAndStatusIn(Item item, List<RentalStatus> statuses);

    // User 엔티티 기반 메서드 추가 (탈퇴 시 사용)
    boolean existsByUserAndStatusNotIn(User user, List<RentalStatus> statuses);

    List<Rental> findByUser(User user); // MyPage 조회용

    Page<Rental> findByUserId(Long userId, Pageable pageable);

    Page<Rental> findByUserIdAndStatus(Long userId, RentalStatus status, Pageable pageable);

    Page<Rental> findAllByStatus(RentalStatus status, Pageable pageable);

    Page<Rental> findAll(Pageable pageable);  // 전체 상태 조건 없이

    @Query("SELECT r FROM Rental r WHERE r.user.id = :userId")
    List<Rental> findByUserId(@Param("userId") Long userId);

    @Query("""
                SELECT r FROM Rental r
                WHERE r.item.id = :itemId
                  AND r.status IN ('REQUESTED', 'APPROVED', 'RENTED')
                  AND (
                        (r.startDate <= :endDate AND r.endDate >= :startDate)
                      )
            """)
    List<Rental> findConflictingRentals(
            @Param("itemId") Long itemId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("SELECT r FROM Rental r WHERE r.status = 'RENTED' AND r.endDate < :today AND r.isOverdue = false")
    List<Rental> findOverdueRentals(@Param("today") LocalDate today);

    @Query("""
            SELECT COUNT(r) > 0
            FROM Rental r
            WHERE r.item.id = :itemId
              AND r.status IN ('APPROVED', 'RENTED', 'RETURN_REQUESTED')
              AND r.startDate <= :endDate
              AND r.endDate >= :startDate
            """)
    boolean existsConflictingRental(@Param("itemId") Long itemId,
                                    @Param("startDate") LocalDate startDate,
                                    @Param("endDate") LocalDate endDate);

    @Query("SELECT r FROM Rental r WHERE r.user.id = :userId ORDER BY r.startDate DESC")
    List<Rental> findRecentRentalsByUserId(@Param("userId") Long userId, Pageable pageable);

    /**
     * 해당 월과 기간이 겹치는 모든 렌탈(아이템/파트너 같이 로딩)
     */
    @Query("""
                select r
                from Rental r
                join fetch r.item i
                join fetch i.partner p
                where r.startDate <= :monthEnd and r.endDate >= :monthStart
            """)
    List<Rental> findAllOverlapping(LocalDate monthStart, LocalDate monthEnd);

    /**
     * 특정 파트너의 해당 월 겹침 렌탈
     */
    @Query("""
                select r
                from Rental r
                join fetch r.item i
                join fetch i.partner p
                where p.id = :partnerId
                  and r.startDate <= :monthEnd and r.endDate >= :monthStart
            """)
    List<Rental> findAllByPartnerOverlapping(Long partnerId, LocalDate monthStart, LocalDate monthEnd);

    /**
     * 특정 파트너의 요청 상태별 대여 목록 조회
     */
    Page<Rental> findByItemPartnerIdAndStatus(Long partnerId, RentalStatus status, Pageable pageable);

    /**
     * 특정파트너의 전체 조회 목록
     */
    @Query("SELECT r FROM Rental r " +
            "JOIN r.item i " +
            "WHERE i.partner.id = :partnerId " +
            "AND (:status IS NULL OR r.status = :status)")
    Page<Rental> findByPartnerItemAndStatus(@Param("partnerId") Long partnerId,
                                            @Param("status") RentalStatus status,
                                            Pageable pageable);
}


