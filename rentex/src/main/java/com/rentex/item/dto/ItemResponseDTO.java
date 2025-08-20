package com.rentex.item.dto;

import com.rentex.item.domain.Item;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemResponseDTO {
    private Long id;
    private String name;
    private String description;
    private int stockQuantity;
    private String status;
    private Long partnerId;
    private String thumbnailUrl;
    private int dailyPrice;
    private Long categoryId;      // 대분류 카테고리 ID
    private Long subCategoryId;
    private String categoryName;
    private String subCategoryName;
    private String partnerName;

    // 추가된 필드
    private String detailDescription; // 상세 설명
    private List<String> detailImages; // 상세 이미지 리스트

    public static ItemResponseDTO fromEntity(Item item) {
        return ItemResponseDTO.builder()
                .id(item.getId())
                .name(item.getName())
                .description(item.getDescription())
                .stockQuantity(item.getStockQuantity())
                .status(item.getStatus().name())
                .partnerId(item.getPartner() != null ? item.getPartner().getId() : null)
                .thumbnailUrl(item.getThumbnailUrl())
                .dailyPrice(item.getDailyPrice())
                .categoryId(item.getCategory() != null ? item.getCategory().getId() : null)
                .subCategoryId(item.getSubCategory() != null ? item.getSubCategory().getId() : null)
                .categoryName(item.getCategory() != null ? item.getCategory().getName() : "-")
                .subCategoryName(item.getSubCategory() != null ? item.getSubCategory().getName() : "-")
                .partnerName(item.getPartner() != null ? item.getPartner().getName() : "-")
                .detailDescription(item.getDetailDescription())
                .detailImages(item.getDetailImages())
                .build();
    }
}