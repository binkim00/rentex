package com.rentex.item.service;

import com.rentex.category.domain.Category;
import com.rentex.category.domain.SubCategory;
import com.rentex.category.repository.CategoryRepository;
import com.rentex.category.repository.SubCategoryRepository;
import com.rentex.common.upload.FileUploadService;
import com.rentex.item.domain.Item;
import com.rentex.item.domain.Item.ItemStatus;
import com.rentex.item.dto.ItemRequestDTO;
import com.rentex.item.dto.ItemResponseDTO;
import com.rentex.user.domain.User; // ✅ Partner → User 로 교체
import com.rentex.user.repository.UserRepository; // ✅ PartnerRepository → UserRepository 로 교체
import com.rentex.item.repository.ItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ItemService {

    private final ItemRepository itemRepository;
    private final UserRepository userRepository; // ✅ PartnerRepository 대신 UserRepository 사용
    private final FileUploadService fileUploadService;
    private final CategoryRepository categoryRepository;
    private final SubCategoryRepository subCategoryRepository;

    // 전체 아이템 조회
    public List<ItemResponseDTO> getAllItems() {
        return itemRepository.findAll().stream()
                .map(ItemResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    // 파트너별 아이템 조회
    public List<ItemResponseDTO> getItemsByPartnerId(Long partnerId) {
        List<Item> items = itemRepository.findItemsByPartnerIdNative(partnerId);
        return items.stream()
                .map(ItemResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    // 아이템 등록
    public void registerItem(ItemRequestDTO dto, MultipartFile thumbnail, List<MultipartFile> detailImages) {
        User partner = userRepository.findById(dto.getPartnerId()) // ✅ Partner → User
                .orElseThrow(() -> new IllegalArgumentException("파트너 ID가 유효하지 않습니다."));

        Category category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid category ID"));
        SubCategory subCategory = subCategoryRepository.findById(dto.getSubCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid subCategory ID"));

        if (!subCategory.getCategory().getId().equals(category.getId())) {
            throw new IllegalArgumentException("SubCategory does not belong to Category");
        }

        // 썸네일 업로드
        String thumbnailUrl = (thumbnail != null && !thumbnail.isEmpty())
                ? fileUploadService.upload(thumbnail)
                : null;

        // 상세 이미지 업로드
        List<String> detailImageUrls = detailImages != null
                ? detailImages.stream()
                .filter(file -> !file.isEmpty())
                .map(fileUploadService::upload)
                .collect(Collectors.toList())
                : null;

        Item item = Item.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .stockQuantity(dto.getStockQuantity())
                .status(ItemStatus.valueOf(dto.getStatus()))
                .partner(partner) // ✅ User로 매핑
                .thumbnailUrl(thumbnailUrl)
                .dailyPrice(dto.getDailyPrice())
                .category(category)
                .subCategory(subCategory)
                .detailDescription(dto.getDetailDescription())
                .detailImages(detailImageUrls)
                .build();

        itemRepository.save(item);
    }

    // 아이템 수정
    @Transactional
    public void updateItem(Long id, ItemRequestDTO dto, MultipartFile thumbnail, List<MultipartFile> detailImages) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 아이템입니다. id=" + id));

        User partner = userRepository.findById(dto.getPartnerId()) // ✅ Partner → User
                .orElseThrow(() -> new IllegalArgumentException("파트너 ID가 유효하지 않습니다."));

        if (dto.getCategoryId() != null) {
            Category category = categoryRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> new IllegalArgumentException("대분류 카테고리가 유효하지 않습니다."));
            item.setCategory(category);
        }

        if (dto.getSubCategoryId() != null) {
            SubCategory subCategory = subCategoryRepository.findById(dto.getSubCategoryId())
                    .orElseThrow(() -> new IllegalArgumentException("소분류 카테고리가 유효하지 않습니다."));
            item.setSubCategory(subCategory);
        }

        item.setName(dto.getName());
        item.setDescription(dto.getDescription());
        item.setStockQuantity(dto.getStockQuantity());
        item.setDailyPrice(dto.getDailyPrice());
        item.setStatus(ItemStatus.valueOf(dto.getStatus()));
        item.setPartner(partner); // ✅ User 로 매핑
        item.setDetailDescription(dto.getDetailDescription());

        // 상세 이미지 업로드
        if (detailImages != null && !detailImages.isEmpty()) {
            List<String> detailImageUrls = detailImages.stream()
                    .filter(file -> !file.isEmpty())
                    .map(fileUploadService::upload)
                    .collect(Collectors.toList());
            item.setDetailImages(detailImageUrls);
        }

        // 썸네일 업로드
        if (thumbnail != null && !thumbnail.isEmpty()) {
            String thumbnailUrl = fileUploadService.upload(thumbnail);
            item.setThumbnailUrl(thumbnailUrl);
        }

        itemRepository.save(item);
    }

    // 단건 조회
    @Transactional(readOnly = true)
    public ItemResponseDTO getItemById(Long id) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 아이템입니다. id=" + id));
        return ItemResponseDTO.fromEntity(item);
    }

    // 삭제
    @Transactional
    public void deleteItem(Long id) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 아이템입니다. id=" + id));
        itemRepository.delete(item);
    }
}
